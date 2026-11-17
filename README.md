# Atmos — Weather Forecast & Climate Telemetry App

A responsive weather dashboard built with HTML, CSS and vanilla JavaScript. It uses the OpenWeatherMap API to look up current weather and a five-day forecast for cities around the world.

## Features
- Search for a city worldwide
- Current temperature and weather conditions
- Dynamic weather symbols
- Humidity, wind speed, atmospheric pressure and visibility
- Sunrise and sunset times
- Five-day forecast with daily high and low temperatures
- Loading feedback and helpful error messages
- Responsive layout for desktop and mobile screens

## Technologies
- HTML5
- CSS3 (Flexbox, Grid and transitions)
- JavaScript (ES6+, Fetch API, async/await, Promise.all)
- OpenWeatherMap Geocoding, Current Weather and 5 Day / 3 Hour Forecast APIs

## Setup
1. Create an OpenWeatherMap account and generate an API key.
2. Open `config.js`.
3. Replace `YOUR_OPENWEATHERMAP_API_KEY` with your key.
4. Save the file.
5. Open the project using VS Code Live Server (recommended). Do not rely on opening `index.html` directly with `file://`.
6. Search for a city such as Abuja, London or Tokyo.

## API key note
This is a frontend learning project. A key used directly in browser JavaScript can be seen by visitors in browser developer tools and network requests. Do not use a key connected to sensitive services or paid usage. Check the provider's current key restrictions and usage limits. For a production application, route API requests through a backend and keep the key on the server.

Do not commit a real API key to a public GitHub repository. If you publish this project, understand that a frontend key cannot be kept secret; use a suitable restricted learning key and monitor its usage. If a key is exposed unexpectedly, regenerate it in your OpenWeatherMap account.

## Notes
The forecast API returns three-hour forecast entries. This app groups those entries by date and selects a representative entry near midday for each daily card.

## Author
Aisha Joda
