const testDashboardApi = async (district) => {
    const token = `demo-fake-admin-jwt-token-${district}`;
    const url = 'http://localhost:5000/api/admin/metrics'; // Assuming backend is on 5000

    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await res.json();
        console.log(`\n--- Response for ${district} ---`);
        console.log('Success:', data.success);
        if (data.success) {
            console.log('Total Collected:', data.metrics.totalTaxesCollected);
            console.log('Total Users:', data.metrics.totalUsers);
            console.log('Recent Payments Count:', data.metrics.recentPayments.length);
        } else {
            console.log('Error:', data.error);
        }
    } catch (e) {
        console.error('Fetch failed (is backend running?):', e.message);
    }
};

const run = async () => {
    await testDashboardApi('all');
    await testDashboardApi('udhamsingh');
};

run();
