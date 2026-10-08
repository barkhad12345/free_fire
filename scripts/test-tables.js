const SUPABASE_URL = 'https://bacgsctnupxconexfgih.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhY2dzY3RudXB4Y29uZXhmZ2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODQ4MzMsImV4cCI6MjEwNzA2MDgzM30.IRzjJ-SQ5zWeHasOVVtdHiDKqJXKDaqMCUcoda3XMdI';

async function test() {
  const tables = ['packages', 'profiles', 'orders', 'payment_methods', 'support_messages', 'notifications'];
  for (const table of tables) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      console.log(table, 'status:', r.status, 'body:', (await r.text()).slice(0, 100));
    } catch (e) {
      console.error(table, 'fetch error:', e.message);
    }
  }
}

test();
