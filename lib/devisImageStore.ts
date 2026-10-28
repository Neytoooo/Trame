import fs from 'fs'
import path from 'path'

const DEVIS_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'devis')

function ensureDevisUploadsDir() {
    if (!fs.existsSync(DEVIS_UPLOADS_DIR)) {
        fs.mkdirSync(DEVIS_UPLOADS_DIR, { recursive: true })
    }
}

/**
 * Crée une copie indépendante et permanente d'une photo pour un devis.
 * Même si la photo originale du Dépôt est supprimée du Dépôt, le devis
 * conserve sa propre copie intacte dans /uploads/devis/.
 */
export async function createDevisPhotoCopy(imageUrl: string, devisId: string): Promise<string> {
    try {
        ensureDevisUploadsDir()

        const ext = '.jpg'
        const safeDevisId = (devisId || 'devis').replace(/[^a-zA-Z0-9_-]/g, '_')
        const fileName = `devis-${safeDevisId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${ext}`
        const targetPath = path.join(DEVIS_UPLOADS_DIR, fileName)
        const targetUrl = `/uploads/devis/${fileName}`

        // 1. Si c'est un fichier local sur le serveur (ex: /uploads/depot/photo-xyz.jpg)
        if (imageUrl.startsWith('/uploads/')) {
            const cleanRelative = imageUrl.replace(/^\//, '').replace(/\//g, path.sep)
            const sourcePath = path.join(process.cwd(), 'public', cleanRelative)
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, targetPath)
                return targetUrl
            }
        }

        // 2. Si c'est du base64
        if (imageUrl.startsWith('data:image/')) {
            const cleaned = imageUrl.replace(/^data:image\/\w+;base64,/, '').trim()
            const buffer = Buffer.from(cleaned, 'base64')
            fs.writeFileSync(targetPath, buffer)
            return targetUrl
        }

        // 3. Si c'est une URL distante HTTP/HTTPS
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            try {
                const res = await fetch(imageUrl)
                if (res.ok) {
                    const arrayBuffer = await res.arrayBuffer()
                    fs.writeFileSync(targetPath, Buffer.from(arrayBuffer))
                    return targetUrl
                }
            } catch {
                // Fallback
            }
        }

        return imageUrl
    } catch (e) {
        console.error('Erreur createDevisPhotoCopy:', e)
        return imageUrl
    }
}
