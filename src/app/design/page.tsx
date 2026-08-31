"use client";

import * as React from "react";
import type { ComponentProps } from "react";
import { useTheme } from "next-themes";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Info,
  TriangleAlert,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Section } from "./section";

/*
  DESIGN-SYSTEM PREVIEW — internal verification surface only.
  Not a product page. Demonstrates the Lokker design language across
  shadcn primitives: states, themes, typography, surfaces, motion.
  Remove or replace when real application surfaces exist.
*/

const emptySubscribe = () => () => {};

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const label = mounted
    ? `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`
    : "Toggle theme";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {label}
    </Button>
  );
}

const SURFACE_LEVELS = [
  ["bg-background", "background"],
  ["bg-surface", "surface"],
  ["bg-surface-elevated", "surface-elevated"],
  ["bg-surface-overlay", "surface-overlay"],
  ["bg-surface-hover", "surface-hover"],
  ["bg-surface-active", "surface-active"],
] as const;

type SurfaceSwatchProps = ComponentProps<"div"> & { name: string };

function SurfaceSwatch({ name, className, ...props }: SurfaceSwatchProps) {
  return (
    <div
      className={`${className} rounded-lg border border-border-subtle p-4 shadow-xs`}
      {...props}
    >
      <p className="text-caption text-muted-foreground">{name}</p>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-background text-foreground">
        {/* Navigation */}
        <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border-subtle bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
            <nav className="flex items-center gap-5 text-label">
              <span className="font-semibold tracking-label">LOKKER</span>
              <a
                className="text-muted-foreground transition-colors hover:text-foreground"
                href="#surfaces"
              >
                Surfaces
              </a>
              <a
                className="text-muted-foreground transition-colors hover:text-foreground"
                href="#buttons"
              >
                Buttons
              </a>
              <a
                className="text-muted-foreground transition-colors hover:text-foreground"
                href="#forms"
              >
                Forms
              </a>
              <a
                className="text-muted-foreground transition-colors hover:text-foreground"
                href="#overlays"
              >
                Overlays
              </a>
            </nav>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-5xl space-y-14 px-6 py-12">
          {/* Typography */}
          <Section
            title="Typography"
            description="Geist Sans. Semantic sizes via text-display / text-heading / text-label / text-caption."
          >
            <div className="space-y-3">
              <p className="text-display font-semibold">Display — Vault integrity verified</p>
              <p className="text-heading font-semibold">Heading — Security overview</p>
              <p className="text-label">Label — Regular interface text at 0.875rem</p>
              <p className="text-caption text-muted-foreground">
                Caption — supporting, muted detail at 0.8125rem.
              </p>
            </div>
          </Section>

          {/* Surfaces */}
          <Section
            id="surfaces"
            title="Surface hierarchy"
            description="Depth comes from separated surface levels, 1px borders and restrained shadows — never decoration."
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {SURFACE_LEVELS.map(([token, name]) => (
                <SurfaceSwatch key={name} name={name} className={token} />
              ))}
            </div>
          </Section>

          {/* Buttons */}
          <Section
            id="buttons"
            title="Buttons & states"
            description="Tactile states: hover brightness shift, pressed displacement, visible focus ring, disabled contrast."
          >
            <div className="flex flex-wrap items-center gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>
                Disabled
              </Button>
              <Button aria-invalid="true">Invalid</Button>
              <Button>
                <Spinner data-icon="inline-start" /> Loading
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Account">
                    <User />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tooltip on a icon button</TooltipContent>
              </Tooltip>
            </div>
          </Section>

          {/* Forms */}
          <Section
            id="forms"
            title="Forms"
            description="Inputs, labels, textarea, switch. Error state uses aria-invalid — not color alone."
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="demo-site">Site address</Label>
                <Input id="demo-site" placeholder="https://example.com" />
                <p className="text-caption text-muted-foreground">
                  Stored locally. Never transmitted.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-error">Master password</Label>
                <Input id="demo-error" type="password" aria-invalid="true" defaultValue="wrong" />
                <p className="text-caption text-destructive">
                  Incorrect master password. 2 attempts remaining.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-notes">Secure notes</Label>
                <Textarea id="demo-notes" placeholder="Encrypted notes…" />
              </div>
              <div className="flex items-center gap-3">
                <Switch id="demo-lock" defaultChecked />
                <Label htmlFor="demo-lock">Auto-lock vault after inactivity</Label>
              </div>
            </div>
          </Section>

          {/* Cards + badges */}
          <Section title="Cards & badges" description="Raised surface levels with status colors from tokens.">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Vault status</CardTitle>
                  <CardDescription>
                    Your vault is encrypted at rest with AES-GCM.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge className="bg-success text-success-foreground">Success</Badge>
                  <Badge className="bg-warning text-warning-foreground">Warning</Badge>
                  <Badge className="bg-info text-info-foreground">Info</Badge>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="outline">
                    Run security check
                  </Button>
                </CardFooter>
              </Card>
              <div className="space-y-4">
                <Alert>
                  <Info />
                  <AlertTitle>Heads up</AlertTitle>
                  <AlertDescription>
                    Lokker stores everything on this device. Enable backups to
                    avoid data loss.
                  </AlertDescription>
                </Alert>
                <Alert className="border-success/40 bg-success/10 [&>svg]:text-success">
                  <CheckCircle2 />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Vault created and encrypted successfully.
                  </AlertDescription>
                </Alert>
                <Alert className="border-warning/40 bg-warning/10 [&>svg]:text-warning">
                  <TriangleAlert />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Reused passwords were detected in 3 entries.
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to unlock the vault. Check your master password.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </Section>

          {/* Overlays */}
          <Section id="overlays" title="Overlays" description="Dialog, dropdown menu, tabs — Radix-managed stacking.">
            <div className="flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete entry</DialogTitle>
                    <DialogDescription>
                      This permanently removes “GitHub — work” from your vault.
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="ghost">Cancel</Button>
                    <Button variant="destructive">Delete entry</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Options <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Vault</DropdownMenuLabel>
                  <DropdownMenuItem>New entry</DropdownMenuItem>
                  <DropdownMenuItem>Export…</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    Lock vault
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All items</TabsTrigger>
                <TabsTrigger value="logins">Logins</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="pt-4">
                <div className="rounded-lg border border-border-subtle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead className="text-right">Strength</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">GitHub</TableCell>
                        <TableCell className="text-muted-foreground">
                          arnav@example.com
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-success text-success-foreground">Strong</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Old forum</TableCell>
                        <TableCell className="text-muted-foreground">
                          arnav92
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">Weak</Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="logins" className="pt-4 text-caption text-muted-foreground">
                Logins list.
              </TabsContent>
              <TabsContent value="notes" className="pt-4 text-caption text-muted-foreground">
                Notes list.
              </TabsContent>
            </Tabs>
          </Section>

          {/* Loading */}
          <Section title="Loading" description="Skeletons and spinners for async states.">
            <div className="flex items-center gap-8">
              <div className="w-64 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="flex items-center gap-2 text-label text-muted-foreground">
                <Spinner /> Unlocking vault…
              </div>
            </div>
          </Section>
        </main>

        <footer className="border-t border-border-subtle py-6 text-center text-caption text-muted-foreground">
          Lokker design system — internal preview, not a product page.
        </footer>
      </div>
    </TooltipProvider>
  );
}
