const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yljsnkiewgsubimwatji.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bGSTGeJbehf9bOumU0Nb2Q_WUzay69-';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function syncPlanning() {
    const filePath = path.join(__dirname, '..', 'data', 'planning_interventions.json');
    if (!fs.existsSync(filePath)) {
        console.log('No local planning_interventions.json found.');
        return;
    }

    const localList = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`Found ${localList.length} local interventions.`);

    let success = 0;
    for (const item of localList) {
        const payload = {
            id: String(item.id),
            title: item.title || 'Intervention',
            chantier_name: item.chantierName || 'Chantier',
            client_name: item.clientName || 'Client',
            address: item.address || '',
            technicien: item.technicien || 'Technicien',
            zone: item.zone || 'Île-de-France',
            date: item.date,
            start_time: item.startTime || '08:00',
            end_time: item.endTime || '12:00',
            color: item.color || 'blue',
            status: item.status || 'planifie',
            notes: item.notes || '',
            chantier_id: item.chantier_id || null,
            client_id: item.client_id || null,
            user_id: item.user_id || null,
            company_id: item.company_id || '00000000-0000-0000-0000-000000000001'
        };

        const { error } = await sb.from('planning_interventions').upsert(payload, { onConflict: 'id' });
        if (error) {
            console.error(`Error inserting ${item.id}:`, error.message);
        } else {
            success++;
        }
    }

    console.log(`Successfully synced ${success}/${localList.length} interventions to Supabase.`);
}

syncPlanning();
