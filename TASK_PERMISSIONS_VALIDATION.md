# Task Permissions Implementation - Verification Guide

## 🎯 Objectives
Strictly enforce task ownership and assignment rules:
1. **Edit/Delete**: Only the **Task Creator** can edit or delete a task.
2. **Complete**: Only the **Assigned User** can mark a task as complete.

---

## ✅ Implementation Summary

### 1. Data Model (`src/types.ts`)
- Added `createdBy` field to `Task` interface to track ownership.
- Note: Legacy tasks (without `CREATED_BY`) remain editable/deletable by anyone to prevent lock-out.

### 2. UI Enforcement

#### **Opportunities Page (`src/pages/Opportunities.tsx`)**
- **Edit Button**: Hidden for non-creators. Replaced with disabled icon + tooltip.
- **Delete Button**: Hidden for non-creators. Replaced with disabled icon + tooltip.
- **Checkbox**: Hidden/Disabled for non-assignees.

#### **Tasks Page (`src/pages/Tasks.tsx`)**
- **Completion Checkbox**: 
  - If you are the assignee: ✅ Clickable
  - If you are NOT the assignee: ❌ Disabled & greyed out

### 3. Backend/Store Enforcement (`src/store/useStore.ts`)
- Added validation logic to `updateOpportunity`.
- Before sending updates to Firestore, the store:
  1. Detects deleted tasks → Checks if current user is Creator.
  2. Detects modified tasks → Checks if modifications are allowed.
  3. **Diffing Logic**:
     - If only `isCompleted` changed → Allowed ONLY if user is Assignee.
     - If other fields changed (Title, Date, etc.) → Allowed ONLY if user is Creator.

---

## 🧪 Validation Checklist for User

### Scenario 1: You Create a Task
1. Create a task in an Opportunity.
2. Assign it to someone else (e.g., User B).
3. **Verify**:
   - [ ] You see **Edit** button (enabled).
   - [ ] You see **Delete** button (enabled).
   - [ ] You see **Checkbox** (disabled/greyed out because you assigned it to User B).

### Scenario 2: You Are Assigned a Task (Created by Someone Else)
1. Log in as User B.
2. Find the task created by User A.
3. **Verify**:
   - [ ] **Edit** button is hidden/disabled.
   - [ ] **Delete** button is hidden/disabled.
   - [ ] **Checkbox** is enabled (You can complete it).

### Scenario 3: Third Party View (Not Creator, Not Assignee)
1. Log in as User C.
2. View the task created by User A, assigned to User B.
3. **Verify**:
   - [ ] **Edit** button is hidden/disabled.
   - [ ] **Delete** button is hidden/disabled.
   - [ ] **Checkbox** is hidden/disabled.

### Scenario 4: "Backend" Validation (Console Test)
1. Open Browser Console.
2. Try to manually call `updateOpportunity` to delete a task you didn't create.
   ```javascript
   // Pseudo-code to test
   // This should throw "Permission denied" error in console
   ```
3. **Verify**:
   - [ ] Error message apperas: `Permission denied: You cannot delete task...`

---

## 📝 Files Modified
1. `src/types.ts`
2. `src/pages/Opportunities.tsx`
3. `src/pages/Tasks.tsx`
4. `src/store/useStore.ts`
5. `src/utils/taskPermissions.ts` (New file)

---

**Status**: ✅ **Implemented & Secured**
**Date**: 2026-01-19
