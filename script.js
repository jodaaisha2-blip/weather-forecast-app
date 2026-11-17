const searchForm = document.querySelector("#searchForm");
const cityInput = document.querySelector("#cityInput");
const searchButton = document.querySelector("#searchButton");
const statusMessage = document.querySelector("#statusMessage");
const weatherContent = document.querySelector("#weatherContent");

const weatherSymbols = {
  Clear: "☀", Clouds: "☁", Rain: "☂", Drizzle: "☂",
  Thunderstorm: "ϟ", Snow: "❄", Mist: "≋", Smoke: "≋",
  Haze: "≋", Dust: "≋", Fog: "≋", Sand: "≋",
  Ash: "≋", Squall: "〰", Tornado: "〰"
};

function showStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`.trim();
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  searchButton.innerHTML = isLoading
    ? '<span class="spinner" aria-hidden="true"></span> Loading'
    : 'Search <span aria-hidden="true">→</span>';
  cityInput.disabled = isLoading;
}

function formatTime(unixSeconds, timezoneOffset) {
  const date = new Date((unixSeconds + timezoneOffset) * 1000);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", timeZone: "UTC"
  });
}

function formatDay(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short"
  });
}

function titleCase(value) {
  return value.replace(/\b\w/g, character => character.toUpperCase());
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const errorData = await response.json();
      if (errorData.message) message = errorData.message;
    } catch (_) {}
    throw new Error(message);
  }
  return response.json();
}

async function getCoordinates(city) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
  const locations = await fetchJson(url);
  if (!locations.length) throw new Error(`We couldn't find "${city}". Check the spelling and try again.`);
  return locations[0];
}

function renderCurrentWeather(data) {
  const weather = data.weather[0];
  const mainCondition = weather.main;
  const icon = weatherSymbols[mainCondition] || "☁";
  const temp = Math.round(data.main.temp);
  const feels = Math.round(data.main.feels_like);

  document.querySelector("#cityName").textContent =
    `${data.name}, ${data.sys.country || ""}`.replace(/,\s*$/, "");
  document.querySelector("#currentDate").textContent =
    new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  document.querySelector("#weatherSymbol").textContent = icon;
  document.querySelector("#temperature").textContent = temp;
  document.querySelector("#condition").textContent = titleCase(weather.description);
  document.querySelector("#feelsLike").textContent = `Feels like ${feels}°`;
  document.querySelector("#highLow").textContent =
    `H: ${Math.round(data.main.temp_max)}°   L: ${Math.round(data.main.temp_min)}°`;
  document.querySelector("#sunInfo").textContent =
    `☀ Sunrise ${formatTime(data.sys.sunrise, data.timezone)}   ◐ Sunset ${formatTime(data.sys.sunset, data.timezone)}`;

  document.querySelector("#humidity").textContent = `${data.main.humidity}%`;
  document.querySelector("#wind").textContent = `${data.wind.speed} m/s`;
  document.querySelector("#windDirection").textContent =
    Number.isFinite(data.wind.deg) ? `${data.wind.deg}° direction` : "Current wind";
  document.querySelector("#pressure").textContent = `${data.main.pressure} hPa`;
  document.querySelector("#visibility").textContent =
    Number.isFinite(data.visibility) ? `${(data.visibility / 1000).toFixed(1)} km` : "N/A";

  const isNight = data.dt < data.sys.sunrise || data.dt > data.sys.sunset;
  document.body.dataset.weather = mainCondition.toLowerCase();
  document.body.dataset.time = isNight ? "night" : "day";
}

function buildDailyForecast(forecastList) {
  const days = new Map();
  forecastList.forEach(item => {
    const day = item.dt_txt.split(" ")[0];
    if (!days.has(day)) days.set(day, []);
    days.get(day).push(item);
  });

  return [...days.entries()].slice(0, 5).map(([date, entries]) => {
    const representative = entries.reduce((best, item) => {
      const bestHour = Number(best.dt_txt.slice(11, 13));
      const itemHour = Number(item.dt_txt.slice(11, 13));
      return Math.abs(itemHour - 12) < Math.abs(bestHour - 12) ? item : best;
    }, entries[0]);
    const min = Math.min(...entries.map(item => item.main.temp_min));
    const max = Math.max(...entries.map(item => item.main.temp_max));
    return { date, item: representative, min, max };
  });
}

function renderForecast(forecastData) {
  const forecastGrid = document.querySelector("#forecastGrid");
  const dailyForecast = buildDailyForecast(forecastData.list);
  forecastGrid.innerHTML = dailyForecast.map((day, index) => {
    const condition = day.item.weather[0].main;
    const symbol = weatherSymbols[condition] || "☁";
    return `
      <article class="forecast-card">
        <p class="forecast-day">${index === 0 ? "Today" : formatDay(day.date)}</p>
        <span class="forecast-symbol" aria-hidden="true">${symbol}</span>
        <p class="forecast-condition">${titleCase(day.item.weather[0].description)}</p>
        <div class="forecast-temperatures"><strong>${Math.round(day.max)}°</strong><span>${Math.round(day.min)}°</span></div>
      </article>`;
  }).join("");
}

async function searchWeather(city) {
  if (!API_KEY || API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
    showStatus("Add your OpenWeatherMap API key in config.js first.", "error");
    return;
  }

  setLoading(true);
  weatherContent.hidden = true;
  showStatus(`Finding the latest weather for ${city}...`);

  try {
    const location = await getCoordinates(city);
    const coordinates = `lat=${location.lat}&lon=${location.lon}`;
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?${coordinates}&units=metric&appid=${API_KEY}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?${coordinates}&units=metric&appid=${API_KEY}`;

    const [currentData, forecastData] = await Promise.all([
      fetchJson(currentUrl),
      fetchJson(forecastUrl)
    ]);

    renderCurrentWeather(currentData);
    renderForecast(forecastData);
    weatherContent.hidden = false;
    showStatus(`Showing current conditions for ${currentData.name}.`, "success");
  } catch (error) {
    console.error("Weather lookup error:", error);
    const message = error.message.includes("401")
      ? "Your API key may still be activating, or it may be incorrect. Check config.js and try again later."
      : error.message.includes("429")
        ? "The API request limit has been reached. Please wait a little and try again."
        : error.message.toLowerCase().includes("failed to fetch")
          ? "Network error. Check your internet connection and try again."
          : error.message;
    showStatus(message, "error");
  } finally {
    setLoading(false);
  }
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    showStatus("Please enter a city name.", "error");
    cityInput.focus();
    return;
  }
  searchWeather(city);
});

cityInput.addEventListener("input", () => {
  if (statusMessage.classList.contains("error")) {
    showStatus("Enter a city name and search for its weather.");
  }
});
