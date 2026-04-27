# Workload Management System

A full-stack workload and task management platform for software teams, with role-based access, approval workflows, workload analytics, and real-time in-app notifications.

The repository is split into:
- `Backend/` — ASP.NET Core Web API (.NET 9)
- `Frontend/workload-management-ui/` — React 19 + Vite frontend
- `Backend/WorkloadManagement.Tests/` — xUnit test suite (81 tests, all passing)

## Features

### Admin
- manage all users (create, activate/deactivate, delete)
- manage tasks across the platform
- review and action approval requests
- monitor workload and dashboard statistics
- receive in-app notifications

### Team Leader
- manage tasks for their own team members
- monitor team workload
- review member approval requests
- receive task and approval notifications

### Member
- view and filter assigned tasks
- update personal task status
- mark tasks as complete
- submit approval requests
- view personal workload and notifications

## Tech Stack

### Backend
- ASP.NET Core Web API (.NET 9)
- Entity Framework Core (NoTracking mode)
- SQL Server
- JWT authentication (Bearer tokens)
- BCrypt password hashing

### Frontend
- React 19
- Vite 5
- React Router v7
- Framer Motion
- Axios

### Tests
- xUnit 2.9.3
- Moq 4.20.70
- FluentAssertions 6.12.0

---

## Project Structure

### `Backend/`
Contains the .NET solution and all backend projects.

### `Frontend/workload-management-ui/`
Contains the React frontend application.

### `README.md`
This documentation file.

---

## Backend Structure

The backend follows a layered architecture:
- `API` = controllers and app startup
- `Application` = services, DTOs, interfaces
- `Domain` = core entities and enums
- `Infrastructure` = EF Core, repositories, migrations, security

## `Backend/WorkloadManagement.API`

This is the entry point of the backend API.

### Important files

### `Program.cs`
Configures:
- CORS
- Swagger
- database connection
- dependency injection
- JWT authentication
- controller routing

### `Controllers/AuthController.cs`
Handles:
- login
- register

### `Controllers/UsersController.cs`
Handles:
- get all users
- get current user
- create/update/delete users
- activate/deactivate users

### `Controllers/TasksController.cs`
Handles:
- get tasks
- create tasks
- update tasks
- delete tasks
- update personal task status
- mark task complete

### `Controllers/ApprovalsController.cs`
Handles:
- create approval request
- get pending approvals
- get approvals for current approver
- review approval

### `Controllers/DashboardController.cs`
Returns dashboard summary data for:
- admin
- team leader
- member

### `Controllers/WorkloadController.cs`
Handles workload endpoints and workload summary data.

### `Controllers/NotificationsController.cs`
Handles:
- get my notifications
- get unread count
- mark notification as read
- mark all notifications as read

### `appsettings.json`
Stores configuration such as:
- connection string
- JWT settings

### `Properties/launchSettings.json`
Local run profiles for ASP.NET Core development.

---

## `Backend/WorkloadManagement.Application`

This layer contains business logic.

### `Services/`
Core app logic lives here.

#### `Services/AuthService.cs`
Validates login/register logic and generates auth response data.

#### `Services/UserService.cs`
Business logic for creating, updating, deleting, and reading users.

#### `Services/TaskService.cs`
Main task logic:
- create task
- edit task
- update own task status
- complete task
- permission checks
- task notifications

#### `Services/ApprovalService.cs`
Approval logic:
- create approval request
- enforce hierarchy rules
- approve/reject request
- approval notifications

#### `Services/DashboardService.cs`
Builds summary numbers shown in the dashboards.

#### `Services/WorkloadService.cs`
Calculates:
- member workload
- team workload
- workload status

#### `Services/NotificationService.cs`
Handles:
- creating notifications
- reading notifications
- unread count
- mark as read

### `DTOs/`
DTOs are request/response models sent between controller and frontend.

#### `DTOs/Auth/`
- login and register request/response models

#### `DTOs/Users/`
- user create/update/read DTOs

#### `DTOs/Tasks/`
- task create/update/details/list DTOs

