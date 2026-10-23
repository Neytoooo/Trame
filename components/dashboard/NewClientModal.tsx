'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, User, Mail, Phone, MapPin, Building2, CreditCard, FileText, CheckCircle2 } from 'lucide-react'
import { ClientData, createClientAction, updateClientAction } from '@/app/actions/clients'

export default function NewClientModal({
    isOpen,
    onClose,
    clientToEdit
}: {
    isOpen: boolean
    onClose: () => void
    clientToEdit?: any
}) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<ClientData>({
        name: '',
        type: 'particulier',
        email: '',
        billing_email: '',
        phone_mobile: '',
        address_line1: '',
        city: '',
        zip_code: '',
        siret: '',
        iban: ''
    })

    useEffect(() => {
        if (isOpen) {
            if (clientToEdit) {
                setFormData({
                    name: clientToEdit.name || '',
                    type: clientToEdit.type || 'particulier',
                    email: clientToEdit.email || '',
                    billing_email: clientToEdit.billing_email || '',
                    phone_mobile: clientToEdit.phone_mobile || '',
                    address_line1: clientToEdit.address_line1 || '',
                    city: clientToEdit.city || '',
                    zip_code: clientToEdit.zip_code || '',
                    siret: clientToEdit.siret || '',
                    iban: clientToEdit.iban || ''
                })
            } else {
                setFormData({
                    name: '',
                    type: 'particulier',
                    email: '',
                    billing_email: '',
                    phone_mobile: '',
                    address_line1: '',
                    city: '',
                    zip_code: '',
                    siret: '',
                    iban: ''
                })
            }
        }
    }, [isOpen, clientToEdit])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = clientToEdit
                ? await updateClientAction(clientToEdit.id, formData)
                : await createClientAction(formData)
            if (res.error) {
                alert(res.error)
            } else {
                onClose()
                // Reset form
                setFormData({
                    name: '',
                    type: 'particulier',
                    email: '',
                    billing_email: '',
                    phone_mobile: '',
                    address_line1: '',
                    city: '',
                    zip_code: '',
                    siret: '',
                    iban: ''
                })
            }
        } catch (err) {
            console.error(err)
            alert("Une erreur inattendue est survenue.")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0B101B]/95 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-in zoom-in-95 duration-200 custom-scrollbar before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent">

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0B101B]/95 backdrop-blur-md px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.35)]">
                            {formData.type === 'professionnel' ? <Building2 size={20} /> : <User size={20} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">
                                {clientToEdit ? "Modifier le Client" : "Nouveau Client"}
                            </h2>
                            <p className="text-xs text-slate-400">
                                {clientToEdit ? "Mettre à jour les coordonnées du client" : "Enregistrez un nouveau client particulier ou professionnel"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">

                        {/* Nom & Type */}
                        <div className="space-y-4 md:col-span-2">
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Type de client
                                </label>
                                <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/10 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'particulier' })}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${formData.type === 'particulier'
                                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_2px_14px_rgba(124,58,237,0.4)]'
                                            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                            }`}
                                    >
                                        <User size={15} />
                                        Particulier
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'professionnel' })}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${formData.type === 'professionnel'
                                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_2px_14px_rgba(99,102,241,0.4)]'
                                            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                            }`}
                                    >
                                        <Building2 size={15} />
                                        Professionnel
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Nom complet / Entreprise
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                        <User size={16} />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder={formData.type === 'particulier' ? "ex: Jean Dupont" : "ex: Menuiserie Durand SARL"}
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Info Pro (SIRET) - Only if Pro */}
                        {formData.type === 'professionnel' && (
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Numéro de SIRET
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                        <FileText size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.siret}
                                        onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                                        placeholder="123 456 789 00012"
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Coordonnées */}
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Email Principal
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                        <Mail size={16} />
                                    </div>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="client@email.com"
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Email Facturation (Optionnel)
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                        <Mail size={16} />
                                    </div>
                                    <input
                                        type="email"
                                        value={formData.billing_email}
                                        onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                                        placeholder="facturation@entreprise.com"
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Téléphone
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                        <Phone size={16} />
                                    </div>
                                    <input
                                        type="tel"
                                        value={formData.phone_mobile}
                                        onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
                                        placeholder="06 12 34 56 78"
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20"
                                    />
                                </div>
                            </div>

                            {/* IBAN */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    IBAN
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                        <CreditCard size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.iban}
                                        onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                                        placeholder="FR76 ...."
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20 font-mono text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Adresse */}
                        <div className="space-y-4 md:col-span-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Adresse Principale
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                                        <MapPin size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.address_line1}
                                        onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                                        placeholder="123 rue des Lilas"
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <input
                                        type="text"
                                        value={formData.zip_code}
                                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                                        placeholder="Code Postal"
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 px-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Ville"
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 px-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-[0_4px_20px_rgba(124,58,237,0.4)] transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
                            <span>Enregistrer</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
