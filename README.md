# TaskFlow

TaskFlow is a small full-stack task management app with JWT authentication, project ownership, collaborative task assignment, PostgreSQL-backed persistence, and a React UI for creating and managing work.

This repository now implements the original take-home brief with:

- A Node.js + Express backend
- A React + TypeScript frontend styled with Tailwind CSS
- PostgreSQL with SQL migrations and seed data
- Docker Compose for one-command local startup

## Overview

### What the app does

- Users can register and log in
- Authenticated users can create projects
- Users can view projects they own or participate in through assigned/created tasks
- Tasks can be created, edited, filtered, reassigned, status-changed, and deleted with role-aware permissions
- The frontend includes protected routes, persisted auth, visible loading/error states, optimistic task status updates, and a persisted light/dark theme toggle

### Tech stack

- Frontend: React, TypeScript, React Router, Vite, Tailwind CSS
- Backend: Node.js, Express, pg, jsonwebtoken, bcryptjs, pino
- Database: PostgreSQL 15
- Migrations: SQL files executed by a custom Node migration runner
- Infra: Docker, Docker Compose

### UI approach

This project uses custom React components styled with Tailwind CSS utilities instead of a third-party component library. That keeps the UI lightweight while still meeting the assignment requirements for responsive layout, visible empty/loading/error states, theme switching, and task editing in a side panel.

## Architecture Decisions

### Why Node.js for the backend

The original scaffold used Go, but this implementation was written in Node.js to better match the current project direction. Express was chosen because it keeps the API surface small and readable for a take-home project while still making auth, validation, and structured error handling straightforward.

### Backend structure

- `backend/src/server.js`: startup, database readiness, auto-migrations, graceful shutdown
- `backend/src/app.js`: Express app wiring, middleware, route registration, error handling
- `backend/src/modules`: feature-oriented auth, users, and projects/task modules
- `backend/src/common`: shared middleware, auth helpers, validation, SQL utilities, and error primitives
- `backend/src/lib`: database connection and migration runner infrastructure
- `backend/db/migrations`: schema, seed data, and indexes

Each backend module follows a small repository -> service -> controller -> routes flow so database access, business rules, and HTTP concerns stay separated and readable.
 b
### Database and migrations

- The schema is defined in SQL, not ORM-generated
- Migrations run automatically when the backend container starts
- Seed data is versioned as a migration so the app is usable immediately after startup
- A small `schema_migrations` table tracks applied versions

### Auth and permissions

- Passwords are hashed with bcrypt cost 12
- JWTs expire after 24 hours and include `user_id` and `email`
- All non-auth endpoints require `Authorization: Bearer <token>`
- Project access is granted to the owner and users who already participate through created/assigned tasks
- Task updates are allowed for project owners, task creators, and assignees
- Task deletes are limited to project owners and task creators

### Tradeoffs

- I added `GET /users` so the frontend can support assignee selection cleanly
- I added `GET /projects/:id/stats` as a small bonus endpoint even though the UI does not currently consume it
- I kept the data model intentionally compact instead of introducing a separate project-membership table

### What is intentionally left out

- Automated backend integration tests are not included yet
- There is no audit log or activity history
- There is no invite/membership workflow beyond task-based collaboration visibility
- Pagination is not implemented because the dataset size in this assignment is small

## Running Locally

### Prerequisites

- Docker Desktop or Docker Engine with Compose

### Exact startup steps

```bash
git clone <your-repo-url>
cd zomatoassignment
cp .env.example .env
docker compose up --build
```

### App URLs

- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:4000`

### Notes

- The backend waits for PostgreSQL, then runs migrations automatically
- The seeded user is available immediately after startup
- PostgreSQL is kept on the internal Docker network to avoid local port collisions
- If you want a clean database reset, run:

```bash
docker compose down -v
docker compose up --build
```

## Running Migrations

Migrations run automatically on backend startup, so no manual step is required for normal local development.

Optional manual commands:

```bash
# Apply any pending migrations
docker compose exec backend npm run migrate

# Roll back the latest migration
docker compose exec backend npm run migrate:down -- 1
```

## Test Credentials

Use the seeded account to log in immediately:

```text
Email:    test@example.com
Password: password123
```

## API Reference

All responses are JSON except `204 No Content` deletes.

### Auth

#### POST `/auth/register`

Request:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}
```

Response `201`:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "created_at": "2026-04-10T12:00:00.000Z"
  }
}
```

#### POST `/auth/login`

Request:

```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

Response `200`:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "created_at": "2026-04-10T12:00:00.000Z"
  }
}
```

### Users

#### GET `/users`

Returns all users so the frontend can populate assignee filters and task forms.

Response `200`:

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Seed User",
      "email": "test@example.com",
      "created_at": "2026-04-10T12:00:00.000Z"
    }
  ]
}
```

### Projects

#### GET `/projects`

Returns projects the current user owns or participates in.

Response `200`:

