Here is a comprehensive Product Requirements Document (PRD) for refactoring the existing monolithic Flask application into a modern Decoupled Architecture (Python API + React Frontend).

---

# Product Requirements Document (PRD)

## Cyber Force Management System (CFMS) - Architecture Refactor

| Metadata         | Details                                         |
| :--------------- | :---------------------------------------------- |
| **Project Name** | CFMS Refactor (Monolith to Microservices-ready) |
| **Version**      | 2.0.0                                           |
| **Status**       | Draft                                           |
| **Date**         | January 25, 2026                                |
| **Author**       | System Architect                                |

---

## 1. Executive Summary

The Cyber Force Management System is a critical tool for tracking personnel, attendance, command hierarchy, and internal transfers within a military/police cyber unit.

Currently, the system operates as a server-side rendered monolithic Flask application. The goal of this project is to decouple the frontend from the backend. We will transition to a **RESTful Python API** (Flask/FastAPI) and a modern **React (Vite)** frontend. This will improve maintainability, user experience (SPA), and scalability.

## 2. Goals & Objectives

- **Architecture Decoupling:** Separate data logic from presentation logic.
- **API-First Design:** Create a documented REST API that handles all business logic.
- **Modern UI/UX:** Implement a responsive, Single Page Application (SPA) using React.
- **Performance:** Reduce server load by shifting rendering to the client; optimize database queries.
- **Security:** Move from Session-based auth to Token-based auth (JWT).

## 3. User Personas

