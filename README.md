# Build-todo

A plain to-do list for busy parents balancing home, family and study. It starts with **Housekeeping**, **Fetch children**, **Groceries shopping** and **Agile Assignments**. These are starter tasks; you can add your own.

## Run

Use Node.js 22 or later. From the repository root:

```bash
npm start
```

No `npm install` is needed: there are no dependencies. In GitHub Codespaces, open **Ports → 3000 → Open in Browser**, keeping the port **Private**. On your own computer, open `http://localhost:3000`. Stop with Ctrl+C. Run `npm run check` to check both JavaScript files for syntax errors.

**Use this server, not Live Server, a double-clicked HTML file or GitHub Pages.** The page needs its REST API. Uploading the code to GitHub does not start the app.

## Basic functions

Type a task and press **Add**. Tick a checkbox to mark it done or undo it. **Edit** opens a plain dialog; **Delete** asks for confirmation. **Reset** asks before replacing the whole list with the four unfinished starting tasks. **Cancel** or Escape leaves the task unchanged. The count shows completed tasks. There are no coloured themes, frameworks, external libraries or external API calls.

The dialog is an HTML `<dialog>`, not `alert()`, `prompt()` or `confirm()`, so it has no browser-generated “site says” heading. Changes are shown as saved only after the server succeeds; failed edits stay in the dialog for correction/retry.

## Files

```text
Build-todo/
  todo/
    index.html   # Form, list, row template and reusable dialog
    style.css    # Plain layout and a mobile media query
    script.js    # Commented DOM, events, arrays and AJAX operations
    server.js    # Small framework-free REST API and JSON storage
  package.json   # Start/check commands
  .gitignore     # Excludes local task data and secrets
  README.md
```

`todo/tasks.json` is created automatically on first start. It keeps work across page refreshes and server restarts in the same workspace; it is not uploaded or included in the source ZIP. Removing the file/Codespace can lose the work. One shared list, one server process: this classroom demo has no login, separate user accounts or backups. Keep it private and use example data.

## Assignment marking criteria

Mapped to the detailed criteria in *Agile assignments.pdf*. Comments beside the code identify the relevant functionality; there is no separate assessor guide.

| Requirement | Evidence |
| --- | --- |
| Vanilla HTML, CSS and JavaScript | No Bootstrap, React, Express or other frameworks. |
| Target audience / pain point | Remembering home, family and study commitments in one simple list. |
| Full CRUD | Add, display, edit/complete and delete task objects. |
| Mobile-responsive | Viewport meta tag, flexible layout and a 480px media query. |
| Three DOM properties across two elements | `textContent`, `checked`, `hidden`, plus `value`, `className` and `disabled`. |
| Two or more event handlers | `submit`, `click`, `change` and `cancel` handlers. |
| JavaScript logic and structured programming | Comparisons, logical operators, `if` branches, functions, `forEach`, `map` and `filter`. |
| Array and object | `tasks` contains `{ id, title, completed }` objects. |
| Function return used as another call's argument | `list.appendChild(createTaskElement(task))`. |
| Asynchronous call and JSON resource | `async`/`await`, `fetch()`, `response.json()` and `JSON.stringify()`. |
| AJAX GET plus POST/PATCH/PUT | Real GET, POST and PATCH requests to the included API. DELETE is also implemented. |
| Submission | Submit the repository link and the source ZIP via the LMS. |

This demonstrates the detailed marking criteria, not a guaranteed assessment result. It uses its own REST API; external SaaS and generative AI are not integrated. Check with the assessor if those are separately expected under the wider LO12 learning outcome. Practise explaining and adapting the code yourself.

## API

| Request | Function |
| --- | --- |
| `GET /api/tasks` | Read the array of tasks. |
| `GET /api/tasks/:id` | Read one task. |
| `POST /api/tasks` | Create with `{ "title": "A new task" }`. |
| `PATCH /api/tasks/:id` | Edit `title` and/or `completed`. |
| `DELETE /api/tasks/:id` | Delete one task. |
| `POST /api/reset` | Restore the four starting tasks. |

Open browser Developer Tools → Network → Fetch/XHR to watch these requests. Task names must be 1–120 characters. User-supplied text is displayed with `textContent`, and the server validates names and update fields.

## Verification

Local checks passed: JavaScript syntax, 72 HTTP/API assertions and 34 browser interaction/layout assertions. HTTP tests covered CRUD, invalid input, disk-write failure, concurrent additions and persistence across server restarts. Browser tests covered dialogs, cancellation, failed saves, safe task text and phone widths down to 320px.

Browser navigation is blocked in the assistant sandbox, so the browser tests used mocked API responses with the actual HTML, CSS and JavaScript. They are not a live browser-to-server test. The HTTP API was tested separately with real requests. Your Codespace has not been started by the assistant; run it and try each action before presenting.

## References

- Fetch: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
- Dialogs: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
- Node HTTP: https://nodejs.org/api/http.html
- Codespaces ports: https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace
