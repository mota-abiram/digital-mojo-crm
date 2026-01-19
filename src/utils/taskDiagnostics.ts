/**
 * Task Visibility Diagnostic Utility
 * 
 * This utility helps diagnose why tasks may not be visible for certain users.
 * Run this in the browser console when logged in as the affected user.
 */

export const diagnoseTaskVisibility = () => {
    console.log('🔍 Starting Task Visibility Diagnostic...\n');

    // Get the Zustand store instance
    const storeElement = document.querySelector('[data-store]');
    if (!storeElement) {
        console.warn('⚠️ Could not find store element. Trying alternative method...');
    }

    // Try to access store from window (if exposed in dev mode)
    // @ts-ignore
    const store = window.__ZUSTAND_STORE__ || {};

    console.group('👤 Current User Information');
    console.log('User ID:', store.currentUser?.id || 'Not found');
    console.log('User Email:', store.currentUser?.email || 'Not found');
    console.log('User Name:', store.currentUser?.name || 'Not found');
    console.groupEnd();

    console.group('📊 Opportunities & Tasks Overview');
    const opportunities = store.opportunities || [];
    console.log('Total Opportunities:', opportunities.length);

    let totalTasks = 0;
    let tasksAssignedToCurrentUser = 0;
    let tasksWithNoAssignee = 0;
    let tasksAssignedToOthers = 0;
    const assigneeBreakdown: Record<string, number> = {};

    opportunities.forEach((opp: any) => {
        if (opp.tasks && Array.isArray(opp.tasks)) {
            opp.tasks.forEach((task: any) => {
                totalTasks++;

                if (!task.assignee) {
                    tasksWithNoAssignee++;
                } else if (
                    task.assignee === store.currentUser?.id ||
                    task.assignee === store.currentUser?.email
                ) {
                    tasksAssignedToCurrentUser++;
                } else {
                    tasksAssignedToOthers++;
                }

                // Track assignee breakdown
                const assignee = task.assignee || '(unassigned)';
                assigneeBreakdown[assignee] = (assigneeBreakdown[assignee] || 0) + 1;
            });
        }
    });

    console.log('Total Tasks:', totalTasks);
    console.log('Tasks Assigned to Current User:', tasksAssignedToCurrentUser);
    console.log('Tasks with No Assignee:', tasksWithNoAssignee);
    console.log('Tasks Assigned to Others:', tasksAssignedToOthers);
    console.groupEnd();

    console.group('📋 Assignee Breakdown');
    Object.entries(assigneeBreakdown)
        .sort((a, b) => b[1] - a[1])
        .forEach(([assignee, count]) => {
            const isCurrent =
                assignee === store.currentUser?.id ||
                assignee === store.currentUser?.email;
            const marker = isCurrent ? '👉 (YOU)' : '';
            console.log(`${assignee}: ${count} tasks ${marker}`);
        });
    console.groupEnd();

    console.group('🔍 Sample Tasks (First 5)');
    let sampleCount = 0;
    opportunities.forEach((opp: any) => {
        if (sampleCount >= 5) return;
        if (opp.tasks && Array.isArray(opp.tasks)) {
            opp.tasks.forEach((task: any) => {
                if (sampleCount >= 5) return;
                console.log({
                    title: task.title,
                    assignee: task.assignee || '(unassigned)',
                    isCompleted: task.isCompleted,
                    dueDate: task.dueDate,
                    opportunityName: opp.name
                });
                sampleCount++;
            });
        }
    });
    console.groupEnd();

    console.group('⚠️ Potential Issues Detected');
    const issues: string[] = [];

    if (totalTasks === 0) {
        issues.push('❌ No tasks found in any opportunities');
    }

    if (tasksAssignedToCurrentUser === 0 && totalTasks > 0) {
        issues.push('⚠️ No tasks are assigned to the current user');
        issues.push('💡 Suggestion: Switch to "All Tasks" view to see all tasks');
    }

    if (tasksWithNoAssignee > 0) {
        issues.push(`ℹ️ ${tasksWithNoAssignee} tasks have no assignee set`);
    }

    if (!store.currentUser?.id && !store.currentUser?.email) {
        issues.push('❌ CRITICAL: Current user ID and email are both missing!');
    }

    // Check for mixed ID/email usage
    const hasIdAssignments = Object.keys(assigneeBreakdown).some(a =>
        a.length > 20 && !a.includes('@')
    );
    const hasEmailAssignments = Object.keys(assigneeBreakdown).some(a =>
        a.includes('@')
    );

    if (hasIdAssignments && hasEmailAssignments) {
        issues.push('⚠️ Tasks use mixed assignee formats (both IDs and emails)');
        issues.push('💡 Recommendation: Standardize on either user IDs or emails');
    }

    if (issues.length === 0) {
        console.log('✅ No obvious issues detected');
    } else {
        issues.forEach(issue => console.log(issue));
    }
    console.groupEnd();

    console.group('🎯 Recommendations');
    if (tasksAssignedToCurrentUser === 0 && totalTasks > 0) {
        console.log('1. Click the "All Tasks" button to view all tasks');
        console.log('2. Verify that tasks should be assigned to:', store.currentUser?.email);
        console.log('3. Check if tasks are assigned using user ID instead of email');
    }

    if (totalTasks === 0) {
        console.log('1. Verify that opportunities exist in the database');
        console.log('2. Check if opportunities have tasks arrays');
        console.log('3. Try refreshing the page or logging out and back in');
    }
    console.groupEnd();

    console.log('\n✅ Diagnostic Complete!\n');

    // Return summary object
    return {
        currentUser: {
            id: store.currentUser?.id,
            email: store.currentUser?.email,
            name: store.currentUser?.name
        },
        summary: {
            totalOpportunities: opportunities.length,
            totalTasks,
            tasksAssignedToCurrentUser,
            tasksWithNoAssignee,
            tasksAssignedToOthers
        },
        assigneeBreakdown,
        issues
    };
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.diagnoseTaskVisibility = diagnoseTaskVisibility;
    console.log('💡 Task diagnostic utility loaded! Run: diagnoseTaskVisibility()');
}
