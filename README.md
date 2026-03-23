# TravHell — Discover Places Only Locals Know About
What's this about?
You know that feeling when you travel somewhere and you only end up visiting the same spots everyone else does — just because they're on Google Maps? Meanwhile, locals know about this amazing viewpoint, a tiny dhaba that serves the best food, or a hidden waterfall that barely anyone visits.
That's exactly the problem this app tries to solve.
LocalLens is a web app that helps you discover offbeat, lesser-known spots at any destination — the kind of places you'd normally only find out about from a local or stumble across on someone's reel. Think hidden photo spots, budget-friendly dhabas, scenic viewpoints, and more.



What the app does:
Search for any city or destination
Browse lesser-known and interesting places around that area
Filter spots by category — food, nature, photo spots, hidden gems, etc.
Sort results by rating or relevance
Save your favorite spots so you don't lose track of them
Works on mobile, tablet, and desktop



Tech Stack:
HTML, CSS, JavaScript — the core of everything
Fetch API — to pull live data from the places API
OpenTripMap API — provides data on attractions and points of interest worldwide, including lesser-known spots
Array Higher-Order Functions — used for all search, filter, and sort logic (.filter(), .map(), .sort(), etc.)
Local Storage — to save your favorite spots between sessions
Optionally: Tailwind CSS for styling



Planned Features:
Search — find spots by city or keyword
Filter by category — nature, food, photography, hidden gems
Sort — by rating, name, or distance
Save Favorites — bookmark spots you want to visit, stored in local storage
Dark / Light Mode — theme toggle for better experience
Loading indicators — visual feedback while data is being fetched
Pagination — browse results page by page without overwhelming the screen



API Being Used:
1) OpenTripMap API =>

Website: https://opentripmap.io
Docs: https://opentripmap.io/product
Why this one? It has a large database of places including offbeat, cultural, and historic spots that don't always show up on mainstream travel apps. It covers locations worldwide, supports category-based filtering, and has a free tier which is perfect for this project.

2) Foursquare Places API =>

Website: https://foursquare.com/developer
Docs: https://developer.foursquare.com
Why this one? It provides real user-contributed data like tips, ratings, and venue details. Useful for finding restaurants, cafes, and local hangout spots with genuine reviews.

Primary API: OpenTripMap — used for discovering attractions and offbeat spots.
Secondary API: Foursquare — used for food, stays, and local venue data.



How to Run This Project:
No complicated setup needed — it's a plain HTML/CSS/JS project.

Clone the repo:

   git clone https://github.com/your-username/locallens.git

Open the project folder and just open index.html in your browser — that's it.
If you want to use the live API, get a free API key from https://opentripmap.io and add it to the config section in app.js.



Current Status:
Milestone 1 complete — project planned, repo created, README written. Development starts with Milestone 2.
