import { getCachedUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TopPillNavbar from '@/components/dashboard/TopPillNavbar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCachedUser()

    if (!user) {
        redirect('/')
    }

    return (
        <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden font-sans transition-colors duration-200">
            {/* --- BESPOKE SAAS AMBIENT BACKGROUND (0 noise, ultra clean) --- */}
            {/* Top soft ambient light */}
            <div className="fixed top-0 inset-x-0 h-[480px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.07),transparent_70%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.16),transparent_70%)] pointer-events-none z-0" />
            
            {/* Very subtle architectural dot grid */}
            <div 
                className="fixed inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.12] z-0" 
                style={{
                    backgroundImage: 'radial-gradient(#94A3B8 0.75px, transparent 0.75px)',
                    backgroundSize: '24px 24px'
                }} 
            />

            {/* --- TOP FLOATING PILL NAVBAR --- */}
            <TopPillNavbar user={user} />

            {/* --- MAIN WORKSPACE CONTAINER --- */}
            <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6">
                {children}
            </main>
        </div>
    )
}
