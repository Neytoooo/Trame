'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
    Building2,
    MapPin,
    Mail,
    Phone,
    Hash,
    FileText,
    UploadCloud,
    Check,
    Save,
    ShieldCheck,
    Eye,
    Sparkles,
    Trash2,
    RefreshCw,
    AlertCircle,
    FileCheck2
} from 'lucide-react'
import PillButton from '@/components/ui/PillButton'
import { saveCompanySettings } from '@/app/actions/settings'

interface CompanySettings {
    id?: string
    name?: string | null
    address?: string | null
    siret?: string | null
    email?: string | null
    phone?: string | null
    footer_text?: string | null
    logo_url?: string | null
    company_id?: string | null
    user_id?: string | null
}

interface CompanySettingsClientProps {
    initialSettings: CompanySettings | null
}

export default function CompanySettingsClient({ initialSettings }: CompanySettingsClientProps) {
    const [name, setName] = useState(initialSettings?.name || '')
    const [siret, setSiret] = useState(initialSettings?.siret || '')
    const [address, setAddress] = useState(initialSettings?.address || '')
    const [email, setEmail] = useState(initialSettings?.email || '')
    const [phone, setPhone] = useState(initialSettings?.phone || '')
    const [footerText, setFooterText] = useState(initialSettings?.footer_text || '')

    // Logo state
    const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(initialSettings?.logo_url || null)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(initialSettings?.logo_url || null)
    const [removeLogo, setRemoveLogo] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    // Form feedback
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isDirty, setIsDirty] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Track unsaved changes
    useEffect(() => {
        const hasChanged =
            name !== (initialSettings?.name || '') ||
            siret !== (initialSettings?.siret || '') ||
            address !== (initialSettings?.address || '') ||
            email !== (initialSettings?.email || '') ||
            phone !== (initialSettings?.phone || '') ||
            footerText !== (initialSettings?.footer_text || '') ||
            logoFile !== null ||
            removeLogo

        setIsDirty(hasChanged)
    }, [name, siret, address, email, phone, footerText, logoFile, removeLogo, initialSettings])

    // File selection
    const handleFileChange = (file: File | null) => {
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setErrorMessage('Veuillez sélectionner un fichier image valide (PNG, JPG, SVG, WebP).')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage('L\'image ne doit pas dépasser 5 Mo.')
            return
        }

        setErrorMessage(null)
        setLogoFile(file)
        setRemoveLogo(false)

        const objectUrl = URL.createObjectURL(file)
        setLogoPreview(objectUrl)
    }

    const handleRemoveLogo = () => {
        setLogoFile(null)
        setLogoPreview(null)
        setRemoveLogo(true)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // Drag & drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0])
        }
    }

    // Append legal preset tags
    const handleAddPreset = (text: string) => {
        setFooterText(prev => {
            if (!prev) return text
            if (prev.includes(text)) return prev
            return `${prev}\n${text}`
        })
    }

    // Save action
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setErrorMessage(null)
        setSaveSuccess(false)

        try {
            const formData = new FormData()
            formData.append('name', name)
            formData.append('siret', siret)
            formData.append('address', address)
            formData.append('email', email)
            formData.append('phone', phone)
            formData.append('footer_text', footerText)
            formData.append('remove_logo', removeLogo ? 'true' : 'false')

            if (logoFile) {
                formData.append('logo', logoFile)
            }

            const res = await saveCompanySettings(formData)

            if (res?.error) {
                setErrorMessage(res.error)
            } else {
                setSaveSuccess(true)
                setIsDirty(false)
                if (removeLogo) {
                    setCurrentLogoUrl(null)
                }
                setTimeout(() => setSaveSuccess(false), 4000)
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Une erreur inattendue est survenue lors de l\'enregistrement.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
            {/* ========================================================================= */}
            {/* 1. TOP HEADER & QUICK SAVE ACTION BAR */}
            {/* ========================================================================= */}
            <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/[0.08] mb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Paramètres Entreprise
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                            <ShieldCheck size={12} />
                            Espace Entreprise KOTA
                        </span>
                        {isDirty && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                                Modifications non enregistrées
                            </span>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Ces informations sont imprimées automatiquement sur vos devis, factures et documents officiels.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    {saveSuccess && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                            Enregistré avec succès !
                        </div>
                    )}

                    <PillButton
                        type="button"
                        onClick={handleSubmit}
                        loading={isSaving}
                        variant="primary"
                        icon={<Save size={14} />}
                    >
                        {isSaving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
                    </PillButton>
                </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
                <div className="shrink-0 mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                    <button
                        onClick={() => setErrorMessage(null)}
                        className="text-rose-600 hover:text-rose-800 dark:text-rose-400 text-xs font-bold"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 2. MAIN 2-COLUMN WORKSPACE: FORM (LEFT) + REALTIME DOCUMENT PREVIEW (RIGHT) */}
            {/* ========================================================================= */}
            <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* --- LEFT FORM COLUMN (7 COLS) --- */}
                    <div className="lg:col-span-7 space-y-5">

                        {/* CARD 1: IDENTITÉ & LOGO */}
                        <div className="rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-[#131B2A]/90 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl space-y-5 transition-colors">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                        <Building2 size={16} />
                                    </div>
                                    Identité & Image de Marque
                                </h2>
                                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                    En-tête de devis
                                </span>
                            </div>

                            <div className="space-y-4">
                                {/* Nom Entreprise */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Nom commercial de l'entreprise *
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ex: KOTA BTP Construction, Dupont Rénovation..."
                                        required
                                        className="w-full rounded-xl bg-slate-50 dark:bg-[#0D121B] border border-slate-200 dark:border-white/[0.08] px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-indigo-500 focus:bg-white dark:focus:bg-[#111724] focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-xs sm:text-sm font-medium"
                                    />
                                </div>

                                {/* SIRET */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Hash size={12} className="text-indigo-500" />
                                            Numéro SIRET (14 chiffres)
                                        </span>
                                        <span className="text-[10px] text-slate-400 normal-case font-normal">
                                            {siret.replace(/\s/g, '').length}/14 chiffres
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={siret}
                                        onChange={(e) => setSiret(e.target.value)}
                                        placeholder="123 456 789 00012"
                                        className="w-full rounded-xl bg-slate-50 dark:bg-[#0D121B] border border-slate-200 dark:border-white/[0.08] px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-indigo-500 focus:bg-white dark:focus:bg-[#111724] focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-xs sm:text-sm font-medium font-mono"
                                    />
                                </div>

                                {/* Logo Dropzone */}
                                <div className="space-y-1.5 pt-1">
                                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        Logo de l'entreprise (Imprimé sur vos devis et factures)
                                    </label>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png, image/jpeg, image/webp, image/svg+xml"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                    />

                                    {logoPreview ? (
                                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0D121B]/80 transition-colors">
                                            <div className="relative w-24 h-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white p-2 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo preview"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>

                                            <div className="flex-1 space-y-1.5 text-center sm:text-left">
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    {logoFile ? logoFile.name : 'Logo actuellement enregistré'}
                                                </p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                    {logoFile
                                                        ? `${(logoFile.size / 1024).toFixed(1)} Ko • Prêt à être sauvegardé`
                                                        : 'Ce logo apparaît dans l\'en-tête de tous vos exports PDF.'}
                                                </p>

                                                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-[#1A2438] hover:bg-slate-50 dark:hover:bg-[#23304a] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <RefreshCw size={11} />
                                                        Remplacer
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveLogo}
                                                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <Trash2 size={11} />
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                                                isDragging
                                                    ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                                                    : 'border-slate-300 dark:border-white/[0.12] bg-slate-50/50 dark:bg-[#0D121B]/40 hover:bg-slate-50 dark:hover:bg-[#0D121B]/80 hover:border-slate-400 dark:hover:border-white/20'
                                            }`}
                                        >
                                            <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                <UploadCloud size={20} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                    Cliquez pour importer votre logo ou glissez-déposez ici
                                                </p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                    PNG, JPG, SVG ou WebP (max. 5 Mo)
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: COORDONNÉES & CONTACT */}
                        <div className="rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-[#131B2A]/90 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl space-y-5 transition-colors">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                        <MapPin size={16} />
                                    </div>
                                    Coordonnées & Contact Client
                                </h2>
                                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                    Bloc émetteur
                                </span>
                            </div>

                            <div className="space-y-4">
                                {/* Adresse */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Adresse complète du siège ou de l'atelier
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="12 Allée Richelieu, 75000 Paris"
                                        className="w-full rounded-xl bg-slate-50 dark:bg-[#0D121B] border border-slate-200 dark:border-white/[0.08] px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-purple-500 focus:bg-white dark:focus:bg-[#111724] focus:ring-1 focus:ring-purple-500 outline-none transition-all text-xs sm:text-sm font-medium resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Mail size={12} className="text-purple-500" />
                                            Email de contact
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="contact@entreprise-btp.fr"
                                            className="w-full rounded-xl bg-slate-50 dark:bg-[#0D121B] border border-slate-200 dark:border-white/[0.08] px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-purple-500 focus:bg-white dark:focus:bg-[#111724] focus:ring-1 focus:ring-purple-500 outline-none transition-all text-xs sm:text-sm font-medium"
                                        />
                                    </div>

                                    {/* Téléphone */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Phone size={12} className="text-purple-500" />
                                            Numéro de téléphone
                                        </label>
                                        <input
                                            type="text"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="06 12 34 56 78"
                                            className="w-full rounded-xl bg-slate-50 dark:bg-[#0D121B] border border-slate-200 dark:border-white/[0.08] px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-purple-500 focus:bg-white dark:focus:bg-[#111724] focus:ring-1 focus:ring-purple-500 outline-none transition-all text-xs sm:text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 3: PIED DE PAGE & MENTIONS LÉGALES */}
                        <div className="rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-[#131B2A]/90 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl space-y-5 transition-colors">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <FileText size={16} />
                                    </div>
                                    Pied de Page PDF & Mentions Légales
                                </h2>
                                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                    Bas de page PDF
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Texte juridique et mentions obligatoires
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={footerText}
                                        onChange={(e) => setFooterText(e.target.value)}
                                        placeholder="TVA Intracommunautaire : FRXX... / Assurance Décennale n°... / R.C.S. Paris B 123 456 789"
                                        className="w-full rounded-xl bg-slate-50 dark:bg-[#0D121B] border border-slate-200 dark:border-white/[0.08] px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#111724] focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-xs sm:text-sm font-medium resize-none leading-relaxed"
                                    />
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                        Ce paragraphe apparaît en bas de toutes les pages de vos devis et factures édités.
                                    </p>
                                </div>

                                {/* Quick Presets */}
                                <div className="pt-1">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2">
                                        Ajouts rapides en un clic :
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleAddPreset('TVA Intracommunautaire : FRXX 123456789')}
                                            className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2438] dark:hover:bg-[#23304a] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                        >
                                            + TVA Intracommunautaire
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAddPreset('Assurance Décennale & Responsabilité Civile Pro n° DEC-987654 (SMABTP)')}
                                            className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2438] dark:hover:bg-[#23304a] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                        >
                                            + Assurance Décennale
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAddPreset('R.C.S. Paris B 123 456 789 - SAS au capital de 10 000 €')}
                                            className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2438] dark:hover:bg-[#23304a] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                        >
                                            + RCS & Capital social
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAddPreset('En cas de retard de paiement, indemnité forfaitaire pour frais de recouvrement : 40 €')}
                                            className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2438] dark:hover:bg-[#23304a] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                        >
                                            + Pénalités de retard
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* --- RIGHT COLUMN: LIVE INTERACTIVE DOCUMENT PREVIEW (5 COLS) --- */}
                    <div className="lg:col-span-5 sticky top-2 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Eye size={13} className="text-indigo-500" />
                                Aperçu en Direct sur vos Devis
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                Rendu PDF fidèle
                            </span>
                        </div>

                        {/* Sheet Mockup */}
                        <div className="rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white text-slate-900 p-6 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all relative overflow-hidden select-none">
                            {/* Watermark accent */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 to-transparent pointer-events-none rounded-bl-full" />

                            {/* Header Section */}
                            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
                                <div className="space-y-1 max-w-[65%]">
                                    <p className="text-base font-black tracking-tight text-slate-900 uppercase">
                                        {name || 'NOM DE VOTRE ENTREPRISE'}
                                    </p>
                                    {siret && (
                                        <p className="text-[10px] font-mono text-slate-500">
                                            SIRET : {siret}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-slate-600 whitespace-pre-line leading-tight">
                                        {address || '12 Rue de l\'Exemple, 75000 Paris'}
                                    </p>
                                    <div className="pt-1 flex flex-col text-[10px] text-slate-500 leading-tight">
                                        {email && <span>Email : {email}</span>}
                                        {phone && <span>Tél : {phone}</span>}
                                    </div>
                                </div>

                                {/* Logo Box */}
                                <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-2xs">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-center text-slate-300">
                                            <Building2 size={20} className="mx-auto" />
                                            <span className="text-[8px] font-semibold uppercase tracking-wider block mt-0.5">Logo</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Document Title Dummy */}
                            <div className="bg-slate-50 rounded-xl p-3 mb-4 flex items-center justify-between border border-slate-100">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-900">DEVIS N° DEV-2026-0084</p>
                                    <p className="text-[9px] text-slate-500">Date : 26 Octobre 2026</p>
                                </div>
                                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    À titre d'exemple
                                </span>
                            </div>

                            {/* Dummy Content lines */}
                            <div className="space-y-2 py-2 border-b border-slate-100 mb-4 opacity-50">
                                <div className="h-2 w-3/4 bg-slate-200 rounded"></div>
                                <div className="h-2 w-1/2 bg-slate-200 rounded"></div>
                                <div className="h-2 w-2/3 bg-slate-200 rounded"></div>
                            </div>

                            {/* Footer Section */}
                            <div className="pt-2 text-center">
                                <p className="text-[9px] text-slate-400 font-mono italic leading-tight whitespace-pre-line">
                                    {footerText || 'TVA Intracommunautaire : FRXX... / Assurance Décennale n°...'}
                                </p>
                            </div>
                        </div>

                        {/* Help note */}
                        <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 text-slate-600 dark:text-slate-300 text-xs flex items-start gap-2.5">
                            <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed">
                                Les devis et factures édités par n'importe quel membre de votre équipe reprendront instantanément cette mise en page.
                            </p>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    )
}
