export const getURL = () => {
    let url =
        process?.env?.NEXT_PUBLIC_SITE_URL ?? // Défini manuellement dans Vercel
        process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatique sur Vercel
        'http://localhost:3000/';

    // IMPORTANT: Si on est côté client, on utilise l'URL actuelle du navigateur
    // Cela permet de supporter les Preview URLs et les domaines alias (ex: trame-kohl.vercel.app)
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
        url = window.location.origin
    }

    // S'assurer d'inclure https:// (sauf localhost) et enlever le slash final
    url = url.includes('http') ? url : `https://${url}`;
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;

    return url;
};
