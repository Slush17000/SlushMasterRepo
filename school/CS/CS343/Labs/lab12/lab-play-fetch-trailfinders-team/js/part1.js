const output = document.getElementById("output");
const nameEL = document.getElementById("name");
const ageEL = document.getElementById("age");

document.getElementById("get-btn").addEventListener("click", async () => {
    // This function should send a GET request to the echo endpoint and output the result
    // The two input fields should be included in the request URL as **query parameters**

    let params = new URLSearchParams({ name: nameEL.value, age: ageEL.value });
    let response = await fetch("https://echo.zuplo.io/api?" + params.toString());

    let json = await response.json();
    output.innerText = JSON.stringify(json, null, 2);

});

document.getElementById("post-json-btn").addEventListener("click", async () => {
    // This function should send a POST request to the echo endpoint with the input data as JSON
    // The two input fields should be included in the request body as **JSON data**

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json", // or "application/x-www-form-urlencoded", "text/plain", etc.
        },
        body: JSON.stringify({ name: nameEL.value, age: ageEL.value }),
    };
    let response = await fetch("https://echo.zuplo.io/api", options);
    let json = await response.json();
    output.innerText = JSON.stringify(json, null, 2);
});

document.getElementById("post-form-btn").addEventListener("click", async () => {
    // This function should send a POST request to the echo endpoint with the input data as form data
    // The two input fields should be included in the request body as **url-encoded data**

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ name: nameEL.value, age: ageEL.value }),
    };
    let response = await fetch("https://echo.zuplo.io/api", options);
    let json = await response.json();
    output.innerText = JSON.stringify(json, null, 2);
});

