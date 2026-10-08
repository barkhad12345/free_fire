const SUPABASE_URL = 'https://bacgsctnupxconexfgih.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhY2dzY3RudXB4Y29uZXhmZ2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODQ4MzMsImV4cCI6MjEwNzA2MDgzM30.IRzjJ-SQ5zWeHasOVVtdHiDKqJXKDaqMCUcoda3XMdI';

async function check() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log('Rest status:', res.status);
    const data = await res.json();
    console.log('Tables defined:', Object.keys(data.definitions || {}));
  } catch (e) {
    console.error('Error:', e);
  }
}

check();
