# WorkHub – Enterprise Management Platform

WorkHub is a comprehensive full-stack web platform for internal company management, designed to centralize the administration of personnel, shifts, warehouse, orders, ticketing, customers, and corporate events.

Built with a modern **Node.js/Express** backend and a scalable **React** frontend, WorkHub leverages **Redux Toolkit** for state management and **TailwindCSS** for a clean, professional UI.

---

## Platform Preview

<table>
  <tr>
    <td width="50%">
      <img src="docs/media/workhub-overview-light.png" alt="WorkHub overview dashboard in light mode" />
      <br />
      <sub><b>Overview dashboard (light mode)</b></sub>
    </td>
    <td width="50%">
      <img src="docs/media/workhub-overview-dark.png" alt="WorkHub overview dashboard in dark mode" />
      <br />
      <sub><b>Overview dashboard (dark mode)</b></sub>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/media/workhub-calendar.png" alt="WorkHub calendar with weekly shifts" />
      <br />
      <sub><b>Calendar and shift planning</b></sub>
    </td>
    <td width="50%">
      <img src="docs/media/workhub-employee.png" alt="WorkHub employee profile and weekly shifts" />
      <br />
      <sub><b>Employee profile and shifts</b></sub>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/media/workhub-customers.png" alt="WorkHub customer registry" />
      <br />
      <sub><b>Customer registry</b></sub>
    </td>
    <td width="50%">
      <img src="docs/media/workhub-customer-detail.png" alt="WorkHub customer detail with order history" />
      <br />
      <sub><b>Customer detail and order history</b></sub>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/media/workhub-warehouse.png" alt="WorkHub warehouse inventory dashboard" />
      <br />
      <sub><b>Warehouse inventory</b></sub>
    </td>
    <td width="50%">
      <img src="docs/media/workhub-orders.png" alt="WorkHub order management with customer breakdown" />
      <br />
      <sub><b>Order management</b></sub>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/media/workhub-ticketing.png" alt="WorkHub ticketing dashboard" />
      <br />
      <sub><b>Ticketing dashboard</b></sub>
    </td>
    <td width="50%">
      <img src="docs/media/workhub-settings.png" alt="WorkHub user settings" />
      <br />
      <sub><b>User settings (profile, language, theme)</b></sub>
    </td>
  </tr>
</table>

## Demo Videos

- [Authentication demo](docs/media/workhub-demo-1.mp4)
- [Platform walkthrough](docs/media/workhub-demo-2.mp4)

---

## Role-based UI

WorkHub uses the same layout for every user, but several routes render **different components** depending on the JWT role (`admin` vs `user`). The sidebar label also changes: admins see **Personale**, users see **Profilo** on the same `/personale` route.

| Area | User (`user`) | Admin (`admin`) |
|------|----------------|-----------------|
| `/board` | Read-only events board + calendar | KPI cards, low-stock widget, **Bacheca** CRUD, department filters on calendar |
| `/personale` | Personal profile, own shifts, leave requests | Full **Personale** registry: add / edit / delete employees |
| `/ticket` | Simple ticket creator (`TicketCreator`) | Analytics dashboard (`TicketPageAdmin`): chart, date range, filters |
| Calendar | Own shifts + read-only events | All shifts, department filters, event management |

Screenshots above show the **standard** experience (mostly `user` or shared views). The section below shows views that appear **only after logging in as admin**.

### Admin-only preview

<table>
  <tr>
    <td width="50%">
      <img src="docs/media/workhub-admin-overview.png" alt="Admin overview with bulletin board and shift calendar" />
      <br />
      <sub><b>Overview (admin): Bacheca, KPIs, shift calendar with department filters</b></sub>
    </td>
    <td width="50%">
      <img src="docs/media/workhub-admin-personale.png" alt="Admin personnel management table" />
      <br />
      <sub><b>Personale (admin): employee registry and CRUD actions</b></sub>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/media/workhub-admin-personale-edit.png" alt="Admin edit employee drawer" />
      <br />
      <sub><b>Edit employee (drawer form: contract, workplace, role)</b></sub>
    </td>
    <td width="50%">
      <img src="docs/media/workhub-admin-ticket.png" alt="Admin ticket analytics and list" />
      <br />
      <sub><b>Ticket (admin): trend chart + filtered ticket list</b></sub>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/media/workhub-admin-ticket-date-range.png" alt="Ticket date range picker" />
      <br />
      <sub><b>Ticket date filter: react-date-range picker with presets</b></sub>
    </td>
    <td width="50%">
      <img src="docs/media/workhub-admin-board-edit-event.png" alt="Admin edit corporate event on board" />
      <br />
      <sub><b>Bacheca (admin): create / edit events via drawer</b></sub>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img src="docs/media/workhub-admin-board-delete-event.png" alt="Admin delete event confirmation modal" width="80%" />
      <br />
      <sub><b>Delete confirmation modal (AppFeedbackModal) before removing a Bacheca event</b></sub>
    </td>
  </tr>
