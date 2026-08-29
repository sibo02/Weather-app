const dateElement = document.querySelector(".location-info time");
const weatherForm = document.getElementById("weatherForm");
const cityInput = document.getElementById("cityInput");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const precipitation = document.getElementById("precipitation");
const weatherImage = document.getElementById("weatherImage");

const dailyForecastList = document.querySelector("#dailyForecast ul");
const hourlyForecastList = document.querySelector("#hourlyForecast ul");

const toggleUnits = document.getElementById("toggleUnits");
const unitsMenu = document.querySelector(".units-menu");

const tempButtons = document.querySelectorAll(".menu-group:first-of-type .option");
const windButtons = document.querySelectorAll(".menu-group:nth-of-type(2) .option");
const precipitationButtons = document.querySelectorAll(".menu-group:nth-of-type(3) .option");

const daySelector = document.getElementById("daySelector");
const dayMenu = document.querySelector(".day-menu");
const dayButtons = document.querySelectorAll(".day-menu button");

let currentWeatherData = null;
let currentPlace = null;

let currentUnit = "metric";
let currentWindUnit = "kmh";
let currentPrecipitationUnit = "mm";
let selectedDayIndex = 0;

weatherForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const city = cityInput.value.trim();
  if (!city) return;

  searchWeather(city);
});

async function searchWeather(city) {
  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );

    const geoData = await geoResponse.json();

    if (!geoData.results) {
      alert("City not found.");
      return;
    }

    currentPlace = geoData.results[0];

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${currentPlace.latitude}&longitude=${currentPlace.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
    );

    currentWeatherData = await weatherResponse.json();

    renderWeather();
  } catch (error) {
    console.error(error);
    alert("Something went wrong.");
  }
}

function renderWeather() {
  if (!currentWeatherData || !currentPlace) return;

  cityName.textContent = `${currentPlace.name}, ${currentPlace.country}`;

  updateTemperatureDisplay();

  humidity.textContent = `${currentWeatherData.current.relative_humidity_2m}%`;
  windSpeed.textContent = convertWind(currentWeatherData.current.wind_speed_10m);
  precipitation.textContent = convertPrecipitation(
    currentWeatherData.current.precipitation
  );

  weatherImage.src = getWeatherIcon(currentWeatherData.current.weather_code);
  weatherImage.alt = "Current weather";

  const currentDate = new Date(currentWeatherData.current.time);

  dateElement.textContent = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  dailyForecastList.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    dailyForecastList.innerHTML += `
      <li>
        <p>${getDayName(currentWeatherData.daily.time[i])}</p>
        <img src="${getWeatherIcon(currentWeatherData.daily.weather_code[i])}" class="icon-small" alt="">
        <p>
          <span class="high">${convertTemp(currentWeatherData.daily.temperature_2m_max[i])}°</span>
          <span class="low">${convertTemp(currentWeatherData.daily.temperature_2m_min[i])}°</span>
        </p>
      </li>
    `;
  }

  hourlyForecastList.innerHTML = "";

  const start = selectedDayIndex * 24;

  for (let i = start; i < start + 8; i++) {
    const hour = new Date(currentWeatherData.hourly.time[i]).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        hour12: true,
      }
    );

    hourlyForecastList.innerHTML += `
      <li>
        <p>${hour}</p>
        <img src="${getWeatherIcon(currentWeatherData.hourly.weather_code[i])}" class="icon-small" alt="">
        <span>${convertTemp(currentWeatherData.hourly.temperature_2m[i])}°</span>
      </li>
    `;
  }
}

function convertTemp(temp) {
  return currentUnit === "metric"
    ? Math.round(temp)
    : Math.round(temp * 9 / 5 + 32);
}

function convertWind(speed) {
  return currentWindUnit === "kmh"
    ? `${Math.round(speed)} km/h`
    : `${Math.round(speed / 1.609)} mph`;
}

function convertPrecipitation(value) {
  return currentPrecipitationUnit === "mm"
    ? `${Math.round(value)} mm`
    : `${(value / 25.4).toFixed(1)} in`;
}

function updateTemperatureDisplay() {
  temperature.textContent = `${convertTemp(currentWeatherData.current.temperature_2m)}°`;
  feelsLike.textContent = `${convertTemp(currentWeatherData.current.apparent_temperature)}°`;
}

toggleUnits.addEventListener("click", (e) => {
  e.stopPropagation();
  unitsMenu.classList.toggle("open");
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".units-dropdown")) {
    unitsMenu.classList.remove("open");
  }
});

tempButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentUnit = button.textContent.includes("Fahrenheit")
      ? "imperial"
      : "metric";

    tempButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    renderWeather();
  });
});

windButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentWindUnit = button.textContent.includes("mph")
      ? "mph"
      : "kmh";

    windButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    renderWeather();
  });
});

precipitationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentPrecipitationUnit = button.textContent.includes("Inches")
      ? "in"
      : "mm";

    precipitationButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    renderWeather();
  });
});

daySelector.addEventListener("click", (e) => {
  e.stopPropagation();
  dayMenu.classList.toggle("open");
});

dayButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    selectedDayIndex = index;

    daySelector.childNodes[0].textContent = button.textContent + " ";

    dayButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    dayMenu.classList.remove("open");

    renderWeather();
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".day-dropdown")) {
    dayMenu.classList.remove("open");
  }
});

function getDayName(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function getWeatherIcon(code) {
  if (code === 0) return "images/icon-sunny.webp";
  if ([1, 2].includes(code)) return "images/icon-partly-cloudy.webp";
  if (code === 3) return "images/icon-overcast.webp";
  if ([45, 48].includes(code)) return "images/icon-fog.webp";
  if ([51, 53, 55].includes(code)) return "images/icon-drizzle.webp";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "images/icon-rain.webp";
  if ([71, 73, 75, 77].includes(code)) return "images/icon-snow.webp";
  if ([95, 96, 99].includes(code)) return "images/icon-storm.webp";

  return "images/icon-overcast.webp";
}
searchWeather("Berlin");