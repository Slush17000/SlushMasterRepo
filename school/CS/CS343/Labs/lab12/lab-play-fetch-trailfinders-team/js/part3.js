const output1 = document.getElementById('output-1');
const output2 = document.getElementById('output-2');

document.getElementById('api-1-btn').addEventListener('click', async () => {
    // Make a request to your first API here. Put the response's data in output-1.
    // If your response has no body, put the status code in output-1.

    try {
        let response = await fetch("https://api.ipinfo.io/lite/8.8.8.8?token=4adfcc46c95c4a");
        if (response.ok) {
            let data = await response.json();
            output1.textContent = JSON.stringify(data, null, 2);
        } else {
            output1.textContent = `Error: ${response.status} - ${response.statusText}`;
        }
    } catch (error) {
        output1.textContent = `Error: ${error.message}`;
    }
});

document.getElementById('api-2-btn').addEventListener('click', async () => {
    // Make a request to your second API here. Put the response's data in output-2.
    // If your response has no body, put the status code in output-2.
    
    try {
        // Example using Hiking Project API (requires API key)
        // You'll need to sign up at https://www.hikingproject.com/data to get an API key
        let params = new URLSearchParams({
            lat: 38.4365,  // Harrisonburg, VA latitude
            lon: -78.8689, // Harrisonburg, VA longitude
            maxDistance: 50,
            key: '200992653-1b6eb6dce5f10cd41f2285f7087a2d27' // Replace with your API key
        });
        
        let response = await fetch("https://www.hikingproject.com/data/get-trails?" + params.toString());
        if (response.ok) {
            let data = await response.json();
            output2.textContent = JSON.stringify(data, null, 2);
        } else {
            output2.textContent = `Error: ${response.status} - ${response.statusText}`;
        }
    } catch (error) {
        output2.textContent = `Error: ${error.message}`;
    }
});
