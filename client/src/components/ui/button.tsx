import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "neo-hover inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md border-2 border-border text-sm font-extrabold ring-offset-background transition-[background-color,box-shadow,transform,color] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-55 disabled:shadow-none disabled:transform-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-neoSm hover:bg-primary-hover",
        destructive: "bg-destructive text-destructive-foreground shadow-neoSm hover:bg-danger",
        outline: "bg-surface text-foreground shadow-neoSm hover:bg-accent-soft",
        secondary: "bg-secondary text-secondary-foreground shadow-neoSm hover:bg-secondary-hover hover:text-surface",
        ghost: "min-h-10 border-transparent bg-transparent shadow-none hover:border-border hover:bg-accent hover:shadow-neoSm",
        link: "min-h-0 border-transparent bg-transparent p-0 font-bold text-secondary shadow-none underline-offset-4 hover:translate-x-0 hover:translate-y-0 hover:bg-transparent hover:shadow-none hover:underline",
      },
      size: {
        default: "px-4 py-2.5",
        sm: "min-h-9 rounded-md px-3 py-1.5 text-xs",
        lg: "min-h-12 rounded-md px-6 py-3 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
