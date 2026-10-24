"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { setSubjectArchived } from "@/actions/subjects";
import { Button } from "@/components/ui/button";

export function ArchiveButton({
  id, archived, name, compact,
}: { id: string; archived: boolean; name: string; compact?: boolean }) {
  const [pending, startTransition] = useTransition();
  const action = archived ? "Restore" : "Archive";
  return (
    <Button
      variant="ghost" size={compact ? "icon" : "sm"} disabled={pending}
      aria-label={`${action} ${name}`} title={`${action} ${name}`}
      className={compact ? "size-8 text-muted-foreground" : undefined}
      onClick={() =>
        startTransition(async () => {
          const res = await setSubjectArchived(id, !archived);
          if (res.error) toast.error(res.error);
          else toast.success(archived ? "Subject restored" : "Subject archived. Its history is kept.");
        })
      }
    >
      {compact ? (archived ? <ArchiveRestore className="size-3.5" aria-hidden /> : <Archive className="size-3.5" aria-hidden />) : action}
    </Button>
  );
}
