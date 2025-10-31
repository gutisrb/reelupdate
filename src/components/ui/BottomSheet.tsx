import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
}: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "flex flex-col",
            "bg-surface rounded-t-[20px]",
            "max-h-[80vh]",
            "border border-border shadow-2xl"
          )}
        >
          {/* Drag Handle */}
          <div className="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted" />

          {/* Header */}
          {(title || description) && (
            <div className="flex-shrink-0 px-6 pt-4 pb-2 border-b border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {title && (
                    <Drawer.Title className="text-lg font-semibold text-foreground">
                      {title}
                    </Drawer.Title>
                  )}
                  {description && (
                    <Drawer.Description className="text-sm text-muted-foreground mt-1">
                      {description}
                    </Drawer.Description>
                  )}
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="ml-4 p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label="Zatvori"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

BottomSheet.displayName = "BottomSheet";
