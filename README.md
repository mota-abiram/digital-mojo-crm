# Digital Mojo CRM

A comprehensive, production-ready CRM system built with React, TypeScript, Vite, Tailwind CSS, and Firebase.

## Features

### 🎯 **Dashboard**
- Real-time statistics and KPIs (total opportunities, conversion rates, revenue tracking)
- Interactive charts using Recharts (revenue trends, pipeline distribution)
- Activity feed with recent updates
- Customizable time range filters (7, 30, 90 days)

### 👥 **Contacts Management**
- **CRUD Operations**: Create, read, update, and delete contacts
- **Advanced Search**: Real-time search with debouncing across name, email, and phone
- **Filtering**: Filter by contact type (Branding, Performance, Creative, 360) and value tier
- **Contact Details**:
  - International phone number support with country codes
  - Company information and notes
  - Contact value classification (Standard, Mid, High)
  - Automatic opportunity linking
- **Bulk Operations**: 
  - Multi-select contacts
  - Bulk delete functionality
- **CSV Import/Export**: Import contacts from CSV files with automatic opportunity creation
- **Infinite Scroll**: Efficient pagination for large contact lists
- **Pipeline Integration**: Set pipeline stage directly from contact form

### 💼 **Opportunities Management**
- **Kanban Board View**: 
  - Drag-and-drop cards between pipeline stages
  - Real-time stage counts and total values
  - Infinite scroll per column
  - Color-coded stages
- **List View**: Tabular view with sorting and filtering
- **Opportunity Details**:
  - Contact linking with automatic sync
  - Value tracking and status management (Open, Won, Lost, Abandoned)
  - Source tracking and tags
  - Follow-up date scheduling
- **Tasks & Notes**:
  - Create tasks with due dates, times, and assignees
  - Task permissions (edit, delete, complete based on assignment)
  - Self-assignment detection
  - Recurring task support
  - Add notes with timestamps
- **Advanced Features**:
  - Appointment booking integrated with calendar
  - CSV import with contact auto-creation
  - Bulk delete operations
  - Stage-based filtering and sorting
  - Search across opportunity name, contact, company, and phone

### 📅 **Calendar & Appointments**
- **Multiple Views**: Weekly and monthly calendar views
- **Appointment Management**:
  - Create, edit, and delete appointments
  - Assign appointments to team members
  - Contact linking
  - Location and notes support
- **Google Calendar Integration**:
  - OAuth authentication
  - Two-way sync with Google Calendar
  - Automatic event creation and updates
- **Mini Calendar**: Quick date navigation

### ✅ **Tasks**
- **Centralized Task View**: All tasks from opportunities in one place
- **Smart Filtering**:
  - My Tasks / All Tasks toggle
  - Pending / Completed filters
  - Real-time search
- **Task Management**:
  - Assignment tracking with user resolution
  - Self-assignment detection
  - Due date indicators (Today, Tomorrow, Overdue)
  - Task completion permissions
  - Click-to-call integration for contact phone numbers
- **Task Details Modal**: Full task information with opportunity context

### ⚙️ **Settings**
- **Pipeline Customization**:
  - Drag-and-drop stage reordering
  - Add/remove pipeline stages
  - Custom stage colors
  - Stage title editing
- **Data Cleanup Tools**:
  - Remove duplicate contacts (by email/name)
  - Remove duplicate opportunities (by name/contact)
  - Reset all tasks (admin function)

### 🔐 **Authentication & User Management**
- Firebase Authentication integration
- User registration and login
- Profile management
- Team member tracking (Komal, Dhiraj, Rupal, Veda)
- Role-based permissions for tasks

### 🎨 **UI/UX Features**
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Clean, professional interface with Tailwind CSS
- **Loading States**: Skeleton screens and spinners for better UX
- **Toast Notifications**: Real-time feedback for user actions
- **Modal Dialogs**: Intuitive forms and confirmations
- **Infinite Scroll**: Efficient data loading across all list views
- **Hover Effects**: Contextual tooltips and action buttons

## Tech Stack

### Frontend
- **React 19.2.0**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Vite 6.2.0**: Lightning-fast build tool
- **React Router 7.9.6**: Client-side routing

### Styling & UI
- **Tailwind CSS 4.1.18**: Utility-first CSS framework
- **Lucide React 0.555.0**: Beautiful icon library
- **clsx & tailwind-merge**: Dynamic className management