#### `DTOs/Approvals/`
- approval create/review/read DTOs

#### `DTOs/Dashboard/`
- dashboard summary DTOs

#### `DTOs/Workload/`
- workload summary/member workload DTOs

#### `DTOs/Notifications/`
- notification create and read DTOs

### `Interfaces/`
Service contracts used by controllers and infrastructure.

Important files:
- `IAuthService.cs`
- `IUserService.cs`
- `ITaskService.cs`
- `IApprovalService.cs`
- `IDashboardService.cs`
- `IWorkloadService.cs`
- `INotificationService.cs`
- `IJwtTokenGenerator.cs`
- `IPasswordHasher.cs`

---

## `Backend/WorkloadManagement.Domain`

This is the core business model layer.

### `Entities/`
Database/domain objects.

#### `Entities/User.cs`
Represents users and includes:
- role
- active status
- team leader relationship
- assigned/created tasks
- approvals
- notifications

#### `Entities/TaskItem.cs`
Represents a task with:
- title
- description
- assignee
- creator
- status
- priority
- complexity
- estimated hours
- weight

#### `Entities/TaskApproval.cs`
Represents an approval request for a task.

#### `Entities/TaskAcknowledgement.cs`
Represents member acknowledgement of task assignment.

#### `Entities/Notification.cs`
Represents an in-app notification.

#### `Entities/Role.cs`
Represents system role values.

### `Enums/`
Important enums:
- `RoleType.cs`
- `TaskStatus.cs`
- `TaskPriority.cs`
- `TaskComplexity.cs`
- `ApprovalStatus.cs`
- `NotificationType.cs`

### `Interfaces/`
Repository contracts such as:
- `IGenericRepository.cs`
- `IUserRepository.cs`
- `ITaskRepository.cs`
- `ITaskApprovalRepository.cs`
- `ITaskAcknowledgementRepository.cs`
- `INotificationRepository.cs`
- `IRoleRepository.cs`

---

## `Backend/WorkloadManagement.Infrastructure`

This layer connects the application to real storage and framework services.

### `Data/AppDbContext.cs`
EF Core database context.

Defines:
- tables (`DbSet`)
- table relationships
- entity configuration
- seed roles

### `Repositories/`
Database access implementations.

Important files:
- `GenericRepository.cs`
- `UserRepository.cs`
- `TaskRepository.cs`
- `TaskApprovalRepository.cs`
- `TaskAcknowledgementRepository.cs`
- `NotificationRepository.cs`
- `RoleRepository.cs`

### `Security/`

#### `JwtTokenGenerator.cs`
Creates JWT tokens for authenticated users.

#### `PasswordHasher.cs`
Hashes and verifies passwords.

### `Migrations/`
EF Core migration history for schema changes.

Important migrations include:
- initial create
- role seed
- approval hierarchy changes
- team leader relationship
- notifications table

---

## Frontend Structure

The frontend is inside:
- `Frontend/workload-management-ui`

## Main frontend files

### `src/main.jsx`
Frontend entry point.

Wraps the app with:
- `BrowserRouter`
- `AuthProvider`

### `src/App.jsx`
Root React app component.

### `src/index.css`
Global CSS rules used across the project.

### `src/App.css`
Additional app-level styling.

---

## `src/api/`

Frontend API wrappers for backend endpoints.

### `axios.js`
Creates the shared Axios instance and attaches JWT token automatically.

### `authApi.js`
Calls auth endpoints such as login and current user.

### `usersApi.js`
Calls user management endpoints.

### `tasksApi.js`
Calls task endpoints.

### `approvalsApi.js`
Calls approval endpoints.

### `dashboardApi.js`
Calls dashboard summary endpoints.

### `workloadApi.js`
Calls workload endpoints.

### `notificationsApi.js`
Calls notification endpoints.

---

## `src/context/`

### `AuthContext.jsx`
Stores:
- current token
- current user
- login
- logout
- auth loading state

This is the main authentication state for the frontend.

---

## `src/utils/`

### `storage.js`
Handles local storage for:
- token
- user
- clearing auth data

---

## `src/routes/`

