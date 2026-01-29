import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-purple-500/20 text-purple-300 border border-purple-500/30",
        secondary:
          "bg-gray-700 text-gray-300 border border-gray-600",
        success:
          "bg-green-500/20 text-green-300 border border-green-500/30",
        destructive:
          "bg-red-500/20 text-red-300 border border-red-500/30",
        warning:
          "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
        outline:
          "text-gray-300 border border-gray-600",
        bronze:
          "bg-amber-900/30 text-amber-400 border border-amber-700/50",
        silver:
          "bg-gray-400/20 text-gray-300 border border-gray-400/50",
        gold:
          "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50",
        platinum:
          "bg-purple-300/20 text-purple-200 border border-purple-300/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
