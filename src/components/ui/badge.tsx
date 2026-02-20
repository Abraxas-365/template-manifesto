import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border border-transparent px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-[3px] focus-visible:ring-ring/10 aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-all overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary border-primary/20 [a&]:hover:bg-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20 [a&]:hover:bg-destructive/20 focus-visible:ring-destructive/20",
        outline:
          "border-border text-muted-foreground [a&]:hover:bg-secondary",
        ghost: "[a&]:hover:bg-secondary",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
        success:
          "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 [a&]:hover:bg-emerald-500/20",
        warning:
          "bg-amber-500/10 text-amber-700 border-amber-500/20 [a&]:hover:bg-amber-500/20",
        info:
          "bg-indigo-500/10 text-indigo-700 border-indigo-500/20 [a&]:hover:bg-indigo-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
