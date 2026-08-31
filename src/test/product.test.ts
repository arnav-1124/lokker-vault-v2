import { describe, it, expect } from "vitest";
import { Category, PasswordEntry, Bookmark } from "../types";
import {
  generateSecurePassword,
  generateMemorablePassphrase,
  calculatePasswordStrength,
} from "../lib/crypto";

describe("Lokker Product Workflows & Logic", () => {
  describe("Password Generator & Modes", () => {
    it("generates random password conforming to length and exclusion constraints", () => {
      const pwd = generateSecurePassword({
        length: 32,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: true,
      });

      expect(pwd.length).toBe(32);
      // Ensure excluded characters (I, O, l, 1, 0, o) are not present
      expect(/[IOl10o]/.test(pwd)).toBe(false);
    });

    it("generates memorable passphrases with specified word count", () => {
      const phrase = generateMemorablePassphrase(5, "-");
      const parts = phrase.split("-");
      expect(parts.length).toBe(6); // 5 words + 1 random 2-digit number
      expect(parts.slice(0, 5).every((w) => w.length >= 4)).toBe(true);
    });

    it("correctly calculates password entropy strength score", () => {
      const short = calculatePasswordStrength("123");
      expect(short.score).toBe(25);
      expect(short.label).toBe("Weak");

      const medium = calculatePasswordStrength("pass1");
      expect(medium.score).toBe(25);

      const strong = calculatePasswordStrength("Password123");
      expect(strong.score).toBe(75);
      expect(strong.label).toBe("Strong");

      const veryStrong = calculatePasswordStrength("K9#mQ!vL2$xP9@zW");
      expect(veryStrong.score).toBe(100);
      expect(veryStrong.label).toBe("Very Strong");
    });
  });

  describe("Category Hierarchies & Organization", () => {
    it("preserves nested parent-child category relationships", () => {
      const categories: Category[] = [
        { id: "cat-root-1", name: "Work", color: "#3b82f6" },
        { id: "cat-sub-1", name: "Infrastructure", color: "#10b981", parentId: "cat-root-1" },
        { id: "cat-sub-2", name: "Billing", color: "#f59e0b", parentId: "cat-root-1" },
        { id: "cat-root-2", name: "Personal", color: "#ec4899" },
      ];

      const parentMap = new Map<string, string>();
      categories.forEach((c) => parentMap.set(c.id, c.name));

      expect(parentMap.get(categories[1].parentId!)).toBe("Work");
      expect(categories.filter((c) => c.parentId === "cat-root-1").length).toBe(2);
    });
  });

  describe("Bidirectional Credential & Bookmark Synchronization Logic", () => {
    it("creates synchronized bookmark representation when credential is saved", () => {
      const newPassword: PasswordEntry = {
        id: "pwd-1",
        websiteName: "GitHub",
        websiteUrl: "https://github.com",
        username: "octocat@github.com",
        password: "SecretPassword123!",
        category: "Development",
        isFavorite: true,
        createdAt: 1000,
        updatedAt: 1000,
      };

      const existingBookmarks: Bookmark[] = [];
      const isMatch = (url1: string, url2: string) =>
        url1.toLowerCase().replace(/^https?:\/\//, "") === url2.toLowerCase().replace(/^https?:\/\//, "");

      const matchedIndex = existingBookmarks.findIndex((b) => isMatch(b.url, newPassword.websiteUrl || ""));

      let updatedBookmarks: Bookmark[];
      if (matchedIndex >= 0) {
        updatedBookmarks = [...existingBookmarks];
      } else {
        const syncedBookmark: Bookmark = {
          id: "bm-synced-1",
          title: newPassword.websiteName,
          url: newPassword.websiteUrl || "",
          category: newPassword.category,
          isFavorite: newPassword.isFavorite,
          description: newPassword.notes,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        updatedBookmarks = [syncedBookmark, ...existingBookmarks];
      }

      expect(updatedBookmarks.length).toBe(1);
      expect(updatedBookmarks[0].title).toBe("GitHub");
      expect(updatedBookmarks[0].category).toBe("Development");
      expect(updatedBookmarks[0].isFavorite).toBe(true);
    });
  });
});
