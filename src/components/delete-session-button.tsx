"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteSession } from "@/actions/sessions";
import { Button } from "@/components/ui/button";

export function DeleteSessionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost" size="icon" aria-label="Delete session" disabled={pending}
      className="text-muted-foreground hover:text-destructive"
      onClick={() => {
        if (!confirm("Delete this session? This can't be undone.")) return;
        startTransition(async () => {
          const res = await deleteSession(id);
          if (res.error) toast.error(res.error);
          else toast.success("Session deleted");
        });
      }}
    >
      <Trash2 className="size-4" aria-hidden />
    </Button>
  );
}
