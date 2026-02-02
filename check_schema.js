
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase env vars');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to select logo_url from company_settings
    // We just fetch 1 row
    const { data, error } = await supabase
        .from('company_settings')
        .select('logo_url')
        .limit(1);

    if (error) {
        console.log('Error selecting logo_url:', error.message);
        if (error.code === 'PGRST204') { // Column not found error code (approx)
            console.log('Column probably does not exist');
        }
    } else {
        console.log('Column logo_url exists!');
    }
}

checkSchema();
