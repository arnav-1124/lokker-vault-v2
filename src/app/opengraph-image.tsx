import { ImageResponse } from "next/og";

export const alt = "Lokker — Local-First Zero-Knowledge Password Vault";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#070b12",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(30, 58, 138, 0.25) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(14, 116, 144, 0.2) 0%, transparent 50%)",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              backgroundColor: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(37, 99, 235, 0.4)",
            }}
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <span
            style={{
              fontSize: "36px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#f8fafc",
            }}
          >
            Lokker
          </span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#38bdf8",
              backgroundColor: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              padding: "6px 14px",
              borderRadius: "9999px",
              marginLeft: "12px",
            }}
          >
            Local-First Vault
          </span>
        </div>

        {/* Hero Title & Pitch */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "980px",
          }}
        >
          <h1
            style={{
              fontSize: "64px",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              margin: 0,
              color: "#ffffff",
            }}
          >
            Your vault. Your device.
            <br />
            <span
              style={{
                backgroundImage: "linear-gradient(90deg, #38bdf8, #818cf8)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Your keys. Your control.
            </span>
          </h1>
          <p
            style={{
              fontSize: "24px",
              fontWeight: 400,
              color: "#94a3b8",
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Zero-knowledge password management, TOTP authenticator, encrypted file vault, and browser autofill running completely on your device.
          </p>
        </div>

        {/* Feature Badges Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            paddingTop: "30px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            width: "100%",
            color: "#cbd5e1",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#22c55e" }}>✓</span> AES-GCM 256-Bit
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#22c55e" }}>✓</span> PBKDF2 100,000 Iterations
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#22c55e" }}>✓</span> RFC 6238 TOTP 2FA
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#22c55e" }}>✓</span> Manifest V3 Autofill
          </div>
          <div style={{ marginLeft: "auto", color: "#64748b" }}>
            lokker-vault.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
