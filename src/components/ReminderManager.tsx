import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { format, parseISO, isSameMinute, addMinutes } from 'date-fns';
import toast from 'react-hot-toast';

const ReminderManager: React.FC = () => {
    const { appointments, currentUser } = useStore();
    const notifiedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!currentUser || appointments.length === 0) return;

        const checkReminders = () => {
            const now = new Date();
            const nowStr = format(now, 'yyyy-MM-dd HH:mm');

            appointments.forEach(apt => {
                const aptKey = `${apt.id}-${apt.date}-${apt.time}`;

                // If already notified for this specific instance, skip
                if (notifiedRef.current.has(aptKey)) return;

                try {
                    // Appointment date and time string: "2023-10-27 09:00"
                    const aptDateTimeStr = `${apt.date} ${apt.time}`;
                    const aptDate = parseISO(`${apt.date}T${apt.time}`);

                    // Check if the appointment time is now (within the same minute)
                    if (isSameMinute(now, aptDate)) {
                        toast(`Reminder: ${apt.title} is starting now!`, {
                            icon: '⏰',
                            duration: 10000,
                            position: 'top-center',
                            style: {
                                borderRadius: '10px',
                                background: '#1e2a3b',
                                color: '#fff',
                                fontWeight: 'bold'
                            },
                        });

                        // Also try native browser notification if permitted
                        if ("Notification" in window && Notification.permission === "granted") {
                            new Notification("Reminder", {
                                body: `${apt.title} is starting now!`,
                                icon: '/dm.png'
                            });
                        }

                        notifiedRef.current.add(aptKey);
                    }
                } catch (error) {
                    // Invalid date/time format, skip
                }
            });
        };

        // Request browser notification permission on mount
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
        checkReminders(); // Initial check

        return () => clearInterval(interval);
    }, [appointments, currentUser]);

    return null; // This component doesn't render anything
};

export default ReminderManager;
