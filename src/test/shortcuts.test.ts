import { describe, it, expect } from "vitest";
import { SHORTCUTS_REGISTRY, ShortcutItem } from "../components/modals/shortcuts-modal";

describe("Keyboard Shortcuts & Navigation Cheatsheet", () => {
  it("contains valid and unique shortcut items across all core categories", () => {
    expect(SHORTCUTS_REGISTRY.length).toBeGreaterThanOrEqual(10);

    const ids = new Set<string>();
    const categories = new Set<string>();

    for (const item of SHORTCUTS_REGISTRY) {
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);

      expect(item.description).toBeTruthy();
      expect(item.macKeys.length).toBeGreaterThan(0);
      expect(item.winKeys.length).toBeGreaterThan(0);
      expect(item.icon).toBeDefined();

      categories.add(item.category);
    }

    expect(categories).toContain("Navigation");
    expect(categories).toContain("Vault Actions");
    expect(categories).toContain("Item & List");
  });

  it("registers essential power-user shortcuts accurately", () => {
    const searchShortcut = SHORTCUTS_REGISTRY.find((s) => s.id === "nav-search");
    expect(searchShortcut).toBeDefined();
    expect(searchShortcut?.macKeys).toEqual(["⌘", "K"]);
    expect(searchShortcut?.winKeys).toEqual(["Ctrl", "K"]);

    const lockShortcut = SHORTCUTS_REGISTRY.find((s) => s.id === "action-lock");
    expect(lockShortcut).toBeDefined();
    expect(lockShortcut?.macKeys).toEqual(["⌘", "L"]);
    expect(lockShortcut?.winKeys).toEqual(["Ctrl", "L"]);

    const cheatsheetShortcut = SHORTCUTS_REGISTRY.find((s) => s.id === "action-shortcuts");
    expect(cheatsheetShortcut).toBeDefined();
    expect(cheatsheetShortcut?.macKeys).toEqual(["?"]);

    const addShortcut = SHORTCUTS_REGISTRY.find((s) => s.id === "action-add");
    expect(addShortcut).toBeDefined();
    expect(addShortcut?.macKeys).toEqual(["N"]);

    const escapeShortcut = SHORTCUTS_REGISTRY.find((s) => s.id === "action-escape");
    expect(escapeShortcut).toBeDefined();
    expect(escapeShortcut?.macKeys).toEqual(["Esc"]);
  });

  it("registers sequential G-navigation shortcuts", () => {
    const gNavigation = SHORTCUTS_REGISTRY.filter(
      (s) => s.category === "Navigation" && s.macKeys[0] === "G"
    );

    const targetSubkeys = gNavigation.map((s) => s.macKeys[1]);
    expect(targetSubkeys).toContain("P"); // Passwords
    expect(targetSubkeys).toContain("B"); // Bookmarks
    expect(targetSubkeys).toContain("T"); // TOTP 2FA
    expect(targetSubkeys).toContain("F"); // Favorites
    expect(targetSubkeys).toContain("W"); // Workspaces
    expect(targetSubkeys).toContain("S"); // Settings
  });

  it("filters shortcuts dynamically by query string (case-insensitive description, keys, or category)", () => {
    const filterShortcuts = (query: string): ShortcutItem[] => {
      if (!query.trim()) return SHORTCUTS_REGISTRY;
      const q = query.toLowerCase().trim();
      return SHORTCUTS_REGISTRY.filter(
        (s) =>
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.macKeys.join("").toLowerCase().includes(q) ||
          s.winKeys.join("").toLowerCase().includes(q)
      );
    };

    // Filter by action keyword
    const lockResults = filterShortcuts("lock");
    expect(lockResults.some((s) => s.id === "action-lock")).toBe(true);

    // Filter by category keyword
    const navResults = filterShortcuts("navigation");
    expect(navResults.length).toBeGreaterThanOrEqual(6);

    // Filter by key combo
    const kResults = filterShortcuts("k");
    expect(kResults.some((s) => s.id === "nav-search")).toBe(true);

    // Empty query returns all
    expect(filterShortcuts("").length).toBe(SHORTCUTS_REGISTRY.length);

    // Non-matching query returns empty
    expect(filterShortcuts("xyzNonExistentKeyPhrase999").length).toBe(0);
  });

  it("correctly models platform-dependent key representations", () => {
    const getKeyDisplay = (isMac: boolean, item: ShortcutItem) => {
      return isMac ? item.macKeys : item.winKeys;
    };

    const searchItem = SHORTCUTS_REGISTRY.find((s) => s.id === "nav-search")!;
    expect(getKeyDisplay(true, searchItem)).toEqual(["⌘", "K"]);
    expect(getKeyDisplay(false, searchItem)).toEqual(["Ctrl", "K"]);
  });

  it("simulates sequential key buffering logic", () => {
    let pendingKey: string | null = null;
    let navigatedTo: string | null = null;

    const routeMap: Record<string, string> = {
      p: "/app/passwords",
      b: "/app/bookmarks",
      t: "/app/totp",
      f: "/app/favorites",
      w: "/app/workspaces",
      s: "/app/settings",
    };

    const handleKey = (key: string) => {
      if (key === "g") {
        pendingKey = "g";
        return;
      }
      if (pendingKey === "g") {
        pendingKey = null;
        if (routeMap[key]) {
          navigatedTo = routeMap[key];
        }
      }
    };

    // G then P -> Passwords
    handleKey("g");
    expect(pendingKey).toBe("g");
    handleKey("p");
    expect(navigatedTo).toBe("/app/passwords");
    expect(pendingKey).toBeNull();

    // G then W -> Workspaces
    handleKey("g");
    handleKey("w");
    expect(navigatedTo).toBe("/app/workspaces");

    // G then unknown -> clears buffer without navigating
    navigatedTo = null;
    handleKey("g");
    handleKey("z");
    expect(navigatedTo).toBeNull();
    expect(pendingKey).toBeNull();
  });
});
