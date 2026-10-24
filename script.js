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

// PROJECT 2: SMART TASK MANAGER
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