import { Task } from '../types';

/**
 * Task Permission Utilities
 * 
 * These functions determine what actions a user can perform on a task
 * based on ownership and assignment rules.
 */

/**
 * Check if the current user can edit a task
 * Only the task creator can edit the task
 */
export const canEditTask = (task: Task, currentUserId?: string, currentUserEmail?: string): boolean => {
    if (!currentUserId && !currentUserEmail) return false;
    if (!task.createdBy) return true; // Legacy tasks without createdBy can be edited by anyone

    return (
        task.createdBy === currentUserId ||
        task.createdBy === currentUserEmail
    );
};

/**
 * Check if the current user can delete a task
 * Only the task creator can delete the task
 */
export const canDeleteTask = (task: Task, currentUserId?: string, currentUserEmail?: string): boolean => {
    if (!currentUserId && !currentUserEmail) return false;
    if (!task.createdBy) return true; // Legacy tasks without createdBy can be deleted by anyone

    return (
        task.createdBy === currentUserId ||
        task.createdBy === currentUserEmail
    );
};

/**
 * Check if the current user can mark a task as complete/incomplete
 * Only the assigned user can toggle task completion
 */
export const canToggleTaskCompletion = (task: Task, currentUserId?: string, currentUserEmail?: string): boolean => {
    if (!currentUserId && !currentUserEmail) return false;
    if (!task.assignee) return false; // Unassigned tasks cannot be completed

    return (
        task.assignee === currentUserId ||
        task.assignee === currentUserEmail
    );
};

/**
 * Check if the current user is the task creator
 */
export const isTaskCreator = (task: Task, currentUserId?: string, currentUserEmail?: string): boolean => {
    if (!task.createdBy) return false;

    return (
        task.createdBy === currentUserId ||
        task.createdBy === currentUserEmail
    );
};

/**
 * Check if the current user is assigned to the task
 */
export const isTaskAssignee = (task: Task, currentUserId?: string, currentUserEmail?: string): boolean => {
    if (!task.assignee) return false;

    return (
        task.assignee === currentUserId ||
        task.assignee === currentUserEmail
    );
};

/**
 * Get permission summary for a task
 * Returns an object with all permission flags
 */
export const getTaskPermissions = (task: Task, currentUserId?: string, currentUserEmail?: string) => {
    return {
        canEdit: canEditTask(task, currentUserId, currentUserEmail),
        canDelete: canDeleteTask(task, currentUserId, currentUserEmail),
        canToggleCompletion: canToggleTaskCompletion(task, currentUserId, currentUserEmail),
        isCreator: isTaskCreator(task, currentUserId, currentUserEmail),
        isAssignee: isTaskAssignee(task, currentUserId, currentUserEmail),
    };
};
