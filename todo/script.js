// DOM selection: connect JavaScript to the HTML controls.
const list = document.querySelector("#task-list");
const input = document.querySelector("#new-task");
const message = document.querySelector("#message");
const dialog = document.querySelector("#dialog");
const editInput = document.querySelector("#edit-task");
const dialogError = document.querySelector("#dialog-error");
let tasks = []; // An ARRAY containing task OBJECTS: { id, title, completed }.
let selectedTask = null;
let action = "";
let busy = false;

// AJAX / REST: await a real HTTP request and read the JSON response.
async function api(path, method = "GET", body) {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

// Return a DOM element. textContent treats task names as text, not HTML.
function createTaskElement(task) {
  const row = document.querySelector("#task-template").content.firstElementChild.cloneNode(true);
  row.dataset.id = task.id;
  row.querySelector("span").textContent = task.title;
  row.querySelector("span").className = task.completed ? "done" : "";
  row.querySelector("input").checked = task.completed;
  return row;
}

// READ: loop through the array, display each task and update the done count.
function renderList() {
  list.replaceChildren();
  tasks.forEach(task => list.appendChild(createTaskElement(task)));
  // Above: one function's RETURN VALUE is another function's ARGUMENT.
  document.querySelector("#count").textContent =
    `${tasks.filter(task => task.completed).length} of ${tasks.length} done`;
  document.querySelector("#empty").hidden = tasks.length !== 0;
}

// Share loading/error handling and stop duplicate clicks during a request.
async function run(work) {
  if (busy) return;
  busy = true;
  document.querySelector("#controls").disabled = true;
  document.querySelector("#dialog-controls").disabled = true;
  message.textContent = "";
  dialogError.textContent = "";
  try {
    await work();
  } catch (error) {
    message.textContent = `Could not finish: ${error.message} Check the server and try again.`;
    dialogError.textContent = message.textContent;
  } finally {
    renderList(); // Restore the saved checkbox state if a request failed.
    busy = false;
    document.querySelector("#controls").disabled = false;
    document.querySelector("#dialog-controls").disabled = false;
  }
}

// Set up the same dialog for three actions. These are DOM property changes.
function openDialog(nextAction, task = null) {
  action = nextAction;
  selectedTask = task;
  const editing = action === "edit";
  document.querySelector("#dialog-title").textContent =
    editing ? "Edit task" : action === "delete" ? "Delete task?" : "Reset list?";
  document.querySelector("#dialog-message").textContent = action === "reset"
    ? "Replace the entire list with the four starting tasks? This cannot be undone."
    : editing ? "Change the task name below." : `Delete "${task.title}"?`;
  document.querySelector("#edit-field").hidden = !editing;
  editInput.required = editing;
  editInput.disabled = !editing;
  editInput.value = editing ? task.title : "";
  document.querySelector("#confirm").textContent = editing ? "Save" : action === "delete" ? "Delete" : "Reset";
  dialogError.textContent = "";
  dialog.showModal();
  (editing ? editInput : document.querySelector("#cancel")).focus();
}

// Event 1: SUBMIT creates a task using POST; blank names are not saved.
document.querySelector("#add-form").addEventListener("submit", event => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) { message.textContent = "Please enter a task name."; return; }
  run(async () => {
    tasks.push(await api("/api/tasks", "POST", { title }));
    input.value = "";
  });
});

// Event 2: CHANGE updates the completed property using PATCH.
list.addEventListener("change", event => {
  const id = event.target.closest("li").dataset.id;
  const completed = event.target.checked;
  run(async () => {
    const updated = await api(`/api/tasks/${id}`, "PATCH", { completed });
    tasks = tasks.map(task => task.id === id ? updated : task);
  });
});

// Event 3: CLICK finds the chosen object and opens an edit/delete dialog.
list.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (button) openDialog(button.dataset.action,
    tasks.find(task => task.id === button.closest("li").dataset.id));
});
document.querySelector("#reset").addEventListener("click", () => openDialog("reset"));
document.querySelector("#cancel").addEventListener("click", () => dialog.close());
dialog.addEventListener("cancel", event => { if (busy) event.preventDefault(); });

// UPDATE / DELETE / RESET: change the array only after the server succeeds.
document.querySelector("#dialog-form").addEventListener("submit", event => {
  event.preventDefault();
  const title = editInput.value.trim();
  if (action === "edit" && !title) { dialogError.textContent = "Please enter a task name."; return; }
  run(async () => {
    if (action === "edit") {
      const updated = await api(`/api/tasks/${selectedTask.id}`, "PATCH", { title });
      tasks = tasks.map(task => task.id === updated.id ? updated : task);
    } else if (action === "delete") {
      await api(`/api/tasks/${selectedTask.id}`, "DELETE");
      tasks = tasks.filter(task => task.id !== selectedTask.id);
    } else {
      tasks = await api("/api/reset", "POST", {});
    }
    dialog.close();
  });
});

// First asynchronous GET: load the saved JSON array when the page opens.
run(async () => { tasks = await api("/api/tasks"); });
