'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
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

                // Mapping intelligent des colonnes (supporte les noms techniques et français)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1A1A1A] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/5 p-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FileSpreadsheet className="text-green-400" size={20} />
                        Importer des clients
                    </h2>
                    <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Zone de drop / upload */}
                    {!successCount && (
                        <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-8 transition-all hover:border-blue-500/50 hover:bg-blue-500/5">
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileChange}
                                className="absolute inset-0 cursor-pointer opacity-0"
                            />
                            <Upload className="mb-4 text-blue-400" size={32} />
                            <p className="text-sm font-medium text-white">
                                {file ? file.name : "Cliquez ou glissez un fichier ici"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Supporte .xlsx, .csv
                            </p>
                        </div>
                    )}

                    {/* État Analyse */}
                    {isAnalyzing && (
                        <div className="flex items-center justify-center py-4 text-sm text-blue-400">
                            <Loader2 className="mr-2 animate-spin" size={16} />
                            Analyse du fichier...
                        </div>
                    )}

                    {/* Aperçu / Résultat */}
                    {parsedData.length > 0 && !isImporting && !successCount && (
                        <div className="rounded-xl bg-blue-500/10 p-4 border border-blue-500/20">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="mt-0.5 text-blue-400" size={18} />
                                <div>
                                    <h3 className="font-medium text-blue-400">Fichier valide</h3>
                                    <p className="text-sm text-blue-200/70 mt-1">
                                        {parsedData.length} clients détectés prêtes à être importés.
                                    </p>
                                    <div className="mt-2 text-xs text-blue-300 space-y-1">
                                        <p>Colonnes détectées : Nom, Email, Type, Tel, Ville, SIRET, IBAN...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Succès */}
                    {successCount !== null && (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Import réussi !</h3>
                            <p className="text-gray-400">{successCount} clients ont été ajoutés.</p>
                        </div>
                    )}

                    {/* Erreur */}
                    {error && (
                        <div className="flex items-start gap-3 rounded-xl bg-red-500/10 p-4 border border-red-500/20">
                            <AlertCircle className="mt-0.5 text-red-400" size={18} />
                            <p className="text-sm text-red-200">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    {!successCount && (
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleImport}
                                disabled={parsedData.length === 0 || isImporting}
                                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Import en cours...
                                    </>
                                ) : (
                                    <>
                                        Importer {parsedData.length > 0 && `(${parsedData.length})`}
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
