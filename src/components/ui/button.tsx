import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium cursor-pointer transition-[color,background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        accent: "bg-ink text-white hover:bg-ink/90",
        highlight: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-secondary text-destructive hover:bg-secondary/80",
        outline: "bg-fill-subtle text-deep-ink hover:bg-fill-selected",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "bg-transparent text-deep-ink hover:bg-fill-subtle",
        link: "text-ink text-sm font-semibold underline-offset-4 hover:underline active:opacity-70",
      },
      size: {
        default: "h-8 px-4",
        sm: "h-8 px-3",
        lg: "h-11 px-5 text-sm font-medium",
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
