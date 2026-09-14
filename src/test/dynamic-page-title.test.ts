import { describe, expect, it, beforeEach, vi } from "vitest";
import { getPageTitle, DynamicPageTitle, ROUTE_TITLES } from "@/components/dynamic-page-title";
import { render } from "@testing-library/react";
import * as React from "react";

// Mock next/navigation
let currentPathname = "/app";
vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

describe("Dynamic Browser Page Title", () => {
  beforeEach(() => {
    currentPathname = "/app";
    document.title = "";
  });

  describe("getPageTitle mapping", () => {
    it("maps personal vault routes to clean user-friendly titles", () => {
      expect(getPageTitle("/app")).toBe("Dashboard");
      expect(getPageTitle("/app/passwords")).toBe("Password Vault");
      expect(getPageTitle("/app/settings")).toBe("Settings");
      expect(getPageTitle("/app/bookmarks")).toBe("Bookmarks");
      expect(getPageTitle("/app/favorites")).toBe("Favorites");
      expect(getPageTitle("/app/totp")).toBe("2FA Authenticator");
      expect(getPageTitle("/app/generator")).toBe("Password Generator");
      expect(getPageTitle("/app/security-audit")).toBe("Security Audit");
      expect(getPageTitle("/app/passkeys")).toBe("Passkeys");
      expect(getPageTitle("/app/files")).toBe("File Vault");
      expect(getPageTitle("/app/masked-emails")).toBe("Masked Emails");
      expect(getPageTitle("/app/import-export")).toBe("Import & Export");
      expect(getPageTitle("/app/extension")).toBe("Browser Extension");
      expect(getPageTitle("/app/guide")).toBe("User Guide");
      expect(getPageTitle("/app/workspaces")).toBe("Workspaces");
      expect(getPageTitle("/app/why-to-pay")).toBe("Why Pay");
    });

    it("normalizes trailing slashes", () => {
      expect(getPageTitle("/app/passwords/")).toBe("Password Vault");
      expect(getPageTitle("/app/settings/")).toBe("Settings");
    });

    it("maps workspace subroutes dynamically", () => {
      expect(getPageTitle("/app/workspace/ws-123/passwords")).toBe("Workspace Passwords");
      expect(getPageTitle("/app/workspace/ws-123/bookmarks")).toBe("Workspace Bookmarks");
      expect(getPageTitle("/app/workspace/ws-123/members")).toBe("Workspace Members");
      expect(getPageTitle("/app/workspace/ws-123/activity")).toBe("Workspace Activity");
      expect(getPageTitle("/app/workspace/ws-123/settings")).toBe("Workspace Settings");
      expect(getPageTitle("/app/workspace/ws-123")).toBe("Team Workspace");
    });

    it("maps marketing and auth routes", () => {
      expect(getPageTitle("/login")).toBe("Sign In");
      expect(getPageTitle("/signup")).toBe("Create Account");
      expect(getPageTitle("/pricing")).toBe("Pricing");
      expect(getPageTitle("/features")).toBe("Features");
      expect(getPageTitle("/security")).toBe("Security Architecture");
      expect(getPageTitle("/docs")).toBe("Documentation");
      expect(getPageTitle("/download")).toBe("Download Extension");
    });

    it("derives readable titles for arbitrary nested routes", () => {
      expect(getPageTitle("/some-new-feature")).toBe("Some New Feature");
    });
  });

  describe("DynamicPageTitle Component", () => {
    it("dynamically sets document.title in 'Lokker - <Page>' format", () => {
      currentPathname = "/app";
      const { rerender } = render(React.createElement(DynamicPageTitle));
      expect(document.title).toBe("Lokker - Dashboard");

      // Simulate navigating to /app/passwords
      currentPathname = "/app/passwords";
      rerender(React.createElement(DynamicPageTitle));
      expect(document.title).toBe("Lokker - Password Vault");

      // Simulate navigating to /app/settings
      currentPathname = "/app/settings";
      rerender(React.createElement(DynamicPageTitle));
      expect(document.title).toBe("Lokker - Settings");
    });
  });
});
