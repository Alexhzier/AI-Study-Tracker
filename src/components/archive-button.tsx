"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setSubjectArchived } from "@/actions/subjects";
import { Button } from "@/components/ui/button";

export function ArchiveButton({ id, archived }: { id: string; archived: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost" size="sm" disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await setSubjectArchived(id, !archived);
          if (res.error) toast.error(res.error);
          else toast.success(archived ? "Subject restored" : "Subject archived");
        })
      }
    >
      {archived ? "Restore" : "Archive"}
    </Button>
  );
}
