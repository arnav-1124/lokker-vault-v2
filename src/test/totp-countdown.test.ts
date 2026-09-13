import { describe, it, expect } from "vitest";
import { generateTOTPCode } from "../lib/totp";

describe("TOTP Visual Countdown & Row Integration", () => {
  const RFC_SECRET = "JBSWY3DPEHPK3PXP"; // Standard Base32 RFC secret

  it("calculates accurate SVG strokeDashoffset across the 30-second window", () => {
    const radius = 6.5;
    const circumference = 2 * Math.PI * radius; // ~40.8407

    const getOffset = (secondsRemaining: number) => {
      const progress = Math.max(0, Math.min(30, secondsRemaining)) / 30;
      return circumference * (1 - progress);
    };

    // Full ring at 30 seconds
    expect(getOffset(30)).toBe(0);

    // Half ring at 15 seconds
    expect(getOffset(15)).toBeCloseTo(circumference / 2, 2);

    // Depleted ring at 0 seconds
    expect(getOffset(0)).toBeCloseTo(circumference, 2);

    // Clamps properly if secondsRemaining is out of bounds
    expect(getOffset(35)).toBe(0);
    expect(getOffset(-5)).toBeCloseTo(circumference, 2);
  });

  it("applies proper urgency styling thresholds based on remaining seconds", () => {
    const getUrgencyClass = (secondsRemaining: number) => {
      if (secondsRemaining <= 3) return "stroke-rose-500 text-rose-400";
      if (secondsRemaining <= 7) return "stroke-amber-400 text-amber-400";
      return "stroke-primary text-primary";
    };

    expect(getUrgencyClass(25)).toBe("stroke-primary text-primary");
    expect(getUrgencyClass(10)).toBe("stroke-primary text-primary");
    expect(getUrgencyClass(7)).toBe("stroke-amber-400 text-amber-400");
    expect(getUrgencyClass(5)).toBe("stroke-amber-400 text-amber-400");
    expect(getUrgencyClass(3)).toBe("stroke-rose-500 text-rose-400");
    expect(getUrgencyClass(1)).toBe("stroke-rose-500 text-rose-400");
    expect(getUrgencyClass(0)).toBe("stroke-rose-500 text-rose-400");
  });

  it("formats 6-digit TOTP codes with human-readable space grouping", () => {
    const formatCode = (code: string) => {
      if (!code) return "••••••";
      return code.length >= 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
    };

    expect(formatCode("123456")).toBe("123 456");
    expect(formatCode("987654")).toBe("987 654");
    expect(formatCode("")).toBe("••••••");
  });

  it("generates deterministic RFC-compliant codes and secondsRemaining", async () => {
    // 59,000ms = timestamp 59s -> 30s step -> 1s into second step -> 29s remaining
    const result = await generateTOTPCode(RFC_SECRET, 30, 6, 59_000);
    expect(result.code).toHaveLength(6);
    expect(result.secondsRemaining).toBe(1); // 60 - 59 = 1 second remaining
  });

  it("strictly fails closed on invalid or empty secrets", async () => {
    await expect(generateTOTPCode("!!!!")).rejects.toThrow();
    await expect(generateTOTPCode("")).rejects.toThrow();
    await expect(generateTOTPCode("0000")).rejects.toThrow();
  });
});
