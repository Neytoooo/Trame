import { NextResponse } from 'next/server'
import { seedProBtpDataAction } from '@/app/actions/seed_pro_data'

export async function GET() {
    const res = await seedProBtpDataAction()
    return NextResponse.json(res)
}

export async function POST() {
    const res = await seedProBtpDataAction()
    return NextResponse.json(res)
}
