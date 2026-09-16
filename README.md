# Quality Inspection Tracker

A mobile-first web application for shop-floor supervisors to log, track, and resolve fabric-quality defects. The Express REST API and SQLite persistence layer are complete; the React interface is the next implementation phase.

## Current status

- Complete: Node.js/Express REST API, SQLite schema, validation, filtering, sorting, resolution workflow, summary endpoint, and React/Tailwind mobile interface.
- Next: Review the complete experience at a 390px viewport target.
- Complete: Mock SAP webhook and simple session authentication are included as optional assignment bonuses.
- Deferred: Offline sync.

## Prerequisites

- Node.js 22.5 or newer. The project uses Node's built-in SQLite module, so there are no packages to install for the API.

## Run locally

1. Open a terminal in the project folder and run `npm install`.
2. In one terminal, run `npm run start:api`.
3. In a second terminal, run `npm run dev`.
4. Open the local Vite URL shown in the second terminal (normally `http://localhost:5173`).
5. On the login screen, use `admin` as both the username and password. The app uses simple session-based authentication for local development.


The frontend's Vite development server proxies `/api` calls to the API on port `3001`. The API creates its local SQLite database at `server/data/quality-inspections.db` on first startup. To use another API port, set both `PORT` and the proxy target in `vite.config.js`.
## Screenshots

### Login

The authentication screen prompts users to sign in before accessing the Quality Inspection Tracker.

<img width="285" height="445" alt="Login screen" src="https://github.com/user-attachments/assets/4c2edf1a-938c-4dea-89be-58f37652bf45" />

### Inspection Dashboard

The dashboard combines the inspection form, severity summary, filters, live inspection register, and resolution workflow.

<img height="445" alt="Inspection dashboard" src="https://github.com/user-attachments/assets/9ee71a27-0ea7-4532-ae72-d4992d470408" />

### Mobile Layout

The interface is responsive and optimized for shop-floor use on narrow mobile viewports.

<img height="445" alt="Mobile inspection form" src="https://github.com/user-attachments/assets/926169f3-391f-42a5-ae8b-c4acdfa1b54a" />

<img height="445" alt="Mobile inspection dashboard" src="https://github.com/user-attachments/assets/f3386dea-4630-4c70-b585-283a32fa09bd" />

<img height="445" alt="Mobile inspection register" src="https://github.com/user-attachments/assets/3f29ef4e-fd4e-4691-87d4-25817ea37ae3" />

<img  height="445" alt="Mobile inspection filters" src="https://github.com/user-attachments/assets/5fe41c76-6618-4413-8c12-310603f8df28" />

### Offline Queue

When the API is unavailable, newly logged inspections are stored locally and displayed with a pending-sync indicator. Once connectivity is restored, the pending inspections are automatically synchronized with the backend.

<img height="445" alt="Offline inspection queue" src="https://github.com/user-attachments/assets/4171ed12-9c4d-4499-9e23-5d22d7dd971c" />

<img height="445" alt="Pending inspection sync" src="https://github.com/user-attachments/assets/6d919651-c6e0-48d3-8e60-90f4acfea806" />

## API reference

### Create an inspection

`POST /api/inspections`

```json
{
  "inspectionDate": "2026-09-16",
  "machineLineId": "Loom-03",
  "defectType": "Weave Defect",
  "severity": "Major",
  "remarks": "Broken warp thread"
}
```

`defectType` must be one of `Weave Defect`, `Shade Variation`, `Hole/Tear`, `Count Deviation`, or `Other`. `severity` must be `Critical`, `Major`, or `Minor`.

### List inspections

`GET /api/inspections`

Optional query parameters: `severity`, `status` (`Open` or `Resolved`), `from`, `to` (both `YYYY-MM-DD`), `sortBy` (`inspectionDate`, `createdAt`, `severity`, `status`, or `machineLineId`), and `sortOrder` (`asc` or `desc`). The default is newest inspection date first.

### Resolve an inspection

`PATCH /api/inspections/:id/resolve`

```json
{
  "resolutionNote": "Replaced damaged thread and tested the line."
}
```

