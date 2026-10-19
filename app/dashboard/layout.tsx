import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TopPillNavbar from '@/components/dashboard/TopPillNavbar'
import ArchitecturalWave from '@/components/dashboard/ArchitecturalWave'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
    }

    return (
        <div className="relative min-h-screen bg-[#EEF3F8] text-slate-800 antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden font-sans">
            {/* --- 3D ARCHITECTURAL WAVE ACCENT --- */}
            <ArchitecturalWave />

            {/* --- TOP FLOATING PILL NAVBAR --- */}
            <TopPillNavbar user={user} />

            {/* --- MAIN WORKSPACE CONTAINER --- */}
            <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-4">
                {children}
            </main>
        </div>
    )
}
