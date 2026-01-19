# Task Visibility Investigation Report

## Executive Summary
**Issue**: Tasks visible in Profile A but not visible in Profile B  
**Root Cause Identified**: ✅ **Task filtering based on `assignee` field in "My Tasks" view**  
**Severity**: Medium - Working as designed, but may need clarification or adjustment

---

## 🔍 Investigation Findings

### 1. **Data Architecture**
Tasks are **NOT** stored in a separate Firestore collection. Instead:
- Tasks are stored as an **array field** (`tasks[]`) within each `Opportunity` document
- Each task has the following structure:
  ```typescript
  interface Task {
    id: string;
    title: string;
    description?: string;
    isCompleted: boolean;
    dueDate?: string;
    dueTime?: string;
    isRecurring?: boolean;
    assignee?: string;  // ⚠️ KEY FIELD for filtering
  }
  ```

### 2. **Backend / Data Layer Analysis**

#### Opportunities Fetching (src/services/api.ts)
```typescript
// Line 143-180: opportunities.getAll()
// ✅ NO userId filtering - opportunities are SHARED across all accounts
constraints.push(orderBy('createdAt', 'desc'));
// NO where() clause filtering by userId
```

**Finding**: 
- ✅ All opportunities (and their tasks) are fetched for ALL users
- ✅ No backend filtering by user ID, role, or organization
- ✅ Data is shared globally across all logged-in users

#### Store Layer (src/store/useStore.ts)
```typescript
// Line 407-416: fetchOpportunities()
fetchOpportunities: async () => {
    set({ isLoading: true });
    const userId = get().currentUser?.id;
    const { data, lastDoc } = await api.opportunities.getAll(userId, null, 20);
    // userId is passed but NOT used in the API query
    set({
        opportunities: data,
        lastOpportunityDoc: lastDoc,
        hasMoreOpportunities: data.length === 20,
        isLoading: false
    });
}
```

**Finding**:
- ✅ Store fetches ALL opportunities regardless of user
- ✅ No role-based or permission-based filtering in the store

---

### 3. **Frontend Filtering Logic (src/pages/Tasks.tsx)**

#### Critical Code Section (Lines 42-71)
```typescript
const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
        const matchesSearch = /* ... search logic ... */;
        const matchesFilter = /* ... completed/pending logic ... */;
        
        // 🔴 THIS IS THE KEY FILTERING LOGIC
        const isAssignedToMe = (
            task.assignee === currentUser?.id || 
            task.assignee === currentUser?.email
        ) && !!(currentUser?.id || currentUser?.email);
        
        const matchesScope = viewScope === 'all' ? true : isAssignedToMe;
        
        return matchesSearch && matchesFilter && matchesScope;
    });
}, [allTasks, filter, search, viewScope, currentUser]);
```

#### View Scope Toggle (Lines 122-133)
```tsx
<div className="flex bg-white border border-gray-200 rounded-lg p-1">
    {(['my', 'all'] as const).map((v) => (
        <button
            onClick={() => setViewScope(v)}
            className={/* ... */}
        >
            {v === 'my' ? 'My Tasks' : 'All Tasks'}
        </button>
    ))}
</div>
```

**Default State** (Line 10):
```typescript
const [viewScope, setViewScope] = useState<'my' | 'all'>('my');
// ⚠️ DEFAULT is 'my' - shows only assigned tasks
```

---

## 🎯 Root Cause Analysis

### Why Profile B Sees No Tasks

**Scenario 1: Default "My Tasks" View**
- Profile B logs in → `viewScope` defaults to `'my'`
- Tasks are filtered by: `task.assignee === currentUser?.email`
- If tasks are assigned to Profile A's email/ID, they won't appear for Profile B
- **This is working as designed**

**Scenario 2: Tasks Not Assigned to Profile B**
- Tasks may have `assignee` field set to:
  - Profile A's email
  - Profile A's user ID
  - Empty/undefined
  - Another user's identifier
- Profile B will only see tasks where `task.assignee` matches their email or ID

**Scenario 3: Profile B Never Switched to "All Tasks"**
- If Profile B never clicked "All Tasks" button, they remain in "My Tasks" view
- This would hide all tasks not explicitly assigned to them

---

## 🔧 Verification Steps

### For Profile A (Seeing Tasks):
1. Check if `viewScope` is set to `'all'` or `'my'`
2. If `'my'`: Check if tasks have `assignee` matching Profile A's email/ID
3. If `'all'`: All tasks should be visible

### For Profile B (Not Seeing Tasks):
1. **First Check**: Is the "All Tasks" button selected?
   - If not → Click "All Tasks" to see all tasks
2. **Second Check**: Inspect task data in browser console:
   ```javascript
   // In browser console
   const store = window.__ZUSTAND_STORE__;
   console.log('Current User:', store.currentUser);
   console.log('All Opportunities:', store.opportunities);
   console.log('Tasks:', store.opportunities.flatMap(o => o.tasks || []));
   ```
3. **Third Check**: Verify `assignee` field values:
   ```javascript
   store.opportunities.forEach(opp => {
       opp.tasks?.forEach(task => {
           console.log(`Task: ${task.title}, Assignee: ${task.assignee}`);
       });
   });
   ```

---

## 📊 Data Integrity Checks

