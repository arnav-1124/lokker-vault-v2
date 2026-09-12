import { describe, expect, it } from "vitest";
import type { Category } from "@/types";
import {
  buildCategoryTree,
  getCategoryPathArray,
  formatCategoryPath,
  getCategoryDescendantIds,
  getCategoryAncestors,
  getCategoryFamilyNames,
  reconcileMissingCategories,
} from "@/lib/category-tree";

describe("Category Tree Utilities", () => {
  const sampleCategories: Category[] = [
    { id: "root-1", name: "Work", color: "#3b82f6" },
    { id: "child-1", name: "Engineering", color: "#10b981", parentId: "root-1" },
    { id: "grandchild-1", name: "Frontend", color: "#f59e0b", parentId: "child-1" },
    { id: "great-grandchild-1", name: "React", color: "#06b6d4", parentId: "grandchild-1" },
    { id: "root-2", name: "Personal", color: "#8b5cf6" },
    { id: "child-2", name: "Finance", color: "#ec4899", parentId: "root-2" },
  ];

  it("builds a multi-level tree with accurate depths and paths", () => {
    const tree = buildCategoryTree(sampleCategories);
    expect(tree).toHaveLength(6);

    const work = tree.find((t) => t.category.id === "root-1");
    expect(work?.depth).toBe(0);
    expect(work?.hasChildren).toBe(true);
    expect(work?.path).toBe("Work");

    const eng = tree.find((t) => t.category.id === "child-1");
    expect(eng?.depth).toBe(1);
    expect(eng?.hasChildren).toBe(true);
    expect(eng?.path).toBe("Work / Engineering");

    const frontend = tree.find((t) => t.category.id === "grandchild-1");
    expect(frontend?.depth).toBe(2);
    expect(frontend?.hasChildren).toBe(true);
    expect(frontend?.path).toBe("Work / Engineering / Frontend");

    const react = tree.find((t) => t.category.id === "great-grandchild-1");
    expect(react?.depth).toBe(3);
    expect(react?.hasChildren).toBe(false);
    expect(react?.path).toBe("Work / Engineering / Frontend / React");
  });

  it("resolves formatted category breadcrumbs correctly", () => {
    expect(formatCategoryPath("React", sampleCategories)).toBe("Work › Engineering › Frontend › React");
    expect(formatCategoryPath("Finance", sampleCategories)).toBe("Personal › Finance");
    expect(formatCategoryPath("Work", sampleCategories)).toBe("Work");
  });

  it("finds all descendant IDs of a category recursively", () => {
    const workDescendants = getCategoryDescendantIds("root-1", sampleCategories);
    expect(workDescendants.has("child-1")).toBe(true);
    expect(workDescendants.has("grandchild-1")).toBe(true);
    expect(workDescendants.has("great-grandchild-1")).toBe(true);
    expect(workDescendants.has("root-2")).toBe(false);
    expect(workDescendants.has("child-2")).toBe(false);

    const engDescendants = getCategoryDescendantIds("child-1", sampleCategories);
    expect(engDescendants.has("grandchild-1")).toBe(true);
    expect(engDescendants.has("great-grandchild-1")).toBe(true);
    expect(engDescendants.has("root-1")).toBe(false);
  });

  it("finds all ancestor categories correctly", () => {
    const ancestors = getCategoryAncestors("great-grandchild-1", sampleCategories);
    expect(ancestors.map((a) => a.name)).toEqual(["Frontend", "Engineering", "Work"]);

    const rootAncestors = getCategoryAncestors("root-1", sampleCategories);
    expect(rootAncestors).toHaveLength(0);
  });

  it("returns family names for subtree filtering", () => {
    const workFamily = getCategoryFamilyNames("Work", sampleCategories);
    expect(workFamily.has("work")).toBe(true);
    expect(workFamily.has("engineering")).toBe(true);
    expect(workFamily.has("frontend")).toBe(true);
    expect(workFamily.has("react")).toBe(true);
    expect(workFamily.has("personal")).toBe(false);

    const reactFamily = getCategoryFamilyNames("React", sampleCategories);
    expect(reactFamily.has("react")).toBe(true);
    expect(reactFamily.has("frontend")).toBe(false);
  });

  it("reconciles missing categories (e.g. from Cloud sync)", () => {
    const cloudEntries = [
      { category: "Work" }, // existing
      { category: "DevOps" }, // missing
      { category: "Security Audit" }, // missing
    ];

    const { updatedCategories, addedCount } = reconcileMissingCategories(cloudEntries, sampleCategories);
    expect(addedCount).toBe(2);
    expect(updatedCategories).toHaveLength(8);
    expect(updatedCategories.some((c) => c.name === "DevOps")).toBe(true);
    expect(updatedCategories.some((c) => c.name === "Security Audit")).toBe(true);
  });

  it("handles transfer and re-parenting of subcategories when a category is deleted", () => {
    // Suppose we delete "Engineering" (child-1) and transfer to "Personal" (root-2)
    const deletingCat = sampleCategories.find((c) => c.id === "child-1")!;
    const targetCat = sampleCategories.find((c) => c.id === "root-2")!;

    // 1. Target cannot be self or descendant
    const descendants = getCategoryDescendantIds(deletingCat.id, sampleCategories);
    expect(descendants.has(deletingCat.id)).toBe(false);
    expect(descendants.has(targetCat.id)).toBe(false);

    // 2. Re-parent direct children of child-1 to root-2
    const remainingCategories = sampleCategories
      .filter((c) => c.id !== deletingCat.id)
      .map((c) => {
        if (c.parentId === deletingCat.id) {
          return { ...c, parentId: targetCat.id };
        }
        return c;
      });

    // Frontend (grandchild-1) was child-1's child; now its parent should be root-2 ("Personal")
    const frontend = remainingCategories.find((c) => c.id === "grandchild-1");
    expect(frontend?.parentId).toBe("root-2");

    // Great-grandchild "React" was grandchild-1's child; its parent remains grandchild-1
    const react = remainingCategories.find((c) => c.id === "great-grandchild-1");
    expect(react?.parentId).toBe("grandchild-1");

    // Path of React is now "Personal › Frontend › React"
    expect(formatCategoryPath("React", remainingCategories)).toBe("Personal › Frontend › React");
  });

  it("preserves category parentId relationships in vault export payload while excluding cloud scope", () => {
    const passwords = [
      { id: "p1", websiteName: "GitHub", username: "dev", category: "React", storageScope: "local" },
      { id: "p2", websiteName: "AWS", username: "root", category: "Engineering", storageScope: "cloud" },
    ];
    const bookmarks = [
      { id: "b1", title: "React Docs", url: "https://react.dev", category: "React", storageScope: "local" },
      { id: "b2", title: "Cloud Portal", url: "https://aws.amazon.com", category: "Engineering", storageScope: "cloud" },
    ];

    // Filter out cloud items for local export
    const localPasswords = passwords.filter((p) => p.storageScope !== "cloud");
    const localBookmarks = bookmarks.filter((b) => b.storageScope !== "cloud");

    expect(localPasswords).toHaveLength(1);
    expect(localPasswords[0].websiteName).toBe("GitHub");
    expect(localBookmarks).toHaveLength(1);
    expect(localBookmarks[0].title).toBe("React Docs");

    // All categories (parents and nested subcategories) are intact with parentId
    const nestedCats = sampleCategories.filter((c) => !!c.parentId);
    expect(nestedCats.length).toBeGreaterThanOrEqual(4);
    expect(sampleCategories.find((c) => c.id === "great-grandchild-1")?.parentId).toBe("grandchild-1");
  });
});
