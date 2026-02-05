import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'

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
        <div className="relative flex h-screen overflow-hidden bg-slate-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">

            {/* --- FOND ANIMÉ (Global pour tout le dashboard) --- */}
            <div className="hidden dark:block fixed -left-20 -top-20 h-96 w-96 rounded-full bg-blue-600 opacity-20 blur-[100px] animate-pulse" />
            <div className="hidden dark:block fixed top-1/2 right-0 h-96 w-96 rounded-full bg-purple-600 opacity-10 blur-[100px] animate-pulse delay-1000" />
            <div className="hidden dark:block fixed bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-500 opacity-10 blur-[100px]" />

            {/* --- SIDEBAR --- */}
            <Sidebar user={user} />

            {/* --- CONTENU PRINCIPAL --- */}
            <main className="relative z-10 flex-1 overflow-y-auto">
                <div className="min-h-full p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
