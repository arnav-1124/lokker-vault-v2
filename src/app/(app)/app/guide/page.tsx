"use client";

import { useVault } from "@/context/vault-context";
import { FeatureGuideView } from "@/components/views/feature-guide-view";

export default function GuidePage() {
  const vault = useVault();

  return (
    <FeatureGuideView
      onSelectView={vault.navigateTo}
      onOpenCommandPalette={() => vault.setIsCommandPaletteOpen(true)}
    />
  );
}