The resolution note is mandatory. Resolving an already resolved inspection returns `409 Conflict`.

### Summary

`GET /api/inspections/summary` returns Open and Resolved counts for each severity.

### Authentication

The API uses simple in-memory cookie sessions. The default development credentials are `admin` / `admin`; set `AUTH_USERNAME` and `AUTH_PASSWORD` before starting the API to change them. Sessions are cleared when the API restarts.

`POST /api/auth/login` accepts `{ "username": "admin", "password": "admin" }` and sets an HTTP-only session cookie. `GET /api/auth/session` checks the current session and `POST /api/auth/logout` clears it. Inspection routes require an authenticated session.

### Mock SAP webhook

`POST /api/sap-webhook` accepts an SAP event payload and automatically creates an Open inspection record. It is intentionally not tied to the browser session, because an external SAP sender cannot use the UI's in-memory session cookie. The payload is still validated before the record is created.

```json
{
  "eventId": "SAP-QI-20260916-0001",
  "eventType": "QUALITY_INSPECTION_CREATED",
  "inspection": {
    "inspectionDate": "2026-09-16",
    "machineLineId": "Loom-03",
    "defectType": "Weave Defect",
    "severity": "Major",
    "remarks": "Broken warp thread reported by SAP quality inspection."
  }
}
```

`eventId` and `inspection` are required. `eventType` and other SAP metadata are accepted but not persisted. The `inspection` fields use the same rules as `POST /api/inspections`: `inspectionDate` must be `YYYY-MM-DD`, `machineLineId` is required, `defectType` must be one of the documented defect types, `severity` must be `Critical`, `Major`, or `Minor`, and `remarks` is optional. A successful request returns `201 Created` with the created inspection in `data` and `{ "source": "SAP", "eventId": "..." }` in `meta`.

## Architecture decisions

### Backend structure

The backend separates HTTP routing from database operations so each layer has one responsibility. `server/src/app.js` configures Express middleware and mounts routers; `server/src/routes/` receives requests, validates inputs, and builds HTTP responses; and `server/src/repositories/inspectionsRepository.js` contains the SQLite queries and converts database rows into API-friendly inspection objects.

Shared concerns are kept outside the route handlers: `server/src/validation.js` contains request validation rules, `server/src/utils/http.js` provides common error and async-route helpers, and `server/src/database.js` owns only the SQLite connection and schema initialization. This makes it easier to change a route without changing SQL, or replace SQLite later without rewriting the API endpoints.

### Express with built-in SQLite

The API uses Express for its routing, JSON middleware, and clear endpoint structure, while using Node's built-in SQLite driver for local data storage. Express provides a familiar, maintainable backend foundation without adding unnecessary database infrastructure.

### React and Tailwind CSS

The frontend uses React for stateful forms, API-driven inspection data, filters, and the resolution flow. Tailwind CSS keeps the visual system consistent while allowing a mobile-first layout with large touch targets, stacked controls, and responsive dashboard cards.

### SQLite

SQLite is stored in a local file and initialized from a small, explicit schema on application startup. It is a good fit for this single-machine internal-tool assignment, while the data-access boundary leaves a later PostgreSQL migration straightforward.

### REST and validation

The API validates inputs before database writes and responds with a consistent `{ data }` success envelope or `{ error }` error envelope. Sorting is restricted to an allowlist of database columns so the flexible list endpoint remains safe and predictable.

## Assumptions and future work

- Every new inspection starts as Open and cannot be reopened in this MVP.
- Date filters use the inspection date, not the record-creation timestamp; both range bounds are inclusive.
- Machine/line IDs remain free text as specified in the assignment.
- With more time, I would add pagination for large inspection volumes, an audit trail, and session persistence across API restarts.

### Offline support

New inspections are queued in browser `localStorage` when the API is unavailable or the device is offline. The queue is retried when the app starts and when the browser fires the `online` event. Pending records remain on the device until the API accepts them, and the tracker shows the number waiting to sync. Clearing browser storage removes unsynced inspections, so reconnect before clearing site data.
