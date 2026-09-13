"use client";

import * as React from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import {
  Workspace,
  WorkspaceMember,
  WorkspacePlanQuota,
  PasswordEntry,
  Bookmark,
  Category,
  WorkspaceRole,
} from "@/types";
import { appConfig } from "@/config/app";
import { getCloudSession, CLOUD_AUTH_CHANGE_EVENT } from "@/lib/auth-session";

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string | null;
  planQuota: WorkspacePlanQuota;
  userRole: WorkspaceRole | null;
  members: WorkspaceMember[];
  workspacePasswords: PasswordEntry[];
  workspaceBookmarks: Bookmark[];
  workspaceCategories: Category[];
  isLoading: boolean;
  isCloudActive: boolean;
  error: string | null;
  refreshWorkspaces: () => Promise<void>;
  selectWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  updateWorkspace: (workspaceId: string, name?: string, description?: string) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  createInvite: (workspaceId: string) => Promise<{ inviteToken: string; expiresAt: string }>;
  acceptInvite: (inviteToken: string) => Promise<{ workspaceId: string; workspaceName: string }>;
  leaveWorkspace: (workspaceId: string) => Promise<void>;
  saveWorkspacePassword: (entry: PasswordEntry) => Promise<void>;
  deleteWorkspacePassword: (id: string) => Promise<void>;
  toggleWorkspacePasswordFavorite: (id: string) => Promise<void>;
  saveWorkspaceBookmark: (entry: Bookmark) => Promise<void>;
  deleteWorkspaceBookmark: (id: string) => Promise<void>;
  toggleWorkspaceBookmarkFavorite: (id: string) => Promise<void>;
  saveWorkspaceCategory: (category: Category) => Promise<void>;
  deleteWorkspaceCategory: (id: string) => Promise<void>;
  renameWorkspaceCategory: (id: string, newName: string) => Promise<void>;
  selectedWorkspaceCategory: string | null;
  setSelectedWorkspaceCategory: (category: string | null) => void;
}

const WorkspaceContext = React.createContext<WorkspaceContextType | null>(null);

