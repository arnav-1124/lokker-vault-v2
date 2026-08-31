import { describe, it, expect } from "vitest";
import {
  parseCSVToEntries,
  parseCSVRows,
  parseJSONBackupText,
  decryptEncryptedBackupData,
} from "../lib/importers";
import {
  encryptPayload,
  deriveKeyFromPassword,
  generateRandomSalt,
  bufferToBase64,
} from "../lib/crypto";

describe("Importer Test Suite", () => {
  it("correctly parses CSV rows with commas inside quotes", () => {
    const csv = `name,url,username,password,note\n"GitHub, Inc.","https://github.com","octocat","p@ss,123","developer notes, api keys"`;
    const rows = parseCSVRows(csv);
    expect(rows.length).toBe(2);
    expect(rows[1][0]).toBe("GitHub, Inc.");
    expect(rows[1][3]).toBe("p@ss,123");
    expect(rows[1][4]).toBe("developer notes, api keys");
  });

  it("correctly parses Chrome CSV format", () => {
    const chromeCSV = `name,url,username,password,note
Google,https://google.com,user@gmail.com,secret123,my primary email
Twitter,https://twitter.com,tweetuser,twitpass,social media`;

    const entries = parseCSVToEntries(chromeCSV);
    expect(entries.length).toBe(2);
    expect(entries[0].websiteName).toBe("Google");
    expect(entries[0].websiteUrl).toBe("https://google.com");
    expect(entries[0].username).toBe("user@gmail.com");
    expect(entries[0].password).toBe("secret123");
    expect(entries[0].notes).toBe("my primary email");

    expect(entries[1].websiteName).toBe("Twitter");
    expect(entries[1].username).toBe("tweetuser");
  });

  it("correctly parses Bitwarden CSV format", () => {
    const bitwardenCSV = `folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp
Personal,1,login,Slack,Team chat,,0,https://slack.com,dev@corp.com,slackpass123,JBSWY3DPEHPK3PXP`;

    const entries = parseCSVToEntries(bitwardenCSV);
    expect(entries.length).toBe(1);
    expect(entries[0].websiteName).toBe("Slack");
    expect(entries[0].websiteUrl).toBe("https://slack.com");
    expect(entries[0].username).toBe("dev@corp.com");
    expect(entries[0].password).toBe("slackpass123");
    expect(entries[0].totpSecret).toBe("JBSWY3DPEHPK3PXP");
  });

  it("correctly parses Bitwarden JSON export", () => {
    const bwJson = JSON.stringify({
      items: [
        {
          id: "bw-item-1",
          name: "Linear App",
          type: 1,
          favorite: true,
          notes: "Issue tracking",
          login: {
            uris: [{ uri: "https://linear.app" }],
            username: "linear_user",
            password: "linear_password",
            totp: "HXDMVJECJJWSRB3H",
          },
        },
      ],
    });

    const result = parseJSONBackupText(bwJson);
    expect(result.isEncrypted).toBe(false);
    expect(result.passwords.length).toBe(1);
    expect(result.passwords[0].websiteName).toBe("Linear App");
    expect(result.passwords[0].websiteUrl).toBe("https://linear.app");
    expect(result.passwords[0].username).toBe("linear_user");
    expect(result.passwords[0].totpSecret).toBe("HXDMVJECJJWSRB3H");
  });

  it("correctly detects and decrypts encrypted Lokker JSON backups", async () => {
    const testPassword = "MyStrongBackupPassword!123";
    const testSalt = bufferToBase64(generateRandomSalt());
    const key = await deriveKeyFromPassword(testPassword, testSalt);

    const vaultPayload = {
      passwords: [
        {
          id: "pwd-1",
          websiteName: "ProtonMail",
          websiteUrl: "https://mail.proton.me",
          username: "secure@proton.me",
          password: "EncryptedPass!789",
          notes: "Encrypted mail",
          category: "Security",
          isFavorite: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      bookmarks: [
        {
          id: "bm-1",
          title: "ProtonMail",
          url: "https://mail.proton.me",
          category: "Security",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      categories: [
        {
          id: "cat-1",
          name: "Security",
          color: "#3b82f6",
        },
      ],
    };

    const { cipherText, iv } = await encryptPayload(vaultPayload, key);

    const encryptedBackupJSON = JSON.stringify({
      app: "Lokker Password Vault",
      version: 2,
      isEncryptedBackup: true,
      cipherText,
      iv,
      salt: testSalt,
    });

    const parsed = parseJSONBackupText(encryptedBackupJSON);
    expect(parsed.isEncrypted).toBe(true);
    expect(parsed.encryptedBackup).toBeDefined();

    if (parsed.encryptedBackup) {
      const decrypted = await decryptEncryptedBackupData(
        parsed.encryptedBackup,
        testPassword
      );
      expect(decrypted.passwords.length).toBe(1);
      expect(decrypted.passwords[0].websiteName).toBe("ProtonMail");
      expect(decrypted.passwords[0].password).toBe("EncryptedPass!789");
      expect(decrypted.bookmarks.length).toBe(1);
      expect(decrypted.categories.length).toBe(1);
    }
  });

  it("fails decryption when wrong password is supplied for encrypted backup", async () => {
    const testSalt = bufferToBase64(generateRandomSalt());
    const key = await deriveKeyFromPassword("CorrectPassword123", testSalt);
    const { cipherText, iv } = await encryptPayload({ passwords: [] }, key);

    const encryptedBackup = {
      cipherText,
      iv,
      salt: testSalt,
    };

    await expect(
      decryptEncryptedBackupData(encryptedBackup, "WrongPassword456")
    ).rejects.toThrow();
  });
});
