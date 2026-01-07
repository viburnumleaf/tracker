"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

type DialogLayoutProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  headerContent?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  isLoading?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export const DialogLayout = ({
  open,
  onOpenChange,
  title,
  description,
  headerContent,
  children,
  footer,
  isLoading = false,
  maxWidth = "2xl",
}: DialogLayoutProps) => {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  // Check if description is a simple string or can be safely wrapped in <p>
  const isSimpleDescription =
    typeof description === "string" ||
    description === null ||
    description === undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${maxWidthClasses[maxWidth]} h-dvh sm:h-[90vh] sm:max-h-[90vh] flex flex-col p-0 gap-0`}
        showCloseButton={false}
      >
        <DialogHeader className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {description &&
            (isSimpleDescription ? (
              <DialogDescription>{description}</DialogDescription>
            ) : (
              <div className="text-muted-foreground text-xs/relaxed">
                {description}
              </div>
            ))}
          {headerContent && <div className="mt-2">{headerContent}</div>}
        </DialogHeader>
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute z-10 top-2 right-3"
            disabled={isLoading}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </Button>
        </DialogClose>
        <div className="flex-1 overflow-hidden px-4 py-4 min-h-0 flex flex-col">{children}</div>
        {footer && (
          <DialogFooter className="bottom-0 z-10 bg-background border-t border-border px-4 py-3 shrink-0 mt-0 relative">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
