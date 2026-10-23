'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { importClientsAction, ClientData } from '@/app/actions/clients'

interface ClientImportModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function ClientImportModal({ isOpen, onClose }: ClientImportModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [parsedData, setParsedData] = useState<ClientData[]>([])
    const [error, setError] = useState<string | null>(null)
    const [successCount, setSuccessCount] = useState<number | null>(null)

    if (!isOpen) return null

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            parseFile(e.target.files[0])
        }
    }

    const parseFile = async (file: File) => {
        setIsAnalyzing(true)
        setError(null)
        setSuccessCount(null)
        setParsedData([])

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: 'binary' })
                const sheetName = workbook.SheetNames[0]
                const sheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(sheet)

                const clients: ClientData[] = jsonData.map((row: any) => ({
                    name: row['name'] || row['Name'] || row['Nom'] || row['Nom complet'] || 'Nom Inconnu',
                    type: (row['type'] || row['Type'] || '').toLowerCase().includes('pro') ? 'professionnel' : 'particulier',
                    email: row['email'] || row['Email'] || row['E-mail'] || row['Mail'],
                    billing_email: row['billing_email'] || row['Email_Facturation'] || row['Email Facturation'],
                    phone_mobile: row['phone_mobile'] || row['Telephone_Mobile'] || row['Téléphone Mobile'] || row['Tel'],
                    phone_fixe: row['phone_fixe'] || row['Telephone_Fixe'] || row['Téléphone Fixe'] || row['Fixe'],
                    city: row['city'] || row['Ville'] || row['City'],
                    address_line1: row['address_line1'] || row['Adresse'] || row['Address'],
                    address_line2: row['address_line2'] || row['Adresse 2'] || row['Complément'],
                    zip_code: row['zip_code'] || row['Code Postal'] || row['CP'] || row['Zip'],
                    siret: row['siret'] || row['SIRET'] || row['Siret'],
                    iban: row['iban'] || row['IBAN'] || row['Iban'],
                    tva_number: row['tva_number'] || row['TVA_Intracom'] || row['TVA']
                }))

                if (clients.length === 0) {
                    setError("Aucun client trouvé dans le fichier. Vérifiez les entêtes de colonnes (Nom, Email, etc.).")
                } else {
                    setParsedData(clients)
                }
            } catch (err) {
                console.error(err)
                setError("Erreur lors de la lecture du fichier. Assurez-vous qu'il s'agit d'un fichier Excel ou CSV valide.")
            } finally {
                setIsAnalyzing(false)
            }
        }
        reader.readAsBinaryString(file)
    }

    const handleImport = async () => {
        if (parsedData.length === 0) return

        setIsImporting(true)
        const res = await importClientsAction(parsedData)
        setIsImporting(false)

        if (res.success) {
            setSuccessCount(res.count || 0)
            setFile(null)
            setParsedData([])
            setTimeout(() => {
                onClose()
                setSuccessCount(null)
            }, 2000)
        } else {
            setError(res.error || "Une erreur est survenue lors de l'import.")
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[#0B101B]/95 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-in zoom-in-95 duration-200 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Importer des clients</h2>
                            <p className="text-xs text-slate-400">Import en masse via fichier Excel ou CSV</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Zone de drop / upload */}
                    {!successCount && (
                        <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-8 transition-all hover:border-violet-500/60 hover:bg-violet-500/[0.04] group cursor-pointer">
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileChange}
                                className="absolute inset-0 cursor-pointer opacity-0"
                            />
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-violet-400 group-hover:scale-110 transition-transform">
                                <Upload size={22} />
                            </div>
                            <p className="text-sm font-semibold text-white">
                                {file ? file.name : "Cliquez ou glissez un fichier Excel / CSV"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Formats acceptés : .xlsx, .xls, .csv
                            </p>
                        </div>
                    )}

                    {/* État Analyse */}
                    {isAnalyzing && (
                        <div className="flex items-center justify-center py-4 text-xs font-semibold text-violet-400 gap-2">
                            <Loader2 className="animate-spin" size={16} />
                            <span>Analyse et mapping des colonnes...</span>
                        </div>
                    )}

                    {/* Aperçu / Résultat */}
                    {parsedData.length > 0 && !isImporting && !successCount && (
                        <div className="rounded-2xl bg-emerald-500/10 p-4 border border-emerald-500/20">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="mt-0.5 text-emerald-400 shrink-0" size={18} />
                                <div>
                                    <h3 className="font-semibold text-xs uppercase tracking-wider text-emerald-300">Fichier validé</h3>
                                    <p className="text-xs text-emerald-200/80 mt-1">
                                        <span className="font-bold text-white">{parsedData.length} clients</span> prêts à être importés dans votre carnet.
                                    </p>
                                    <div className="mt-2 text-[11px] text-emerald-300/80">
                                        Colonnes : Nom, Email, Type, Téléphone, Ville, SIRET, IBAN
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Succès */}
                    {successCount !== null && (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 size={30} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Import réussi !</h3>
                            <p className="text-xs text-slate-400 mt-1">{successCount} clients ont été ajoutés.</p>
                        </div>
                    )}

                    {/* Erreur */}
                    {error && (
                        <div className="flex items-start gap-2.5 rounded-2xl bg-rose-500/10 p-4 border border-rose-500/20">
                            <AlertCircle className="mt-0.5 text-rose-400 shrink-0" size={16} />
                            <p className="text-xs font-medium text-rose-300">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    {!successCount && (
                        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={parsedData.length === 0 || isImporting}
                                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-2.5 text-xs font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={15} />
                                        <span>Import en cours...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={15} />
                                        <span>Importer {parsedData.length > 0 && `(${parsedData.length})`}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