### Database Query (Firestore Console)
1. Navigate to Firestore → `opportunities` collection
2. Check any opportunity document
3. Verify `tasks` array exists and contains task objects
4. Check `assignee` field values in tasks

### No Soft-Delete Flags
✅ **Confirmed**: No `is_deleted`, `is_active`, or `status` flags on tasks
- Tasks are either present in the array or not
- No soft-delete mechanism implemented

---

## 🚨 Identified Issues

### Issue #1: Misleading Default State
**Problem**: Default view is "My Tasks" but users may not realize this
**Impact**: Users think tasks are missing when they're just filtered
**Recommendation**: 
- Change default to `'all'` for broader visibility
- Add a visual indicator showing active filter
- Add task count badges: "My Tasks (5)" vs "All Tasks (23)"

### Issue #2: Assignee Matching Logic
**Problem**: Matching uses both `currentUser?.id` and `currentUser?.email`
**Impact**: Inconsistent task assignment if some tasks use ID, others use email
**Current Code** (Line 54):
```typescript
const isAssignedToMe = (
    task.assignee === currentUser?.id || 
    task.assignee === currentUser?.email
) && !!(currentUser?.id || currentUser?.email);
```
**Recommendation**: Standardize on either ID or email, not both

### Issue #3: No Visual Feedback for Empty States
**Problem**: When "My Tasks" is empty, users don't know why
**Current Code** (Lines 144-146):
```typescript
<p className="text-gray-500 max-w-sm mb-6">
    {search || filter !== 'pending' || viewScope !== 'my' 
        ? 'Try adjusting your search terms or filters.' 
        : 'You have no tasks matching this filter. Great job!'}
</p>
```
**Recommendation**: Add more specific messaging:
- "You have no tasks assigned to you. Switch to 'All Tasks' to see team tasks."

---

## ✅ Recommended Solutions

### Solution 1: Change Default View (Quick Fix)
```typescript
// In src/pages/Tasks.tsx, line 10
const [viewScope, setViewScope] = useState<'my' | 'all'>('all'); // Changed from 'my'
```

### Solution 2: Add Task Count Indicators
```tsx
<button onClick={() => setViewScope(v)}>
    {v === 'my' ? 'My Tasks' : 'All Tasks'}
    <span className="ml-2 text-xs">
        ({v === 'my' ? myTasksCount : allTasksCount})
    </span>
</button>
```

### Solution 3: Improve Empty State Messaging
```tsx
{filteredTasks.length === 0 && viewScope === 'my' && (
    <div>
        <p>You have no tasks assigned to you.</p>
        <button onClick={() => setViewScope('all')}>
            View All Tasks ({allTasks.length})
        </button>
    </div>
)}
```

### Solution 4: Add Debug Logging (Development Only)
```typescript
// Add after line 40 in Tasks.tsx
useEffect(() => {
    console.log('🔍 Task Debug Info:', {
        currentUser: currentUser?.email,
        totalOpportunities: opportunities.length,
        totalTasks: allTasks.length,
        filteredTasks: filteredTasks.length,
        viewScope,
        filter,
        search
    });
}, [allTasks, filteredTasks, viewScope, filter, search, currentUser]);
```

---

## 🎓 Expected Behavior Clarification

### Current Design (Working as Intended):
1. **All users see the same opportunities** (no user-level filtering)
2. **Tasks are filtered by assignee** when "My Tasks" is selected
3. **Tasks appear for all users** when "All Tasks" is selected
4. **No role-based restrictions** on task visibility

### If This Is NOT the Intended Behavior:
You may want to implement:
- Organization-level scoping (multi-tenancy)
- Role-based access control (RBAC)
- Team-based task visibility
- Owner-based opportunity filtering

---

## 🔬 Testing Checklist

- [ ] Profile A: Click "My Tasks" → Verify only assigned tasks appear
- [ ] Profile A: Click "All Tasks" → Verify all tasks appear
- [ ] Profile B: Click "My Tasks" → Check if any tasks are assigned to Profile B
- [ ] Profile B: Click "All Tasks" → Verify all tasks appear (same as Profile A)
- [ ] Create a task assigned to Profile B → Verify it appears in Profile B's "My Tasks"
- [ ] Check browser console for any errors or warnings
- [ ] Verify `currentUser.email` and `currentUser.id` are correctly set for both profiles
- [ ] Check Firestore console to confirm tasks exist in opportunities

---

## 📝 Conclusion

**The system is working as designed.** Tasks are visible to all users, but the default "My Tasks" view filters them by the `assignee` field. 

**Most Likely Cause**: Profile B is viewing "My Tasks" but has no tasks assigned to them.

**Immediate Action**: Have Profile B click the **"All Tasks"** button to see all tasks.

**Long-term Recommendation**: Consider changing the default view to "All Tasks" or adding clearer visual indicators about the current filter state.

---

## 📞 Next Steps

1. **Verify the hypothesis**: Ask Profile B to click "All Tasks" and report if tasks appear
2. **Check task assignments**: Review which tasks have `assignee` set to Profile B's email/ID
3. **Decide on default behavior**: Should new users see "My Tasks" or "All Tasks" by default?
4. **Implement improvements**: Add task count badges and better empty state messaging

---

**Report Generated**: 2026-01-19  
**Investigated By**: AI Assistant  
**Status**: ✅ Root cause identified - Working as designed with UX improvement opportunities
