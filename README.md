# GoHighLevel CRM Clone

A fully functional CRM system built with React, Vite, Tailwind CSS, and Firebase.

## Features

- **Dashboard**: Real-time statistics, charts (Recharts), and activity feed.
- **Contacts**: CRUD operations, search, filtering, and detailed view.
- **Opportunities**: Kanban board with drag-and-drop (dnd-kit) for pipeline management.
- **Calendars**: Weekly and Monthly views, appointment scheduling, and mini-calendar.
- **Conversations**: Real-time chat interface with message history.
- **Launchpad**: Onboarding checklist.
- **Global Features**:
  - Global Search (Contacts & Opportunities).
  - Dark Mode support.
  - Responsive Sidebar & Navigation.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS (via CDN for simplicity, can be migrated to local), Lucide React (Icons)
- **State Management**: Zustand
- **Backend**: Firebase (Firestore, Auth)
- **Charts**: Recharts
- **Drag & Drop**: @dnd-kit/core
- **Date Handling**: date-fns

## Setup Instructions

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Firebase Configuration**:
    - Create a project in [Firebase Console](https://console.firebase.google.com/).
    - Enable **Firestore Database** and **Authentication**.
    - Create a `.env` file in the root directory with your Firebase credentials:
      ```env
      VITE_FIREBASE_API_KEY=your_api_key
      VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
      VITE_FIREBASE_PROJECT_ID=your_project_id
      VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
      VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
      VITE_FIREBASE_APP_ID=your_app_id
      ```

3.  **Run Locally**:
    ```bash
    npm run dev
    ```

4.  **Build for Production**:
    ```bash
    npm run build
    ```
    The output will be in the `dist` folder.

## Folder Structure

- `src/components`: Reusable UI components (Layout, etc.)
- `src/pages`: Main page components (Dashboard, Contacts, etc.)
- `src/store`: Zustand store for global state management.
- `src/services`: API abstraction layer for Firebase.
- `src/lib`: Firebase initialization.
- `src/types.ts`: TypeScript interfaces.

## Notes

- The app uses a mock/optimistic update approach for some features to ensure smooth UX.
- Ensure Firestore rules allow read/write for development or configure proper security rules.
