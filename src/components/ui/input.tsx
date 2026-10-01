import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg max-sm:min-h-11 border border-form-border bg-sheet px-3 py-1 text-base transition-[border-color,box-shadow] duration-150 ease-in-out file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-line-3 focus-visible:outline-none focus-visible:border-form-focus focus-visible:ring-[3px] focus-visible:ring-ink/15 aria-[invalid=true]:border-alert-negative-fg disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
