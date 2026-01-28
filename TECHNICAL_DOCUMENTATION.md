# Technical Documentation: Digital Mojo CRM Platform

## 1. System Overview

The Digital Mojo CRM is a high-performance, web-based SaaS platform designed specifically for SMEs and sales teams to manage their customer lifecycle. It provides a centralized hub for lead management, sales pipeline visibility, task orchestration, and team collaboration.

### Key Problems Solved
*   **Pipeline Visibility**: Real-time sales stage tracking using an interactive Kanban board.
*   **Lead Centralization**: Unified contact database accessible across the organization.
*   **Activity Accountability**: Granular task management with enforced permission rules.
*   **Data-Driven Decisions**: Automated reporting on conversion rates and pipeline trends.

### Core System Capabilities
*   **Interactive Sales Pipeline**: Drag-and-drop opportunity management.
*   **Smart Contact Linking**: Automatic contact creation/linking during opportunity entry.
*   **Collaborative Tasks**: Task assignment with role-based editing permissions.
*   **Appointment Scheduling**: Integrated calendar for sales meeting management.
*   **Communication Hub**: Messaging system for customer conversations.

---

## 2. Technology Stack

### Frontend
*   **Framework**: **React.js (v19)** - Utilizing the latest Concurrent Mode features for a responsive UI.
*   **State Management**: **Zustand** - Light-weight, high-performance state management for global data orchestration.
*   **UI Library**: **TailwindCSS (v4)** for design-token-based styling; **Lucide React** for consistent iconography.
*   **Interactive Elements**: **@dnd-kit** for robust drag-and-drop pipeline functionality.
*   **Data Visualization**: **Recharts** for real-time dashboard analytics.
*   **Routing**: **React Router (v7)** for client-side navigation.
*   **Build Tools**: **Vite** for fast HMR (Hot Module Replacement) and optimized production builds.

### Backend & Platform
*   **Platform**: **Firebase (v12)** - Scalable serverless infrastructure.
*   **Authentication**: **Firebase Auth** - Email/Password and OAuth support.
*   **Database**: **Cloud Firestore** - Real-time NoSQL database with flexible schema and horizontal scaling.
*   **Hosting**: **Firebase Hosting** for global CDN delivery.

### Third-Party Integrations
*   **Google Calendar**: Integration for syncing appointments to external calendars.
*   **Papa Parse**: Client-side CSV parsing for bulk data imports.
*   **UI Avatars**: Dynamic avatar generation for user profiles.

---

## 3. System Architecture

### High-Level Architecture
The platform follows a **Single Page Application (SPA)** architecture interacting with a **Backend-as-a-Service (BaaS)** provider.

1.  **UI Layer**: React components consuming the Zustand store.
2.  **State Layer**: Zustand store managing local cache and orchestrating API calls.
3.  **Service Layer**: Abstracted API functions in `api.ts` handling Firestore communication.
4.  **Database Layer**: Firestore collections (`contacts`, `opportunities`, `appointments`, `conversations`).

### Data Flow
*   **Real-time Synch**: Uses Firestore `onSnapshot` listeners for collaborative features like conversations and appointments.
*   **Pagination**: Contacts and Opportunities use cursor-based pagination (`startAfter`) to     handle thousands of records efficiently.
*   **Search**: Implements a hybrid approach:
    *   Direct Firestore queries for indexed fields.
    *   Client-side filtering for complex, multi-field text matching to overcome NoSQL query limitations.

---

## 4. Application Modules

### Dashboard
*   **Purpose**: Strategic overview of sales performance.
*   **Functionalities**: Conversion rate metrics, pipeline value trends, and task completion stats.
*   **Dependencies**: Recharts, `opportunities` collection.

### Contacts (Leads)
*   **Purpose**: Repository of all potential and existing clients.
*   **Functionalities**: Bulk import/export, duplicate detection, and tag management.
*   **Shared Access**: Contacts are globally visible to all organization members to prevent duplicated effort.

