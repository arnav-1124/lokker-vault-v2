"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function WorkspacePasswordRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  useEffect(() => {
    if (workspaceId) {
      router.replace(`/app/workspace/${workspaceId}/passwords`);
    }
  }, [workspaceId, router]);

  return null;
}
