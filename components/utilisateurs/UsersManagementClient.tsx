'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users,
    UserPlus,
    ShieldCheck,
    Search,
    X,
    Check,
    MoreVertical,
    Mail,
    Phone,
    Calendar,
    Clock,
    Trash2,
    Edit3,
    AlertCircle,
    UserX,
    Filter,
    Shield,
    HardHat,
    Briefcase,
    FileText,
    CheckCircle2,
    Loader2,
    Copy,
    Database,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import type {
    AuthorizedUser,
    UserRole,
    UserAccessStatus
} from '@/types/users'
import { USER_ROLES_CONFIG } from '@/types/users'
import {
    addAuthorizedUserAction,
    updateAuthorizedUserRoleAction,
    updateAuthorizedUserStatusAction,
    removeAuthorizedUserAction
} from '@/app/actions/users'
import PillButton from '@/components/ui/PillButton'
import { useConfirm } from '@/components/ui/ConfirmProvider'

const CREATE_USERS_SQL = `-- 1. TABLE DES UTILISATEURS AUTORISÉS (WHITELIST)
CREATE TABLE IF NOT EXISTS public.authorized_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'charge_affaires'
        CHECK (role IN ('admin', 'charge_affaires', 'metreur', 'conducteur_travaux', 'chef_chantier', 'comptabilite')),
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'invite'
        CHECK (status IN ('actif', 'invite', 'suspendu')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_authorized_users_email ON public.authorized_users(lower(email));
CREATE INDEX IF NOT EXISTS idx_authorized_users_role ON public.authorized_users(role);
CREATE INDEX IF NOT EXISTS idx_authorized_users_status ON public.authorized_users(status);

ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'authorized_users' AND policyname = 'Authenticated users can read authorized_users'
    ) THEN
        CREATE POLICY "Authenticated users can read authorized_users" ON public.authorized_users
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'authorized_users' AND policyname = 'Authenticated users can manage authorized_users'
    ) THEN
        CREATE POLICY "Authenticated users can manage authorized_users" ON public.authorized_users
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

INSERT INTO public.authorized_users (email, role, status, first_name, last_name, phone)
VALUES
    ('mattiskhn@gmail.com', 'admin', 'actif', 'Mattis', 'Khn', '06 12 34 56 78'),
    ('mattiskhn2@gmail.com', 'metreur', 'actif', 'Mattis', 'Khn (Second)', '06 98 76 54 32'),
    ('thomas.laurent@trame-btp.fr', 'charge_affaires', 'actif', 'Thomas', 'Laurent', '06 45 12 89 23'),
    ('sophie.martinez@trame-btp.fr', 'conducteur_travaux', 'actif', 'Sophie', 'Martinez', '06 78 45 12 90'),
    ('nicolas.dupuis@trame-btp.fr', 'chef_chantier', 'actif', 'Nicolas', 'Dupuis', '06 33 21 87 65'),
    ('claire.bernard@trame-btp.fr', 'comptabilite', 'actif', 'Claire', 'Bernard', '06 54 89 63 21')
ON CONFLICT (email) DO UPDATE 
SET role = EXCLUDED.role, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name;`

interface UsersManagementClientProps {
    initialUsers: AuthorizedUser[]
    currentUserEmail: string
    isTableMissing?: boolean
}

