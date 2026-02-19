import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function keepAlive() {
  console.log('Running Supabase Keep-Alive...');
  try {
    // Query a small table or just get 1 item to simulate activity
    // 'events' table is a good candidate
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error querying Supabase:', error.message);
      process.exit(1);
    }

    console.log('Successfully queried Supabase. Data:', data);
    console.log('Keep-Alive check completed.');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

keepAlive();
