export const getURL = () => {
    // 1. Si on est en local (dev), on force localhost
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:3000/'
    }

    // 2. Sinon (Prod/Preview), on cherche les variables Vercel
    let url =
        process?.env?.NEXT_PUBLIC_SITE_URL ?? // Défini manuellement dans Vercel
        process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatique sur Vercel
        'http://localhost:3000/';

    // S'assurer d'inclure https:// et enlever le slash final
    url = url.includes('http') ? url : `https://${url}`;
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
    return url;
};
