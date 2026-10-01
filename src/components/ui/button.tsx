import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// DESIGN_SYSTEM v2 §6: every fill has rest / hover / pressed steps; disabled = 50% opacity; 150ms ease-in-out.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-medium cursor-pointer transition-[color,background-color,border-color,box-shadow,opacity] duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-default [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-ink text-white hover:bg-ink-hover active:bg-ink-pressed",
        accent: "bg-ink text-white hover:bg-ink-hover active:bg-ink-pressed",
        dark: "bg-deep-ink text-white hover:bg-[#3B332E] active:bg-[#55493F]",
        highlight: "bg-dark-0 text-white hover:bg-dark-1 active:bg-dark-2",
        destructive: "bg-alert-negative text-alert-negative-fg hover:bg-[#FCE1DB] active:bg-[#F9C7BE]",
        outline: "border border-line-2 bg-transparent text-deep-ink hover:border-line-3 hover:bg-line-1 active:bg-tint-2",
        secondary: "bg-tint-1 text-deep-ink hover:bg-tint-2 active:bg-[rgba(60,36,24,0.16)]",
        ghost: "bg-transparent text-deep-ink hover:bg-tint-1 active:bg-tint-2",
        link: "text-ink text-sm font-semibold underline-offset-4 hover:underline active:opacity-70",
      },
      size: {
        default: "h-10 px-4 sm:h-8",
        sm: "h-10 px-3 text-xs sm:h-8",
        md: "h-10 px-4 text-sm",
        lg: "h-12 rounded-full px-6 text-[15px]",
        icon: "size-10 rounded-[10px] sm:size-8 sm:rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
