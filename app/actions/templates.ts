'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveTemplate(name: string, description: string, nodes: any[], edges: any[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Non connecté" }

    const { data, error } = await supabase
        .from('chantier_templates')
        .insert({
            name,
            description,
            nodes,
            edges,
            is_public: false // User templates are private by default or public? Let's say private/globally visible based on RLS for now.
        })
        .select()
        .single()

    if (error) {
        console.error("Save Template Error:", error)
        return { error: "Erreur lors de la sauvegarde du modèle" }
    }

    return { success: true, data }
}

export async function getTemplates() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('chantier_templates')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Get Templates Error:", error)
        return { error: "Impossible de récupérer les modèles" }
    }

    return { data }
}

export async function loadTemplate(chantierId: string, templateId: string) {
    const supabase = await createClient()

    // 1. Fetch Template
    const { data: template, error: templateError } = await supabase
        .from('chantier_templates')
        .select('*')
        .eq('id', templateId)
        .single()

    if (templateError || !template) {
        return { error: "Modèle introuvable" }
    }

    // 2. Clear current graph
    // Delete edges first to avoiding FK constraints (if any, though here it's soft)
    await supabase.from('chantier_edges').delete().eq('chantier_id', chantierId)
    await supabase.from('chantier_nodes').delete().eq('chantier_id', chantierId)

    // 3. Insert new nodes
    // We need to map old IDs to new IDs to maintain connections!
    // Or we keep the relative structure. 
    // Problem: If we reuse IDs, it might clash if we mix. 
    // Since we cleared the graph, we can try to reuse IDs IF they are UUIDs not present elsewhere.
    // Better: Generate new IDs and map them.

    const idMap = new Map<string, string>()
    const newNodes = template.nodes.map((node: any) => {
        const newId = crypto.randomUUID()
        idMap.set(node.id, newId)

        return {
            ...node,
            id: newId,
            chantier_id: chantierId,
            status: 'pending', // Reset status
            // Keep positions and labels
        }
    })

    const newEdges = template.edges.map((edge: any) => {
        return {
            ...edge,
            id: crypto.randomUUID(),
            chantier_id: chantierId,
            source: idMap.get(edge.source) || edge.source, // Map source
            target: idMap.get(edge.target) || edge.target  // Map target
        }
    })

    // Batch Insert (Supabase supports this)
    const { error: nodesError } = await supabase.from('chantier_nodes').insert(newNodes)
    if (nodesError) {
        console.error("Insert Nodes Error:", nodesError)
        return { error: "Erreur lors de l'import des étapes" }
    }

    const { error: edgesError } = await supabase.from('chantier_edges').insert(newEdges)
    if (edgesError) {
        console.error("Insert Edges Error:", edgesError)
        return { error: "Erreur lors de l'import des liens" }
    }

    revalidatePath(`/dashboard/chantiers/${chantierId}`)
    return { success: true }
}
