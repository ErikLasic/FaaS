require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Primer uporabe:
async function testConnection() {
  const { data, error } = await supabase.from('events').select('*');
  console.log(data, error);
}
testConnection();