```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Demo Project",
      "description": "A seeded project for testing",
      "owner_id": "uuid",
      "created_at": "2026-04-10T12:00:00.000Z"
    }
  ]
}
```

#### POST `/projects`

Request:

```json
{
  "name": "Website Redesign",
  "description": "Q2 delivery work"
}
```

Response `201`:

```json
{
  "id": "uuid",
  "name": "Website Redesign",
  "description": "Q2 delivery work",
  "owner_id": "uuid",
  "created_at": "2026-04-10T12:00:00.000Z"
}
```

#### GET `/projects/:id`

Response `200`:

```json
{
  "id": "uuid",
  "name": "Demo Project",
  "description": "A seeded project for testing",
  "owner_id": "uuid",
  "created_at": "2026-04-10T12:00:00.000Z",
  "tasks": [
    {
      "id": "uuid",
      "title": "Review project",
      "description": "Inspect seeded project and tasks",
      "status": "in_progress",
      "priority": "high",
      "project_id": "uuid",
      "assignee_id": null,
      "creator_id": "uuid",
      "due_date": "2026-05-02T13:30:00.000Z",
      "created_at": "2026-04-10T12:00:00.000Z",
      "updated_at": "2026-04-10T12:00:00.000Z",
      "assignee_name": null,
      "creator_name": "Seed User"
    }
  ]
}
```

#### PATCH `/projects/:id`

Request:

```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

Response `200`:

```json
{
  "id": "uuid",
  "name": "Updated Name",
  "description": "Updated description",
  "owner_id": "uuid",
  "created_at": "2026-04-10T12:00:00.000Z"
}
```

#### DELETE `/projects/:id`

Response `204`

#### GET `/projects/:id/stats`

Bonus endpoint that returns counts grouped by status and assignee.

Response `200`:

```json
{
  "by_status": [
    { "status": "done", "count": 1 },
    { "status": "in_progress", "count": 1 },
    { "status": "todo", "count": 1 }
  ],
  "by_assignee": [
    { "assignee": "Seed User", "count": 2 },
    { "assignee": "Unassigned", "count": 1 }
  ]
}
```

### Tasks

#### GET `/projects/:id/tasks`

Supports:

- `?status=todo|in_progress|done`
- `?assignee=<uuid>`
- `?assignee=unassigned`

Response `200`:

```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Write seed data",
      "description": "Create initial tasks for the app",
      "status": "todo",
      "priority": "medium",
      "project_id": "uuid",
      "assignee_id": "uuid",
      "creator_id": "uuid",
      "due_date": "2026-04-30T09:00:00.000Z",
      "created_at": "2026-04-10T12:00:00.000Z",
      "updated_at": "2026-04-10T12:00:00.000Z",
      "assignee_name": "Seed User",
      "creator_name": "Seed User"
    }
  ]
}
```

#### POST `/projects/:id/tasks`

Request:

```json
{
  "title": "Design homepage",
  "description": "Create new hero section",
  "status": "todo",
  "priority": "high",
  "assignee_id": "uuid",
  "due_date": "2026-05-15T14:30:00.000Z"
}
```

Response `201`:

```json
{
  "id": "uuid",
  "title": "Design homepage",
  "description": "Create new hero section",
  "status": "todo",
  "priority": "high",
  "project_id": "uuid",
  "assignee_id": "uuid",
  "creator_id": "uuid",
  "due_date": "2026-05-15T14:30:00.000Z",
  "created_at": "2026-04-10T12:00:00.000Z",
  "updated_at": "2026-04-10T12:00:00.000Z",
  "assignee_name": "Seed User",
  "creator_name": "Seed User"
}
```

#### PATCH `/tasks/:id`

Request:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "done",
  "priority": "low",
  "assignee_id": null,
  "due_date": "2026-05-20T11:15:00.000Z"
}
```

Response `200`:

```json
{
  "id": "uuid",
  "title": "Updated title",
  "description": "Updated description",
  "status": "done",
  "priority": "low",
  "project_id": "uuid",
  "assignee_id": null,
  "creator_id": "uuid",
  "due_date": "2026-05-20T11:15:00.000Z",
  "created_at": "2026-04-10T12:00:00.000Z",
  "updated_at": "2026-04-10T12:05:00.000Z",
  "assignee_name": null,
  "creator_name": "Seed User"
}
```

#### DELETE `/tasks/:id`

Response `204`

### Error responses

Validation error:

```json
{
  "error": "validation failed",
  "fields": {
    "email": "is required"
  }
}
```

Unauthenticated:

```json
{
  "error": "unauthorized"
}
```

Forbidden:

```json
{
  "error": "forbidden"
}
```

Not found:

```json
{
  "error": "not found"
}
```

## What I'd Do With More Time

- Add backend integration tests for auth, task permissions, and migrations
- Introduce project memberships instead of inferring collaboration from tasks
- Add pagination and search on list endpoints
- Add richer task board interactions like drag-and-drop between status columns
- Add activity history and inline toasts for create/edit/delete success states
- Add stronger end-to-end browser tests around auth persistence and optimistic status updates
