import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-form-border bg-sheet px-3 py-2 text-base transition-[border-color,box-shadow] duration-150 ease-in-out placeholder:text-muted-foreground hover:border-line-3 focus-visible:outline-none focus-visible:border-form-focus focus-visible:ring-[3px] focus-visible:ring-ink/15 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
