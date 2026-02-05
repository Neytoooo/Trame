import { Workflow } from "lucide-react";

export default function AutomationTag() {
    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-sm">
            <Workflow size={10} />
            Automatisé
        </span>
    )
}
