"use client";

import * as React from "react";
import { Lock } from "lucide-react";

interface LokkerBrandIconProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LokkerBrandIcon({ className = "", size = "md" }: LokkerBrandIconProps) {
  const sizeClasses = {
    sm: "size-7 rounded-lg",
    md: "size-8 rounded-xl",
    lg: "size-10 rounded-2xl",
  }[size];

  const iconSizes = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-5",
  }[size];

  return (
    <div
      className={`${sizeClasses} bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-xs shadow-blue-500/25 shrink-0 ${className}`}
    >
      <Lock className={`${iconSizes} stroke-[2.2]`} />
    </div>
  );
}
