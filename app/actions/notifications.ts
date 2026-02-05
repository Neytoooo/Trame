'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getNotifications() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return data || []
}

export async function markAsRead(id: string) {
    const supabase = await createClient()

    await supabase.from('notifications').update({ status: 'read' }).eq('id', id)

    revalidatePath('/dashboard/annonces')
}

export async function createNotification(type: string, title: string, message: string, data: any = {}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from('notifications').insert({
        user_id: user.id,
        type,
        title,
        message,
        data
    })

    revalidatePath('/dashboard/annonces')
}

export async function confirmOrder(notificationId: string, articleId: string, quantity: number) {
    const supabase = await createClient()

    // 1. Get current stock
    const { data: article, error: fetchError } = await supabase
        .from('articles')
        .select('stock')
        .eq('id', articleId)
        .single()

    if (fetchError || !article) {
        console.error("Error fetching article stock", fetchError)
        return { success: false, message: "Article introuvable" }
    }

    // 2. Increment stock
    const newStock = (article.stock || 0) + quantity

    const { error: updateError } = await supabase
        .from('articles')
        .update({ stock: newStock })
        .eq('id', articleId)

    if (updateError) {
        console.error("Error updating stock", updateError)
        return { success: false, message: "Erreur mise à jour stock" }
    }

    // 3. Archive notification
    await supabase.from('notifications').update({ status: 'archived' }).eq('id', notificationId)

    revalidatePath('/dashboard/annonces')
    revalidatePath('/dashboard/articles')

    return { success: true }
}
