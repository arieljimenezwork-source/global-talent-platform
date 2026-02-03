
// Native fetch available in Node 18+
async function getNgrokUrl() {
    try {
        const response = await fetch('http://localhost:4040/api/tunnels');
        const data = await response.json();
        const publicUrl = data.tunnels[0].public_url;
        console.log('NGROK_URL:', publicUrl);
    } catch (error) {
        console.error('Error fetching Ngrok URL:', error.message);
    }
}

getNgrokUrl();
