import { Task } from '../types';

export const canToggleTaskCompletion = (
    task: Task,
    userId?: string,
    userEmail?: string
) => {
    if (!task || !userId && !userEmail) return false;

    return (
        task.assignee === userId ||
        task.assignee === userEmail
    );
};

export const canEditTask = canToggleTaskCompletion;
export const canDeleteTask = canToggleTaskCompletion;