### State Management
- **Zustand 5.0.9**: Lightweight state management
- **React Hot Toast 2.6.0**: Toast notifications

### Backend & Database
- **Firebase 12.6.0**: 
  - Firestore Database (NoSQL)
  - Authentication
  - Real-time updates
- **API Service Layer**: Abstracted Firebase operations

### Data Handling
- **date-fns 4.1.0**: Modern date utility library
- **PapaParse 5.5.3**: CSV parsing for imports
- **Recharts 3.5.1**: Composable charting library

### Drag & Drop
- **@dnd-kit/core 6.3.1**: Modern drag-and-drop toolkit
- **@dnd-kit/sortable 10.0.0**: Sortable lists
- **@dnd-kit/utilities 3.2.2**: Utility functions

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Firebase Configuration
1. Create a project in [Firebase Console](https://console.firebase.google.com/)
2. Enable **Firestore Database** and **Authentication** (Email/Password & Google)
3. Create a `.env.local` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Firestore Security Rules
Update your Firestore rules in `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Run Development Server
```bash
npm run dev
```
Access the app at `http://localhost:5173`

### 5. Build for Production
```bash
npm run build
```
The optimized build will be in the `dist` folder.

### 6. Deploy
Deploy to Firebase Hosting, Vercel, or any static hosting service:
```bash
# Firebase
firebase deploy

# Vercel
vercel deploy
```

## Project Structure

```
Digital-Mojo_CRM/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # Main layout wrapper
│   │   ├── Modal.tsx        # Modal dialog component
│   │   └── Sidebar.tsx      # Navigation sidebar
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Dashboard with stats & charts
│   │   ├── Contacts.tsx     # Contact management
│   │   ├── Opportunities.tsx # Opportunity pipeline
│   │   ├── Calendars.tsx    # Calendar & appointments
│   │   ├── Tasks.tsx        # Task management
│   │   ├── Settings.tsx     # App settings
│   │   ├── Login.tsx        # Authentication
│   │   ├── Register.tsx     # User registration
│   │   └── Profile.tsx      # User profile
│   ├── store/               # State management
│   │   └── useStore.ts      # Zustand store
│   ├── services/            # API layer
│   │   └── api.ts           # Firebase service abstraction
│   ├── lib/                 # Libraries & configs
│   │   ├── firebase.ts      # Firebase initialization
│   │   └── admin.ts         # Admin utilities
│   ├── utils/               # Utility functions
│   │   ├── taskPermissions.ts
│   │   ├── taskDiagnostics.ts
│   │   ├── countryCodes.ts
│   │   └── resetTasks.ts
│   ├── types.ts             # TypeScript interfaces
│   ├── App.tsx              # Root component
│   └── index.tsx            # Entry point
├── public/                  # Static assets
├── .env.local              # Environment variables (gitignored)
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies

```

## Key Features Explained

### Infinite Scroll Implementation
All list views (Contacts, Opportunities, Tasks) use IntersectionObserver for efficient infinite scrolling, loading data in batches of 20 items.

### Task Permission System
Tasks have granular permissions:
- Only assigned users can complete tasks
- Task creators and assigners can edit/delete
- Self-assigned tasks are clearly labeled

### Contact-Opportunity Linking
Contacts and opportunities are automatically linked:
- Creating a contact auto-creates an opportunity
- Updating contact info syncs to linked opportunities
- Deleting a contact removes linked opportunities

### Google Calendar Sync
Two-way synchronization with Google Calendar:
- OAuth 2.0 authentication
- Automatic event creation in Google Calendar
- Updates sync bidirectionally

## Development Notes

- **State Management**: Zustand provides a simple, performant alternative to Redux
- **Real-time Updates**: Firestore listeners ensure data stays in sync
- **Optimistic Updates**: UI updates immediately for better UX
- **Type Safety**: Full TypeScript coverage prevents runtime errors
- **Code Organization**: Clear separation of concerns (components, services, state)

## Security Considerations

- All routes require authentication
- Firestore rules enforce user-based access control
- Environment variables protect sensitive credentials
- Input validation on all forms
- XSS protection through React's built-in escaping

## Performance Optimizations

- Lazy loading of routes
- Infinite scroll pagination
- Debounced search inputs
- Memoized computed values
- Optimized re-renders with React.memo
- Efficient Firestore queries with indexes

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
