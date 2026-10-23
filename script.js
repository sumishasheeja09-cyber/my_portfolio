const $ = (selector) => document.querySelector(selector);

// MOBILE NAVIGATION
const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");

menuToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.textContent = open ? "✕" : "☰";
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  });
});

// DARK MODE
$("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
  const dark = document.body.classList.contains("dark-theme");
  $("#themeToggle").textContent = dark ? "☀️" : "🌙";
});

// PROJECT FILTERS
document.querySelectorAll(".filter-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(btn =>
      btn.classList.remove("active")
    );

    button.classList.add("active");

    const filter = button.dataset.filter;

    document.querySelectorAll(".project-card").forEach(card => {
      card.hidden =
        filter !== "all" && card.dataset.category !== filter;
    });
  });
});

// OPEN AND CLOSE PROJECT DEMOS
const demos = {
  palette: $("#paletteDemo"),
  weather: $("#weatherDemo"),
  tasks: $("#tasksDemo")
};

document.querySelectorAll("[data-demo]").forEach(button => {
  button.addEventListener("click", () => {
    Object.values(demos).forEach(demo => demo.hidden = true);

    const selected = demos[button.dataset.demo];
    selected.hidden = false;

    selected.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });
});

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => {
    demos[button.dataset.close].hidden = true;
  });
});

// PROJECT 1: COLOR PALETTE GENERATOR
const swatches = $("#swatches");
const paletteMessage = $("#paletteMessage");

function randomColor() {
  return "#" + Math.floor(Math.random() * 16777216)
    .toString(16).padStart(6, "0").toUpperCase();
}

function renderPalette(colors) {
  swatches.replaceChildren();

  colors.forEach(color => {
    const button = document.createElement("button");
    button.className = "swatch";
    button.type = "button";
    button.setAttribute("aria-label", `Copy ${color}`);

    const colorBox = document.createElement("span");
    colorBox.className = "swatch-color";
    colorBox.style.backgroundColor = color;

    const code = document.createElement("span");
    code.className = "swatch-code";
    code.textContent = color;

    button.append(colorBox, code);

    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(color);
        paletteMessage.textContent = `${color} copied!`;
      } catch {
        paletteMessage.textContent = `Colour code: ${color}`;
      }
    });

    swatches.append(button);
  });
}

renderPalette([
  "#7968D9", "#E5A3C8", "#FFCE86", "#87C9BC", "#38466F"
]);

$("#generatePalette").addEventListener("click", () => {
  renderPalette(Array.from({ length: 5 }, randomColor));
  paletteMessage.textContent =
    "New palette generated! Click a colour to copy its HEX code.";
});

// PROJECT 2: LIVE WEATHER DASHBOARD
const weatherForm = $("#weatherForm");
const weatherMessage = $("#weatherMessage");
const weatherResult = $("#weatherResult");

function weatherDescription(code) {
  if (code === 0) return ["Clear sky", "☀️"];
  if ([1, 2].includes(code)) return ["Mostly clear", "🌤️"];
  if (code === 3) return ["Cloudy", "☁️"];
  if ([45, 48].includes(code)) return ["Foggy", "🌫️"];
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    return ["Rainy", "🌧️"];
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return ["Snowy", "❄️"];
  if ([95, 96, 99].includes(code))
    return ["Thunderstorm", "⛈️"];
  return ["Changing conditions", "🌦️"];
}

weatherForm.addEventListener("submit", async event => {
  event.preventDefault();

  const city = $("#cityInput").value.trim();
  if (!city) return;

  weatherMessage.textContent = "Checking weather...";
  weatherResult.hidden = true;

  try {
    // Find city coordinates using Open-Meteo geocoding.
    const geoURL =
      "https://geocoding-api.open-meteo.com/v1/search?name=" +
      encodeURIComponent(city) + "&count=1&language=en&format=json";

    const geoResponse = await fetch(geoURL);
    if (!geoResponse.ok) throw new Error("City search failed.");

    const geoData = await geoResponse.json();
    const place = geoData.results?.[0];

    if (!place) {
      throw new Error("City not found. Check the spelling and try again.");
    }

    // Fetch current weather. No API key is required.
    const weatherURL =
      "https://api.open-meteo.com/v1/forecast?latitude=" +
      place.latitude +
      "&longitude=" + place.longitude +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto";

    const weatherResponse = await fetch(weatherURL);
    if (!weatherResponse.ok) throw new Error("Weather service unavailable.");

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;

    const [description, icon] =
      weatherDescription(current.weather_code);

    $("#weatherCity").textContent =
      `${place.name}${place.country ? ", " + place.country : ""}`;

    $("#weatherIcon").textContent = icon;
    $("#temperature").textContent =
      `${Math.round(current.temperature_2m)}°C`;

    $("#weatherDescription").textContent =
      `${description} · Feels like ${Math.round(current.apparent_temperature)}°C`;

    $("#humidity").textContent =
      `${current.relative_humidity_2m}%`;

    $("#windSpeed").textContent =
      `${current.wind_speed_10m} km/h`;

    weatherResult.hidden = false;
    weatherMessage.textContent =
      `Current weather · Updated ${current.time.replace("T", " ")}`;

  } catch (error) {
    weatherMessage.textContent =
      error.message || "Unable to load weather. Check your internet connection.";
  }
});

// PROJECT 3: SMART TASK MANAGER
const taskForm = $("#taskForm");
const taskInput = $("#taskInput");
const taskList = $("#taskList");

let tasks = [];

try {
  tasks = JSON.parse(localStorage.getItem("sumishaTasks") || "[]");
  if (!Array.isArray(tasks)) tasks = [];
} catch {
  tasks = [];
}

function saveTasks() {
  try {
    localStorage.setItem("sumishaTasks", JSON.stringify(tasks));
  } catch {
    // Tasks still work for this session if storage is unavailable.
  }
}

function renderTasks() {
  taskList.replaceChildren();

  tasks.forEach((task, index) => {
    const item = document.createElement("li");
    item.className = "task-item";
    if (task.done) item.classList.add("done");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", "Mark task complete");

    checkbox.addEventListener("change", () => {
      tasks[index].done = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const text = document.createElement("span");
    text.textContent = task.text;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";

    remove.addEventListener("click", () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    });

    item.append(checkbox, text, remove);
    taskList.append(item);
  });
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const text = taskInput.value.trim();
  if (!text) return;

  tasks.push({ text, done: false });
  saveTasks();
  renderTasks();

  taskInput.value = "";
  taskInput.focus();
});

renderTasks();

// CONTACT FORM
$("#contactForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("#contactName").value.trim();
  const email = $("#contactEmail").value.trim();
  const message = $("#contactMessage").value.trim();

  const subject = encodeURIComponent(
    `Portfolio message from ${name}`
  );

  const body = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
  );

  $("#contactStatus").textContent =
    "Opening your default email application...";

  window.location.href =
    `mailto:?subject=${subject}&body=${body}`;
});