### `AppRoutes.jsx`
Defines all application routes for:
- admin pages
- team leader pages
- member pages
- login
- unauthorized
- notifications

### `ProtectedRoute.jsx`
Blocks access unless:
- user is authenticated
- user role is allowed

---

## `src/components/layout/`

Shared layout components.

### `DashboardShell.jsx`
Main dashboard layout.

Responsible for:
- sidebar
- top bar
- role badge
- notification bell/dropdown
- page wrapper

### `Sidebar.jsx`
Additional sidebar component structure.

### `Topbar.jsx`
Top bar related layout component.

### `StatCard.jsx`
Reusable card used in dashboards to display summary values.

---

## `src/pages/`

Feature pages used in the application.

### `pages/auth/LoginPage.jsx`
Login screen for the system.

### `pages/dashboard/AdminDashboard.jsx`
Admin summary dashboard.

### `pages/dashboard/TeamLeaderDashboard.jsx`
Team leader dashboard.

### `pages/dashboard/MemberDashboard.jsx`
Member dashboard.

### `pages/users/UsersPage.jsx`
Admin user management page:
- create user
- edit user
- activate/deactivate
- delete user

### `pages/tasks/TasksPage.jsx`
Main task management page used by:
- admin
- team leader
- member

Includes:
- task creation/editing
- status changes
- mark done
- filtering/search

### `pages/tasks/MyTasksPage.jsx`
Alternative task list page focused on current user tasks.

### `pages/approvals/ApprovalsPage.jsx`
Approval workflow page:
- create approval request
- review pending approvals
- search approvals

### `pages/workload/WorkloadPage.jsx`
Team workload page for admin/team leader.

### `pages/workload/MyWorkloadPage.jsx`
Personal workload page for members.

### `pages/notifications/NotificationsPage.jsx`
Full notifications dashboard with:
- filters
- unread handling
- open action

### `pages/common/UnauthorizedPage.jsx`
Shown when a user enters a page their role cannot access.

### `pages/common/NotFoundPage.jsx`
Fallback page for invalid routes.

---

## Authentication Flow

1. User enters email and password on `LoginPage.jsx`
2. Frontend calls `authApi.loginRequest`
3. Backend validates credentials in `AuthService.cs`
4. JWT token is generated by `JwtTokenGenerator.cs`
5. Frontend stores token and user in `AuthContext`
6. Protected routes unlock according to role

---

## Task Flow

1. Admin or Team Leader creates a task
2. Task is stored in database
3. Assigned user receives a notification
4. Assignee can update status or mark done
5. Creator receives status/completion notifications
6. Dashboards and workload reflect active task counts

---

## Approval Flow

1. Member or Team Leader creates approval request
2. Backend checks hierarchy rules
3. Target approver receives notification
4. Approver approves or rejects
5. Requester receives result notification

---

## Notification Flow

Notifications are created for:
- task assigned
- task reassigned
- task status changed
- task completed
- approval submitted
- approval approved/rejected

Notifications appear:
- in the bell icon dropdown
- in the full notifications page

---

## How To Run

### Prerequisites
- .NET 9 SDK
- Node.js 18+
- SQL Server (local or remote)

### 1. Configure the database connection

Edit `Backend/WorkloadManagement.API/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=YOUR_SERVER;Database=WorkloadManagement;Trusted_Connection=True;TrustServerCertificate=True"
}
```

### 2. Apply database migrations

```powershell
cd Backend\WorkloadManagement.API
dotnet ef database update --project ..\WorkloadManagement.Infrastructure --startup-project .
```

### 3. Run the backend

```powershell
cd Backend\WorkloadManagement.API
dotnet run
```

API runs on `http://localhost:5127`.  
Swagger UI is available in development at `http://localhost:5127/swagger`.

### 4. Run the frontend

