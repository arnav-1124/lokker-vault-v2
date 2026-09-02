/**
 * Standard RFC 6238 TOTP generation using Web Crypto HMAC-SHA1.
 *
 * Fail-closed: when a code cannot be derived (invalid/empty secret, crypto
 * failure) this module throws an AppError instead of returning a
 * plausible-looking placeholder code.
 */

import { AppError } from "./errors";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32ToBytes(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/[\s=-]/g, "");
  let bits = "";
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return bytes;
}

export async function generateTOTPCode(
  secret: string,
  timeStepSeconds = 30,
  digits = 6,
  nowMs: number = Date.now()
): Promise<{ code: string; secondsRemaining: number }> {
  try {
    const now = Math.floor(nowMs / 1000);
    const counter = Math.floor(now / timeStepSeconds);
    const secondsRemaining = timeStepSeconds - (now % timeStepSeconds);

    // RFC 6238: 8-byte big-endian counter. Unix time / 30 fits the low 32
    // bits until ~year 6000, so bytes 0-3 legitimately stay zero.
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setUint32(4, counter, false);

    const keyBytes = base32ToBytes(secret);
    if (keyBytes.length === 0) {
      throw new AppError("TOTP secret decoded to zero bytes", {
        code: "TOTP_INVALID_SECRET",
        userMessage: "This entry's 2FA secret key is invalid. Edit the entry and re-scan the QR code.",
      });
    }

    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes as unknown as BufferSource,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, counterBuffer);
    const hash = new Uint8Array(signature);

    const offset = hash[hash.length - 1] & 0xf;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, digits);
    const code = otp.toString().padStart(digits, "0");

    return { code, secondsRemaining };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("TOTP generation failed", {
      code: "TOTP_GENERATION_FAILED",
      userMessage: "Could not generate the 2FA code for this entry. Check its secret key.",
      cause: err,
    });
  }
}
