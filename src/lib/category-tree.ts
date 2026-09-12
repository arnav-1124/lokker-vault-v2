import { Category } from "@/types";
import { generateId } from "./id";

export interface CategoryTreeItem {
  category: Category;
  depth: number;
  hasChildren: boolean;
  childCount: number;
  ancestors: Category[];
  path: string; // e.g. "Work / Projects / Client A"
}

/**
 * Builds a flat, depth-first ordered list of category tree items for arbitrary depth.
 */
export function buildCategoryTree(categories: Category[]): CategoryTreeItem[] {
  const childrenMap = new Map<string, Category[]>();
  const rootCats: Category[] = [];

  categories.forEach((cat) => {
    if (cat.parentId) {
      const list = childrenMap.get(cat.parentId) || [];
      list.push(cat);
      childrenMap.set(cat.parentId, list);
    } else {
      rootCats.push(cat);
    }
  });

  const catMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const result: CategoryTreeItem[] = [];
  const visited = new Set<string>();

  const walk = (cat: Category, depth: number, ancestorList: Category[]) => {
    if (visited.has(cat.id)) return; // Prevent circular reference loops
    visited.add(cat.id);

    const children = childrenMap.get(cat.id) || [];
    const currentAncestors = [...ancestorList];
    const pathNames = [...currentAncestors.map((a) => a.name), cat.name];

    result.push({
      category: cat,
      depth,
      hasChildren: children.length > 0,
      childCount: children.length,
      ancestors: currentAncestors,
      path: pathNames.join(" / "),
    });

    children.forEach((child) => walk(child, depth + 1, [...currentAncestors, cat]));
  };

  rootCats.forEach((root) => walk(root, 0, []));

  // Handle orphan categories (categories whose parentId does not exist)
  categories.forEach((cat) => {
    if (!visited.has(cat.id)) {
      const parent = cat.parentId ? catMap.get(cat.parentId) : null;
      if (!parent) {
        walk(cat, 0, []);
      }
    }
  });

  return result;
}

/**
 * Resolves the full breadcrumb path of a category by name or ID.
 * Returns array of category names, e.g. ["Work", "Projects", "Client A"].
 */
export function getCategoryPathArray(catNameOrId: string, categories: Category[]): string[] {
  const cat = categories.find((c) => c.name === catNameOrId || c.id === catNameOrId);
  if (!cat) return [catNameOrId];

  const catMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const path: string[] = [cat.name];
  let curr = cat;
  const visited = new Set<string>([cat.id]);

  while (curr.parentId && catMap.has(curr.parentId)) {
    const parent = catMap.get(curr.parentId)!;
    if (visited.has(parent.id)) break; // circular safeguard
    visited.add(parent.id);
    path.unshift(parent.name);
    curr = parent;
  }

  return path;
}

/**
 * Returns formatted breadcrumb path string e.g. "Work › Projects › Client A"
 */
export function formatCategoryPath(catNameOrId: string, categories: Category[], separator = " › "): string {
  const arr = getCategoryPathArray(catNameOrId, categories);
  return arr.join(separator);
}

/**
 * Collects all descendant IDs of a category recursively (excluding the category itself).
 */
export function getCategoryDescendantIds(categoryId: string, categories: Category[]): Set<string> {
  const descendants = new Set<string>();
  const childrenMap = new Map<string, Category[]>();

  categories.forEach((c) => {
    if (c.parentId) {
      const arr = childrenMap.get(c.parentId) || [];
      arr.push(c);
      childrenMap.set(c.parentId, arr);
    }
  });

  const collect = (id: string) => {
    const children = childrenMap.get(id) || [];
    children.forEach((child) => {
      if (!descendants.has(child.id)) {
        descendants.add(child.id);
        collect(child.id);
      }
    });
  };

  collect(categoryId);
  return descendants;
}

/**
 * Collects all ancestor categories for a category, from immediate parent up to root.
 */
export function getCategoryAncestors(categoryId: string, categories: Category[]): Category[] {
  const catMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const target = catMap.get(categoryId);
  if (!target) return [];

  const ancestors: Category[] = [];
  let curr = target;
  const visited = new Set<string>([target.id]);

  while (curr.parentId && catMap.has(curr.parentId)) {
    const parent = catMap.get(curr.parentId)!;
    if (visited.has(parent.id)) break;
    visited.add(parent.id);
    ancestors.push(parent);
    curr = parent;
  }

  return ancestors;
}

/**
 * Returns a Set of category names belonging to the category and all its descendants.
 * Used for subtree filtering: selecting a parent shows items belonging to the parent or any child.
 */
export function getCategoryFamilyNames(categoryName: string, categories: Category[]): Set<string> {
  const target = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
  const names = new Set<string>([categoryName.toLowerCase()]);
  if (!target) return names;

  const descendantIds = getCategoryDescendantIds(target.id, categories);
  categories.forEach((c) => {
    if (descendantIds.has(c.id)) {
      names.add(c.name.toLowerCase());
    }
  });

  return names;
}

/**
 * Scans a list of items (credentials or bookmarks) and creates any categories that exist
 * on the items but are missing from the category list (e.g. when synced from Cloud).
 */
export function reconcileMissingCategories(
  entries: { category?: string }[],
  existingCategories: Category[]
): { updatedCategories: Category[]; addedCount: number } {
  const existingNames = new Set(existingCategories.map((c) => c.name.toLowerCase().trim()));
  const missingNames = new Set<string>();

  entries.forEach((e) => {
    if (e.category) {
      const name = e.category.trim();
      if (name && !existingNames.has(name.toLowerCase())) {
        missingNames.add(name);
      }
    }
  });

  if (missingNames.size === 0) {
    return { updatedCategories: existingCategories, addedCount: 0 };
  }

  const PRESET_COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
  ];

  const newCategories: Category[] = [];
  let colorIndex = 0;

  missingNames.forEach((name) => {
    newCategories.push({
      id: generateId("cat"),
      name,
      color: PRESET_COLORS[colorIndex % PRESET_COLORS.length],
    });
    colorIndex++;
  });

  return {
    updatedCategories: [...existingCategories, ...newCategories],
    addedCount: newCategories.length,
  };
}
