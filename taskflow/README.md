# TaskFlow — Project & Task Management App

A full-stack project management web app with role-based access control, built with Node.js, Express, PostgreSQL (Prisma ORM), and React.

## Live Demo
> Deploy to Railway and add your live URL here.

## Features

- **Authentication** — JWT-based signup/login
- **Projects** — Create, view, update, delete projects
- **Team Management** — Invite members by email, assign Admin or Member roles
- **Tasks** — Create tasks with title, description, priority (Low/Medium/High), status, due date, and assignee
- **Status Tracking** — Inline status updates (To Do → In Progress → Done)
- **Dashboard** — Live stats: total projects, tasks by status, overdue count, your assigned tasks, recent activity
- **Role-Based Access Control**
  - **Admin**: full project control — edit/delete project, manage members, create/delete any task
  - **Member**: create tasks, update their own assigned tasks

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |
| HTTP | Axios |
| Deployment | Railway |

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@taskflow.dev` | `Admin@1234` |
| Member | `member@taskflow.dev` | `Member@1234` |

> **Admin** — full project control: edit/delete project, manage members, create/delete any task.
> **Member** — can create tasks and update their own assigned tasks.

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or cloud)

### Setup

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd taskflow

# 2. Install backend dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# 4. Push Prisma schema to database
npm run db:push

# 5. Start backend dev server (port 3001, auto-restarts on change)
npm run dev

# 6. In a second terminal — install and start frontend (port 5173)
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Available Scripts

| Command | Location | Description |
|---------|----------|-------------|
| `npm run dev` | root | Start backend with nodemon (port 3001) |
| `npm start` | root | Start backend without nodemon (production) |
| `npm run build` | root | Install client deps and build React app to `client/dist` |
| `npm run db:push` | root | Sync Prisma schema to database (no migration history) |
| `npm run db:migrate` | root | Run Prisma migrations (production deploys) |
| `npm run dev` | `client/` | Start Vite dev server (port 5173, HMR) |
| `npm run build` | `client/` | Build React app for production |
| `npm run preview` | `client/` | Preview the production build locally |

## Deployment on Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Add a **PostgreSQL** plugin to the project
4. Set environment variables in the Railway service settings:
   ```
   DATABASE_URL   (auto-filled by Railway PostgreSQL plugin)
   JWT_SECRET     your-random-secret-here
   NODE_ENV       production
   ```
5. Railway will run `npm install && npm run build` then `npx prisma db push && node src/index.js`
6. Your app is live!

> The build step compiles the React frontend into `client/dist`. The Express server serves these static files in production.

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user (auth required) |

### Projects
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| GET | `/api/projects` | ✓ | any member |
| POST | `/api/projects` | ✓ | any user |
| GET | `/api/projects/:id` | ✓ | member of project |
| PUT | `/api/projects/:id` | ✓ | Admin |
| DELETE | `/api/projects/:id` | ✓ | Admin |
| POST | `/api/projects/:id/members` | ✓ | Admin |
| DELETE | `/api/projects/:id/members/:userId` | ✓ | Admin |

### Tasks
| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/api/projects/:id/tasks` | ✓ | any project member |
| PUT | `/api/projects/:id/tasks/:taskId` | ✓ | Admin / creator / assignee |
| DELETE | `/api/projects/:id/tasks/:taskId` | ✓ | Admin / creator |

### Dashboard
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/dashboard` | ✓ |

## Project Structure

```
taskflow/
├── src/                     # Express backend
│   ├── controllers/         # Request handlers
│   ├── routes/              # Route definitions
│   ├── middleware/          # Auth & RBAC middleware
│   └── utils/               # Prisma client
├── prisma/
│   └── schema.prisma        # Database schema
├── client/                  # React frontend
│   └── src/
│       ├── pages/           # Dashboard, Projects, ProjectDetail, Login, Signup
│       ├── components/      # Layout, Modals, Navbar, Sidebar
│       ├── context/         # AuthContext
│       └── api/             # Axios client
├── railway.toml             # Railway deployment config
└── README.md
```
