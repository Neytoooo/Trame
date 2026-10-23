import { getCachedUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUserRoleAction, getAuthorizedUsersAction } from '@/app/actions/users'
import UsersManagementClient from '@/components/utilisateurs/UsersManagementClient'

export const dynamic = 'force-dynamic'

export default async function UtilisateursPage() {
    const user = await getCachedUser()

    if (!user || !user.email) {
        redirect('/')
    }

    // 1. SÉCURITÉ STRICTE : Seul l'administrateur peut accéder à cette page
    const userRole = await getCurrentUserRoleAction(user.email)
    if (!userRole.isAdmin) {
        redirect('/dashboard')
    }

    // 2. Récupérer la liste des utilisateurs autorisés
    const usersRes = await getAuthorizedUsersAction()

    return (
        <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-200">
            <UsersManagementClient
                initialUsers={usersRes.users || []}
                currentUserEmail={user.email}
                isTableMissing={usersRes.isTableMissing || false}
            />
        </div>
    )
}
