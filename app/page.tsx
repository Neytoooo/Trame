'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { CheckCircle2, ArrowRight, LayoutDashboard, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { checkEmailWhitelistedAction } from '@/app/actions/users'
import InteractiveDotGrid from '@/components/ui/InteractiveDotGrid'
import KotaSignatureLogo from '@/components/ui/KotaSignatureLogo'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)

  // Détecter les erreurs d'authentification dans l'URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const error = params.get('error')
      if (error === 'auth_failed') {
        setAuthError("Échec de l'authentification. Veuillez réessayer.")
      } else if (error === 'no_code') {
        setAuthError("Erreur de redirection. Vérifiez vos URLs dans Supabase.")
      } else if (error === 'unauthorized_email') {
        setAuthError("Accès restreint : Votre adresse email n'est pas autorisée sur cette application. Contactez votre administrateur pour recevoir une invitation.")
      }
    }
  }, [])

  // Connexion Google
  const handleGoogleLogin = async () => {
    setAuthError(null)
    console.log('🚀 Tentative de connexion Google...')
    console.log('📍 URL actuelle:', window.location.origin)

    const redirectUrl = `${window.location.origin}/auth/callback`
    console.log('🔗 Redirect URL configurée:', redirectUrl)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (error) {
      console.error('❌ Erreur lors de signInWithOAuth:', error)
      setAuthError(`Erreur OAuth: ${error.message}`)
    } else {
      console.log('✅ Redirection OAuth initiée', data)
    }
  }

  // Connexion Email
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError(null)

    // Vérification de la whitelist en amont
    try {
      const whitelistCheck = await checkEmailWhitelistedAction(email)
      if (!whitelistCheck.isWhitelisted) {
        setAuthError(whitelistCheck.message || "Cette adresse email n'est pas autorisée sur cet espace d'entreprise.")
        setLoading(false)
        return
      }
    } catch (err) {
      console.warn('Vérification whitelist ignorée:', err)
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setAuthError(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : error.message)
      setLoading(false)
    } else {
      router.refresh()
      router.push('/dashboard')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060A10] p-4">

      {/* --- ARRIÈRE-PLAN INTERACTIF : GRILLE DE POINTS ARCHITECTURALE AVEC RÉACTION SOURIS --- */}
      <InteractiveDotGrid />

      {/* --- CONTENEUR PRINCIPAL --- */}
      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-white/[0.08] shadow-[0_0_80px_rgba(0,0,0,0.6)] md:grid-cols-2 backdrop-blur-xs">

        {/* COLONNE GAUCHE : Marketing (Visuel) */}
        <div className="relative hidden flex-col justify-between bg-[#0B0F17]/95 p-10 md:flex border-r border-white/[0.04]">
          <div className="relative">
            {/* Brand Header KOTA : Tracé Cinétique Signature + Lockup Typographique */}
            <div className="mb-10">
              <KotaSignatureLogo />
            </div>

            <div className="mt-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                ✦ Alternative moderne à Sage Batigest & Obat
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.15] tracking-tight text-white">
                Gérez vos chantiers <br />
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  sans la complexité.
                </span>
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-400">
                Devis IA, factures et suivi d'équipe en temps réel avec KOTA.
              </p>
            </div>
          </div>

          <div className="relative space-y-3">
            <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur-sm transition-all hover:border-white/[0.12] hover:bg-white/[0.07]">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Gain de temps</p>
                <p className="text-xs text-gray-500">3x plus rapide pour les devis</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur-sm transition-all hover:border-white/[0.12] hover:bg-white/[0.07]">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                <LayoutDashboard size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Tout-en-un</p>
                <p className="text-xs text-gray-500">Clients, Ouvrages, Factures</p>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : Formulaire (Action) */}
        <div className="flex flex-col justify-center bg-[#111827] p-8 md:p-12">
          {/* Logo KOTA visible uniquement sur mobile avec Lockup Signature */}
          <div className="mb-6 flex items-center justify-center md:hidden">
            <KotaSignatureLogo showTagline={false} />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white">Bon retour parmi nous</h2>
            <p className="mt-1 text-sm text-gray-400">Connectez-vous pour accéder à votre espace d'entreprise.</p>
          </div>

          {/* Message d'erreur d'authentification ou whitelist */}
          {authError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 animate-in fade-in duration-200">
              <ShieldAlert className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed font-medium">{authError}</p>
            </div>
          )}

          {/* Bouton Google */}
          <button
            onClick={handleGoogleLogin}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-3 text-sm font-medium text-gray-200 transition-all hover:border-white/[0.18] hover:bg-white/[0.1] active:scale-[0.98] cursor-pointer"
          >
            <svg className="h-5 w-5 flex-shrink-0" aria-hidden="true" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuer avec Google
          </button>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#111827] px-3 text-gray-500 uppercase tracking-widest">Ou avec email</span>
            </div>
          </div>

          {/* Formulaire Email classique */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">Email professionnel</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-blue-500/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-blue-500/20"
                placeholder="nom@entreprise.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-blue-500/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-blue-500/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-500">
            Plateforme à accès restreint. Les comptes doivent être préalablement enregistrés par un administrateur.
          </p>
        </div>
      </div>
    </div>
  )
}
