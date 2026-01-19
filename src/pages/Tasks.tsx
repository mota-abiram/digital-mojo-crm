import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { CheckSquare, Search, Filter, Calendar, Clock, ArrowRight, Phone, X } from 'lucide-react';
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns';
import { Task } from '../types';
import { canEditTask, canDeleteTask, canToggleTaskCompletion } from '../utils/taskPermissions';

const Tasks: React.FC = () => {
    const { opportunities, updateOpportunity, currentUser, isLoading } = useStore();
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [viewScope, setViewScope] = useState<'my' | 'all'>('my');
    const [search, setSearch] = useState('');
    const [selectedTask, setSelectedTask] = useState<(Task & { opportunityName: string; opportunityId: string; opportunityPhone?: string }) | null>(null);

    // ... (rest of memoization code)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
            </div>
        );
    }

    // Flatten tasks from all opportunities
    const allTasks = useMemo(() => {
        const tasks: (Task & { opportunityName: string; opportunityId: string; opportunityPhone?: string })[] = [];
        opportunities.forEach(opp => {
            if (opp.tasks) {
                opp.tasks.forEach(task => {
                    tasks.push({
                        ...task,
                        opportunityName: opp.name,
                        opportunityId: opp.id,
                        opportunityPhone: opp.contactPhone
                    });
                });
            }
        });
        return tasks;
    }, [opportunities]);

    const filteredTasks = useMemo(() => {
        return allTasks.filter(task => {
            const matchesSearch =
                task.title.toLowerCase().includes(search.toLowerCase()) ||
                (task.description || '').toLowerCase().includes(search.toLowerCase()) ||
                task.opportunityName.toLowerCase().includes(search.toLowerCase());

            const matchesFilter =
                filter === 'all' ? true :
                    filter === 'completed' ? task.isCompleted :
                        !task.isCompleted;

            const isAssignedToMe = (task.assignee === currentUser?.id || task.assignee === currentUser?.email) && !!(currentUser?.id || currentUser?.email);
            const matchesScope = viewScope === 'all' ? true : isAssignedToMe;

            return matchesSearch && matchesFilter && matchesScope;
        }).sort((a, b) => {
            // Sort by completion (pending first) then by due date
            if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1;
            }
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            const dateA = new Date(`${a.dueDate}T${a.dueTime || '00:00'}`);
            const dateB = new Date(`${b.dueDate}T${b.dueTime || '00:00'}`);
            return dateA.getTime() - dateB.getTime();
        });
    }, [allTasks, filter, search, viewScope, currentUser]);

    // Calculate task counts for UI indicators
    const myTasksCount = useMemo(() => {
        return allTasks.filter(task =>
            (task.assignee === currentUser?.id || task.assignee === currentUser?.email) &&
            !!(currentUser?.id || currentUser?.email)
        ).length;
    }, [allTasks, currentUser]);

    const allTasksCount = allTasks.length;

    // Diagnostic logging (can be removed in production)
    React.useEffect(() => {
        console.log('🔍 Task Visibility Debug:', {
            currentUser: currentUser?.email,
            totalOpportunities: opportunities.length,
            totalTasks: allTasksCount,
            myTasks: myTasksCount,
            filteredTasks: filteredTasks.length,
            viewScope,
            filter,
            searchActive: !!search
        });
    }, [allTasks, filteredTasks, viewScope, filter, search, currentUser, opportunities, allTasksCount, myTasksCount]);

    const handleToggleTask = (task: Task & { opportunityId: string }) => {
        const opp = opportunities.find(o => o.id === task.opportunityId);
        if (!opp || !opp.tasks) return;

        const updatedTasks = opp.tasks.map(t =>
            t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t
        );

        updateOpportunity(task.opportunityId, { tasks: updatedTasks });
    };

    const formatTimeToAMPM = (timeStr: string) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        const m = minutes;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; // the hour '0' should be '12'
        return `${h}:${m} ${ampm}`;
    };

    const getDueDateLabel = (dateStr?: string) => {
        if (!dateStr) return null;
        const date = parseISO(dateStr);
        if (isToday(date)) return <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">Today</span>;
        if (isTomorrow(date)) return <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium">Tomorrow</span>;
        if (isPast(date)) return <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-medium">Overdue</span>;
        return <span className="text-gray-500">{format(date, 'MMM d')}</span>;
    };

    return (
        <div className="p-8 h-full flex flex-col bg-gray-50/50">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
                    <p className="text-gray-500 mt-1">Manage your daily to-dos across all opportunities</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
                        />
                    </div>
                    <div className="flex bg-white border border-gray-200 rounded-lg p-1">
                        {(['my', 'all'] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setViewScope(v)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors flex items-center gap-2 ${viewScope === v ? 'bg-brand-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {v === 'my' ? 'My Tasks' : 'All Tasks'}
                                <span className={`text-xs px-1.5 py-0.5 rounded ${viewScope === v ? 'bg-white/20' : 'bg-gray-100'}`}>
                                    {v === 'my' ? myTasksCount : allTasksCount}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400">
                            <CheckSquare size={40} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
                        <p className="text-gray-500 max-w-sm mb-6">
                            {viewScope === 'my' && myTasksCount === 0 && allTasksCount > 0 ? (
                                <>
                                    You have no tasks assigned to you. There {allTasksCount === 1 ? 'is' : 'are'}{' '}
                                    <strong>{allTasksCount}</strong> task{allTasksCount === 1 ? '' : 's'} in the system.
                                </>
                            ) : search ? (
                                'No tasks match your search. Try different keywords.'
                            ) : filter !== 'all' ? (
                                `No ${filter} tasks found. Try changing the filter.`
                            ) : (
                                'You have no tasks. Great job staying on top of things!'
                            )}
                        </p>
                        {viewScope === 'my' && myTasksCount === 0 && allTasksCount > 0 && (
                            <button
                                onClick={() => setViewScope('all')}
                                className="px-4 py-2 bg-brand-blue text-white rounded-lg font-medium hover:bg-brand-blue/90 transition-colors mb-4"
                            >
                                View All Tasks ({allTasksCount})
                            </button>
                        )}
                        {(search || filter !== 'all' || viewScope !== 'all') && !(viewScope === 'my' && myTasksCount === 0 && allTasksCount > 0) && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setFilter('all');
                                    setViewScope('all');
                                }}
                                className="text-brand-blue font-medium hover:underline"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 max-w-5xl mx-auto">
                        {filteredTasks.map(task => {
                            const canComplete = canToggleTaskCompletion(task, currentUser?.id, currentUser?.email);

                            return (
                                <div
                                    key={task.id}
                                    className={`group bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4 cursor-pointer ${task.isCompleted ? 'opacity-75 bg-gray-50' : ''
                                        }`}
                                    onClick={() => setSelectedTask(task)}
                                >
                                    {canComplete ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleTask(task);
                                            }}
                                            className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${task.isCompleted
                                                ? 'bg-primary border-primary text-black'
                                                : 'border-gray-300 hover:border-primary text-transparent'
                                                }`}
                                        >
                                            <CheckSquare size={14} fill="currentColor" />
                                        </button>
                                    ) : (
                                        <div className="flex-shrink-0 w-6 h-6 rounded border-2 border-gray-200 bg-gray-50 flex items-center justify-center opacity-50 cursor-not-allowed" title="Only assigned user can complete this task">
                                            {task.isCompleted && <CheckSquare size={14} fill="currentColor" className="text-gray-400" />}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className={`font-medium text-gray-900 truncate ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                                                {task.title}
                                            </h3>
                                            {getDueDateLabel(task.dueDate)}
                                        </div>
                                        {task.description && (
                                            <p className={`text-sm text-gray-600 mb-3 line-clamp-2 ${task.isCompleted ? 'line-through opacity-50' : ''}`}>
                                                {task.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <ArrowRight size={12} />
                                                {task.opportunityName}
                                            </span>
                                            {task.opportunityPhone && (
                                                <span className="flex items-center gap-1 text-green-600 font-medium">
                                                    <Phone size={10} />
                                                    {task.opportunityPhone}
                                                </span>
                                            )}
                                            {task.assignee && (
                                                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${task.assignee === currentUser?.id || task.assignee === currentUser?.email ? 'text-blue-600 bg-blue-50 font-bold' : 'text-gray-500 bg-gray-100 font-medium'}`}>
                                                    {task.assignee === currentUser?.id || task.assignee === currentUser?.email ? (
                                                        task.assignedBy === currentUser?.email || task.assignedBy === currentUser?.id ? (
                                                            '• Self Assigned'
                                                        ) : (
                                                            `• Assigned by ${task.assignedBy?.split('@')[0] || 'Unknown'}`
                                                        )
                                                    ) : (
                                                        <>
                                                            {task.assignedBy && task.assignee === task.assignedBy ? (
                                                                `• Self Assigned by ${task.assignee.includes('@') ? task.assignee.split('@')[0] : task.assignee}`
                                                            ) : (
                                                                <>
                                                                    • Assigned to: {task.assignee.includes('@') ? task.assignee.split('@')[0] : task.assignee}
                                                                    {task.assignedBy && (
                                                                        <span className="text-[10px] opacity-70"> by {task.assignedBy.includes('@') ? task.assignedBy.split('@')[0] : task.assignedBy}</span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </span>
                                            )}
                                            {task.dueDate && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {task.dueDate}
                                                </span>
                                            )}
                                            {task.dueTime && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {formatTimeToAMPM(task.dueTime)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* Task Details Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-bold text-gray-900 pr-8 break-words">{selectedTask.title}</h2>
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                                    {selectedTask.description ? (
                                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            {selectedTask.description}
                                        </p>
                                    ) : (
                                        <p className="text-gray-400 italic">No description provided.</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Opportunity</h3>
                                        <div className="font-medium text-gray-900 flex items-center gap-1.5">
                                            {selectedTask.opportunityName}
                                            <ArrowRight size={14} className="text-gray-400" />
                                        </div>
                                    </div>

                                    {selectedTask.opportunityPhone && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact Phone</h3>
                                            <a
                                                href={`tel:${selectedTask.opportunityPhone}`}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors"
                                            >
                                                <Phone size={14} />
                                                {selectedTask.opportunityPhone}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Assignment Information */}
                                {selectedTask.assignee && (
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <h3 className="text-sm font-semibold text-blue-900 mb-1">Assignment</h3>
                                        <p className="text-sm text-blue-700">
                                            {selectedTask.assignee === currentUser?.id || selectedTask.assignee === currentUser?.email ? (
                                                selectedTask.assignedBy === currentUser?.email || selectedTask.assignedBy === currentUser?.id ? (
                                                    <span className="font-medium">Self Assigned</span>
                                                ) : (
                                                    <>
                                                        Assigned to <span className="font-medium">You</span> by{' '}
                                                        <span className="font-medium">{selectedTask.assignedBy?.split('@')[0] || 'Unknown'}</span>
                                                    </>
                                                )
                                            ) : (
                                                <>
                                                    {selectedTask.assignedBy && selectedTask.assignee === selectedTask.assignedBy ? (
                                                        <>
                                                            Self Assigned by <span className="font-medium">{selectedTask.assignee.includes('@') ? selectedTask.assignee.split('@')[0] : selectedTask.assignee}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            Assigned to <span className="font-medium">{selectedTask.assignee.includes('@') ? selectedTask.assignee.split('@')[0] : selectedTask.assignee}</span>
                                                            {selectedTask.assignedBy && (
                                                                <> by <span className="font-medium">{selectedTask.assignedBy.includes('@') ? selectedTask.assignedBy.split('@')[0] : selectedTask.assignedBy}</span></>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center gap-6 pt-4 border-t border-gray-100 text-sm text-gray-600">
                                    {selectedTask.dueDate && (
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-brand-blue" />
                                            <span>{selectedTask.dueDate}</span>
                                        </div>
                                    )}
                                    {selectedTask.dueTime && (
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-brand-blue" />
                                            <span>{formatTimeToAMPM(selectedTask.dueTime)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end">
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Tasks;
