/**
 * Robust CSV and JSON format detection and parsing for Password Vault portability.
 * Supports:
 * - Chrome CSV (`name,url,username,password,note`)
 * - Bitwarden CSV & JSON (`login_uri,login_username,login_password,name,notes,login_totp`)
 * - 1Password CSV (`title,website,username,password,notes`)
 * - Lokker Plain CSV & JSON
 * - Lokker Encrypted JSON Backups (`isEncryptedBackup: true`)
 */

import { Bookmark, Category, PasswordEntry } from "@/types";
import { generateId } from "@/lib/id";
import { decryptPayload, deriveKeyFromPassword } from "./crypto";

export function parseCSVRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\r") {
        // ignore CR
      } else if (char === "\n") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((r) => r.length > 0 && r.some((c) => c.trim().length > 0));
}

export function parseCSVToEntries(csvText: string): PasswordEntry[] {
  const rows = parseCSVRows(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().trim().replace(/^"|"$/g, ""));

  // Find column indices
  let titleIdx = headers.findIndex((h) => ["title", "name", "website name", "item name"].includes(h));
  let urlIdx = headers.findIndex((h) => ["url", "website", "website url", "login_uri", "uri"].includes(h));
  let userIdx = headers.findIndex((h) => ["username", "user", "login_username", "email", "login"].includes(h));
  let passIdx = headers.findIndex((h) => ["password", "login_password", "pass"].includes(h));
  let notesIdx = headers.findIndex((h) => ["notes", "note", "comment", "extra"].includes(h));
  let catIdx = headers.findIndex((h) => ["category", "folder", "group"].includes(h));
  let totpIdx = headers.findIndex((h) => ["totp", "login_totp", "2fa", "otp", "secret"].includes(h));

  // Default fallback positional mappings if headers not recognized
  if (titleIdx === -1) titleIdx = 0;
  if (urlIdx === -1) urlIdx = 1;
  if (userIdx === -1) userIdx = 2;
  if (passIdx === -1) passIdx = 3;

  const entries: PasswordEntry[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = (row[titleIdx] || "").trim();
    const url = urlIdx >= 0 ? (row[urlIdx] || "").trim() : "";
    const username = userIdx >= 0 ? (row[userIdx] || "").trim() : "";
    const password = passIdx >= 0 ? (row[passIdx] || "").trim() : "";
    const notes = notesIdx >= 0 ? (row[notesIdx] || "").trim() : "";
    const category = catIdx >= 0 && row[catIdx]?.trim() ? row[catIdx].trim() : "Imported";
    const totpSecret = totpIdx >= 0 ? (row[totpIdx] || "").trim() : "";

    if (name || url || username || password) {
      entries.push({
        id: generateId("pwd-imp"),
        websiteName: name || (url ? new URL(url.startsWith("http") ? url : `https://${url}`).hostname : "Imported Item"),
        websiteUrl: url,
        username,
        password,
        notes,
        category,
        totpSecret,
        isFavorite: false,
        entryType: "login",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }

  return entries;
}

export interface ParsedImportResult {
  isEncrypted: boolean;
  encryptedBackup?: {
    cipherText: string;
    iv: string;
    salt: string;
  };
  passwords: PasswordEntry[];
  bookmarks: Bookmark[];
  categories: Category[];
}

export function parseJSONBackupText(jsonText: string): ParsedImportResult {
  const data = JSON.parse(jsonText);

  // 1. Encrypted Lokker Backup
  if (data.isEncryptedBackup && data.cipherText && data.iv && data.salt) {
    return {
      isEncrypted: true,
      encryptedBackup: {
        cipherText: data.cipherText,
        iv: data.iv,
        salt: data.salt,
      },
      passwords: [],
      bookmarks: [],
      categories: [],
    };
  }

  // 2. Standard Plain Lokker Backup
  if (Array.isArray(data.passwords) || Array.isArray(data.bookmarks)) {
    return {
      isEncrypted: false,
      passwords: Array.isArray(data.passwords) ? data.passwords : [],
      bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
      categories: Array.isArray(data.categories) ? data.categories : [],
    };
  }

  // 3. Bitwarden JSON export format (`{ items: [...] }`)
  if (Array.isArray(data.items)) {
    const passwords: PasswordEntry[] = [];
    for (const item of data.items) {
      if (item.type === 1 && item.login) {
        // Login item
        const uri = item.login.uris?.[0]?.uri || "";
        passwords.push({
          id: item.id ? `pwd-bw-${item.id}` : generateId("pwd-bw"),
          websiteName: item.name || "Bitwarden Item",
          websiteUrl: uri,
          username: item.login.username || "",
          password: item.login.password || "",
          totpSecret: item.login.totp || "",
          notes: item.notes || "",
          category: "Bitwarden",
          isFavorite: !!item.favorite,
          entryType: "login",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
    return {
      isEncrypted: false,
      passwords,
      bookmarks: [],
      categories: [],
    };
  }

  throw new Error("Unrecognized JSON backup format.");
}

export async function decryptEncryptedBackupData(
  encryptedBackup: { cipherText: string; iv: string; salt: string },
  masterPassword: string
): Promise<{ passwords: PasswordEntry[]; bookmarks: Bookmark[]; categories: Category[] }> {
  const key = await deriveKeyFromPassword(masterPassword, encryptedBackup.salt);
  const decrypted = await decryptPayload<{
    passwords?: PasswordEntry[];
    bookmarks?: Bookmark[];
    categories?: Category[];
  }>(encryptedBackup.cipherText, encryptedBackup.iv, key);

  return {
    passwords: Array.isArray(decrypted.passwords) ? decrypted.passwords : [],
    bookmarks: Array.isArray(decrypted.bookmarks) ? decrypted.bookmarks : [],
    categories: Array.isArray(decrypted.categories) ? decrypted.categories : [],
  };
}
