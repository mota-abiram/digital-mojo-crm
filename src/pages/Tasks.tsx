import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { CheckSquare, Search, Filter, Calendar, Clock, ArrowRight } from 'lucide-react';
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns';
import { Task } from '../types';

const Tasks: React.FC = () => {
    const { opportunities, updateOpportunity } = useStore();
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
    const [search, setSearch] = useState('');

    // Flatten tasks from all opportunities
    const allTasks = useMemo(() => {
        const tasks: (Task & { opportunityName: string; opportunityId: string })[] = [];
        opportunities.forEach(opp => {
            if (opp.tasks) {
                opp.tasks.forEach(task => {
                    tasks.push({
                        ...task,
                        opportunityName: opp.name,
                        opportunityId: opp.id
                    });
                });
            }
        });
        return tasks;
    }, [opportunities]);

    const filteredTasks = useMemo(() => {
        return allTasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
            const matchesFilter =
                filter === 'all' ? true :
                    filter === 'completed' ? task.isCompleted :
                        !task.isCompleted;
            return matchesSearch && matchesFilter;
        }).sort((a, b) => {
            // Sort by due date
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
    }, [allTasks, filter, search]);

    const handleToggleTask = (task: Task & { opportunityId: string }) => {
        const opp = opportunities.find(o => o.id === task.opportunityId);
        if (!opp || !opp.tasks) return;

        const updatedTasks = opp.tasks.map(t =>
            t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t
        );

        updateOpportunity(task.opportunityId, { tasks: updatedTasks });
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
                        {(['all', 'pending', 'completed'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {f}
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
                        <p className="text-gray-500 max-w-sm">
                            {search ? 'Try adjusting your search terms.' : 'You have no tasks matching this filter. Great job!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 max-w-5xl mx-auto">
                        {filteredTasks.map(task => (
                            <div
                                key={task.id}
                                className={`group bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4 ${task.isCompleted ? 'opacity-75 bg-gray-50' : ''
                                    }`}
                            >
                                <button
                                    onClick={() => handleToggleTask(task)}
                                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${task.isCompleted
                                            ? 'bg-primary border-primary text-white'
                                            : 'border-gray-300 hover:border-primary text-transparent'
                                        }`}
                                >
                                    <CheckSquare size={14} fill="currentColor" />
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className={`font-medium text-gray-900 truncate ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                                            {task.title}
                                        </h3>
                                        {getDueDateLabel(task.dueDate)}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <ArrowRight size={12} />
                                            {task.opportunityName}
                                        </span>
                                        {task.dueDate && (
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {task.dueDate}
                                            </span>
                                        )}
                                        {task.dueTime && (
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {task.dueTime}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tasks;
