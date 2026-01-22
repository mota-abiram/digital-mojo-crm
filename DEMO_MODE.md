# Demo Mode Guide

This CRM application now supports a **Demo Mode** that allows you to showcase the project without requiring Firebase authentication or real data. Demo mode uses dummy data stored in localStorage, making it perfect for portfolio presentations.

## How to Enable Demo Mode

### Option 1: URL Parameter (Recommended for Sharing)
Add `?demo=true` to your URL:
```
http://localhost:3000/?demo=true
```

### Option 2: LocalStorage
Open your browser's developer console and run:
```javascript
localStorage.setItem('demo_mode', 'true');
location.reload();
```

## Features in Demo Mode

- **No Authentication Required**: Automatically logs in as "Demo User"
- **Realistic Dummy Data**: 
  - 25 sample contacts
  - 30 sample opportunities across different stages
  - 15 sample appointments
  - 10 sample conversations
- **Full Functionality**: All features work as normal (create, edit, delete)
- **Data Persistence**: Changes are saved to localStorage (browser-specific)
- **Visual Indicator**: Yellow banner at the top indicating demo mode

## Demo Data Details

The demo data includes:
- **Contacts**: Names, emails, phone numbers, companies, and contact types
- **Opportunities**: Various stages (16, 17, 18, 19, 20, 20.5, 21, 10, 0) with realistic values
- **Tasks**: Associated with opportunities, some completed, some pending
- **Appointments**: Scheduled meetings with contacts
- **Conversations**: Sample chat conversations with contacts

## Resetting Demo Data

To reset the demo data to its initial state, run in the browser console:
```javascript
localStorage.removeItem('demo_contacts');
localStorage.removeItem('demo_opportunities');
localStorage.removeItem('demo_appointments');
localStorage.removeItem('demo_conversations');
localStorage.removeItem('demo_data_initialized');
location.reload();
```

## Disabling Demo Mode

To disable demo mode:
```javascript
localStorage.removeItem('demo_mode');
location.reload();
```

Or simply remove the `?demo=true` parameter from the URL.

## For Portfolio/Resume

When sharing your project:
1. Deploy your application
2. Share the URL with `?demo=true` parameter
3. The demo mode will automatically activate
4. No Firebase credentials needed for viewers

Example deployment URL:
```
https://your-app.vercel.app/?demo=true
```

## Technical Details

- Demo mode is detected via `isDemoMode()` function
- Uses `mockApi` service instead of Firebase API
- Data stored in browser localStorage
- All CRUD operations work with mock data
- Authentication is bypassed in demo mode

