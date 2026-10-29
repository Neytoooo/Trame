const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENV_TS_PATH = path.join(__dirname, '..', 'Kota_Mobile', 'src', 'config', 'env.ts');
const SETTINGS_TS_PATH = path.join(__dirname, '..', 'Kota_Mobile', 'src', 'screens', 'SettingsScreen.tsx');
const TUNNEL_URL_FILE = path.join(__dirname, '..', 'data', 'tunnel_url.txt');
const CLOUD_SYNC_TOPIC = 'kota_btp_tunnel_sync_7f8a92';

let lastKnownUrl = null;

async function publishToCloud(url) {
    if (!url || !url.startsWith('https://')) return;
    try {
        const res = await fetch(`https://ntfy.sh/${CLOUD_SYNC_TOPIC}`, {
            method: 'POST',
            body: url,
            headers: {
                'Title': 'KOTA Tunnel Actif',
                'Priority': 'default',
                'Tags': 'rocket,mobile'
            }
        });
        if (res.ok) {
            console.log(`[TUNNEL] 📡 Publié automatiquement sur le canal cloud ntfy.sh : ${url}`);
        }
    } catch (err) {
        console.warn(`[TUNNEL] ⚠️ Erreur lors de la publication cloud :`, err.message);
    }
}

function updateConfigFiles(newUrl) {
    if (!newUrl || newUrl === lastKnownUrl) return;
    lastKnownUrl = newUrl;
    console.log(`[TUNNEL] 🚀 Nouvelle URL détectée : ${newUrl}`);

    try {
        if (!fs.existsSync(path.dirname(TUNNEL_URL_FILE))) {
            fs.mkdirSync(path.dirname(TUNNEL_URL_FILE), { recursive: true });
        }
        fs.writeFileSync(TUNNEL_URL_FILE, newUrl, 'utf8');

        // 1. Update env.ts
        if (fs.existsSync(ENV_TS_PATH)) {
            let content = fs.readFileSync(ENV_TS_PATH, 'utf8');
            content = content.replace(/export const ACTIVE_TUNNEL_URL = 'https:\/\/[a-z0-9]+\.lhr\.life'/g, `export const ACTIVE_TUNNEL_URL = '${newUrl}'`);
            fs.writeFileSync(ENV_TS_PATH, content, 'utf8');
            console.log(`[TUNNEL] ✅ Mis à jour dans Kota_Mobile/src/config/env.ts`);
        }

        // 2. Update SettingsScreen.tsx
        if (fs.existsSync(SETTINGS_TS_PATH)) {
            let content = fs.readFileSync(SETTINGS_TS_PATH, 'utf8');
            content = content.replace(/https:\/\/[a-z0-9]+\.lhr\.life/g, newUrl);
            fs.writeFileSync(SETTINGS_TS_PATH, content, 'utf8');
            console.log(`[TUNNEL] ✅ Mis à jour dans Kota_Mobile/src/screens/SettingsScreen.tsx`);
        }

        // 3. Publier vers le cloud pour que le smartphone récupère l'adresse instantanément
        publishToCloud(newUrl);
    } catch (err) {
        console.error('[TUNNEL] ❌ Erreur lors de la mise à jour des configs:', err);
    }
}

// Heartbeat pour garder la valeur fraîche dans le relais cloud
setInterval(() => {
    if (lastKnownUrl) {
        publishToCloud(lastKnownUrl);
    }
}, 2 * 60 * 1000);

function startTunnel() {
    console.log('[TUNNEL] Démarrage de la connexion SSH localhost.run avec auto-reconnect...');
    const child = spawn('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'ServerAliveInterval=15',
        '-o', 'ServerAliveCountMax=3',
        '-R', '80:localhost:3000',
        'nokey@localhost.run'
    ], {
        stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        const match = text.match(/https:\/\/[a-z0-9]+\.lhr\.life/);
        if (match && match[0]) {
            updateConfigFiles(match[0]);
        }
    });

    child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        const match = text.match(/https:\/\/[a-z0-9]+\.lhr\.life/);
        if (match && match[0]) {
            updateConfigFiles(match[0]);
        }
    });

    child.on('close', (code) => {
        console.warn(`[TUNNEL] ⚠️ Déconnexion du tunnel (code ${code}). Reconnexion dans 3 secondes...`);
        setTimeout(startTunnel, 3000);
    });

    child.on('error', (err) => {
        console.error('[TUNNEL] ❌ Erreur processus tunnel:', err);
        setTimeout(startTunnel, 5000);
    });
}

startTunnel();
