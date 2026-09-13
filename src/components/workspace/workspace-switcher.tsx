"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Check, ChevronsUpDown, Plus, ShieldCheck, User, Cloud } from "lucide-react";
import { useWorkspace } from "@/context/workspace-context";

interface WorkspaceSwitcherProps {
  onOpenAddModal: () => void;
  className?: string;
}

export function WorkspaceSwitcher({ onOpenAddModal, className }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const {
    workspaces,
    activeWorkspace,
    selectWorkspace,
    planQuota,
    isCloudActive,
  } = useWorkspace();

  const ownedWorkspaces = workspaces.filter((w) => w.role === "ADMIN");
  const joinedWorkspaces = workspaces.filter((w) => w.role === "MEMBER");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`h-10 w-full justify-between bg-surface border-border-subtle hover:bg-surface-subtle text-foreground text-xs px-3 font-normal cursor-pointer ${
            className || ""
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="size-3.5" />
            </div>
            <div className="flex flex-col items-start truncate text-left">
              <span className="font-semibold text-foreground text-xs truncate">
                {activeWorkspace ? activeWorkspace.name : "Select Workspace"}
              </span>
              {activeWorkspace && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                  {activeWorkspace.role === "ADMIN" ? (
                    <span className="text-primary font-semibold">Admin</span>
                  ) : (
                    <span>Member</span>
                  )}
                  <span>• {activeWorkspace.memberCount} member{activeWorkspace.memberCount === 1 ? "" : "s"}</span>
                </span>
              )}
            </div>
          </div>
          <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0 ml-1" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64 z-[350] p-1.5 space-y-1">
        {/* Owned Workspaces */}
        {ownedWorkspaces.length > 0 && (
          <>
            <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
              Workspaces You Own
            </DropdownMenuLabel>
            {ownedWorkspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => selectWorkspace(ws.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md cursor-pointer ${
                  activeWorkspace?.id === ws.id ? "bg-sidebar-accent font-medium text-foreground" : ""
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <ShieldCheck className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">{ws.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">
                    Admin
                  </Badge>
                  {activeWorkspace?.id === ws.id && <Check className="size-3 text-primary" />}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Joined Workspaces */}
        {joinedWorkspaces.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
              Workspaces You Joined
            </DropdownMenuLabel>
            {joinedWorkspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => selectWorkspace(ws.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md cursor-pointer ${
                  activeWorkspace?.id === ws.id ? "bg-sidebar-accent font-medium text-foreground" : ""
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{ws.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">
                    Member
                  </Badge>
                  {activeWorkspace?.id === ws.id && <Check className="size-3 text-primary" />}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {workspaces.length === 0 && (
          <div className="px-3 py-2 text-center text-xs text-muted-foreground">
            No workspaces found.
          </div>
        )}

        <DropdownMenuSeparator className="my-1" />

        {/* Action: Add Workspace or Sign In */}
        {isCloudActive ? (
          <DropdownMenuItem
            onClick={onOpenAddModal}
            className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md text-primary hover:text-primary cursor-pointer font-medium"
          >
            <div className="flex items-center gap-2">
              <Plus className="size-3.5" />
              <span>Create New Workspace</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              {planQuota.ownedCount}/{planQuota.maxAllowed}
            </span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => router.push("/signup?redirect=/app/workspaces")}
            className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md text-primary hover:text-primary cursor-pointer font-medium"
          >
            <div className="flex items-center gap-2">
              <Cloud className="size-3.5" />
              <span>Sign In to Access Workspaces</span>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
