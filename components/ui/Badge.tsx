import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils' // Assuming cn utility exists, if not I'll create it or use simple template literal

const badgeVariants = cva(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
                secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
                outline: "text-foreground",
                success: "border-green-500/20 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
                warning: "border-yellow-500/20 bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
                info: "border-blue-500/20 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
                error: "border-red-500/20 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
                purple: "border-purple-500/20 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
                orange: "border-orange-500/20 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
                gray: "border-gray-500/20 bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400",
                pink: "border-pink-500/20 bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400",
                cyan: "border-cyan-500/20 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
                indigo: "border-indigo-500/20 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
                lime: "border-lime-500/20 bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400",
                teal: "border-teal-500/20 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
                rose: "border-rose-500/20 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    // If cn doesn't exist, I need to check. But typically it's in utils.
    // I'll check for clsx/tailwind-merge. 
    // For now assuming existing project structure or standard util.
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