```powershell
cd Frontend\workload-management-ui
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

## Running Tests

The test project is at `Backend/WorkloadManagement.Tests/` and covers all application services.

**Run all tests from the solution root:**

```powershell
dotnet test Backend/WorkloadManagement.sln
```

**Or from the test project directory:**

```powershell
cd Backend\WorkloadManagement.Tests
dotnet test
```

**Current status: 81/81 tests passing.**

| Test class | Tests | Coverage |
|---|---|---|
| `AuthServiceTests` | 8 | Register (new, duplicate email, invalid role), Login (valid, wrong password, unknown email, inactive user) |
| `UserServiceTests` | 11 | GetAll, GetById, Create (valid, duplicate, missing leader, invalid leader), Delete (own account throws, not found), UpdateStatus |
| `TaskServiceTests` | 13 | GetAll/Mine/ById, Create (admin, user not found, leader→non-member), Delete, UpdateStatus/Complete (own/not own), weight calculation `[Theory]` |
| `ApprovalServiceTests` | 12 | Create (happy path, empty reason, not found, member→admin, wrong leader, no leader, admin self-request), Review (approve, reject, not found, already reviewed, wrong approver), GetPending, UTC datetime kind |
| `NotificationServiceTests` | 11 | Create (valid, invalid userId), CreateMany (valid, empty, all invalid), GetMine, UnreadCount, MarkAsRead (unread, already read, not found), MarkAllAsRead |
| `WorkloadServiceTests` | 11 | Acknowledge (first, duplicate, not found, not own), GetMemberWorkload (user not found, with tasks, no tasks in week), GetTeamWorkload (admin, leader, member throws), status thresholds `[Theory]` |
| `DashboardServiceTests` | 6 | AdminSummary (totals, excludes self), LeaderSummary, MemberSummary (correct counts, null workload defaults) |

---

## Notes About Generated / Optional Files

Some files/folders are framework-generated and not central to the business logic:
- `bin/`, `obj/` — build output directories
- `Class1.cs` — default placeholder files (not used)
- `.gitkeep` — empty directory markers

---

## Suggested Reading Order For New Developers

1. `Backend/WorkloadManagement.API/Program.cs`
2. `Backend/WorkloadManagement.Domain/Entities/`
3. `Backend/WorkloadManagement.Application/Services/`
4. `Backend/WorkloadManagement.Infrastructure/Data/AppDbContext.cs`
5. `Frontend/workload-management-ui/src/context/AuthContext.jsx`
6. `Frontend/workload-management-ui/src/routes/AppRoutes.jsx`
7. `Frontend/workload-management-ui/src/components/layout/DashboardShell.jsx`
8. `Frontend/workload-management-ui/src/pages/`

---

## Key Files Reference

### Backend
| File | Purpose |
|---|---|
| `Program.cs` | App configuration, DI registration, middleware |
| `AppDbContext.cs` | EF Core context, entity mappings, role seed |
| `TaskService.cs` | Core task business logic and permissions |
| `ApprovalService.cs` | Approval creation, hierarchy rules, review |
| `WorkloadService.cs` | ISO-week workload calculation |
| `DashboardService.cs` | Role-scoped summary statistics |
| `NotificationService.cs` | In-app notification creation and delivery |

### Frontend
| File | Purpose |
|---|---|
| `main.jsx` | Entry point, providers |
| `AuthContext.jsx` | JWT token and user state |
| `AppRoutes.jsx` | Route definitions and role guards |
| `DashboardShell.jsx` | Sidebar, topbar, notification bell |
| `TasksPage.jsx` | Task management UI |
| `ApprovalsPage.jsx` | Approval workflow UI |
| `NotificationsPage.jsx` | Full notifications view |
| `UsersPage.jsx` | Admin user management |

---

## Summary

Workload Pro is a role-based workload management platform connecting:
- **User management** — role assignment, team leader hierarchy
- **Task management** — creation, assignment, status tracking, completion
- **Approval workflow** — request creation, hierarchy enforcement, review
- **Workload analysis** — ISO-week weight calculation, status thresholds
- **Notifications** — event-driven in-app alerts for all major actions

The backend uses a clean layered architecture (API → Application → Domain ← Infrastructure). The frontend is organized by feature pages with shared auth state and layout components. The full service layer is covered by an automated xUnit test suite.
