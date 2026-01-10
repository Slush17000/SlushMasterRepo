# CS 343 F25 Final Project

## Milestone 1

Complete the assignment as specified on [the inter-section website](https://w3.cs.jmu.edu/cs343/f25/project/), but:

1. Convert your narrative to markdown and include it in this section of README.md
2. Put your design files (draw.io or otherwise) in the `design/` directory

Purpose:
Have you ever wanted to go on a hike but didn’t know of any nearby? Or have you ever gotten burnt-out on your go-to trail and wanted to find a new spot? With our web app, Trail Finder, we seek to solve this problem. Trail Finder makes it easy to discover hiking trails near you, whether you’re looking for a casual nature walk, a challenging mountain climb, or something in between. By combining nearby trail information with a location-based search, Trail Finder removes the guesswork and helps people spend less time planning and more time outdoors. 

We think this application is an important solution for two main reasons. First, hiking and being outdoors is good exercise for the mind and body. Second, there’s not enough environmental awareness in today’s world. If people are finding local trails/hikes through our web app and it sparks their interest to go there and explore it for themselves, then more people will be outdoors and the overall level of environmental awareness will increase. We only have one Earth, so it’s imperative that we treat it with respect and be good stewards for the next generations of all organisms (not just humans).

Users:
Trail Finder is designed for anyone who currently enjoys the outdoors, or for someone that wants to try something new. This could include but not be limited to: Casual hikers looking for nearby trails in their freetime; Boy Scouts, Scout leaders, and Youth groups searching for new outing opportunities; Nature enthusiasts and adventurers who want to explore new locations, challenge themselves, or just enjoy some fresh air; Someone who doesn’t usually hike but gets a wild hair to check it out.

Our users will benefit from the accessibility and configurability of our web app, so that they will get the best search results based on their location and filter criteria. Planning is key when it comes to outdoor expeditions, and having trail length, difficulty, distance, and cost readily available helps users prepare properly and pick a hike that matches their needs. By filtering results, they can discover hidden local gems or plan bigger adventures further away. The app also opens the door for community features such as ratings and reviews, which provide extra insight into trail conditions and overall difficulty/popularity. Whether someone is sitting at home planning on a desktop or pulling up information on their phone at the trailhead, Trail Finder makes the whole experience smoother, safer, and more enjoyable.

Features:
Trail Finder provides several core features designed to make trail discovery simple and effective. Users can quickly locate nearby hikes through location-based search or explore new destinations by searching by name or area. Each trail displays key information at a glance, including length, difficulty, distance from the user, cost (if applicable), and ratings, while expandable details offer additional context such as photos, descriptions, and user reviews. We want a seamless cross-platform experience for our web app, displaying and functioning smoothly on both desktop and mobile devices so users can plan ahead or reference details in real time. In addition, we want to implement a hike list feature that allows users to mark or favorite trails they have completed or wish to revisit, supporting both personal tracking and future planning. The user should also be able to write a review and rate the difficulty and overall score of each hike in their hike list, to inform others about the trail and what they should expect. These entries will be stored locally, ensuring that each user can maintain a customized record of their own hiking experiences without requiring an external database.

For example, consider a college student who recently moved to a new city and wants to spend more time outdoors. They open Trail Finder on their phone, use the location-based search, and instantly see a list of trails within 20 miles. At a glance, they can compare trail lengths and difficulty levels, which allows them to select a moderate three-mile trail nearby that fits the time they have available between classes. After completing the hike, they mark it as completed in their hike list and add a personal review, helping them track which trails they enjoyed most. Without Trail Finder, this process might have required searching multiple websites, cross-checking maps, or relying on word of mouth. By consolidating this information in one place and tailoring results to the user’s location, our web app reduces planning time and encourages the student to get outdoors more often.

Data:
In order for our web app to be truly interactive and useful, the user should be able to create, read, update, and delete data (CRUD) as they see fit. Our users will create data by exporting their hike list as a JSON file, which they can download to their device for later reference and to save their hiking data. Our users will Read data by looking at the search results based on their location and filter criteria, as well as loading in a previously downloaded JSON file and reading their personal hiking data. Our users will update data by being able to edit their pre-existing ratings and reviews if they change their mind or want to write something else. Finally, our user will delete data one of two ways. They can clear their entire hiking list if they want to get rid of everything, or they can delete certain elements of the hiking list. For example, a user should be able to delete a review that they have written or a single hike from the list if they wish.

## Milestone 2

Complete the assignment as specified on [the inter-section website](https://w3.cs.jmu.edu/cs343/f25/project/), but all of your source code (which should have no javascript at this point!) belongs in the `src/` directory

## Milestone 3
Complete the assignment as specified on [the inter-section website](https://w3.cs.jmu.edu/cs343/f25/project/), but all of your source code (which should now include javascript) belongs in the `src/` directory