1.  **System Admin:** Has full access to all settings, can add/delete users, reset passwords, and view all scopes.
2.  **Department Commander (Ra'ash):** Views analytics and personnel for their specific Department and subordinates. Can approve transfers into their department.
3.  **Section Commander (Ramad):** Views analytics for their Section. Manages teams within the section.
4.  **Team Commander (Rashatz):** Manages specific soldiers, updates daily status, views immediate team data.
5.  **Soldier (Regular):** (Future scope) View own profile, self-report status (if enabled).

## 4. Technical Architecture

### 4.1. Current State (Legacy)

- **Backend:** Python (Flask).
- **Frontend:** Jinja2 Templates (HTML/CSS server-rendered).
- **Auth:** Flask-Session (Server-side cookies).
- **Database:** PostgreSQL (`psycopg2`).

### 4.2. Future State (Target)

- **Backend (API):** Python (Flask or FastAPI).
  - Responsible for DB interactions, business logic, authentication, and validation.
  - Returns JSON responses only.
- **Frontend (Client):** React + Vite.
  - State Management: React Query (TanStack Query) or Zustand.
  - Styling: TailwindCSS.
  - Routing: React Router DOM.
- **Authentication:** JWT (JSON Web Tokens) - Access & Refresh tokens.
- **Database:** PostgreSQL (Existing schema preserved).

---

## 5. Functional Requirements

### 5.1. Authentication & Security

| ID          | Requirement           | Description                                                                        | API Endpoint (Draft)             |
| :---------- | :-------------------- | :--------------------------------------------------------------------------------- | :------------------------------- |
| **AUTH-01** | Login                 | User logs in with Personal Number & Password. Returns JWT.                         | `POST /api/auth/login`           |
| **AUTH-02** | Force Password Change | If `must_change_password` is true, force update before allowing other actions.     | `POST /api/auth/change-password` |
| **AUTH-03** | Token Refresh         | Mechanism to refresh access tokens silently.                                       | `POST /api/auth/refresh`         |
| **AUTH-04** | Role Based Access     | Backend must validate permissions (Scope: Admin/Dept/Sect/Team) for every request. | Middleware                       |

### 5.2. Dashboard (Command Center)

| ID          | Requirement                | Description                                                                     | API Endpoint (Draft)               |
| :---------- | :------------------------- | :------------------------------------------------------------------------------ | :--------------------------------- |
| **DASH-01** | Statistics Overview        | Aggregate counts (Present, Sick, Vacation, etc.) based on user scope.           | `GET /api/stats/overview`          |
| **DASH-02** | Hierarchy Drill-down       | Dynamic grouping of stats by Sub-units (Dept -> Section -> Team).               | `GET /api/stats/hierarchy`         |
| **DASH-03** | Birthday Widget            | List soldiers with birthdays Today/This Week.                                   | `GET /api/employees/birthdays`     |
| **DASH-04** | Pending Requests Indicator | Badge showing count of pending transfer requests.                               | `GET /api/transfers/pending-count` |
| **DASH-05** | Quick Actions              | Buttons for Excel Export and WhatsApp Share (Client-side generation/deep link). | N/A (Client Side)                  |

### 5.3. Employee Management

| ID         | Requirement        | Description                                                                   | API Endpoint (Draft)            |
| :--------- | :----------------- | :---------------------------------------------------------------------------- | :------------------------------ |
| **EMP-01** | Employee List      | Paginated/Filtered list of employees. Search by name/personal number.         | `GET /api/employees`            |
| **EMP-02** | Employee Profile   | Detailed view: Personal info, Current Hierarchy, Status History.              | `GET /api/employees/{id}`       |
| **EMP-03** | Create Employee    | Form to add new personnel. Validation for Personal ID/National ID uniqueness. | `POST /api/employees`           |
| **EMP-04** | Edit Employee      | Update details (Phone, City, Role, Security Clearance).                       | `PUT /api/employees/{id}`       |
| **EMP-05** | Soft Delete        | Mark employee as inactive (archive) and clear current status.                 | `DELETE /api/employees/{id}`    |
| **EMP-06** | Command Assignment | Assign a user as commander of Dept/Section/Team.                              | `PUT /api/org/assign-commander` |

### 5.4. Attendance & Status

| ID         | Requirement         | Description                                                                            | API Endpoint (Draft)           |
| :--------- | :------------------ | :------------------------------------------------------------------------------------- | :----------------------------- |
| **ATT-01** | Quick Status Update | Update status for a specific user (Type, Date Range, Note). Closes previous open logs. | `POST /api/attendance/log`     |
| **ATT-02** | Calendar View       | Monthly grid view showing daily status counts or specific user presence.               | `GET /api/attendance/calendar` |
| **ATT-03** | Status Types        | Fetch list of available status types and colors.                                       | `GET /api/config/status-types` |

### 5.5. Transfer Management

| ID         | Requirement       | Description                                                        | API Endpoint (Draft)               |
| :--------- | :---------------- | :----------------------------------------------------------------- | :--------------------------------- |
| **TRF-01** | Request Transfer  | Create request to move employee to new Dept/Section/Team.          | `POST /api/transfers`              |
| **TRF-02** | View Pending      | List requests relevant to the logged-in commander.                 | `GET /api/transfers/pending`       |
| **TRF-03** | Approve/Reject    | Workflow action. Approval updates the `employees` table `team_id`. | `POST /api/transfers/{id}/resolve` |
| **TRF-04** | Organization Tree | Fetch Hierarchy (Depts->Sections->Teams) for dropdown selectors.   | `GET /api/org/tree`                |

---

## 6. Data Model (PostgreSQL)

_Reflects existing schema, no major changes required._

- **Employees:** `id, personal_number, national_id, first_name, last_name, team_id, role_id, is_commander, is_admin, password_hash...`
- **Attendance_Logs:** `id, employee_id, status_type_id, start_datetime, end_datetime, note...`
- **Transfer_Requests:** `id, employee_id, target_type, target_id, status, current_commander_id, new_commander_id...`
- **Hierarchy:** `Departments`, `Sections`, `Teams` (All linked via Foreign Keys).
- **Metadata:** `Roles`, `Status_Types`, `Service_Types`.

## 7. Frontend UI/UX Guidelines (React)

### 7.1. Technology Stack

- **Framework:** React 18+
- **Build Tool:** Vite
- **Language:** TypeScript (Highly Recommended for type safety with API).
- **Styling:** TailwindCSS (Preserve current color palette: Slate, Blue, Emerald, Amber).
- **Icons:** Bootstrap Icons (via `react-icons/bi`).
- **Charts:** Recharts or Chart.js (React wrapper).

### 7.2. Key Components to Build

1.  **LayoutWrapper:** Sidebar/Topnav, Theme Toggler, Toast Container.
2.  **Protected Route:** Checks JWT; redirects to login if missing/expired.
3.  **DataGrid/Table:** Sortable, filterable table for Employee lists.
4.  **StatusBadge:** Reusable component for displaying status with dynamic colors.
5.  **HierarchySelector:** Cascading dropdowns (Department -> Section -> Team).
6.  **Modals:** Reusable modal system for "Quick Update", "Transfer Request", "Export".

### 7.3. Internationalization (i18n)

- The application must support **RTL (Right-to-Left)** layout natively.
- All text is in **Hebrew**.

## 8. Migration Strategy

### Phase 1: Backend API Development

1.  Refactor `auth.py`: Replace `session` with `flask_jwt_extended`.
2.  Refactor `employees.py`, `main.py`: Remove `render_template`. Return `jsonify(data)`.
3.  Implement CORS support (`flask_cors`).
4.  Standardize Error Handling (Return JSON `{ success: false, error: "..." }` and HTTP codes).

### Phase 2: Frontend Skeleton

1.  Initialize Vite project (React + TS).
2.  Setup Tailwind configuration with existing color variables.
3.  Implement Login Page & JWT storage (LocalStorage/HttpOnly Cookie).

### Phase 3: Feature Porting

1.  **Dashboard:** Fetch stats from API, render Charts.
2.  **Employees:** Build the "Add User" wizard and "Profile" view.
3.  **Operations:** Connect Status Update and Transfer logic.

### Phase 4: Testing & Deployment

1.  Verify all hierarchy logic (Commanders seeing correct subordinates).
2.  Test Transfer workflows.
3.  Deploy Backend (Gunicorn/Uvicorn) and Frontend (Nginx/Static) separately.

---

## 9. API Specification (Snapshot)

### Auth

- `POST /auth/login` -> `{ token, user_details }`
- `GET /auth/me` -> `{ user_details, scope }`

### Employees

- `GET /employees?dept=X&status=Y` -> `[ { id, name, status... } ]`
- `POST /employees` -> Payload: `{ first_name, last_name, team_id... }`

### Organization

- `GET /org/structure` -> Returns full nested tree for dropdowns.

### Reports

- `GET /reports/excel` -> Returns Blob (Excel file).

---

## 10. Non-Functional Requirements

- **Responsiveness:** Must work seamlessly on Mobile devices (for commanders in the field).
- **Offline Tolerance:** (Nice to have) React Query caching to show last known data if network flickers.
- **Latency:** API responses should be under 200ms for standard queries.
