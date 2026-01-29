import { createClient } from '@/utils/supabase/server'
import { Building2, MapPin, FileText, Save, Mail, Phone, Hash } from 'lucide-react'
import { saveCompanySettings } from '@/app/actions/settings'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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
        <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white">Paramètres Entreprise</h1>
                <p className="text-gray-400">Ces informations apparaîtront sur vos devis et factures.</p>
            </div>

            <form action={saveCompanySettings} className="space-y-6">

                {/* Section Identité */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Building2 className="text-blue-400" size={20} />
                        Identité
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Nom de l'entreprise</label>
                            <input
                                name="name"
                                type="text"
                                defaultValue={settings?.name || ''}
                                placeholder="Ma Super Entreprise"
                                className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                <Hash size={14} /> SIRET
                            </label>
                            <input
                                name="siret"
                                type="text"
                                defaultValue={settings?.siret || ''}
                                placeholder="123 456 789 00012"
                                className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Section Contact */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <MapPin className="text-purple-400" size={20} />
                        Coordonnées
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Adresse complète</label>
                            <textarea
                                name="address"
                                rows={2}
                                defaultValue={settings?.address || ''}
                                placeholder="12 Rue du Chantier, 75000 Paris"
                                className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <Mail size={14} /> Email de contact
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    defaultValue={settings?.email || ''}
                                    placeholder="contact@entreprise.com"
                                    className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <Phone size={14} /> Téléphone
                                </label>
                                <input
                                    name="phone"
                                    type="text"
                                    defaultValue={settings?.phone || ''}
                                    placeholder="06 12 34 56 78"
                                    className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Pied de page */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FileText className="text-emerald-400" size={20} />
                        Pied de page PDF
                    </h2>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Mentions légales / Texte libre</label>
                        <textarea
                            name="footer_text"
                            rows={3}
                            defaultValue={settings?.footer_text || ''}
                            placeholder="TVA Intracommunautaire : FRXX... / Assurance Décennale n°..."
                            className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
                        />
                        <p className="text-xs text-gray-500">Ce texte apparaîtra en bas de chaque page de vos devis et factures.</p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
                        <Save size={20} />
                        Enregistrer les modifications
                    </button>
                </div>
            </form>
        </div>
    )
}
