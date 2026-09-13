"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function WorkspaceBookmarkRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  useEffect(() => {
    if (workspaceId) {
      router.replace(`/app/workspace/${workspaceId}/bookmarks`);
    }
  }, [workspaceId, router]);

  return null;
}
