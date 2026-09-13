import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  validateManifest,
  isJunkFile,
  dosDateTime,
  buildZipBuffer,
  collectExtensionFiles,
  packageExtension,
} from "../../scripts/package-extension.mjs";

describe("Extension Packaging Suite", () => {
  const extensionDir = path.resolve(process.cwd(), "public/extension");

  describe("Manifest Validation", () => {
    it("validates the production extension manifest successfully", () => {
      const manifest = validateManifest(extensionDir);
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toBe("Lokker - Local-First Password Vault");
      expect(manifest.version).toMatch(/^\d+(\.\d+){1,3}$/);
      expect(manifest.description.length).toBeLessThanOrEqual(132);
      expect(manifest.background.service_worker).toBe("background/service-worker.js");
      expect(manifest.action.default_popup).toBe("popup/popup.html");
      expect(manifest.icons["128"]).toBe("icons/icon128.png");
    });

    it("rejects manifest if file is missing", () => {
      const nonExistentDir = path.join(os.tmpdir(), "lokker-empty-" + Date.now());
      fs.mkdirSync(nonExistentDir, { recursive: true });
      try {
        expect(() => validateManifest(nonExistentDir)).toThrow(/manifest.json not found/);
      } finally {
        fs.rmSync(nonExistentDir, { recursive: true, force: true });
      }
    });

    it("rejects manifest with description exceeding Chrome Web Store limit of 132 chars", () => {
      const tempDir = path.join(os.tmpdir(), "lokker-test-" + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      const invalidManifest = {
        manifest_version: 3,
        name: "Test Ext",
        version: "1.0.0",
        description: "A".repeat(133), // 133 chars > 132 limit
        background: { service_worker: "sw.js" },
      };
      fs.writeFileSync(path.join(tempDir, "manifest.json"), JSON.stringify(invalidManifest));
      try {
        expect(() => validateManifest(tempDir)).toThrow(/exceeds Chrome Web Store max of 132/);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("rejects manifest with invalid version syntax", () => {
      const tempDir = path.join(os.tmpdir(), "lokker-test-" + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      const invalidManifest = {
        manifest_version: 3,
        name: "Test Ext",
        version: "beta-1.0",
        description: "Short desc",
        background: { service_worker: "sw.js" },
      };
      fs.writeFileSync(path.join(tempDir, "manifest.json"), JSON.stringify(invalidManifest));
      try {
        expect(() => validateManifest(tempDir)).toThrow(/version 'beta-1.0' is invalid/);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("rejects manifest if referenced background service worker is missing", () => {
      const tempDir = path.join(os.tmpdir(), "lokker-test-" + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      const invalidManifest = {
        manifest_version: 3,
        name: "Test Ext",
        version: "1.0.0",
        description: "Short desc",
        background: { service_worker: "missing-worker.js" },
      };
      fs.writeFileSync(path.join(tempDir, "manifest.json"), JSON.stringify(invalidManifest));
      try {
        expect(() => validateManifest(tempDir)).toThrow(/Background service worker file missing/);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("Junk File Filtering", () => {
    it("flags operating system metadata files as junk", () => {
      expect(isJunkFile(".DS_Store")).toBe(true);
      expect(isJunkFile("Thumbs.db")).toBe(true);
      expect(isJunkFile("desktop.ini")).toBe(true);
      expect(isJunkFile("ehthumbs.db")).toBe(true);
      expect(isJunkFile(".gitignore")).toBe(true);
      expect(isJunkFile("backup.zip")).toBe(true);
      expect(isJunkFile("extension.crx")).toBe(true);
      expect(isJunkFile("private.pem")).toBe(true);
      expect(isJunkFile("index.js.swp")).toBe(true);
      expect(isJunkFile("temp.tmp")).toBe(true);
    });

    it("accepts valid extension source files", () => {
      expect(isJunkFile("manifest.json")).toBe(false);
      expect(isJunkFile("config.js")).toBe(false);
      expect(isJunkFile("service-worker.js")).toBe(false);
      expect(isJunkFile("autofill.js")).toBe(false);
      expect(isJunkFile("icon128.png")).toBe(false);
      expect(isJunkFile("popup.html")).toBe(false);
      expect(isJunkFile("popup.css")).toBe(false);
    });
  });

  describe("PKZIP Binary Generation", () => {
    it("encodes valid MS-DOS dates and times", () => {
      const date = new Date("2026-05-15T10:30:20Z");
      const dt = dosDateTime(date);
      expect(dt.time).toBeGreaterThan(0);
      expect(dt.date).toBeGreaterThan(0);
    });

    it("builds a conforming ZIP archive with local and central directory signatures", () => {
      const tempDir = path.join(os.tmpdir(), "lokker-zip-test-" + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      const testFile1 = path.join(tempDir, "manifest.json");
      const testFile2 = path.join(tempDir, "data.txt");
      fs.writeFileSync(testFile1, '{"name":"lokker-test"}');
      fs.writeFileSync(testFile2, "Hello from the Lokker packaging test!");

      try {
        const files = [
          {
            fullPath: testFile1,
            relativePath: "manifest.json",
            size: fs.statSync(testFile1).size,
            mtime: new Date(),
          },
          {
            fullPath: testFile2,
            relativePath: "sub/data.txt",
            size: fs.statSync(testFile2).size,
            mtime: new Date(),
          },
        ];

        const zip = buildZipBuffer(files);

        // ZIP magic bytes: PK\x03\x04 (0x04034b50 little endian)
        expect(zip.readUInt32LE(0)).toBe(0x04034b50);

        // Contains End of Central Directory signature (0x06054b50)
        const eocdIndex = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
        expect(eocdIndex).toBeGreaterThan(0);

        // Total entries recorded in EOCD should match 2
        const totalEntries = zip.readUInt16LE(eocdIndex + 10);
        expect(totalEntries).toBe(2);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("Full End-to-End Packaging Workflow", () => {
    it("collects extension files without missing any components", () => {
      const files = collectExtensionFiles(extensionDir);
      const relativePaths = files.map((f) => f.relativePath);

      // Verify root placement of manifest.json
      expect(relativePaths).toContain("manifest.json");

      // Verify all essential directories are represented
      expect(relativePaths.some((p) => p.startsWith("background/"))).toBe(true);
      expect(relativePaths.some((p) => p.startsWith("content/"))).toBe(true);
      expect(relativePaths.some((p) => p.startsWith("icons/"))).toBe(true);
      expect(relativePaths.some((p) => p.startsWith("popup/"))).toBe(true);
      expect(relativePaths.some((p) => p.startsWith("vault/"))).toBe(true);

      // Verify no backslashes in zip paths
      for (const p of relativePaths) {
        expect(p).not.toContain("\\");
      }
    });

    it("runs packageExtension and creates production zip files with correct SHA-256", async () => {
      const result = await packageExtension();

      expect(result.version).toBe("1.0.0");
      expect(result.fileCount).toBeGreaterThanOrEqual(16);
      expect(result.zipSize).toBeGreaterThan(10000); // > 10KB
      expect(result.hash).toHaveLength(64); // SHA-256 hex string

      expect(fs.existsSync(result.distZipPath)).toBe(true);
      expect(fs.existsSync(result.publicZipPath)).toBe(true);

      // Verify file size on disk matches zipBuffer size
      const distStat = fs.statSync(result.distZipPath);
      expect(distStat.size).toBe(result.zipSize);
    });
  });
});
