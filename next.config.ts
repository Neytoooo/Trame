import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/articles', destination: '/dashboard/articles', permanent: false },
      { source: '/annonces', destination: '/dashboard/annonces', permanent: false },
      { source: '/clients', destination: '/dashboard/clients', permanent: false },
      { source: '/chantiers', destination: '/dashboard/chantiers', permanent: false },
      { source: '/devis', destination: '/dashboard/devis', permanent: false },
      { source: '/factures', destination: '/dashboard/factures', permanent: false },
      { source: '/taches', destination: '/dashboard/trello', permanent: false },
      { source: '/dashboard/taches', destination: '/dashboard/trello', permanent: false },
      { source: '/planning', destination: '/dashboard/planning', permanent: false },
    ];
  },
};

export default nextConfig;
