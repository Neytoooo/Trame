import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap tracking-wide select-none",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
                secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
                outline: "text-foreground",
                success: "border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
                warning: "border-amber-500/20 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
                info: "border-sky-500/20 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
                error: "border-rose-500/20 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
                purple: "border-violet-500/20 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
                orange: "border-orange-500/20 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
                gray: "border-slate-500/20 bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400",
                pink: "border-pink-500/20 bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400",
                cyan: "border-cyan-500/20 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
                indigo: "border-indigo-500/20 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
                lime: "border-lime-500/20 bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400",
                teal: "border-teal-500/20 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
                rose: "border-rose-500/20 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",

                // Unified App Status Variants (Harmonized with Dark/Light design)
                "status_blue": "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
                "status_sky": "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
                "status_green": "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
                "status_emerald": "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
                "status_teal": "border-teal-200 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20",
                "status_amber": "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
                "status_red": "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
                "status_gray": "border-slate-200 bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20",
                "status_purple": "border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30",
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
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
