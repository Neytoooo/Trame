import { createClient, getCachedUser } from '@/utils/supabase/server'
import { Building2, MapPin, FileText, Save, Mail, Phone, Hash } from 'lucide-react'
import { saveCompanySettings } from '@/app/actions/settings'

export default async function SettingsPage() {
    const supabase = await createClient()
    const user = await getCachedUser()

    let settings = null
    if (user) {
        const { data } = await supabase
            .from('company_settings')
            .select('*')
            .eq('user_id', user.id)
            .single()
        settings = data
    }

    return (
        <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
            {/* Header (Fixed) */}
            <div className="shrink-0 pb-4">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Paramètres Entreprise</h1>
                <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400">Ces informations apparaîtront sur vos devis et factures.</p>
            </div>

            <form action={async (formData) => {
                'use server'
                await saveCompanySettings(formData)
            }} className="flex-1 min-h-0 overflow-y-auto no-scrollbar max-w-4xl space-y-6 pb-10">

                {/* Section Identité */}
                <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_12px_35px_rgba(0,0,0,0.03)] backdrop-blur-md space-y-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="text-indigo-600" size={20} />
                        Identité
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nom de l'entreprise</label>
                            <input
                                name="name"
                                type="text"
                                defaultValue={settings?.name || ''}
                                placeholder="Ma Super Entreprise"
                                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Logo de l'entreprise</label>
                            <div className="flex items-center gap-4">
                                {settings?.logo_url && (
                                    <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                                        <img src={settings.logo_url} alt="Logo" className="h-full w-full object-contain" />
                                    </div>
                                )}
                                <input
                                    name="logo"
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    className="w-full text-xs text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-500 cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                <Hash size={13} /> SIRET
                            </label>
                            <input
                                name="siret"
                                type="text"
                                defaultValue={settings?.siret || ''}
                                placeholder="123 456 789 00012"
                                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Section Contact */}
                <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_12px_35px_rgba(0,0,0,0.03)] backdrop-blur-md space-y-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="text-purple-600" size={20} />
                        Coordonnées
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Adresse complète</label>
                            <textarea
                                name="address"
                                rows={2}
                                defaultValue={settings?.address || ''}
                                placeholder="12 Rue du Chantier, 75000 Paris"
                                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm font-medium resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <Mail size={13} /> Email de contact
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    defaultValue={settings?.email || ''}
                                    placeholder="contact@entreprise.com"
                                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <Phone size={13} /> Téléphone
                                </label>
                                <input
                                    name="phone"
                                    type="text"
                                    defaultValue={settings?.phone || ''}
                                    placeholder="06 12 34 56 78"
                                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Pied de page */}
                <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_12px_35px_rgba(0,0,0,0.03)] backdrop-blur-md space-y-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-emerald-600" size={20} />
                        Pied de page PDF
                    </h2>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Mentions légales / Texte libre</label>
                        <textarea
                            name="footer_text"
                            rows={3}
                            defaultValue={settings?.footer_text || ''}
                            placeholder="TVA Intracommunautaire : FRXX... / Assurance Décennale n°..."
                            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                        />
                        <p className="text-xs text-slate-400">Ce texte apparaîtra en bas de chaque page de vos devis et factures.</p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95">
                        <Save size={18} />
                        Enregistrer les modifications
                    </button>
                </div>
            </form>
        </div>
    )
}
