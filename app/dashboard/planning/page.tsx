import TechnicianSchedule from '@/components/planning/TechnicianSchedule'

export const metadata = {
    title: 'Planning des Techniciens & Chantiers | Trame',
    description: 'Planning hebdomadaire des interventions par technicien et zone géographique.'
}

export default function PlanningPage() {
    return (
        <div className="space-y-6">
            <TechnicianSchedule />
        </div>
    )
}
