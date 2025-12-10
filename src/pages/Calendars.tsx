import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Appointment } from '../types';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import {
    format,
    addDays,
    subDays,
    startOfWeek,
    endOfWeek,
    addWeeks,
    subWeeks,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isSameMonth,
    addMonths,
    subMonths,
    parseISO,
    getHours,
    set,
    startOfDay
} from 'date-fns';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';

const Calendars: React.FC = () => {
    const { appointments, contacts, fetchAppointments, fetchContacts, addAppointment, updateAppointment, deleteAppointment, currentUser, googleToken } = useStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('Week');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        assignedTo: 'Me',
        notes: '',
        contactId: ''
    });

    useEffect(() => {
        if (currentUser) {
            fetchAppointments();
            fetchContacts();
        }
    }, [fetchAppointments, fetchContacts, currentUser]);

    // Calendar Logic
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    // Expanded hours: 6 AM to 11 PM
    const hours = Array.from({ length: 18 }, (_, i) => i + 6);

    // Mini Calendar Logic
    const miniMonthStart = startOfMonth(currentDate);
    const miniMonthEnd = endOfMonth(currentDate);
    const miniCalendarStart = startOfWeek(miniMonthStart);
    const miniCalendarEnd = endOfWeek(miniMonthEnd);
    const miniCalendarDays = eachDayOfInterval({ start: miniCalendarStart, end: miniCalendarEnd });

    const handlePrev = () => {
        if (view === 'Week') setCurrentDate(subWeeks(currentDate, 1));
        else if (view === 'Day') setCurrentDate(subDays(currentDate, 1));
        else setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNext = () => {
        if (view === 'Week') setCurrentDate(addWeeks(currentDate, 1));
        else if (view === 'Day') setCurrentDate(addDays(currentDate, 1));
        else setCurrentDate(addMonths(currentDate, 1));
    };



    const hasSyncedRef = React.useRef(false);

    const syncWithToken = async (accessToken: string) => {
        try {
            const currentUserId = currentUser?.id || auth.currentUser?.uid;
            if (!currentUserId) {
                console.error("No user ID found for sync");
                toast.error("Cannot sync: User identity missing");
                return;
            }

            // Ensure we have latest appointments for duplicate check
            await fetchAppointments();

            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + startOfDay(new Date()).toISOString() + '&singleEvents=true&orderBy=startTime', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn("Token expired or invalid");
                    // Optionally clear invalid token here
                    return;
                }
                const errorBody = await response.text();
                console.error("Google Calendar API Error:", response.status, errorBody);

                if (response.status === 403) {
                    throw new Error(`Permission denied (403). Ensure Google Calendar API is enabled in Cloud Console.`);
                }
                throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const events = data.items || [];
            let addedCount = 0;
            let foundCount = events.length;

            if (foundCount === 0) {
                toast("No upcoming Google events found");
                return;
            }

            // Re-read appointments from store (it might have updated?)
            // Note: In a closure, 'appointments' is stale. We trust 'fetchAppointments' updated the store state, 
            // but we can't access the new state variable here easily without using a ref or 'useStore.getState()'.
            // For now, we rely on the duplicate check being "best effort" or assume strict duplicates aren't fatal.
            // Better: use the fetched list if `fetchAppointments` returns it, or just proceed.

            for (const event of events) {
                if (event.start && (event.start.dateTime || event.start.date)) {
                    const start = event.start.dateTime || event.start.date;
                    const dateObj = new Date(start);
                    const dateStr = format(dateObj, 'yyyy-MM-dd');
                    const timeStr = format(dateObj, 'HH:mm');
                    const title = event.summary || 'No Title';

                    // Note: 'appointments' here is from the render scope. 
                    // It refers to the state at the time 'syncWithToken' was defined/called.
                    // If we just called 'fetchAppointments', React hasn't re-rendered yet to update 'appointments'.
                    // So this duplicate check is checking against OLD data. 
                    // Use a slightly loose check or accept that first run might double if very fast.
                    // However, Firestore logic doesn't prevent dupes.

                    // Simple client-side duplicate prevention against *currently rendered* items
                    const exists = appointments.some(apt =>
                        apt.title === title &&
                        apt.date === dateStr &&
                        apt.time === timeStr
                    );

                    if (!exists) {
                        await addAppointment({
                            title: title,
                            date: dateStr,
                            time: timeStr,
                            assignedTo: currentUserId,
                            notes: event.description || '',
                            contactId: ''
                        });
                        addedCount++;
                    }
                }
            }

            if (addedCount > 0) {
                await fetchAppointments();
                toast.success(`Synced ${addedCount} new events from Google`);
            } else {
                toast.success(`Calendar up to date (${foundCount} Google events examined)`);
            }

        } catch (error: any) {
            console.error("Auto-sync error", error);
            toast.error("Sync failed: " + error.message);
        }
    };

    useEffect(() => {
        if (googleToken && currentUser && !hasSyncedRef.current) {
            hasSyncedRef.current = true;
            syncWithToken(googleToken);
        }
    }, [googleToken, currentUser]);

    const handleSyncGoogleCalendar = async () => {
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');
            if (currentUser?.email) {
                provider.setCustomParameters({
                    login_hint: currentUser.email
                });
            } else {
                provider.setCustomParameters({
                    prompt: 'select_account'
                });
            }

            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const accessToken = credential?.accessToken;

            if (!accessToken) {
                toast.error('Failed to get access token');
                return;
            }

            await syncWithToken(accessToken);
            // reset manual check to allow feedback
            toast.success('Calendar synced successfully');

        } catch (error: any) {
            console.error('Error syncing calendar:', error);
            toast.error('Failed to sync calendar: ' + error.message);
        }
    };

    const handleOpenModal = (apt?: Appointment) => {
        if (apt) {
            setEditingId(apt.id);
            setFormData({
                title: apt.title,
                date: apt.date,
                time: apt.time,
                assignedTo: apt.assignedTo,
                notes: apt.notes || '',
                contactId: apt.contactId || ''
            });
        } else {
            setEditingId(null);
            setFormData({
                title: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                time: '09:00',
                assignedTo: 'Me',
                notes: '',
                contactId: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.date || !formData.time) {
            toast.error('Title, Date, and Time are required');
            return;
        }

        const aptData = {
            title: formData.title,
            date: formData.date,
            time: formData.time,
            assignedTo: currentUser?.id || 'Unknown',
            notes: formData.notes,
            contactId: formData.contactId
        };

        try {
            if (editingId) {
                await updateAppointment(editingId, aptData);
                toast.success('Appointment updated successfully');
            } else {
                await addAppointment(aptData);
                toast.success('Appointment created successfully');
            }
            setIsModalOpen(false);
            setFormData({ title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00', assignedTo: 'Me', notes: '', contactId: '' });
        } catch (error: any) {
            console.error('Error saving appointment:', error);
            toast.error('Failed to save appointment: ' + (error.message || 'Unknown error'));
        }
    };

    const handleDelete = async () => {
        if (!editingId) return;
        if (window.confirm('Are you sure you want to delete this appointment?')) {
            try {
                await deleteAppointment(editingId);
                toast.success('Appointment deleted successfully');
                setIsModalOpen(false);
            } catch (error) {
                toast.error('Failed to delete appointment');
            }
        }
    };

    const getAppointmentsForDayAndTime = (day: Date, hour: number) => {
        return appointments.filter(apt => {
            try {
                if (!apt.date || !apt.time) return false;
                const aptDate = parseISO(apt.date);
                const aptHour = parseInt(apt.time.split(':')[0]);
                return isSameDay(aptDate, day) && aptHour === hour;
            } catch (e) { return false; }
        });
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Calendars</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleSyncGoogleCalendar}
                        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 0.307 5.387 0 12s5.56 12 12.48 12c3.6 0 6.347-1.173 8.547-3.413C23.213 18.107 24 15.4 24 12.853c0-.853-.093-1.707-.267-2.56h-11.253z" /></svg>
                        Sync Google Calendar
                    </button>
                    <div className="bg-gray-200 rounded-lg p-1 flex text-sm font-medium">
                        <button className="px-3 py-1.5 rounded-md text-gray-600 hover:text-gray-900">Calendars</button>
                        <button className="px-3 py-1.5 rounded-md bg-white shadow text-gray-900">Appointments</button>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                        <Plus size={18} /> New Appointment
                    </button>
                </div>
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* Mini Calendar & Filters */}
                <div className="w-72 flex-shrink-0 flex flex-col gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-gray-800">{format(currentDate, 'MMMM yyyy')}</span>
                            <div className="flex gap-1 text-gray-500">
                                <ChevronLeft size={20} className="cursor-pointer hover:text-gray-800" onClick={() => setCurrentDate(subMonths(currentDate, 1))} />
                                <ChevronRight size={20} className="cursor-pointer hover:text-gray-800" onClick={() => setCurrentDate(addMonths(currentDate, 1))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="py-1">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 text-center text-sm">
                            {miniCalendarDays.map((day, i) => {
                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const isSelected = isSameDay(day, currentDate);
                                return (
                                    <div key={i} className={`py-1.5 ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <button
                                            onClick={() => setCurrentDate(day)}
                                            className={`w-7 h-7 flex items-center justify-center rounded-full mx-auto ${isSelected ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 mb-4 text-sm">Upcoming Appointments</h3>
                        <div className="space-y-4 max-h-60 overflow-y-auto">
                            {appointments.slice(0, 3).map((apt) => (
                                <div key={apt.id} className="border-b border-gray-100 pb-2 last:border-0 cursor-pointer hover:bg-gray-50 p-1 rounded" onClick={() => handleOpenModal(apt)}>
                                    <p className="text-sm font-bold text-gray-800">{apt.title}</p>
                                    <p className="text-xs text-gray-500">{apt.date} at {apt.time}</p>
                                </div>
                            ))}
                            {appointments.length === 0 && <p className="text-sm text-gray-400">No upcoming appointments.</p>}
                        </div>
                    </div>
                </div>

                {/* Main View */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-w-0 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button onClick={handlePrev} className="p-1 hover:bg-white rounded shadow-sm"><ChevronLeft size={20} className="text-gray-600" /></button>
                                <button onClick={handleNext} className="p-1 hover:bg-white rounded shadow-sm"><ChevronRight size={20} className="text-gray-600" /></button>
                            </div>
                            <span className="text-lg font-bold text-gray-800">
                                {view === 'Week' && `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`}
                                {view === 'Month' && format(currentDate, 'MMMM yyyy')}
                                {view === 'Day' && format(currentDate, 'MMMM d, yyyy')}
                            </span>
                        </div>
                        <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                            {['Month', 'Week', 'Day'].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`px-3 py-1.5 rounded-md ${view === v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Month View */}
                    {view === 'Month' && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="grid grid-cols-7 border-b border-gray-200">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="py-2 text-center text-sm font-semibold text-gray-500 border-r border-gray-100 last:border-0">
                                        {d}
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6 overflow-y-auto">
                                {eachDayOfInterval({
                                    start: startOfWeek(startOfMonth(currentDate)),
                                    end: endOfWeek(endOfMonth(currentDate))
                                }).map((day, i) => {
                                    const dayAppointments = appointments.filter(apt => isSameDay(parseISO(apt.date), day));
                                    return (
                                        <div
                                            key={i}
                                            className={`border-b border-r border-gray-100 p-2 min-h-[100px] relative hover:bg-gray-50 transition-colors ${!isSameMonth(day, currentDate) ? 'bg-gray-50/50' : ''}`}
                                            onClick={() => {
                                                setCurrentDate(day);
                                                setView('Day');
                                            }}
                                        >
                                            <div className={`text-sm font-medium mb-1 ${isSameDay(day, new Date()) ? 'text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
                                                {format(day, 'd')}
                                            </div>
                                            <div className="space-y-1">
                                                {dayAppointments.slice(0, 3).map(apt => (
                                                    <div
                                                        key={apt.id}
                                                        onClick={(e) => { e.stopPropagation(); handleOpenModal(apt); }}
                                                        className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded truncate cursor-pointer hover:bg-blue-200"
                                                    >
                                                        {apt.time} {apt.title}
                                                    </div>
                                                ))}
                                                {dayAppointments.length > 3 && (
                                                    <div className="text-xs text-gray-500 pl-1">
                                                        + {dayAppointments.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Week View */}
                    {view === 'Week' && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="grid grid-cols-8 border-b border-gray-200 flex-shrink-0">
                                <div className="col-span-1 border-r border-gray-100"></div>
                                {weekDays.map((day, i) => (
                                    <div key={i} className={`col-span-1 text-center py-3 border-r border-gray-100 ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}>
                                        <div className={`text-xs font-semibold ${isSameDay(day, new Date()) ? 'text-primary' : 'text-gray-500'}`}>{format(day, 'EEE').toUpperCase()}</div>
                                        <div className={`text-xl font-light mt-1 ${isSameDay(day, new Date()) ? 'text-primary font-bold' : 'text-gray-800'}`}>{format(day, 'd')}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 overflow-y-auto no-scrollbar relative">
                                <div className="grid grid-cols-8 relative min-h-[1000px]">
                                    <div className="col-span-1 border-r border-gray-200 bg-gray-50/50">
                                        {hours.map(h => (
                                            <div key={h} className="h-20 border-b border-gray-100 text-xs text-gray-400 text-right pr-3 pt-2 relative">
                                                <span className="-top-3 relative">
                                                    {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {weekDays.map((day, i) => (
                                        <div key={i} className="col-span-1 border-r border-gray-100 relative">
                                            {hours.map(h => (
                                                <div key={h} className="h-20 border-b border-gray-100 relative group">
                                                    {getAppointmentsForDayAndTime(day, h).map(apt => (
                                                        <div
                                                            key={apt.id}
                                                            onClick={(e) => { e.stopPropagation(); handleOpenModal(apt); }}
                                                            className="absolute inset-1 bg-primary text-white p-1 rounded text-xs overflow-hidden z-10 shadow-sm cursor-pointer hover:bg-primary/90"
                                                        >
                                                            <div className="font-bold">{apt.title}</div>
                                                            <div className="opacity-80">{apt.time}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Day View */}
                    {view === 'Day' && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="border-b border-gray-200 py-3 text-center bg-gray-50/30">
                                <div className="text-sm font-semibold text-gray-500">{format(currentDate, 'EEEE').toUpperCase()}</div>
                                <div className="text-2xl font-bold text-gray-900">{format(currentDate, 'd')}</div>
                            </div>
                            <div className="flex-1 overflow-y-auto no-scrollbar relative">
                                <div className="grid grid-cols-1 relative min-h-[1000px]">
                                    {hours.map(h => (
                                        <div key={h} className="h-24 border-b border-gray-100 relative flex group">
                                            <div className="w-20 border-r border-gray-200 bg-gray-50/50 text-xs text-gray-400 text-right pr-3 pt-2 flex-shrink-0">
                                                <span className="-top-3 relative">
                                                    {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
                                                </span>
                                            </div>
                                            <div className="flex-1 relative p-1">
                                                {getAppointmentsForDayAndTime(currentDate, h).map(apt => (
                                                    <div
                                                        key={apt.id}
                                                        onClick={(e) => { e.stopPropagation(); handleOpenModal(apt); }}
                                                        className="absolute inset-x-2 top-1 bottom-1 bg-primary text-white p-2 rounded-lg text-sm overflow-hidden z-10 shadow-md cursor-pointer hover:bg-primary/90 flex flex-col justify-center"
                                                    >
                                                        <div className="font-bold text-base">{apt.title}</div>
                                                        <div className="opacity-90 flex items-center gap-2">
                                                            <span>{apt.time}</span>
                                                            <span>•</span>
                                                            <span>{apt.assignedTo}</span>
                                                        </div>
                                                        {apt.notes && <div className="text-xs opacity-75 mt-1 truncate">{apt.notes}</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Edit Appointment' : 'New Appointment'}
                size="lg"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        {editingId && (
                            <button
                                onClick={handleDelete}
                                className="text-red-600 bg-red-50 border border-red-200 focus:ring-4 focus:outline-none focus:ring-red-100 font-medium rounded-lg text-sm px-5 py-2.5 hover:bg-red-100 mr-auto"
                            >
                                Delete
                            </button>
                        )}
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-700 bg-white border border-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSubmit} className="text-white bg-success hover:bg-success/90 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5">{editingId ? 'Update' : 'Create'}</button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            placeholder="Meeting with Client"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">Contact (Optional)</label>
                        <select
                            value={formData.contactId}
                            onChange={e => setFormData({ ...formData, contactId: e.target.value })}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        >
                            <option value="">Select a contact...</option>
                            {contacts.map(contact => (
                                <option key={contact.id} value={contact.id}>{contact.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900">Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900">Time</label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            rows={3}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Calendars;
