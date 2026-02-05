import { Trash2, Link as LinkIcon, Plus, Terminal, Target, Save, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface GraphToolbarProps {
    isDeleteMode: boolean
    toggleDeleteMode: () => void
    isLinkMode: boolean
    toggleLinkMode: () => void
    onAddClick: () => void
    onCenterClick: () => void
    onLogsClick: () => void
    onSaveTemplateClick: () => void
    onLoadTemplateClick: () => void
}

export default function GraphToolbar({
    isDeleteMode,
    toggleDeleteMode,
    isLinkMode,
    toggleLinkMode,
    onAddClick,
    onCenterClick,
    onLogsClick,
    onSaveTemplateClick,
    onLoadTemplateClick
}: GraphToolbarProps) {
    return (
        <div className="flex items-center gap-2 pointer-events-auto">
            <Button
                variant={isDeleteMode ? "destructive" : "secondary"}
                size="icon"
                onClick={toggleDeleteMode}
                className={`transition-all ${isDeleteMode ? 'rotate-12' : ''}`}
                title={isDeleteMode ? "Quitter le mode suppression" : "Mode suppression"}
            >
                <Trash2 size={20} />
            </Button>

            <Button
                variant={isLinkMode ? "default" : "secondary"}
                size="icon"
                onClick={toggleLinkMode}
                className="transition-all"
                title={isLinkMode ? "Quitter le mode lien" : "Mode lien manuel"}
            >
                <LinkIcon size={20} />
            </Button>

            <Button
                onClick={onAddClick}
                disabled={isDeleteMode || isLinkMode}
                className="gap-2 ml-2"
            >
                <Plus size={18} />
                Ajouter une étape
            </Button>

            <div className="w-[1px] h-8 bg-white/10 mx-2" />

            <Button
                variant="secondary"
                size="icon"
                onClick={onSaveTemplateClick}
                title="Sauvegarder en tant que modèle"
            >
                <Save size={20} className="text-indigo-400" />
            </Button>

            <Button
                variant="secondary"
                size="icon"
                onClick={onLoadTemplateClick}
                title="Charger un modèle"
            >
                <FolderOpen size={20} className="text-blue-400" />
            </Button>

            <div className="w-[1px] h-8 bg-white/10 mx-2" />

            <Button
                variant="secondary"
                size="icon"
                onClick={onCenterClick}
                title="Recentrer la vue"
            >
                <Target size={20} />
            </Button>

            <Button
                variant="outline"
                size="icon"
                onClick={onLogsClick}
                className="ml-2 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
                title="Voir les logs d'automatisation"
            >
                <Terminal size={20} />
            </Button>
        </div>
    )
}