export default function UsersManagementClient({
    initialUsers,
    currentUserEmail,
    isTableMissing = false
}: UsersManagementClientProps) {
    const confirm = useConfirm()
    const [users, setUsers] = useState<AuthorizedUser[]>(initialUsers)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRole, setSelectedRole] = useState<string>('all')
    const [selectedStatus, setSelectedStatus] = useState<string>('all')

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
    const [userToEditRole, setUserToEditRole] = useState<AuthorizedUser | null>(null)
    const [newSelectedRole, setNewSelectedRole] = useState<UserRole>('charge_affaires')

    // Form state for adding user
    const [addForm, setAddForm] = useState({
        email: '',
        role: 'charge_affaires' as UserRole,
        first_name: '',
        last_name: '',
        phone: ''
    })
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

    // SQL Copy banner state
    const [copiedSQL, setCopiedSQL] = useState(false)
    const [showSQLDetails, setShowSQLDetails] = useState(false)

    const handleCopySQL = async () => {
        try {
            await navigator.clipboard.writeText(CREATE_USERS_SQL)
            setCopiedSQL(true)
            setTimeout(() => setCopiedSQL(false), 2500)
        } catch {
            // fallback
        }
    }

    // KPI Metrics
    const metrics = useMemo(() => {
        const total = users.length
        const admins = users.filter(u => u.role === 'admin').length
        const active = users.filter(u => u.status === 'actif').length
        const pending = users.filter(u => u.status === 'invite').length
        return { total, admins, active, pending }
    }, [users])

    // Filtered users
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const query = searchQuery.toLowerCase().trim()
            const matchSearch =
                !query ||
                u.email.toLowerCase().includes(query) ||
                (u.first_name && u.first_name.toLowerCase().includes(query)) ||
                (u.last_name && u.last_name.toLowerCase().includes(query)) ||
                USER_ROLES_CONFIG[u.role]?.label.toLowerCase().includes(query)

            const matchRole = selectedRole === 'all' || u.role === selectedRole
            const matchStatus = selectedStatus === 'all' || u.status === selectedStatus

            return matchSearch && matchRole && matchStatus
        })
    }, [users, searchQuery, selectedRole, selectedStatus])

    // Handle Add User
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormLoading(true)
        setFormError(null)

        const res = await addAuthorizedUserAction(addForm)
        setFormLoading(false)

        if (res.success && res.user) {
            setUsers(prev => [res.user!, ...prev])
            setIsAddModalOpen(false)
            setAddForm({
                email: '',
                role: 'charge_affaires',
                first_name: '',
                last_name: '',
                phone: ''
            })
        } else if (res.error?.includes('authorized_users') || isTableMissing) {
            // Mode preview immédiat pour tester l'interface
            const localUser: AuthorizedUser = {
                id: 'local-' + Date.now(),
                email: addForm.email.trim().toLowerCase(),
                role: addForm.role,
                first_name: addForm.first_name.trim() || null,
                last_name: addForm.last_name.trim() || null,
                phone: addForm.phone.trim() || null,
                status: 'invite',
                created_by: null,
                invited_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
            setUsers(prev => [localUser, ...prev])
            setIsAddModalOpen(false)
            setAddForm({
                email: '',
                role: 'charge_affaires',
                first_name: '',
                last_name: '',
                phone: ''
            })
        } else {
            setFormError(res.error || 'Erreur lors de l\'enregistrement.')
        }
    }

    // Handle Edit Role
    const handleUpdateRole = async () => {
        if (!userToEditRole) return
        setActionLoadingId(userToEditRole.id)

        const res = await updateAuthorizedUserRoleAction(userToEditRole.id, newSelectedRole)
        setActionLoadingId(null)

        if (res.success || isTableMissing) {
            setUsers(prev => prev.map(u => u.id === userToEditRole.id ? { ...u, role: newSelectedRole } : u))
            setIsRoleModalOpen(false)
            setUserToEditRole(null)
        } else {
            alert(res.error || 'Erreur lors de la mise à jour.')
        }
    }

    // Handle Toggle Status (Suspend / Reactivate)
    const handleToggleStatus = async (user: AuthorizedUser) => {
        const nextStatus: UserAccessStatus = user.status === 'suspendu' ? 'actif' : 'suspendu'
        const actionLabel = nextStatus === 'suspendu' ? 'suspendre' : 'réactiver'

        const ok = await confirm({
            title: `${nextStatus === 'suspendu' ? 'Suspendre' : 'Réactiver'} l'accès ?`,
            message: `Êtes-vous sûr de vouloir ${actionLabel} l'accès pour "${user.email}" ?`,
            confirmText: nextStatus === 'suspendu' ? 'Oui, suspendre' : 'Oui, réactiver',
            cancelText: 'Annuler',
            variant: nextStatus === 'suspendu' ? 'danger' : 'info'
        })
        if (!ok) return

        setActionLoadingId(user.id)
        const res = await updateAuthorizedUserStatusAction(user.id, nextStatus)
        setActionLoadingId(null)

        if (res.success || isTableMissing) {
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u))
        } else {
            alert(res.error || 'Erreur lors du changement de statut.')
        }
    }

    // Handle Remove User
    const handleRemoveUser = async (user: AuthorizedUser) => {
        const ok = await confirm({
            title: 'Révoquer définitivement cet accès ?',
            message: `Êtes-vous sûr de vouloir révoquer l'accès pour "${user.email}" ? Cette personne ne pourra plus du tout se connecter au logiciel.`,
            confirmText: 'Oui, révoquer l\'accès',
            cancelText: 'Non, annuler',
            variant: 'danger'
        })
        if (!ok) return

        setActionLoadingId(user.id)
        const res = await removeAuthorizedUserAction(user.id)
        setActionLoadingId(null)

        if (res.success || isTableMissing) {
            setUsers(prev => prev.filter(u => u.id !== user.id))
        } else {
            alert(res.error || 'Erreur lors de la suppression.')
        }
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* ========================================================================= */}
            {/* 1. TOP HEADER & KPI METRICS */}
            {/* ========================================================================= */}
            <div className="shrink-0 space-y-3 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                Gestion des Utilisateurs & Accès
                            </h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                                <ShieldCheck size={12} />
                                Réservé aux Administrateurs
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Seuls les emails enregistrés sur cette page peuvent se connecter à l'espace de votre entreprise.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <PillButton
                            onClick={() => setIsAddModalOpen(true)}
                            variant="primary"
                            icon={<UserPlus size={14} />}
                        >
                            Inviter un collaborateur
                        </PillButton>
                    </div>
                </div>

                {/* BANNIÈRE D'INITIALISATION SQL (Affichée uniquement si la table Supabase n'est pas encore créée) */}
                {isTableMissing && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-slate-800 dark:text-slate-200 transition-all">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                                    <Database size={18} />
                                </div>
                                <div>
                                    <h3 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                                        Initialisation de la table Supabase requise
                                    </h3>
                                    <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                                        La table <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono text-[11px]">authorized_users</code> n'est pas encore créée dans votre base de données Supabase.
                                        Pour activer la persistance et le verrouillage strict, copiez le script SQL et exécutez-le dans le <strong>SQL Editor</strong> de Supabase.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => setShowSQLDetails(!showSQLDetails)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-xl border border-amber-500/30 hover:bg-amber-500/15 text-amber-800 dark:text-amber-200 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                    {showSQLDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                    {showSQLDetails ? 'Masquer le code' : 'Voir le code SQL'}
                                </button>
                                <button
                                    onClick={handleCopySQL}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    {copiedSQL ? <Check size={14} /> : <Copy size={14} />}
                                    {copiedSQL ? 'Copié dans le presse-papiers !' : 'Copier le script SQL'}
                                </button>
                            </div>
                        </div>

                        {showSQLDetails && (
                            <div className="mt-3 pt-3 border-t border-amber-500/20">
                                <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed selection:bg-amber-500 selection:text-black">
                                    {CREATE_USERS_SQL}
                                </pre>
                            </div>
                        )}
                    </div>
                )}

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Accès Autorisés
                            </p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                                {metrics.total}
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                            <Users size={18} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Administrateurs
                            </p>
                            <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                                {metrics.admins}
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <Shield size={18} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Membres Actifs
                            </p>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {metrics.active}
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                En attente d'activation
                            </p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                {metrics.pending}
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock size={18} />
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-2.5 shadow-xs">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email ou rôle BTP..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto">
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none font-medium"
                        >
                            <option value="all">Tous les rôles BTP</option>
                            {(Object.keys(USER_ROLES_CONFIG) as UserRole[]).map((r) => (
                                <option key={r} value={r}>
                                    {USER_ROLES_CONFIG[r].label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none font-medium"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="actif">Actif</option>
                            <option value="invite">Invité (En attente)</option>
                            <option value="suspendu">Suspendu</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. MAIN USERS TABLE */}
            {/* ========================================================================= */}
            <div className="flex-1 min-h-0 bg-white dark:bg-[#131B2A] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-50/90 dark:bg-[#0F1623]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="py-3 px-4">Collaborateur</th>
                                <th className="py-3 px-4">Rôle BTP</th>
                                <th className="py-3 px-4">Statut d'accès</th>
                                <th className="py-3 px-4">Date d'invitation</th>
                                <th className="py-3 px-4">Dernière connexion</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        <UserX size={36} className="mx-auto mb-2 opacity-40" />
                                        <p className="font-medium text-slate-600 dark:text-slate-300 text-sm">
                                            Aucun utilisateur trouvé
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {searchQuery ? 'Modifiez votre recherche ou réinitialisez les filtres.' : 'Invitez votre premier collaborateur ci-dessus.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isSelf = user.email.toLowerCase() === currentUserEmail.toLowerCase()
                                    const roleConfig = USER_ROLES_CONFIG[user.role] || USER_ROLES_CONFIG.charge_affaires
                                    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email.split('@')[0]
                                    const initial = (user.first_name?.[0] || user.email[0] || 'U').toUpperCase()

                                    return (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-[#1A2438]/60 transition-colors group"
                                        >
                                            {/* Collaborateur */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                                        {initial}
                                                        {user.status === 'actif' && (
                                                            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#131B2A]" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                                {fullName}
                                                            </p>
                                                            {isSelf && (
                                                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                                                                    Vous
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate flex items-center gap-1 mt-0.5">
                                                            <Mail size={11} className="opacity-60" />
                                                            {user.email}
                                                            {user.phone && (
                                                                <>
                                                                    <span className="opacity-40">•</span>
                                                                    <Phone size={11} className="opacity-60" />
                                                                    {user.phone}
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Rôle BTP */}
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleConfig.badgeColor}`}>
                                                    {user.role === 'admin' ? <Shield size={12} /> : <HardHat size={12} />}
                                                    {roleConfig.label}
                                                </span>
                                            </td>

                                            {/* Statut d'accès */}
                                            <td className="py-3 px-4">
                                                {user.status === 'actif' && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Actif
                                                    </span>
                                                )}
                                                {user.status === 'invite' && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                        Invité (En attente)
                                                    </span>
                                                )}
                                                {user.status === 'suspendu' && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                        Accès Suspendu
                                                    </span>
                                                )}
                                            </td>

                                            {/* Date d'invitation */}
                                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                                                {new Date(user.invited_at || user.created_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>

                                            {/* Dernière connexion */}
                                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                                                {user.last_login_at ? (
                                                    new Date(user.last_login_at).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                ) : (
                                                    <span className="text-slate-400 italic">Jamais connecté</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Modifier le rôle */}
                                                    <button
                                                        onClick={() => {
                                                            setUserToEditRole(user)
                                                            setNewSelectedRole(user.role)
                                                            setIsRoleModalOpen(true)
                                                        }}
                                                        disabled={actionLoadingId === user.id}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-[#1A2438] transition-colors cursor-pointer"
                                                        title="Modifier le rôle"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>

                                                    {/* Suspendre / Réactiver */}
                                                    {!isSelf && (
                                                        <button
                                                            onClick={() => handleToggleStatus(user)}
                                                            disabled={actionLoadingId === user.id}
                                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                                user.status === 'suspendu'
                                                                    ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                                                    : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                                            }`}
                                                            title={user.status === 'suspendu' ? "Réactiver l'accès" : "Suspendre l'accès"}
                                                        >
                                                            {user.status === 'suspendu' ? <CheckCircle2 size={14} /> : <UserX size={14} />}
                                                        </button>
                                                    )}

                                                    {/* Supprimer / Révoquer */}
                                                    {!isSelf && (
                                                        <button
                                                            onClick={() => handleRemoveUser(user)}
                                                            disabled={actionLoadingId === user.id}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                                            title="Révoquer définitivement l'accès"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="shrink-0 p-3 bg-slate-50 dark:bg-[#0F1623] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                        {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} affiché{filteredUsers.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-[11px] text-slate-400">
                        Protection de connexion active • Whitelist stricte
                    </span>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. MODALE : INVITER UN COLLABORATEUR */}
            {/* ========================================================================= */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10"
                        >
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                        <UserPlus size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                            Inviter un nouveau collaborateur
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Autorisez un email et attribuez-lui un rôle métier BTP.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddUser} className="p-5 space-y-4">
                                {formError && (
                                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                                        <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                        <span>{formError}</span>
                                    </div>
                                )}

                                {/* Email professionnel */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Adresse email professionnelle <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="collaborateur@entreprise.com"
                                        value={addForm.email}
                                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Cette adresse servira d'identifiant de connexion unique (Email ou Google OAuth).
                                    </p>
                                </div>

                                {/* Rôle BTP */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Rôle attribué <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                                        {(Object.keys(USER_ROLES_CONFIG) as UserRole[]).map((r) => {
                                            const cfg = USER_ROLES_CONFIG[r]
                                            const isSelected = addForm.role === r

                                            return (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    onClick={() => setAddForm({ ...addForm, role: r })}
                                                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                                                        isSelected
                                                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'
                                                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                                                    }`}
                                                >
                                                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                                        isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                                                    }`}>
                                                        {isSelected && <Check size={10} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                            {cfg.label}
                                                            {r === 'admin' && (
                                                                <span className="text-[10px] px-1.5 py-0.2 bg-purple-500/15 text-purple-600 rounded font-semibold">
                                                                    Complet
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                                            {cfg.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Prénom & Nom */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Prénom
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="ex: Thomas"
                                            value={addForm.first_name}
                                            onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Nom
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="ex: Martin"
                                            value={addForm.last_name}
                                            onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Téléphone */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Numéro de téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="ex: 06 12 34 56 78"
                                        value={addForm.phone}
                                        onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        {formLoading && <Loader2 size={13} className="animate-spin" />}
                                        {formLoading ? 'Enregistrement...' : 'Autoriser et inviter'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ========================================================================= */}
            {/* 4. MODALE : MODIFIER LE RÔLE */}
            {/* ========================================================================= */}
            <AnimatePresence>
                {isRoleModalOpen && userToEditRole && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsRoleModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10"
                        >
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                        Modifier le rôle BTP
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Pour {userToEditRole.email}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsRoleModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-5 space-y-3">
                                <div className="space-y-2">
                                    {(Object.keys(USER_ROLES_CONFIG) as UserRole[]).map((r) => {
                                        const cfg = USER_ROLES_CONFIG[r]
                                        const isSelected = newSelectedRole === r

                                        return (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setNewSelectedRole(r)}
                                                className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                                                    isSelected
                                                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'
                                                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                                    isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                                                }`}>
                                                    {isSelected && <Check size={10} />}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900 dark:text-white">
                                                        {cfg.label}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                                        {cfg.description}
                                                    </p>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>

                                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsRoleModalOpen(false)}
                                        className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleUpdateRole}
                                        disabled={actionLoadingId === userToEditRole.id}
                                        className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        {actionLoadingId === userToEditRole.id && <Loader2 size={13} className="animate-spin" />}
                                        Enregistrer la modification
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
