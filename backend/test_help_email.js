async function testHelpEmail() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/send-help-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: "Test",
                email: "test@example.com",
                mobile: "1234567890",
                message: "Test message from script"
            })
        });

        console.log('Status Code:', response.status);
        const data = await response.json();
        console.log('Response Body:', data);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testHelpEmail();
