'use client'

import { useState } from 'react'
import { HelpCircle, X, Download, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'

interface ImportHelpButtonProps {
    type: 'client' | 'article'
}

export default function ImportHelpButton({ type }: ImportHelpButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    const downloadTemplate = () => {
        let data: any[] = []
        let filename = ''

        if (type === 'client') {
            data = [
                {
                    Nom: 'Jean Dupont',
                    Email: 'jean@example.com',
                    Telephone: '0612345678',
                    Type: 'Particulier',
                    Ville: 'Paris',
                    Adresse: '10 Rue de la Paix',
                    CP: '75000'
                },
                {
                    Nom: 'Entreprise ABC',
                    Email: 'contact@abc.com',
                    Telephone: '0145678910',
                    Type: 'Professionnel',
                    Ville: 'Lyon',
                    Adresse: '5 Avenue des Champs',
                    CP: '69000',
                    SIRET: '12345678900012',
                    TVA: 'FR12345678901'
                }
            ]
            filename = 'modele_import_clients.xlsx'
        } else {
            data = [
                {
                    Designation: 'Peinture Blanche Satin',
                    Categorie: 'Fourniture',
                    Unite: 'L',
                    Prix_Vente: 15.50,
                    Prix_Achat: 0
                },
                {
                    Designation: 'Pose Carrelage',
                    Categorie: 'Main d\'oeuvre',
                    Unite: 'm2',
                    Prix_Vente: 45.00,
                    Prix_Achat: 0
                }
            ]
            filename = 'modele_import_articles.xlsx'
        }

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Modele")
        XLSX.writeFile(wb, filename)
    }

    const modalContent = {
        client: {
            title: "Aide Import Clients",
            columns: [
                { name: "Nom", required: true, desc: "Nom complet du client ou de l'entreprise" },
                { name: "Email", required: false, desc: "Adresse email de contact" },
                { name: "Téléphone", required: false, desc: "Numéro de mobile ou fixe" },
                { name: "Type", required: false, desc: "'Particulier' ou 'Professionnel' (défaut: Particulier)" },
                { name: "Ville", required: false, desc: "Ville" },
                { name: "Adresse", required: false, desc: "Adresse complète" },
                { name: "CP", required: false, desc: "Code Postal" },
                { name: "SIRET", required: false, desc: "Uniquement pour les pros" },
            ]
        },
        article: {
            title: "Aide Import Articles",
            columns: [
                { name: "Désignation", required: true, desc: "Nom de l'article ou de la prestation" },
                { name: "Catégorie", required: false, desc: "'Fourniture', 'Main d'oeuvre' ou 'Engin'" },
                { name: "Unité", required: false, desc: "Ex: m2, h, U, ml..." },
                { name: "Prix_Vente", required: false, desc: "Prix de vente HT conseillé" },
                { name: "Prix_Achat", required: false, desc: "Coût de revient ou prix d'achat HT" },
            ]
        }
    }

    const { title, columns } = modalContent[type]

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-center p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
                title="Comment importer ?"
            >
                <HelpCircle size={20} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f1115] p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <HelpCircle className="text-blue-500" />
                                {title}
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-xl bg-blue-500/10 p-4 border border-blue-500/20">
                                <p className="text-sm text-blue-200">
                                    Pour importer vos données, préparez un fichier Excel (.xlsx) ou CSV respectant les colonnes ci-dessous.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Colonnes attendues</h3>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {columns.map((col, i) => (
                                        <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-white/5 border border-white/5">
                                            <div className="flex justify-between items-center">
                                                <span className="font-mono text-sm text-emerald-400 font-bold">{col.name}</span>
                                                {col.required && <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full uppercase">Requis</span>}
                                            </div>
                                            <span className="text-xs text-gray-400">{col.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10 flex justify-end">
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                >
                                    <Download size={16} />
                                    Télécharger un modèle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
