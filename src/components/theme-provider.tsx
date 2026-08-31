"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Class-based light/dark theme switching backed by next-themes.
 * The `.dark` class variant is defined in src/app/globals.css.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider> & { children: ReactNode }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