### Opportunities (Pipeline)
*   **Purpose**: Sales process management.
*   **Functionalities**: Multi-stage Kanban view, drag-and-drop transitions, and value tracking.
*   **Logic**: Auto-status updates (e.g., moving to "Closed" sets status to "Won").

### Tasks & Activities
*   **Purpose**: Operational execution.
*   **Functionalities**: Self-assignment, recurring tasks, and due-date notifications.
*   **Permissions**: Built-in logic ensures only creators can delete tasks, and assignees can  only  toggle completion status.

---

## 5. Data Model & Schema Design

| Entity | Key Fields | Notes |
| :--- | :--- | :--- |
| **User** | `id`, `name`, `email`, `avatar` | System identity. |
| **Contact** | `name`, `email`, `phone`, `Value`, `owner` | Core lead data; shared across users. |
| **Opportunity** | `name`, `value`, `stage`, `status`, `contactId` | Linked to a Contact; stores historical snapshots. |
| **Task** | `title`, `isCompleted`, `assignee`, `createdBy` | Embedded in Opportunities or standalone. |
| **Appointment** | `title`, `date`, `time`, `assignedTo` | Calendar-specific events. |

---

## 6. Authentication & Authorization

### Login Mechanism
Handled via `Firebase Authentication`, providing secure session management and JWT token-based API access to Firestore.

### Access Control
*   **Shared Objects**: Contacts and Opportunities are shared across the team to foster transparency.
*   **Private Objects**: Appointments are scoped to the `assignedTo` user by default.
*   **Task Permissions**: 
    *   **Edit/Delete**: Restricted to the `createdBy` user.
    *   **Completion**: Restricted to the `assignee` or `createdBy`.

---

## 7. Business Logic & Rules

### Lead Conversion
*   Creating an Opportunity triggers a search for existing Contacts via email.
*   If no match found, a new Contact is instantiated and linked automatically.

### Pipeline Transitions
*   Stages are weighted (e.g., "10 - Closed" represents success).
*   Transitions between stages update `updatedAt` timestamps for velocity reporting.

---

## 8. Scalability & Performance

*   **Database Scaling**: Firestore horizontally scales to handle millions of concurrent connections and storage.
*   **Performance Optimization**:
    *   Memoized filtering logic prevents UI lag during heavy data operations.
    *   Virtualized lists (implicit via pagination) for Contacts/Opportunities.
    *   Debounced search inputs to reduce database read count.

---

## 9. Security Considerations

*   **Data at Rest**: Encrypted using AES-256 (standard Google Cloud encryption).
*   **Data in Transit**: Forced HTTPS for all client-server communication.
*   **API Isolation**: Firestore Security Rules (defined in `firestore.rules`) enforce that only authenticated users from the same domain/organization can access data.

---

## 10. Deployment & CI/CD

*   **Environment**: Hosted on Vercel / Firebase Hosting.
*   **Build Process**: Vite-driven bundling with code-splitting for fast initial page loads.
*   **Routing Configuration**: `.htaccess` (on Apache) or `vercel.json` ensures SPA routes redirect to `index.html`.

---

## 11. Error Handling & Monitoring

*   **Logging**: Client-side console logging for API interactions.
*   **Error Reporting**: Uses `react-hot-toast` for real-time user feedback on failed operations (e.g., permission denials).
*   **Retry Mechanisms**: Firebase SDK handles automatic connection retries for real-time listeners.

---

## 12. Limitations & Future Enhancements

### Known Constraints
*   **NoSQL Queries**: Multi-field sorting requires composite index creation in Firebase.
*   **Messaging**: Currently limited to internal system communication (simulated for external channels).

### Planned Improvements
*   **Full Google Sync**: Bi-directional contact synch with Google Workspace.
*   **Email Automation**: Trigger-based follow-up emails upon pipeline movements.
*   **Advanced Permissions**: Granular role-based access control (Admin, Manager, User).
