
async function test() {
    try {
        const resp = await fetch('https://uocisjmxihshzixpaxlv.supabase.co');
        console.log('Status:', resp.status);
    } catch (e) {
        console.error('Fetch Error:', e);
    }
}
test();
