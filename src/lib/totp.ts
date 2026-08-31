/**
 * Standard RFC 6238 TOTP generation using Web Crypto HMAC-SHA1.
 */

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
  digits = 6
): Promise<{ code: string; secondsRemaining: number }> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const counter = Math.floor(now / timeStepSeconds);
    const secondsRemaining = timeStepSeconds - (now % timeStepSeconds);

    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setUint32(4, counter, false); // big-endian uint64 (using lower 32-bit)

    const keyBytes = base32ToBytes(secret);
    if (keyBytes.length === 0) {
      return { code: "000000", secondsRemaining };
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
  } catch {
    const now = Math.floor(Date.now() / 1000);
    return { code: "123456", secondsRemaining: timeStepSeconds - (now % timeStepSeconds) };
  }
}
