'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, User, Mail, Phone, MapPin, Building2 } from 'lucide-react'
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
        zip_code: ''
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
                    zip_code: clientToEdit.zip_code || ''
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
                    zip_code: ''
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
                    phone_mobile: '',
                    address_line1: '',
                    city: '',
                    zip_code: ''
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
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 p-6">
                    <h2 className="text-xl font-bold text-white">{clientToEdit ? "Modifier Client" : "Nouveau Client"}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid gap-6 md:grid-cols-2">

                        {/* Nom & Type */}
                        <div className="space-y-4 md:col-span-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-400">Type de client</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'particulier' })}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${formData.type === 'particulier'
                                            ? 'border-blue-500/50 bg-blue-500/20 text-blue-400'
                                            : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <User size={18} />
                                        Particulier
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'professionnel' })}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${formData.type === 'professionnel'
                                            ? 'border-purple-500/50 bg-purple-500/20 text-purple-400'
                                            : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <Building2 size={18} />
                                        Professionnel
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-400">Nom complet / Entreprise</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <User size={18} />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder={formData.type === 'particulier' ? "ex: Jean Dupont" : "ex: Menuiserie Durand"}
                                        className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Coordonnées */}
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-400">Email</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="client@email.com"
                                        className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-400">Email Facturation (Optionnel)</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        value={formData.billing_email}
                                        onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                                        placeholder="facturation@entreprise.com"
                                        className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-400">Téléphone</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <Phone size={18} />
                                    </div>
                                    <input
                                        type="tel"
                                        value={formData.phone_mobile}
                                        onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
                                        placeholder="06 12 34 56 78"
                                        className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Adresse */}
                        <div className="space-y-4 md:col-span-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-400">Adresse</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <MapPin size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.address_line1}
                                        onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                                        placeholder="123 rue des Lilas"
                                        className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                                        className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 px-4 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Ville"
                                        className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 px-4 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
