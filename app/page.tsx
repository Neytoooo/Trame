'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import Image from 'next/image'
import { CheckCircle2, ArrowRight, LayoutDashboard } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Connexion Google
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?next=/dashboard`,
        queryParams: { prompt: 'select_account' }
      },
    })
    if (error) console.error('Erreur Google:', error.message)
  }

  // Connexion Email (Pour l'instant on prépare juste le visuel)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // On ajoutera la logique Email après, testons le design d'abord
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    setLoading(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-900 p-4">

      {/* --- ARRIÈRE PLAN (Effet "Glow" animé) --- */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-500 opacity-20 blur-[100px] animate-pulse" />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-purple-500 opacity-20 blur-[100px] animate-pulse delay-1000" />

      {/* --- CONTENEUR BENTO + GLASS --- */}
      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl md:grid-cols-2">

        {/* COLONNE GAUCHE : Marketing (Visuel) */}
        <div className="relative hidden flex-col justify-between bg-white/5 p-10 md:flex">
          <div>
            <div className="mb-6 flex items-center gap-2">
              <div className="relative h-12 w-12 mr-2">
                <Image
                  src="/trame-logo.png"
                  alt="Trame Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-3xl font-bold text-white">Trame</span>
            </div>
            <h1 className="mt-8 text-4xl font-bold leading-tight text-white">
              Gérez vos chantiers <br />
              <span className="text-blue-400">sans la complexité.</span>
            </h1>
            <p className="mt-4 text-gray-400">
              L'alternative moderne à Sage Batigest. Devis, factures et suivi de chantier en temps réel, partout avec vous.
            </p>
          </div>

          <div className="space-y-4">
            {/* Petites cartes "Preuve sociale" style Bento */}
            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="font-medium text-white">Gain de temps</p>
                <p className="text-xs text-gray-400">3x plus rapide pour les devis</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
                <LayoutDashboard size={20} />
              </div>
              <div>
                <p className="font-medium text-white">Tout-en-un</p>
                <p className="text-xs text-gray-400">Clients, Ouvrages, Factures</p>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : Formulaire (Action) */}
        <div className="flex flex-col justify-center bg-white p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Bon retour parmi nous</h2>
            <p className="text-sm text-gray-500">Connectez-vous pour accéder à votre espace.</p>
          </div>

          {/* Bouton Google */}
          <button
            onClick={handleGoogleLogin}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
          >
            <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuer avec Google
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Ou avec email</span>
            </div>
          </div>

          {/* Formulaire Email classique */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email professionnel</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="nom@entreprise.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Pas encore de compte ?{' '}
            <a href="#" className="font-semibold text-blue-600 hover:text-blue-500">Nous contacter</a>
          </p>
        </div>
      </div>
    </div>
  )
}