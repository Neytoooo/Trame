import { getCompanySettings } from '@/app/actions/settings'
import CompanySettingsClient from '@/components/settings/CompanySettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const settings = await getCompanySettings()

    return <CompanySettingsClient initialSettings={settings} />
}
