import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { format, parseISO, isSameMinute } from 'date-fns';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { Opportunity } from '../types';

const ReminderManager: React.FC = () => {
    const { appointments, currentUser, updateOpportunity } = useStore();
    const notifiedRef = useRef<Set<string>>(new Set());
    const [todayOpportunities, setTodayOpportunities] = useState<Opportunity[]>([]);

    // Fetch opportunities with today's follow-up date
    useEffect(() => {
        if (!currentUser) return;

        const fetchTodayFollowUps = async () => {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            try {
                const opps = await api.opportunities.getByFollowUpDate(todayStr);
                setTodayOpportunities(opps);
            } catch (error) {
                console.error("Error fetching today's follow-ups:", error);
            }
        };

        fetchTodayFollowUps();
        // Refresh every 5 minutes to catch any new follow-ups
        const refreshInterval = setInterval(fetchTodayFollowUps, 5 * 60 * 1000);

        return () => clearInterval(refreshInterval);
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;

        const checkReminders = () => {
            const now = new Date();
            const todayStr = format(now, 'yyyy-MM-dd');

            // 1. Check Appointment Reminders
            if (appointments.length > 0) {
                appointments.forEach(apt => {
                    const aptKey = `apt-${apt.id}-${apt.date}-${apt.time}`;

                    if (notifiedRef.current.has(aptKey)) return;

                    try {
                        const aptDate = parseISO(`${apt.date}T${apt.time}`);

                        if (isSameMinute(now, aptDate)) {
                            toast(`Meeting Reminder: ${apt.title}`, {
                                icon: '📅',
                                duration: 8000,
                                position: 'top-right',
                                style: {
                                    borderRadius: '10px',
                                    background: '#1e2a3b',
                                    color: '#fff',
                                },
                            });

                            if ("Notification" in window && Notification.permission === "granted") {
                                new Notification("Meeting Starting Now", {
                                    body: apt.title,
                                    icon: '/dm.png'
                                });
                            }

                            notifiedRef.current.add(aptKey);
                        }
                    } catch (error) {
                        // Skip invalid dates
                    }
                });
            }

            // 2. Check Opportunity Follow-up Reminders
            if (todayOpportunities.length > 0) {
                todayOpportunities.forEach(opp => {
                    if (!opp.followUpDate || opp.followUpRead) return;

                    const oppKey = `opp-${opp.id}-${opp.followUpDate}`;

                    if (notifiedRef.current.has(oppKey)) return;

                    try {
                        // Compare current date with follow-up date (strings are YYYY-MM-DD)
                        if (opp.followUpDate === todayStr) {
                            toast((t) => (
                                <div className="flex items-center gap-3 w-full">
                                    <span className="text-xl">🎯</span>
                                    <span className="flex-1 font-medium">
                                        Follow-up: {opp.companyName || opp.name}
                                    </span>
                                    <button
                                        onClick={() => toast.dismiss(t.id)}
                                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                                        aria-label="Close"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ), {
                                id: `opp-toast-${opp.id}`,
                                duration: 10000,
                                position: 'top-right',
                                style: {
                                    borderRadius: '10px',
                                    background: '#0ea5e9',
                                    color: '#fff',
                                    fontWeight: '500',
                                    minWidth: '300px'
                                },
                            });

                            if ("Notification" in window && Notification.permission === "granted") {
                                new Notification("Follow-up Due Today", {
                                    body: `Follow-up with ${opp.companyName || opp.name}`,
                                    icon: '/dm.png'
                                });
                            }

                            notifiedRef.current.add(oppKey);
                        }
                    } catch (error) {
                        // Skip invalid dates
                    }
                });
            }
        };

        // Request browser notification permission on mount
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
        checkReminders(); // Initial check

        return () => clearInterval(interval);
    }, [appointments, todayOpportunities, currentUser]);

    return null;
};

export default ReminderManager;