const DEFAULT_CATEGORIES: Category[] = [
  { id: "ws-cat-general", name: "General", color: "#3b82f6" },
  { id: "ws-cat-production", name: "Production", color: "#ef4444" },
  { id: "ws-cat-staging", name: "Staging", color: "#f59e0b" },
  { id: "ws-cat-shared", name: "Team Shared", color: "#10b981" },
];

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = React.useState<string | null>(null);
  const [planQuota, setPlanQuota] = React.useState<WorkspacePlanQuota>({
    plan: "FREE",
    ownedCount: 0,
    maxAllowed: 1,
  });
  const [members, setMembers] = React.useState<WorkspaceMember[]>([]);
  const [workspacePasswords, setWorkspacePasswords] = React.useState<PasswordEntry[]>([]);
  const [workspaceBookmarks, setWorkspaceBookmarks] = React.useState<Bookmark[]>([]);
  const [workspaceCategories, setWorkspaceCategories] = React.useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedWorkspaceCategory, setSelectedWorkspaceCategory] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return !!getCloudSession()?.accessToken;
  });
  const [error, setError] = React.useState<string | null>(null);

  const [isCloudActive, setIsCloudActive] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return !!getCloudSession()?.accessToken;
  });

  // Sync activeWorkspaceId from URL params if on a workspace route
  React.useEffect(() => {
    if (params?.workspaceId && typeof params.workspaceId === "string") {
      setActiveWorkspaceId(params.workspaceId);
    }
  }, [params?.workspaceId]);

  // Load workspaces from backend API (Cloud only)
  const fetchWorkspaces = React.useCallback(async () => {
    const session = getCloudSession();
    setIsLoading(true);
    setError(null);

    if (!session?.accessToken) {
      setIsCloudActive(false);
      setWorkspaces([]);
      setPlanQuota({ plan: "FREE", ownedCount: 0, maxAllowed: 1 });
      setIsLoading(false);
      return;
    }

    setIsCloudActive(true);
    try {
      const res = await fetch(`${appConfig.apiUrl}/api/workspaces`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
        setPlanQuota(data.planQuota || { plan: "FREE", ownedCount: 0, maxAllowed: 1 });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to load workspaces from cloud");
      }
    } catch (err: any) {
      setError("Unable to connect to Lokker Cloud. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWorkspaces();

    const handleAuthChange = () => {
      const session = getCloudSession();
      if (!session?.accessToken) {
        setIsCloudActive(false);
        setWorkspaces([]);
        setActiveWorkspaceId(null);
        setMembers([]);
        setWorkspacePasswords([]);
        setWorkspaceBookmarks([]);
        setPlanQuota({ plan: "FREE", ownedCount: 0, maxAllowed: 1 });
        setIsLoading(false);
      } else {
        setIsCloudActive(true);
        fetchWorkspaces();
      }
    };

    window.addEventListener(CLOUD_AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener(CLOUD_AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [fetchWorkspaces]);

  // Active workspace object
  const activeWorkspace = React.useMemo(() => {
    if (!activeWorkspaceId) return workspaces[0] || null;
    return workspaces.find((w) => w.id === activeWorkspaceId) || null;
  }, [workspaces, activeWorkspaceId]);

  const userRole = activeWorkspace?.role || null;

  // Load active workspace details (members, data) when activeWorkspaceId changes
  React.useEffect(() => {
    if (!activeWorkspaceId) return;
    const session = getCloudSession();

    // Load local scoped items
    const wsVaultKey = `lokker_ws_data_${activeWorkspaceId}`;
    const localData = localStorage.getItem(wsVaultKey);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        setWorkspacePasswords(parsed.passwords || []);
        setWorkspaceBookmarks(parsed.bookmarks || []);
        setWorkspaceCategories(parsed.categories || DEFAULT_CATEGORIES);
      } catch (err) {
        console.warn("Failed to parse local workspace data:", err);
      }
    } else {
      setWorkspacePasswords([]);
      setWorkspaceBookmarks([]);
      setWorkspaceCategories(DEFAULT_CATEGORIES);
    }

    // If cloud session is active, also load member details and remote vault
    if (session?.accessToken) {
      fetch(`${appConfig.apiUrl}/api/workspaces/${activeWorkspaceId}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.members) setMembers(data.members);
        })
        .catch(console.warn);

      fetch(`${appConfig.apiUrl}/api/workspaces/${activeWorkspaceId}/vault`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.exists && data.vault?.encryptedBlob) {
            try {
              const decrypted = JSON.parse(data.vault.encryptedBlob);
              if (decrypted.passwords) setWorkspacePasswords(decrypted.passwords);
              if (decrypted.bookmarks) setWorkspaceBookmarks(decrypted.bookmarks);
              if (decrypted.categories) setWorkspaceCategories(decrypted.categories);
            } catch {
              // encrypted or different format
            }
          }
        })
        .catch(console.warn);
    }
  }, [activeWorkspaceId]);

  // Save workspace data helper (persists locally and syncs to backend if available)
  const persistWorkspaceData = React.useCallback(
    async (
      newPasswords?: PasswordEntry[],
      newBookmarks?: Bookmark[],
      newCategories?: Category[]
    ) => {
      if (!activeWorkspaceId) return;

      const p = newPasswords ?? workspacePasswords;
      const b = newBookmarks ?? workspaceBookmarks;
      const c = newCategories ?? workspaceCategories;

      const payload = {
        passwords: p,
        bookmarks: b,
        categories: c,
        updatedAt: Date.now(),
      };

      // Local storage
      localStorage.setItem(`lokker_ws_data_${activeWorkspaceId}`, JSON.stringify(payload));

      // Remote cloud sync if logged in
      const session = getCloudSession();
      if (session?.accessToken) {
        try {
          await fetch(`${appConfig.apiUrl}/api/workspaces/${activeWorkspaceId}/vault`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify({
              encryptedBlob: JSON.stringify(payload),
              iv: "client-iv-workspace-" + Date.now().toString(16),
              version: 1,
              itemCount: p.length + b.length,
            }),
          });
        } catch (err) {
          console.warn("Could not sync workspace to cloud server:", err);
        }
      }
    },
    [activeWorkspaceId, workspacePasswords, workspaceBookmarks, workspaceCategories]
  );

  // Switch workspace
  const selectWorkspace = React.useCallback(
    (workspaceId: string) => {
      setActiveWorkspaceId(workspaceId);
      const session = getCloudSession();
      const userId = session?.id || "me";

      // Preserve subpage (e.g. passwords, bookmarks, settings) if currently inside workspace
      let subpage = "";
      if (pathname) {
        const parts = pathname.split("/");
        const lastPart = parts[parts.length - 1];
        if (["passwords", "bookmarks", "members", "settings", "categories"].includes(lastPart)) {
          subpage = `/${lastPart}`;
        }
      }

      router.push(`/app/workspace/${workspaceId}${subpage}`);
    },
    [pathname, router]
  );

  // Create workspace (Cloud required)
  const createWorkspace = React.useCallback(
    async (name: string, description?: string): Promise<Workspace> => {
      const session = getCloudSession();
      if (!session?.accessToken) {
        throw new Error(
          "A Lokker Cloud account is required to create Team Workspaces. Please connect your cloud account first."
        );
      }

      const res = await fetch(`${appConfig.apiUrl}/api/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create workspace");
      }

      const createdWs = data.workspace;
      await fetchWorkspaces();
      selectWorkspace(createdWs.id);
      return createdWs;
    },
    [fetchWorkspaces, selectWorkspace]
  );

  // Update workspace
  const updateWorkspace = React.useCallback(
    async (workspaceId: string, name?: string, description?: string) => {
      const session = getCloudSession();
      if (session?.accessToken) {
        const res = await fetch(`${appConfig.apiUrl}/api/workspaces/${workspaceId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ name, description }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to update workspace");
        }
      }

      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === workspaceId
            ? {
                ...w,
                name: name !== undefined ? name : w.name,
                description: description !== undefined ? description : w.description,
                updatedAt: new Date().toISOString(),
              }
            : w
        )
      );
    },
    []
  );

  // Delete workspace
  const deleteWorkspace = React.useCallback(
    async (workspaceId: string) => {
      const session = getCloudSession();
      if (session?.accessToken) {
        const res = await fetch(`${appConfig.apiUrl}/api/workspaces/${workspaceId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to delete workspace");
        }
      }

      localStorage.removeItem(`lokker_ws_data_${workspaceId}`);
      const remaining = workspaces.filter((w) => w.id !== workspaceId);
      setWorkspaces(remaining);

      // Navigate back to personal vault or remaining workspace
      if (remaining.length > 0) {
        selectWorkspace(remaining[0].id);
      } else {
        router.push("/app");
      }
    },
    [workspaces, selectWorkspace, router]
  );

  // Generate Invite
  const createInvite = React.useCallback(
    async (workspaceId: string) => {
      const session = getCloudSession();
      if (session?.accessToken) {
        const res = await fetch(`${appConfig.apiUrl}/api/workspaces/${workspaceId}/invites`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to generate invite");
        return data;
      }

      // Offline mock token
      return {
        inviteToken: "mock-invite-" + Date.now(),
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      };
    },
    []
  );

  // Accept Invite
  const acceptInvite = React.useCallback(
    async (inviteToken: string) => {
      const session = getCloudSession();
      if (!session?.accessToken) {
        throw new Error("You must be signed in to accept a workspace invitation");
      }

      const res = await fetch(`${appConfig.apiUrl}/api/workspaces/invites/${inviteToken}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to accept invite");

      await fetchWorkspaces();
      selectWorkspace(data.workspaceId);
      return data;
    },
    [fetchWorkspaces, selectWorkspace]
  );

  // Leave Workspace
  const leaveWorkspace = React.useCallback(
    async (workspaceId: string) => {
      const session = getCloudSession();
      if (session?.accessToken) {
        const res = await fetch(`${appConfig.apiUrl}/api/workspaces/${workspaceId}/leave`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to leave workspace");
        }
      }

      const remaining = workspaces.filter((w) => w.id !== workspaceId);
      setWorkspaces(remaining);
      if (remaining.length > 0) {
        selectWorkspace(remaining[0].id);
      } else {
        router.push("/app");
      }
    },
    [workspaces, selectWorkspace, router]
  );

  // Scoped Item CRUD
  const saveWorkspacePassword = React.useCallback(
    async (entry: PasswordEntry) => {
      const updatedEntry: PasswordEntry = {
        ...entry,
        workspaceId: activeWorkspaceId || undefined,
        workspaceName: activeWorkspace?.name || undefined,
        updatedAt: Date.now(),
      };

      setWorkspacePasswords((prev) => {
        const exists = prev.some((p) => p.id === entry.id);
        const next = exists ? prev.map((p) => (p.id === entry.id ? updatedEntry : p)) : [updatedEntry, ...prev];

        // If this is a new password entry with a website url or website name, auto-create a bookmark counterpart in workspace
        if (!exists && (entry.websiteUrl || entry.websiteName)) {
          let formattedUrl = entry.websiteUrl?.trim() || "";
          if (!formattedUrl) {
            formattedUrl = `https://${entry.websiteName.toLowerCase().replace(/\s+/g, "")}.com`;
          } else if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
            formattedUrl = `https://${formattedUrl}`;
          }

          const normalizeHost = (str: string) => {
            if (!str) return "";
            try {
              const raw = str.startsWith("http") ? str : `https://${str}`;
              return new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
            } catch {
              return str.trim().toLowerCase();
            }
          };

          const targetHost = normalizeHost(formattedUrl);

          setWorkspaceBookmarks((bms) => {
            const alreadyExists = bms.some((b) => normalizeHost(b.url || b.title) === targetHost);
            if (alreadyExists) {
              persistWorkspaceData(next, undefined, undefined);
              return bms;
            }

            const newBm: Bookmark = {
              id: "ws-bm-" + Date.now().toString(16),
              title: entry.websiteName,
              url: formattedUrl,
              category: entry.category || "General",
              isFavorite: !!entry.isFavorite,
              description: entry.notes || "",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              workspaceId: activeWorkspaceId || undefined,
              workspaceName: activeWorkspace?.name || undefined,
            };
            const nextBms = [newBm, ...bms];
            persistWorkspaceData(next, nextBms, undefined);
            return nextBms;
          });
        } else {
          persistWorkspaceData(next, undefined, undefined);
        }

        return next;
      });
    },
    [activeWorkspaceId, activeWorkspace, persistWorkspaceData]
  );

  const deleteWorkspacePassword = React.useCallback(
    async (id: string) => {
      setWorkspacePasswords((prev) => {
        const next = prev.filter((p) => p.id !== id);
        persistWorkspaceData(next, undefined, undefined);
        return next;
      });
    },
    [persistWorkspaceData]
  );

  const toggleWorkspacePasswordFavorite = React.useCallback(
    async (id: string) => {
      setWorkspacePasswords((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
        persistWorkspaceData(next, undefined, undefined);
        return next;
      });
    },
    [persistWorkspaceData]
  );

  const saveWorkspaceBookmark = React.useCallback(
    async (entry: Bookmark) => {
      const updatedEntry: Bookmark = {
        ...entry,
        workspaceId: activeWorkspaceId || undefined,
        workspaceName: activeWorkspace?.name || undefined,
        updatedAt: Date.now(),
      };

      setWorkspaceBookmarks((prev) => {
        const exists = prev.some((b) => b.id === entry.id);
        const next = exists ? prev.map((b) => (b.id === entry.id ? updatedEntry : b)) : [updatedEntry, ...prev];
        persistWorkspaceData(undefined, next, undefined);
        return next;
      });
    },
    [activeWorkspaceId, activeWorkspace, persistWorkspaceData]
  );

  const deleteWorkspaceBookmark = React.useCallback(
    async (id: string) => {
      setWorkspaceBookmarks((prev) => {
        const next = prev.filter((b) => b.id !== id);
        persistWorkspaceData(undefined, next, undefined);
        return next;
      });
    },
    [persistWorkspaceData]
  );

  const toggleWorkspaceBookmarkFavorite = React.useCallback(
    async (id: string) => {
      setWorkspaceBookmarks((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, isFavorite: !b.isFavorite } : b));
        persistWorkspaceData(undefined, next, undefined);
        return next;
      });
    },
    [persistWorkspaceData]
  );

  const saveWorkspaceCategory = React.useCallback(
    async (category: Category) => {
      setWorkspaceCategories((prev) => {
        const exists = prev.some((c) => c.id === category.id);
        const next = exists ? prev.map((c) => (c.id === category.id ? category : c)) : [...prev, category];
        persistWorkspaceData(undefined, undefined, next);
        return next;
      });
    },
    [persistWorkspaceData]
  );

  const renameWorkspaceCategory = React.useCallback(
    async (id: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;

      setWorkspaceCategories((prev) => {
        const cat = prev.find((c) => c.id === id);
        const oldName = cat?.name;
        const next = prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c));
        persistWorkspaceData(undefined, undefined, next);

        if (oldName && oldName !== trimmed) {
          setSelectedWorkspaceCategory((curr) => (curr === oldName ? trimmed : curr));
          setWorkspacePasswords((pwds) => {
            const updated = pwds.map((p) => (p.category === oldName ? { ...p, category: trimmed } : p));
            persistWorkspaceData(updated, undefined, undefined);
            return updated;
          });
          setWorkspaceBookmarks((bms) => {
            const updated = bms.map((b) => (b.category === oldName ? { ...b, category: trimmed } : b));
            persistWorkspaceData(undefined, updated, undefined);
            return updated;
          });
        }
        return next;
      });
    },
    [persistWorkspaceData]
  );

  const deleteWorkspaceCategory = React.useCallback(
    async (id: string) => {
      setWorkspaceCategories((prev) => {
        const catToDelete = prev.find((c) => c.id === id);
        const next = prev.filter((c) => c.id !== id);
        persistWorkspaceData(undefined, undefined, next);

        if (catToDelete) {
          setSelectedWorkspaceCategory((curr) => (curr === catToDelete.name ? null : curr));
          const fallback = next[0]?.name || "General";
          setWorkspacePasswords((pwds) => {
            const updated = pwds.map((p) => (p.category === catToDelete.name ? { ...p, category: fallback } : p));
            persistWorkspaceData(updated, undefined, undefined);
            return updated;
          });
          setWorkspaceBookmarks((bms) => {
            const updated = bms.map((b) => (b.category === catToDelete.name ? { ...b, category: fallback } : b));
            persistWorkspaceData(undefined, updated, undefined);
            return updated;
          });
        }
        return next;
      });
    },
    [persistWorkspaceData]
  );

  const value: WorkspaceContextType = {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    planQuota,
    userRole,
    members,
    workspacePasswords,
    workspaceBookmarks,
    workspaceCategories,
    selectedWorkspaceCategory,
    setSelectedWorkspaceCategory,
    isLoading,
    isCloudActive,
    error,
    refreshWorkspaces: fetchWorkspaces,
    selectWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    createInvite,
    acceptInvite,
    leaveWorkspace,
    saveWorkspacePassword,
    deleteWorkspacePassword,
    toggleWorkspacePasswordFavorite,
    saveWorkspaceBookmark,
    deleteWorkspaceBookmark,
    toggleWorkspaceBookmarkFavorite,
    saveWorkspaceCategory,
    deleteWorkspaceCategory,
    renameWorkspaceCategory,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