</table>

---

## Technology Stack

### How key features are built

| Feature | Library / approach | Where it is used |
|---------|-------------------|------------------|
| **Shift & event calendar** | [`react-big-calendar`](https://github.com/jquense/react-big-calendar) + [`date-fns`](https://date-fns.org/) localizer | `CalendarBox.jsx` on Overview and employee pages; day / week / month views, shift vs event modes |
| **Ticket trend chart** | [`@mui/x-charts`](https://mui.com/x/react-charts/) (`LineChart`) | `TicketPageAdmin.jsx` — open / resolved / total series over time |
| **Ticket period selection** | [`react-date-range`](https://github.com/hypeserver/react-date-range) (`DateRangePicker`) | `TicketPageAdmin.jsx` — presets (today, this week, this month, etc.) and custom ranges filter chart + list |
| **Downloadable PDF** | [`jspdf`](https://github.com/parallax/jsPDF) | `Product.jsx` — **Esporta PDF** generates a product sheet from warehouse detail |
| **Excel export** | [`xlsx`](https://sheetjs.com/) (SheetJS) | `CustomersRegistry.jsx` — export **Affiliazione** and **Storico Ordini** per customer |
| **UI feedback modals** | Custom `AppFeedbackModal` (React portal) | Success / error / warning / confirm dialogs across board, warehouse, customers, tickets |
| **Forms & layout** | React 19, Tailwind CSS 4, Phosphor Icons | Pages, drawers, tables |
| **Global state** | Redux Toolkit | Auth, users, shifts, events, warehouse, orders, tickets |
| **Routing & guards** | React Router 7 + `ProtectedRoute` | Public vs authenticated areas; role switches inside pages |
| **i18n** | React Context (`LanguageContext`) | IT / EN labels via `translations_it.js` / `translations_en.js` |
| **Theme** | React Context (`ThemeContext`) | Light / dark + persisted default theme in `localStorage` |
| **2FA** | `node-2fa` + `qrcode` (backend) | TOTP secret generation and QR code for authenticator apps |

### Backend stack

| Concern | Technology |
|---------|------------|
| API | Node.js, Express 5, REST `/api/v1` |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt, optional TOTP 2FA |
| Validation | Joi |
| Security headers | Helmet |
| CORS | `cors` middleware (dev-friendly localhost origins) |

---

## Core Features

### Authentication & Security

- JWT-based authentication
- Session persistence via `localStorage`
- Optional Two-Factor Authentication (2FA) — TOTP via `node-2fa`, QR setup with `qrcode`
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

- Implemented with **`react-big-calendar`** and **`date-fns`** (`CalendarBox.jsx`)
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

- Internal communication system integrated with the calendar (same data as calendar “events” mode)
- Admin actions use **drawer forms** and **`AppFeedbackModal`** for save/delete confirmations

**Admin:**

- Create, edit, and delete events from Overview **Bacheca**

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
- Detailed customer view with **order history**
- **Excel export** (`.xlsx` via **SheetJS / `xlsx`**) for affiliation data and order history per customer

---

### Warehouse & Orders

- Product CRUD
- Stock management with low-stock indicators
- Warehouse dashboard (filters, cross-location availability drawer)
- Order CRUD with per-customer breakdown on admin view
- Stock updates via atomic operations
- **PDF export** on product detail page (**`jspdf`**: downloadable product sheet)

---

### Ticketing System

- **Users:** open tickets via `TicketCreator`
- **Admins:** `TicketPageAdmin` with:
  - **`@mui/x-charts` `LineChart`** — ticket trend (open / resolved / total)
  - **`react-date-range` `DateRangePicker`** — filter by period (presets + custom range)
  - User and status filters, editable ticket list
- Ticket creation, status updates, and history tracking via REST API + Redux

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

**Core stack:** React 19, Vite 7, Redux Toolkit, React Router 7, Tailwind CSS 4, Context API (theme + i18n).

See **[Technology Stack](#technology-stack)** for libraries used per feature (calendar, charts, date range, PDF, Excel, modals).

### Frontend Features

- Responsive layout with role-based page components
- Centralized Redux slices: auth, users, shifts, events, products, orders, tickets, warehouse
- Reusable **drawers**, **tables**, and **`AppFeedbackModal`** feedback layer
- Search, sorting, and filters across modules
- Persisted theme (current + default) and IT/EN language

---

