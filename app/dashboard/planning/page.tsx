import TechnicianSchedule from '@/components/planning/TechnicianSchedule'
import { getPlanningDataAction } from '@/app/actions/planning'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Planning des Interventions & Chantiers | KOTA',
    description: 'Planning hebdomadaire des interventions par technicien et zone géographique synchronisé en temps réel.'
}

export default async function PlanningPage() {
    const data = await getPlanningDataAction()

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <TechnicianSchedule
                initialInterventions={data.interventions}
                chantiersList={data.chantiers}
                teamMembersList={data.teamMembers}
            />
        </div>
    )
}
