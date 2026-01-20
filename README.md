# WorkHub – Enterprise Management Platform

WorkHub is a comprehensive full-stack web platform for internal company management, designed to centralize the administration of personnel, shifts, warehouse, orders, ticketing, customers, and corporate events.

Built with a modern **Node.js/Express** backend and a scalable **React** frontend, WorkHub leverages **Redux Toolkit** for state management and **TailwindCSS** for a clean, professional UI.

---

## Core Features

### Authentication & Security

- JWT-based authentication
- Session persistence via `localStorage`
- Optional Two-Factor Authentication (2FA)
- Role-based access control (user, admin)
- Secure password hashing with bcrypt
- Password recovery with temporary generated password
- Password change from user settings
- Backend input validation using Joi
- Protected routes via custom middlewares

---

### User Roles

#### **Admin**

- Full system control
- Manage users, shifts, events, warehouse, orders, customers, and tickets
- Access global dashboards and advanced filters

#### **User**

- Access to personal data only
- View personal shifts
- Read-only access to company events

---

### User & Employee Management

- User registration (admin only)
- Update employee profiles
- Change password
- Delete users
- Advanced employee dashboard
- Search and filtering
- Leave and work information management
- Admin global view / User self view

---

### Work Shifts & Calendar

- Professional calendar powered by `react-big-calendar`
- **Modes:**
  - Shifts mode – employee work schedules
  - Events mode – corporate communications
  - Switchable directly from the calendar UI
- **Features:**
  - Day / Week / Month views
  - Intelligent shift generation (52 weeks forward/backward)
  - Click expansion for detailed view
  - Department filtering (admin only)
  - Dynamic colors based on role or department
  - Monthly view optimization with merged split shifts

---

### Corporate Events Board

- Internal communication system integrated with the calendar

**Admin:**

- Create, edit, and delete events

**User:**

- Read-only access

**Event fields:**

- Title
- Start / end date
- Description

Events are automatically ordered and displayed in both the Event Board and Calendar.

---

### Customer Management

- Full customer registry
- CRUD operations
- Advanced search and filters
- Detailed customer view
- Order history association

---

### Warehouse & Orders

- Product CRUD
- Stock management with low-stock indicators
- Warehouse dashboard
- Order CRUD
- Stock updates via atomic operations

---

### Ticketing System

- Internal issue reporting
- Ticket creation and status updates
- Assignment handling
- Ticket history tracking

---

### UI / UX

- Light / Dark theme
- Fully responsive layout
- TailwindCSS-based components
- Phosphor Icons
- Language switch (ITA / ENG) via Context API
- Clean and consistent design
- Tables with inline actions, search, and sorting

---

## Backend

**Stack:**

- Node.js
- Express
- MongoDB + Mongoose
- JWT Authentication
- Joi validation
- Bcrypt
- Custom middleware
- REST-based architecture

### Main API Endpoints

#### **Auth**

- `POST /auth/login`
- `POST /auth/recover`
- `PATCH /auth/enable-2fa`
- `PATCH /auth/disable-2fa`

#### **Users**

- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id` (admin only)

#### **Events**

- `GET /events`
- `POST /events` (admin only)
- `PATCH /events/:id`
- `DELETE /events/:id`

#### **Warehouse**

- `GET /items`
- `POST /items`
- `PATCH /items/:id`
- `DELETE /items/:id`

#### **Orders**

- `GET /orders`
- `POST /orders`
- `PATCH /orders/:id`
- `DELETE /orders/:id`

#### **Tickets**

- `GET /ticketing`
- `POST /ticketing`
- `PATCH /ticketing/:id`
- `DELETE /ticketing/:id`

---

## Frontend

**Stack:**

- React + Vite
- Redux Toolkit
- React Router
- TailwindCSS
- React Big Calendar
- date-fns
- Context API
- State persistence

### Frontend Features

- Responsive layout
- Centralized global state:
  - auth
  - users
  - shifts
  - events
  - products
  - orders
  - tickets
- Full calendar integration
- Events board
- Drawers, modals, and reusable tables
- Search and sorting
- Theme switching
- Multi-language support

---


