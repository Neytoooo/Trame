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
                { Service: "Construction", Nom: 'Jean Dupont', Email: 'jean.dupont@email.com', Email_Facturation: 'facturation@dupont.fr', Telephone_Mobile: '0601020304', Telephone_Fixe: '0102030405', Type: 'Particulier', Ville: 'Paris', Adresse: '10 Rue de la Paix', CP: '75001', SIRET: '', TVA_Intracom: '' },
                { Service: "Rénovation", Nom: 'SARL Batipro', Email: 'contact@batipro.com', Email_Facturation: 'compta@batipro.com', Telephone_Mobile: '0611223344', Telephone_Fixe: '0478123456', Type: 'Professionnel', Ville: 'Lyon', Adresse: '5 Avenue des Champs', CP: '69002', SIRET: '12345678900012', TVA_Intracom: 'FR12345678901' },
                { Service: "Plomberie", Nom: 'Claire Martin', Email: 'c.martin@test.com', Email_Facturation: '', Telephone_Mobile: '0655443322', Telephone_Fixe: '', Type: 'Particulier', Ville: 'Bordeaux', Adresse: '12 Place de la Bourse', CP: '33000', SIRET: '', TVA_Intracom: '' },
                { Service: "Electricité", Nom: 'Pierre Durand', Email: 'pierre.durand@live.fr', Email_Facturation: '', Telephone_Mobile: '0788990011', Telephone_Fixe: '', Type: 'Particulier', Ville: 'Marseille', Adresse: '8 Rue Paradis', CP: '13000', SIRET: '', TVA_Intracom: '' },
                { Service: "Gros Oeuvre", Nom: 'SCI Immob', Email: 'sci.immob@orange.fr', Email_Facturation: '', Telephone_Mobile: '0612341234', Telephone_Fixe: '', Type: 'Professionnel', Ville: 'Lille', Adresse: '45 Bd de la Liberté', CP: '59000', SIRET: '98765432100055', TVA_Intracom: 'FR98765432100' },
                { Service: "Peinture", Nom: 'Sophie Lefevre', Email: 'sophie.l@gmail.com', Email_Facturation: '', Telephone_Mobile: '0699887766', Telephone_Fixe: '', Type: 'Particulier', Ville: 'Nantes', Adresse: '22 Rue Crébillon', CP: '44000', SIRET: '', TVA_Intracom: '' },
                { Service: "Carrelage", Nom: 'EURL SoluSols', Email: 'contact@solusols.fr', Email_Facturation: '', Telephone_Mobile: '0644332211', Telephone_Fixe: '0240123456', Type: 'Professionnel', Ville: 'Rennes', Adresse: '10 Rue de la Monnaie', CP: '35000', SIRET: '11223344500099', TVA_Intracom: 'FR11223344500' },
                { Service: "Menuiserie", Nom: 'Lucas Robert', Email: 'l.robert@outlook.com', Email_Facturation: '', Telephone_Mobile: '0677889900', Telephone_Fixe: '', Type: 'Particulier', Ville: 'Strasbourg', Adresse: '5 Quai des Bateliers', CP: '67000', SIRET: '', TVA_Intracom: '' },
                { Service: "Cuisine", Nom: 'Emma Thomas', Email: 'emma.thomas@yahoo.fr', Email_Facturation: '', Telephone_Mobile: '0622334455', Telephone_Fixe: '', Type: 'Particulier', Ville: 'Toulouse', Adresse: '3 Place du Capitole', CP: '31000', SIRET: '', TVA_Intracom: '' },
                { Service: "SDB", Nom: 'Hotel du Parc', Email: 'direction@hotelduparc.com', Email_Facturation: 'factures@hotelduparc.com', Telephone_Mobile: '0600110011', Telephone_Fixe: '0493123456', Type: 'Professionnel', Ville: 'Nice', Adresse: '1 Promenade des Anglais', CP: '06000', SIRET: '55667788900012', TVA_Intracom: 'FR55667788901' },
                { Service: "Maçonnerie", Nom: 'Louis Petit', Email: 'louis.petit@free.fr', Email_Facturation: '', Telephone_Mobile: '0688776655', Telephone_Fixe: '', Type: 'Particulier', Ville: 'Montpellier', Adresse: '8 Rue Foch', CP: '34000', SIRET: '', TVA_Intracom: '' },
                { Service: "Charpente", Nom: 'Mme Garcia', Email: 'garcia.m@hotmail.com', Email_Facturation: '', Telephone_Mobile: '0633445566', Telephone_Fixe: '', Type: 'Particulier', Ville: 'Grenoble', Adresse: '15 Bd Gambetta', CP: '38000', SIRET: '', TVA_Intracom: '' },
                { Service: "Climatisation", Nom: 'Resto Le Gourmet', Email: 'chef@legourmet.fr', Email_Facturation: '', Telephone_Mobile: '0611002200', Telephone_Fixe: '', Type: 'Professionnel', Ville: 'Dijon', Adresse: '2 Rue de la Liberté', CP: '21000', SIRET: '99887766500033', TVA_Intracom: 'FR99887766500' },
                { Service: "Isolation", Nom: 'Paul Simon', Email: 'psimon@gmail.com', Email_Facturation: '', Telephone_Mobile: '0655667788', Telephone_Fixe: '', Type: 'Particulier', Ville: 'Angers', Adresse: '9 Place du Ralliement', CP: '49000', SIRET: '', TVA_Intracom: '' },
                { Service: "Démolition", Nom: 'Copropriété Les Oliviers', Email: 'syndic@lesoliviers.com', Email_Facturation: '', Telephone_Mobile: '', Telephone_Fixe: '0490123456', Type: 'Professionnel', Ville: 'Avignon', Adresse: '12 Rue de la République', CP: '84000', SIRET: '12312312300045', TVA_Intracom: '' },
            ]
            filename = 'modele_import_clients.xlsx'
        } else {
            data = [
                { Reference: "PLA001", Designation: 'Plaque BA13 Standard 250x120', Categorie: 'Fourniture', Unite: 'm2', Prix_Vente: 8.50, Prix_Achat: 3.20, TVA: 20, Stock: 500, Seuil_Alerte: 50, Fournisseur: "Point.P" },
                { Reference: "RAIL48", Designation: 'Rail R48 3m', Categorie: 'Fourniture', Unite: 'ml', Prix_Vente: 4.20, Prix_Achat: 1.80, TVA: 20, Stock: 200, Seuil_Alerte: 30, Fournisseur: "Point.P" },
                { Reference: "MONT48", Designation: 'Montant M48 3m', Categorie: 'Fourniture', Unite: 'ml', Prix_Vente: 5.50, Prix_Achat: 2.50, TVA: 20, Stock: 200, Seuil_Alerte: 30, Fournisseur: "Point.P" },
                { Reference: "PEINT01", Designation: 'Peinture Blanche Mat (Fût 15L)', Categorie: 'Fourniture', Unite: 'U', Prix_Vente: 145.00, Prix_Achat: 85.00, TVA: 20, Stock: 20, Seuil_Alerte: 5, Fournisseur: "Seigneurie" },
                { Reference: "ELEC_DISJ", Designation: 'Disjoncteur 16A Ph/N', Categorie: 'Fourniture', Unite: 'U', Prix_Vente: 18.00, Prix_Achat: 8.50, TVA: 20, Stock: 50, Seuil_Alerte: 10, Fournisseur: "Rexel" },
                { Reference: "ELEC_PRI", Designation: 'Prise de courant 2P+T Blanche', Categorie: 'Fourniture', Unite: 'U', Prix_Vente: 12.00, Prix_Achat: 4.50, TVA: 20, Stock: 100, Seuil_Alerte: 20, Fournisseur: "Rexel" },
                { Reference: "CABLE_3G25", Designation: 'Cable RO2V 3G2.5', Categorie: 'Fourniture', Unite: 'ml', Prix_Vente: 2.20, Prix_Achat: 0.90, TVA: 20, Stock: 500, Seuil_Alerte: 100, Fournisseur: "Rexel" },
                { Reference: "MO_PEINT", Designation: 'Main d\'oeuvre Peintre', Categorie: 'Main d\'oeuvre', Unite: 'h', Prix_Vente: 45.00, Prix_Achat: 0, TVA: 10, Stock: 0, Seuil_Alerte: 0, Fournisseur: "Interne" },
                { Reference: "MO_ELEC", Designation: 'Main d\'oeuvre Electricien', Categorie: 'Main d\'oeuvre', Unite: 'h', Prix_Vente: 55.00, Prix_Achat: 0, TVA: 10, Stock: 0, Seuil_Alerte: 0, Fournisseur: "Interne" },
                { Reference: "MO_PLOMB", Designation: 'Main d\'oeuvre Plombier', Categorie: 'Main d\'oeuvre', Unite: 'h', Prix_Vente: 55.00, Prix_Achat: 0, TVA: 10, Stock: 0, Seuil_Alerte: 0, Fournisseur: "Interne" },
                { Reference: "LOC_MINI", Designation: 'Location Minipelle 1.8T', Categorie: 'Engin', Unite: 'j', Prix_Vente: 350.00, Prix_Achat: 220.00, TVA: 20, Stock: 0, Seuil_Alerte: 0, Fournisseur: "Kiloutou" },
                { Reference: "CIM_35", Designation: 'Sac Ciment 35kg', Categorie: 'Fourniture', Unite: 'U', Prix_Vente: 12.50, Prix_Achat: 7.20, TVA: 20, Stock: 40, Seuil_Alerte: 10, Fournisseur: "Point.P" },
                { Reference: "SABLE_BB", Designation: 'Sable 0/4 BigBag 1T', Categorie: 'Fourniture', Unite: 'U', Prix_Vente: 85.00, Prix_Achat: 55.00, TVA: 20, Stock: 5, Seuil_Alerte: 1, Fournisseur: "Point.P" },
                { Reference: "PARP_20", Designation: 'Parpaing Creux 20x20x50', Categorie: 'Fourniture', Unite: 'U', Prix_Vente: 2.30, Prix_Achat: 1.15, TVA: 20, Stock: 400, Seuil_Alerte: 50, Fournisseur: "Point.P" },
                { Reference: "DEP_50", Designation: 'Forfait Deplacement < 50km', Categorie: 'Fourniture', Unite: 'U', Prix_Vente: 65.00, Prix_Achat: 15.00, TVA: 20, Stock: 0, Seuil_Alerte: 0, Fournisseur: "Interne" },
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
                { name: "Email", required: false, desc: "Adresse email de contact principal" },
                { name: "Email_Facturation", required: false, desc: "Si différent de l'email principal" },
                { name: "Telephone_Mobile", required: false, desc: "Numéro de portable" },
                { name: "Telephone_Fixe", required: false, desc: "Numéro de ligne fixe" },
                { name: "Type", required: false, desc: "'Particulier' ou 'Professionnel'" },
                { name: "Ville", required: false, desc: "Ville de l'adresse de facturation" },
                { name: "Adresse", required: false, desc: "Numéro et rue" },
                { name: "CP", required: false, desc: "Code Postal" },
                { name: "SIRET", required: false, desc: "Obligatoire pour les Professionnels" },
                { name: "TVA_Intracom", required: false, desc: "Pour les factures intracommunautaires" },
            ]
        },
        article: {
            title: "Aide Import Articles",
            columns: [
                { name: "Reference", required: false, desc: "Référence unique interne ou fournisseur" },
                { name: "Designation", required: true, desc: "Nom de l'article ou de la prestation" },
                { name: "Categorie", required: false, desc: "'Fourniture', 'Main d'oeuvre' ou 'Engin'" },
                { name: "Unite", required: false, desc: "Unité de vente (m2, h, U, ml...)" },
                { name: "Prix_Vente", required: false, desc: "Prix de vente unitaire HT conseillé" },
                { name: "Prix_Achat", required: false, desc: "Coût de revient ou prix d'achat HT" },
                { name: "TVA", required: false, desc: "Taux de TVA par défaut (20, 10, 5.5)" },
                { name: "Stock", required: false, desc: "Quantité initiale en stock" },
                { name: "Seuil_Alerte", required: false, desc: "Seuil minimal avant alerte stock" },
                { name: "Fournisseur", required: false, desc: "Nom du fournisseur principal" },
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
