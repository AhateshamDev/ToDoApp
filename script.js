const STORAGE_KEY = "todo.tasks";
const THEME_KEY = "todo.theme";

const themeToggleBtn = document.getElementById("theme-toggle");

function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    themeToggleBtn.textContent = "🌙";
    document.documentElement.dataset.theme = "light";
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggleBtn.textContent = "☀️";
    document.documentElement.dataset.theme = "dark";
  }
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  // Default to system preference
  const prefersLight =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  return prefersLight ? "light" : "dark";
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

themeToggleBtn.addEventListener("click", () => {
  const current =
    document.documentElement.getAttribute("data-theme") === "light"
      ? "light"
      : "dark";
  const next = current === "light" ? "dark" : "light";
  applyTheme(next);
  saveTheme(next);
});

const addForm = document.getElementById("add-form");
const newTaskInput = document.getElementById("new-task");
const taskList = document.getElementById("task-list");
const emptyP = document.getElementById("empty");
const countSpan = document.getElementById("count");
const filterSelect = document.getElementById("filter");
const searchInput = document.getElementById("search");
const clearCompletedBtn = document.getElementById("clear-completed");

let tasks = [];

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch (e) {
    tasks = [];
    console.error("Failed to load tasks", e);
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function render() {
  const filter = filterSelect.value;
  const q = (searchInput.value || "").trim().toLowerCase();

  taskList.innerHTML = "";
  const visible = tasks.filter((t) => {
    if (filter === "active" && t.completed) return false;
    if (filter === "completed" && !t.completed) return false;
    if (q && !t.text.toLowerCase().includes(q)) return false;
    return true;
  });

  if (visible.length === 0) {
    emptyP.style.display = "block";
  } else {
    emptyP.style.display = "none";
  }

  visible.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");
    li.dataset.id = task.id;

    const checkbox = document.createElement("button");
    checkbox.className = "checkbox";
    checkbox.setAttribute("aria-label", "Toggle complete");
    checkbox.innerHTML = task.completed ? "✓" : "";
    checkbox.addEventListener("click", () => toggle(task.id));

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = task.text;
    label.title = "Double-click to edit";
    label.addEventListener("dblclick", () => startEdit(task.id, li));

    const actions = document.createElement("div");
    actions.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.className = "icon";
    editBtn.innerHTML = "✎";
    editBtn.title = "Edit";
    editBtn.addEventListener("click", () => startEdit(task.id, li));

    const delBtn = document.createElement("button");
    delBtn.className = "icon delete";
    delBtn.innerHTML = "🗑";
    delBtn.title = "Delete";
    delBtn.addEventListener("click", () => remove(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(actions);

    taskList.appendChild(li);
  });

  const remaining = tasks.filter((t) => !t.completed).length;
  countSpan.textContent = remaining;
}

function add(text) {
  const t = {
    id: uid(),
    text: text.trim(),
    completed: false,
    created: Date.now(),
  };
  tasks.unshift(t);
  save();
  render();
}

function remove(id) {
  tasks = tasks.filter((t) => t.id !== id);
  save();
  render();
}

function toggle(id) {
  const it = tasks.find((t) => t.id === id);
  if (!it) return;
  it.completed = !it.completed;
  save();
  render();
}

function startEdit(id, li) {
  const it = tasks.find((t) => t.id === id);
  if (!it) return;
  // Replace label with input
  const label = li.querySelector(".label");
  const input = document.createElement("input");
  input.type = "text";
  input.value = it.text;
  input.className = "edit-input";
  input.style.flex = "1";
  li.replaceChild(input, label);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  function finish(saveText) {
    if (saveText) {
      it.text = input.value.trim() || it.text;
      save();
    }
    render();
  }

  input.addEventListener("blur", () => finish(true));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      finish(true);
    } else if (e.key === "Escape") {
      finish(false);
    }
  });
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  save();
  render();
}

// Event bindings
addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = newTaskInput.value.trim();
  if (!v) return;
  add(v);
  newTaskInput.value = "";
});

filterSelect.addEventListener("change", render);
searchInput.addEventListener("input", render);
clearCompletedBtn.addEventListener("click", clearCompleted);

// Init
load();
// Apply theme before render to avoid flash
applyTheme(loadTheme());
render();
