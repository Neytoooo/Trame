import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    const supabase = await createClient()

    // Sign out logic
    await supabase.auth.signOut()

    // Redirect to login page
    return NextResponse.redirect(new URL('/', req.url), {
        status: 302,
    })
}
