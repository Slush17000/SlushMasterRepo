const userList = document.getElementById("user-list");

document.addEventListener("DOMContentLoaded", async () => {
    // This function should GET the first page of users from reqres.in.
    // The users should be displayed in the user-list element.
    // Each user should be in a new <div> with the user's first name, last name, and profile image.
    // The format should follow the example user in the HTML file.

    // Fetch the first page of users from reqres.in
    let response = await fetch("https://reqres.in/api/users?page=1", {
        headers: {
            'x-api-key': 'reqres-free-v1'
        }
    });
    
    let json = await response.json();
    
    // Loop through each user in the data array
    for (let user of json.data) {
        // Create a new card div for each user
        let card = document.createElement("div");
        card.classList.add("card");
        
        // Create h2 with user's full name
        let name = document.createElement("h2");
        name.textContent = `${user.first_name} ${user.last_name}`;
        
        // Create img with user's avatar
        let img = document.createElement("img");
        img.src = user.avatar;
        img.alt = `${user.first_name} ${user.last_name}`;
        
        // Append name and image to card
        card.appendChild(name);
        card.appendChild(img);
        
        // Append card to user-list
        userList.appendChild(card);
    }
});
