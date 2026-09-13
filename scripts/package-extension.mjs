import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const JUNK_FILE_PATTERNS = [
  /^\.DS_Store$/i,
  /^Thumbs\.db$/i,
  /^desktop\.ini$/i,
  /^ehthumbs\.db$/i,
  /^\.git/i,
  /\.crx$/i,
  /\.zip$/i,
  /\.pem$/i,
  /~$/,
  /\.swp$/i,
  /\.tmp$/i,
  /\.bak$/i,
];

/**
 * Format a JavaScript Date into MS-DOS date & time (16-bit integers).
 */
export function dosDateTime(date = new Date()) {
  const time =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((Math.floor(date.getSeconds() / 2)) & 0x1f);

  const year = Math.max(1980, date.getFullYear());
  const d =
    (((year - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);

  return { time, date: d };
}

/**
 * Validates the extension manifest according to Chrome Web Store and Edge Add-ons requirements.
 */
export function validateManifest(extensionDir) {
  const manifestPath = path.join(extensionDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest.json not found in ${extensionDir}`);
  }

  const raw = fs.readFileSync(manifestPath, "utf-8");
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (err) {
    throw new Error(`manifest.json is not valid JSON: ${err.message}`);
  }

  const errors = [];

  if (manifest.manifest_version !== 3) {
    errors.push(`manifest_version must be 3, found ${manifest.manifest_version}`);
  }

  if (!manifest.name || typeof manifest.name !== "string" || !manifest.name.trim()) {
    errors.push("name is required and must be a non-empty string");
  }

  if (!manifest.version || !/^\d+(\.\d+){0,3}$/.test(manifest.version)) {
    errors.push(`version '${manifest.version}' is invalid. Must be 1-4 dot-separated integers (e.g. 1.0.0)`);
  }

  if (!manifest.description) {
    errors.push("description is required");
  } else if (manifest.description.length > 132) {
    errors.push(`description length (${manifest.description.length}) exceeds Chrome Web Store max of 132 characters`);
  }

  // Check background service worker
  if (manifest.background?.service_worker) {
    const swPath = path.join(extensionDir, manifest.background.service_worker);
    if (!fs.existsSync(swPath)) {
      errors.push(`Background service worker file missing: ${manifest.background.service_worker}`);
    }
  } else {
    errors.push("background.service_worker is required for MV3");
  }

  // Check content scripts
  if (Array.isArray(manifest.content_scripts)) {
    for (const cs of manifest.content_scripts) {
      if (Array.isArray(cs.js)) {
        for (const jsFile of cs.js) {
          const filePath = path.join(extensionDir, jsFile);
          if (!fs.existsSync(filePath)) {
            errors.push(`Content script missing: ${jsFile}`);
          }
        }
      }
    }
  }

  // Check popup action
  if (manifest.action?.default_popup) {
    const popupPath = path.join(extensionDir, manifest.action.default_popup);
    if (!fs.existsSync(popupPath)) {
      errors.push(`Popup HTML file missing: ${manifest.action.default_popup}`);
    }
  }

  // Check icons
  const iconDicts = [manifest.icons, manifest.action?.default_icon].filter(Boolean);
  for (const dict of iconDicts) {
    for (const [size, iconPath] of Object.entries(dict)) {
      const fullIconPath = path.join(extensionDir, iconPath);
      if (!fs.existsSync(fullIconPath)) {
        errors.push(`Icon (${size}px) missing at: ${iconPath}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Manifest validation failed:\n  - ${errors.join("\n  - ")}`);
  }

  return manifest;
}

/**
 * Checks if a filename matches unwanted OS junk or temp patterns.
 */
export function isJunkFile(filename) {
  const base = path.basename(filename);
  return JUNK_FILE_PATTERNS.some((pattern) => pattern.test(base));
}

/**
 * Recursively collect all non-junk files in the extension directory with POSIX paths.
 */
export function collectExtensionFiles(extensionDir) {
  const results = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (isJunkFile(entry.name)) {
        continue;
      }
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const relativePath = path.relative(extensionDir, fullPath).replace(/\\/g, "/");
        const stats = fs.statSync(fullPath);
        results.push({
          fullPath,
          relativePath,
          size: stats.size,
          mtime: stats.mtime,
        });
      }
    }
  }

  walk(extensionDir);

  // Sort files predictably
  results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return results;
}

/**
 * Builds a valid PKZIP (ZIP) binary Buffer from a list of files without external dependencies.
 */
export function buildZipBuffer(files) {
  const localChunks = [];
  const cdChunks = [];
  let offset = 0;

  for (const file of files) {
    const dataBuf = fs.readFileSync(file.fullPath);
    const filenameBuf = Buffer.from(file.relativePath, "utf8");
    const crc = zlib.crc32(dataBuf);
    const compressed = zlib.deflateRawSync(dataBuf);
    const dt = dosDateTime(file.mtime);

    // Local file header (30 bytes + name + compressed data)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
    localHeader.writeUInt16LE(20, 4);          // Version needed: 2.0
    localHeader.writeUInt16LE(0x0800, 6);      // Flags: UTF-8 filename (bit 11)
    localHeader.writeUInt16LE(8, 8);           // Compression: Deflate
    localHeader.writeUInt16LE(dt.time, 10);    // Last mod time
    localHeader.writeUInt16LE(dt.date, 12);    // Last mod date
    localHeader.writeUInt32LE(crc, 14);        // CRC-32
    localHeader.writeUInt32LE(compressed.length, 18); // Compressed size
    localHeader.writeUInt32LE(dataBuf.length, 22);    // Uncompressed size
    localHeader.writeUInt16LE(filenameBuf.length, 26); // Filename length
    localHeader.writeUInt16LE(0, 28);                  // Extra field length

    localChunks.push(localHeader, filenameBuf, compressed);

    // Central directory file header (46 bytes + name)
    const cdHeader = Buffer.alloc(46);
    cdHeader.writeUInt32LE(0x02014b50, 0);     // Central directory file header signature
    cdHeader.writeUInt16LE(20, 4);              // Version made by: 2.0
    cdHeader.writeUInt16LE(20, 6);              // Version needed: 2.0
    cdHeader.writeUInt16LE(0x0800, 8);          // Flags: UTF-8 filename (bit 11)
    cdHeader.writeUInt16LE(8, 10);              // Compression: Deflate
    cdHeader.writeUInt16LE(dt.time, 12);        // Last mod time
    cdHeader.writeUInt16LE(dt.date, 14);        // Last mod date
    cdHeader.writeUInt32LE(crc, 16);            // CRC-32
    cdHeader.writeUInt32LE(compressed.length, 20); // Compressed size
    cdHeader.writeUInt32LE(dataBuf.length, 24);    // Uncompressed size
    cdHeader.writeUInt16LE(filenameBuf.length, 28); // Filename length
    cdHeader.writeUInt16LE(0, 30);              // Extra field length
    cdHeader.writeUInt16LE(0, 32);              // Comment length
    cdHeader.writeUInt16LE(0, 34);              // Disk number start
    cdHeader.writeUInt16LE(0, 36);              // Internal file attributes
    cdHeader.writeUInt32LE(0, 38);              // External file attributes
    cdHeader.writeUInt32LE(offset, 42);         // Relative offset of local header

    cdChunks.push(cdHeader, filenameBuf);

    offset += localHeader.length + filenameBuf.length + compressed.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const chunk of cdChunks) {
    cdSize += chunk.length;
  }

  // End of central directory record (EOCD) (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);     // EOCD signature
  eocd.writeUInt16LE(0, 4);              // Number of this disk
  eocd.writeUInt16LE(0, 6);              // Disk where central directory starts
  eocd.writeUInt16LE(files.length, 8);   // Number of central directory records on this disk
  eocd.writeUInt16LE(files.length, 10);  // Total number of central directory records
  eocd.writeUInt32LE(cdSize, 12);        // Size of central directory
  eocd.writeUInt32LE(cdOffset, 16);      // Offset of start of central directory
  eocd.writeUInt16LE(0, 20);             // ZIP file comment length

  return Buffer.concat([...localChunks, ...cdChunks, eocd]);
}

/**
 * Main packaging routine.
 */
export async function packageExtension(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const extensionDir = options.extensionDir || path.join(rootDir, "public", "extension");
  const distDir = options.distDir || path.join(rootDir, "dist");
  const publicDir = options.publicDir || path.join(rootDir, "public");

  console.log("\n📦 Lokker Browser Extension Packager");
  console.log("=====================================");
  console.log(`Source directory : ${extensionDir}`);

  // 1. Validate manifest
  const manifest = validateManifest(extensionDir);
  console.log(`✓ Manifest verified: ${manifest.name} v${manifest.version} (MV${manifest.manifest_version})`);

  // 2. Collect files
  const files = collectExtensionFiles(extensionDir);
  if (!files.some((f) => f.relativePath === "manifest.json")) {
    throw new Error("Critical error: manifest.json is not at the root of the extension folder!");
  }

  console.log(`✓ Found ${files.length} clean extension files (excluded OS & temp junk)`);

  // 3. Build ZIP
  const zipBuffer = buildZipBuffer(files);
  const hash = crypto.createHash("sha256").update(zipBuffer).digest("hex");

  // 4. Write targets
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const distZipPath = path.join(distDir, `lokker-extension-v${manifest.version}.zip`);
  const publicZipPath = path.join(publicDir, "lokker-browser-extension-mv3.zip");

  fs.writeFileSync(distZipPath, zipBuffer);
  fs.writeFileSync(publicZipPath, zipBuffer);

  const totalRawSize = files.reduce((acc, f) => acc + f.size, 0);
  const ratio = ((1 - zipBuffer.length / totalRawSize) * 100).toFixed(1);

  console.log("\nIncluded Files:");
  for (const f of files) {
    console.log(`  • ${f.relativePath.padEnd(35)} ${(f.size / 1024).toFixed(1)} KB`);
  }

  console.log("\nPackage Summary:");
  console.log(`  Uncompressed size : ${(totalRawSize / 1024).toFixed(2)} KB`);
  console.log(`  Compressed size   : ${(zipBuffer.length / 1024).toFixed(2)} KB (${ratio}% reduction)`);
  console.log(`  SHA-256 Checksum  : ${hash}`);
  console.log("\nGenerated Artifacts:");
  console.log(`  1. Web Store submission : ${path.relative(rootDir, distZipPath)}`);
  console.log(`  2. Web Vault download   : ${path.relative(rootDir, publicZipPath)}`);
  console.log("\n✅ Ready for Chrome Web Store & Edge Add-ons upload!\n");

  return {
    version: manifest.version,
    fileCount: files.length,
    rawSize: totalRawSize,
    zipSize: zipBuffer.length,
    hash,
    distZipPath,
    publicZipPath,
  };
}

// Execute directly if run via CLI
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  packageExtension().catch((err) => {
    console.error(`\n❌ Packaging failed: ${err.message}\n`);
    process.exit(1);
  });
}
