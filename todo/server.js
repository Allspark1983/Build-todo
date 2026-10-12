// Supporting REST API: Node's built-in modules, with no frameworks/packages.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const dataFile = path.join(__dirname, "tasks.json");
const port = Number(process.env.PORT || 3000);
let tasks = [];

// These are the user's four starting tasks, not four separate task categories.
function startingTasks() {
  return ["Housekeeping", "Fetch children", "Groceries shopping", "Agile Assignments"]
    .map(title => ({ id: randomUUID(), title, completed: false }));
}

// Save before changing memory. Renaming the temporary file avoids half-writes.
function save(nextTasks) {
  fs.writeFileSync(dataFile + ".tmp", JSON.stringify(nextTasks, null, 2));
  fs.renameSync(dataFile + ".tmp", dataFile);
  tasks = nextTasks;
}

// Load existing work; create defaults only when the file does not exist.
try {
  tasks = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  if (!Array.isArray(tasks)) throw new Error("tasks.json must contain an array.");
} catch (error) {
  if (error.code !== "ENOENT") throw error; // Do not overwrite a damaged file.
  save(startingTasks());
}

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

// Validate names at the server too, not just in the browser form.
function validTitle(title) {
  if (typeof title !== "string" || !title.trim() || title.trim().length > 120)
    fail(400, "Use a task name of 1 to 120 characters.");
  return title.trim();
}

// Read a small JSON object asynchronously; reject malformed or oversized input.
async function readBody(request) {
  if (request.headers["content-type"]?.split(";")[0].trim() !== "application/json")
    fail(415, "Send application/json.");
  request.setEncoding("utf8"); // Preserve characters split across network chunks.
  let text = "";
  let bytes = 0;
  for await (const chunk of request) {
    bytes += Buffer.byteLength(chunk);
    if (bytes <= 4096) text += chunk;
  }
  if (bytes > 4096) fail(413, "Request is too large.");
  let body;
  try { body = JSON.parse(text); } catch { fail(400, "Invalid JSON."); }
  if (!body || typeof body !== "object" || Array.isArray(body)) fail(400, "Send a JSON object.");
  return body;
}

// Return the HTTP status and a JSON response (DELETE has no response body).
function reply(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(status === 204 ? undefined : JSON.stringify(data));
}

// Explicit file list: never expose the saved data or server source as files.
const pages = {
  "/": ["index.html", "text/html"],
  "/index.html": ["index.html", "text/html"],
  "/style.css": ["style.css", "text/css"],
  "/script.js": ["script.js", "text/javascript"]
};

const server = http.createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  try {
    const url = new URL(request.url, "http://localhost").pathname;
    const method = request.method;
    if (pages[url] && (method === "GET" || method === "HEAD")) {
      const [file, type] = pages[url];
      response.writeHead(200, { "Content-Type": type + "; charset=utf-8" });
      return response.end(method === "HEAD" ? undefined : fs.readFileSync(path.join(__dirname, file)));
    }
    const match = url.match(/^\/api\/tasks\/([^/]+)$/);
    if (url !== "/api/tasks" && url !== "/api/reset" && !match) fail(404, "Not found.");
    const body = ["POST", "PATCH"].includes(method) ? await readBody(request) : null;

    // READ: return the whole array. CREATE: return the new object with status 201.
    if (url === "/api/tasks" && method === "GET") return reply(response, 200, tasks);
    if (url === "/api/tasks" && method === "POST") {
      const task = { id: randomUUID(), title: validTitle(body.title), completed: false };
      save([...tasks, task]);
      response.setHeader("Location", `/api/tasks/${task.id}`);
      return reply(response, 201, task);
    }
    // The reset button asks for confirmation before calling this extra action.
    if (url === "/api/reset" && method === "POST") {
      save(startingTasks());
      return reply(response, 200, tasks);
    }
    if (!match) fail(405, "Method not allowed.");
    const task = tasks.find(item => item.id === match[1]);
    if (!task) fail(404, "Task not found. Refresh the page.");
    if (method === "GET") return reply(response, 200, task);

    // UPDATE: permit only title and/or a true/false completed value.
    if (method === "PATCH") {
      const keys = Object.keys(body);
      if (!keys.length || keys.some(key => !["title", "completed"].includes(key)))
        fail(400, "Change title or completed only.");
      if ("completed" in body && typeof body.completed !== "boolean") fail(400, "completed must be true or false.");
      const updated = { ...task, ...body };
      if ("title" in body) updated.title = validTitle(body.title);
      save(tasks.map(item => item.id === task.id ? updated : item));
      return reply(response, 200, updated);
    }
    // DELETE: remove the matching object and return 204 No Content.
    if (method === "DELETE") {
      save(tasks.filter(item => item.id !== task.id));
      return reply(response, 204);
    }
    fail(405, "Method not allowed.");
  } catch (error) {
    if (!error.status) console.error(error);
    reply(response, error.status || 500, error.status ? { error: error.message } : { error: "Server could not save or read tasks." });
  }
});
server.listen(port, "127.0.0.1", () => console.log(`To-do list: http://localhost:${port}`));
