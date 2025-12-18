import React, { useState, useEffect, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { Plus, MoreHorizontal, X, Edit, Trash2, LayoutGrid, List as ListIcon, Search, Filter, Download, ChevronDown, User, Calendar, Phone, Mail, Tag, CheckSquare, MessageSquare, Clock, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { Modal } from '../components/Modal';
import { Opportunity, Task, Note } from '../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface DraggableCardProps {
    item: Opportunity;
    color: string;
    onEdit: (opp: Opportunity) => void;
    onDelete: (id: string) => void;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ item, color, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: item.id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    // Handle click separately to avoid conflict with drag
    const handleCardClick = (e: React.MouseEvent) => {
        // Only trigger edit if not dragging
        if (!isDragging) {
            onEdit(item);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all relative group mb-3 z-10 ${isDragging ? 'opacity-50' : ''}`}
        >
            {/* Drag Handle - only this area is draggable */}
            <div
                {...listeners}
                {...attributes}
                className="absolute top-0 left-0 right-0 h-8 cursor-grab"
            />

            {/* Clickable Content Area */}
            <div onClick={handleCardClick} className="cursor-pointer">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                        <h4 className="font-bold text-gray-900 text-sm line-clamp-2">{item.name}</h4>
                        {item.contactId && (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.hash = `#/contacts/${item.contactId}`;
                                }}
                                className="text-xs text-brand-blue hover:underline cursor-pointer flex items-center gap-1 mt-1"
                            >
                                <User size={10} /> {item.contactName || 'View Contact'}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(item);
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            <MoreHorizontal size={16} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="space-y-2 mb-4">
                    <div className="flex text-xs">
                        <span className="text-gray-500 w-32 shrink-0">Business Name:</span>
                        <span className="text-gray-700 font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex text-xs">
                        <span className="text-gray-500 w-32 shrink-0">Opportunity Value:</span>
                        <span className="text-gray-700 font-medium">₹{Number(item.value).toLocaleString()}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center border-t border-gray-100 pt-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Opportunity"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

interface DroppableColumnProps {
    stage: { id: string; title: string; color: string };
    items: Opportunity[];
    onEdit: (opp: Opportunity) => void;
    onDelete: (id: string) => void;
    hasMore: boolean;
    onLoadMore: () => void;
    isLoading?: boolean;
    totalCount: number;
    totalValue: number;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ stage, items, onEdit, onDelete, hasMore, onLoadMore, isLoading, totalCount, totalValue }) => {
    const { setNodeRef } = useDroppable({
        id: stage.id,
    });

    const loadMoreRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Infinite scroll using IntersectionObserver
    useEffect(() => {
        const loadMoreElement = loadMoreRef.current;
        const scrollContainer = scrollContainerRef.current;

        if (!loadMoreElement || !scrollContainer) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && hasMore && !isLoading) {
                    onLoadMore();
                }
            },
            {
                root: scrollContainer,
                rootMargin: '100px',
                threshold: 0.1
            }
        );

        observer.observe(loadMoreElement);

        return () => {
            observer.disconnect();
        };
    }, [hasMore, onLoadMore, isLoading]);

    return (
        <div ref={setNodeRef} className="w-80 flex flex-col h-full">
            <div className="bg-white p-3 rounded-t-lg border-t-4 shadow-sm mb-2 shrink-0" style={{ borderTopColor: stage.color || '#3b82f6' }}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{stage.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {totalCount} Opportunities <span className="font-bold text-gray-700 ml-1">₹{totalValue.toLocaleString()}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar min-h-[100px] pr-1 pb-2">
                {items.map(item => (
                    <DraggableCard key={item.id} item={item} color={stage.color} onEdit={onEdit} onDelete={onDelete} />
                ))}
                {/* Sentinel element for infinite scroll */}
                <div ref={loadMoreRef} className="h-4">
                    {isLoading && hasMore && (
                        <div className="flex justify-center py-2">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Opportunities: React.FC = () => {
    const { opportunities, stages, stageCounts, stagePagination, fetchOpportunities, fetchOpportunitiesByStage, loadMoreByStage, fetchStageCounts, updateOpportunity, addOpportunity, deleteOpportunity, bulkDeleteOpportunities, updateStages, currentUser, addAppointment, contacts, fetchContacts, addContact, updateContact, deleteContact, hasMoreOpportunities, loadMoreOpportunities, isLoading } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('Contact Info');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        value: '',
        stage: '',
        status: 'Open',
        owner: '',
        source: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        companyName: '',

        tags: '',
        pipelineId: 'Marketing Pipeline',
        contactValue: 'Standard'
    });

    // Sub-items State
    const [tasks, setTasks] = useState<Task[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [isAddingNote, setIsAddingNote] = useState(false);

    // Appointment State
    const [appointmentForm, setAppointmentForm] = useState({
        calendar: '',
        location: '',
        title: ''
    });

    // Pipeline editing state
    const [tempStages, setTempStages] = useState(stages);

    useEffect(() => {
        fetchOpportunities();
        fetchContacts();
        fetchStageCounts();
        // Fetch initial opportunities for each stage (for board view)
        stages.forEach(stage => {
            fetchOpportunitiesByStage(stage.id);
        });
    }, [fetchOpportunities, fetchContacts, fetchStageCounts, fetchOpportunitiesByStage, currentUser]);

    useEffect(() => {
        setTempStages(stages);
    }, [stages]);

    // FILTER STATE
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        pipelineId: '',
        stage: '',
        status: ''
    });

    // List view infinite scroll refs
    const listScrollContainerRef = useRef<HTMLDivElement>(null);
    const listLoadMoreRef = useRef<HTMLTableRowElement>(null);

    // List view infinite scroll
    useEffect(() => {
        if (viewMode !== 'list') return;

        const loadMoreElement = listLoadMoreRef.current;
        const scrollContainer = listScrollContainerRef.current;

        if (!loadMoreElement || !scrollContainer) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && hasMoreOpportunities && !isLoading) {
                    loadMoreOpportunities();
                }
            },
            {
                root: scrollContainer,
                rootMargin: '100px',
                threshold: 0.1
            }
        );

        observer.observe(loadMoreElement);

        return () => {
            observer.disconnect();
        };
    }, [viewMode, hasMoreOpportunities, loadMoreOpportunities, isLoading]);

    const visibleOpportunities = useMemo(() => {
        return opportunities.filter(opp => {
            // Text Search
            const matchesSearch =
                opp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                opp.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                opp.companyName?.toLowerCase().includes(searchTerm.toLowerCase());

            // Advanced Filters
            const matchesPipeline = filters.pipelineId ? opp.pipelineId === filters.pipelineId : true;
            const matchesStage = filters.stage ? opp.stage === filters.stage : true;
            const matchesStatus = filters.status ? opp.status === filters.status : true;

            return matchesSearch && matchesPipeline && matchesStage && matchesStatus;
        });
    }, [opportunities, searchTerm, filters.pipelineId, filters.stage, filters.status]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the opportunity and the new stage
        const opportunity = opportunities.find(o => o.id === activeId);
        if (!opportunity) return;

        // If dropped over a container (stage)
        if (stages.some(s => s.id === overId)) {
            if (opportunity.stage !== overId) {
                const updates: any = { stage: overId };

                // Auto-update status if moved to 'Closed' stage
                if (overId === '10') {
                    updates.status = 'Won';
                } else if (opportunity.stage === '10' && overId !== '10') {
                    // Reset to Open if moved OUT of Closed stage
                    updates.status = 'Open';
                }

                await updateOpportunity(activeId, updates);
                toast.success('Opportunity moved');
            }
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(visibleOpportunities.map(o => o.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.size} opportunities?`)) {
            try {
                await bulkDeleteOpportunities(Array.from(selectedIds));
                toast.success(`${selectedIds.size} opportunities deleted successfully`);
                setSelectedIds(new Set());
            } catch (error) {
                toast.error('Failed to delete opportunities');
            }
        }
    };

    const handleOpenModal = (opp?: Opportunity) => {
        if (opp) {
            setEditingId(opp.id);
            const linkedContact = contacts.find(c => c.id === opp.contactId);
            setFormData({
                name: opp.name,
                value: opp.value.toString(),
                stage: opp.stage,
                status: opp.status,
                owner: opp.owner || '',
                source: opp.source || '',
                contactName: linkedContact?.name || opp.contactName || '',
                contactEmail: linkedContact?.email || opp.contactEmail || '',
                contactPhone: linkedContact?.phone || opp.contactPhone || '',
                companyName: linkedContact?.companyName || opp.companyName || '',
                tags: opp.tags ? opp.tags.join(', ') : '',
                pipelineId: opp.pipelineId || 'Marketing Pipeline',
                contactValue: linkedContact?.Value || 'Standard'
            });
            setTasks(opp.tasks || []);
            setNotes(opp.notes || []);
        } else {
            setEditingId(null);
            setFormData({
                name: '', value: '0', stage: stages[0]?.id || 'New', status: 'Open', owner: currentUser?.id || '', source: '',
                contactName: '', contactEmail: '', contactPhone: '', companyName: '', tags: '', pipelineId: 'Marketing Pipeline', contactValue: 'Standard'
            });
            setTasks([]);
            setNotes([]);
        }
        setActiveTab('details');
        setIsModalOpen(true);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!formData.name) {
            toast.error('Opportunity Name is required');
            return;
        }

        if (isSubmitting) return;
        setIsSubmitting(true);

        let finalContactId = editingId ? opportunities.find(o => o.id === editingId)?.contactId : undefined;

        // Logic to link/create contact
        if (formData.contactName) {
            // 1. Check if contact exists
            const existingContact = contacts.find(c =>
                (formData.contactEmail && c.email === formData.contactEmail) ||
                (c.name.toLowerCase() === formData.contactName.toLowerCase())
            );

            if (existingContact) {
                finalContactId = existingContact.id;
                // Update existing contact's value if it changed
                // Sync Contact Info if changed
                const updates: any = {};
                if (existingContact.Value !== formData.contactValue) updates.Value = formData.contactValue;
                if (existingContact.phone !== formData.contactPhone) updates.phone = formData.contactPhone;
                if (existingContact.email !== formData.contactEmail) updates.email = formData.contactEmail;
                if (existingContact.companyName !== formData.companyName) updates.companyName = formData.companyName;
                if (existingContact.name !== formData.contactName) updates.name = formData.contactName;

                if (Object.keys(updates).length > 0) {
                    await updateContact(existingContact.id, updates);
                    toast.success("Linked contact updated");
                }
            } else {
                // 2. Create new contact
                try {
                    const newContact = await addContact({
                        name: formData.contactName,
                        email: formData.contactEmail || '',
                        phone: formData.contactPhone || '',
                        type: '',
                        companyName: formData.name,
                        owner: currentUser?.id || 'Unknown',
                        tags: [],
                        Value: formData.contactValue
                    });
                    finalContactId = newContact.id;
                    toast.success(`New contact "${newContact.name}" created`);
                } catch (err) {
                    console.error("Failed to create contact from opportunity", err);
                    toast.error("Failed to create linked contact");
                }
            }
        }

        const oppData: any = {
            name: formData.name,
            value: Number(formData.value),
            stage: formData.stage,
            status: formData.status as any,
            owner: formData.owner || currentUser?.id || 'Unknown',
            source: formData.source,
            contactName: formData.contactName,
            contactEmail: formData.contactEmail,
            contactPhone: formData.contactPhone,
            companyName: formData.companyName,
            contactId: finalContactId,
            pipelineId: formData.pipelineId,
            tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
            updatedAt: new Date().toISOString(),
            tasks: tasks,
            notes: notes
        };

        if (!editingId) {
            oppData.createdAt = new Date().toISOString();
        }

        try {
            if (editingId) {
                await updateOpportunity(editingId, oppData);
                toast.success('Opportunity updated successfully');
            } else {
                await addOpportunity(oppData);
                toast.success('Opportunity created successfully');
            }
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Error saving opportunity:', error);
            toast.error('Failed to save opportunity: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this opportunity? This will also delete the associated contact.')) {
            try {
                await deleteOpportunity(id);
                toast.success('Opportunity and associated contact deleted successfully');
            } catch (error) {
                console.error("Error deleting opportunity:", error);
                toast.error('Failed to delete opportunity');
            }
        }
    };

    // Task & Note Handlers
    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;
        const newTask: Task = {
            id: Date.now().toString(),
            title: newTaskTitle,
            isCompleted: false
        };
        setTasks([...tasks, newTask]);
        setNewTaskTitle('');
        setIsAddingTask(false);
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    const handleAddNote = () => {
        if (!newNoteContent.trim()) return;
        const newNote: Note = {
            id: Date.now().toString(),
            content: newNoteContent,
            createdAt: new Date().toISOString()
        };
        setNotes([...notes, newNote]);
        setNewNoteContent('');
        setIsAddingNote(false);
    };

    const handleDeleteNote = (noteId: string) => {
        setNotes(notes.filter(n => n.id !== noteId));
    };

    const handleBookAppointment = async () => {
        if (!appointmentForm.title || !appointmentForm.calendar) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await addAppointment({
                title: appointmentForm.title,
                date: format(new Date(), 'yyyy-MM-dd'), // Default to today for now
                time: '09:00',
                assignedTo: currentUser?.id || 'Unknown',
                notes: `Location: ${appointmentForm.location}`,
                contactId: editingId || undefined // Associate with this opportunity if possible, or just create generic
            });
            toast.success('Appointment booked successfully');
            setAppointmentForm({ calendar: '', location: '', title: '' });
        } catch (error) {
            toast.error('Failed to book appointment');
        }
    };


    // Pipeline Management
    const handleSavePipeline = () => {
        updateStages(tempStages);
        setIsPipelineModalOpen(false);
        toast.success('Pipeline updated successfully');
    };

    const handleAddStage = () => {
        setTempStages([...tempStages, { id: `Stage ${tempStages.length + 1}`, title: 'New Stage', color: '#cccccc' }]);
    };

    const handleRemoveStage = (index: number) => {
        const newStages = [...tempStages];
        newStages.splice(index, 1);
        setTempStages(newStages);
    };

    const handleStageChange = (index: number, field: 'title' | 'color', value: string) => {
        const newStages = [...tempStages];
        newStages[index] = { ...newStages[index], [field]: value, id: field === 'title' ? value : newStages[index].id };
        setTempStages(newStages);
    };

    // Import Handler
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as any[];
                let successCount = 0;
                let errorCount = 0;
                const toastId = toast.loading('Importing opportunities...');

                for (const row of rows) {
                    try {
                        if (Object.values(row).every(x => !x)) continue;

                        const normalizedRow: any = {};
                        Object.keys(row).forEach(key => {
                            normalizedRow[key.toLowerCase().trim()] = row[key];
                        });

                        const name = normalizedRow['opportunity name'] || normalizedRow['opportunity'] || normalizedRow['name'] || normalizedRow['title'];
                        if (!name) {
                            errorCount++;
                            continue;
                        }

                        // Extract contact info
                        const contactName = normalizedRow['contact name'] || normalizedRow['contact'];
                        const contactEmail = normalizedRow['email'] || normalizedRow['contact email'];
                        const contactPhone = normalizedRow['phone'] || normalizedRow['contact phone'];
                        const contactValue = normalizedRow['contact value'] || 'Standard';

                        let finalContactId: string | undefined = undefined;

                        // Try to link or create contact
                        if (contactName || contactEmail) {
                            const existingContact = contacts.find(c =>
                                (contactEmail && c.email === contactEmail) ||
                                (contactName && c.name.toLowerCase() === contactName.toLowerCase())
                            );

                            if (existingContact) {
                                finalContactId = existingContact.id;
                                // Sync Data for imported contacts
                                const updates: any = {};
                                if (contactValue && existingContact.Value !== contactValue) updates.Value = contactValue;
                                if (contactPhone && existingContact.phone !== contactPhone) updates.phone = contactPhone;

                                // Mapping Opportunity Name to Company Name
                                if (name && existingContact.companyName !== name) updates.companyName = name;

                                if (Object.keys(updates).length > 0) {
                                    await updateContact(existingContact.id, updates);
                                }
                            } else if (contactName) {
                                // Create new contact if not found
                                try {
                                    const newContact = await addContact({
                                        name: contactName,
                                        email: contactEmail || '',
                                        phone: contactPhone || '',
                                        type: '',
                                        companyName: name,
                                        owner: currentUser?.id || 'Unknown',
                                        Value: contactValue
                                    });
                                    finalContactId = newContact.id;
                                } catch (e) {
                                    console.error("Failed to create simple contact during import", e);
                                }
                            }
                        }

                        // Determine Stage
                        const stageName = normalizedRow['stage'];
                        let validStageId = stages[0]?.id || 'New';
                        if (stageName) {
                            const foundStage = stages.find(s => s.title.toLowerCase() === stageName.toLowerCase() || s.id === stageName);
                            if (foundStage) validStageId = foundStage.id;
                        }

                        const oppData: any = {
                            name: name,
                            value: Number(normalizedRow['value'] || 0),
                            stage: validStageId,
                            status: (normalizedRow['status'] || 'Open'),
                            owner: currentUser?.id || 'Unknown',
                            source: normalizedRow['source'] || '',
                            contactName: contactName || '',
                            contactEmail: contactEmail || '',
                            contactPhone: contactPhone || '',
                            companyName: normalizedRow['company name'] || normalizedRow['company'] || '',
                            contactId: finalContactId,
                            pipelineId: normalizedRow['pipeline'] || 'Marketing Pipeline',
                            tags: normalizedRow['tags'] ? normalizedRow['tags'].split(',').map((t: string) => t.trim()) : [],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };

                        await addOpportunity(oppData);
                        successCount++;
                    } catch (err) {
                        console.error("Error importing row:", row, err);
                        errorCount++;
                    }
                }

                toast.dismiss(toastId);
                if (successCount > 0) toast.success(`Successfully imported ${successCount} opportunities`);
                if (errorCount > 0) toast.error(`Failed to import ${errorCount} opportunities`);

                event.target.value = '';
            },
            error: (error) => {
                toast.error('Failed to parse CSV file');
                console.error(error);
            }
        });
    };

    const handleExport = () => {
        if (opportunities.length === 0) {
            toast.error('No opportunities to export');
            return;
        }

        const csvData = opportunities.map(opp => ({
            'Opportunity Name': opp.name,
            'Value': opp.value,
            'Stage': stages.find(s => s.id === opp.stage)?.title || opp.stage,
            'Status': opp.status,
            'Owner': opp.owner,
            'Source': opp.source,
            'Contact Name': opp.contactName,
            'Contact Email': opp.contactEmail,
            'Contact Phone': opp.contactPhone,
            'Company Name': opp.companyName,
            'Pipeline': opp.pipelineId,
            'Tags': opp.tags.join(', '),
            'Created At': opp.createdAt,
            'Updated At': opp.updatedAt
        }));

        const csvString = Papa.unparse(csvData);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `opportunities_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6 shrink-0">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
                    <div className="flex gap-3">
                        <div className="bg-white border border-gray-300 rounded-lg p-1 flex">
                            <button
                                onClick={() => setViewMode('board')}
                                className={`p-2 rounded ${viewMode === 'board' ? 'bg-gray-100 text-brand-blue' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Board View"
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100 text-brand-blue' : 'text-gray-500 hover:text-gray-700'}`}
                                title="List View"
                            >
                                <ListIcon size={20} />
                            </button>
                        </div>
                        <button
                            onClick={() => setIsPipelineModalOpen(true)}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm"
                        >
                            Pipelines
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm"
                        >
                            Import
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImport}
                            accept=".csv"
                            className="hidden"
                        />
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm flex items-center gap-2"
                        >
                            <Download size={16} /> Export
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            className="px-4 py-2 bg-primary text-gray-900 rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Opportunity
                        </button>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.size > 0 && viewMode === 'list' && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 shrink-0">
                        <span className="text-sm font-medium text-blue-800">{selectedIds.size} opportunities selected</span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleBulkDelete}
                                className="px-3 py-1.5 bg-white border border-red-300 text-red-700 rounded text-sm font-medium hover:bg-red-50"
                            >
                                Delete Selected
                            </button>
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters Bar */}
                <div className="flex gap-4 items-center relative">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search Opportunities"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`px-3 py-2 border rounded-lg flex items-center gap-2 text-sm font-medium ${isFilterOpen || Object.values(filters).some(Boolean) ? 'bg-blue-50 border-primary text-brand-blue' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Filter size={18} /> Filters {(Object.values(filters).some(Boolean)) && <span className="w-2 h-2 rounded-full bg-primary mb-2"></span>}
                        </button>

                        {/* Filter Dropdown */}
                        {isFilterOpen && (
                            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Pipeline</label>
                                    <select
                                        value={filters.pipelineId}
                                        onChange={(e) => setFilters(prev => ({ ...prev, pipelineId: e.target.value }))}
                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">All Pipelines</option>
                                        <option value="Marketing Pipeline">Marketing Pipeline</option>
                                        <option value="Sales Pipeline">Sales Pipeline</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Stage</label>
                                    <select
                                        value={filters.stage}
                                        onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value }))}
                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">All Stages</option>
                                        {stages.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="Open">Open</option>
                                        <option value="Won">Won</option>
                                        <option value="Lost">Lost</option>
                                        <option value="Abandoned">Abandoned</option>
                                    </select>
                                </div>
                                <div className="pt-2 border-t border-gray-100 flex justify-end">
                                    <button
                                        onClick={() => setFilters({ pipelineId: '', stage: '', status: '' })}
                                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {viewMode === 'board' ? (
                    <DndContext onDragEnd={handleDragEnd}>
                        <div className="h-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-4">
                            <div className="flex h-full gap-4 min-w-max px-1">
                                {stages.map(stage => (
                                    <DroppableColumn
                                        key={stage.id}
                                        stage={stage}
                                        items={visibleOpportunities.filter(o => o.stage === stage.id)}
                                        onEdit={handleOpenModal}
                                        onDelete={handleDelete}
                                        hasMore={stagePagination[stage.id]?.hasMore ?? true}
                                        onLoadMore={() => loadMoreByStage(stage.id)}
                                        isLoading={stagePagination[stage.id]?.isLoading ?? false}
                                        totalCount={stageCounts[stage.id]?.count || 0}
                                        totalValue={stageCounts[stage.id]?.value || 0}
                                    />
                                ))}
                            </div>
                        </div>
                    </DndContext>
                ) : (
                    // List View
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
                        <div ref={listScrollContainerRef} className="overflow-auto flex-1">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 w-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.size === visibleOpportunities.length && visibleOpportunities.length > 0}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-primary"
                                            />
                                        </th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Opportunity</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Contact</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Phone</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Email</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Pipeline</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Stage</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Value</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Notes</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Status</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Owner</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Tags</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Created On</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {visibleOpportunities.map((opp) => (
                                        <tr key={opp.id} className={`hover:bg-gray-50 transition-colors group cursor-pointer ${selectedIds.has(opp.id) ? 'bg-blue-50/50' : ''}`} onClick={() => handleOpenModal(opp)}>
                                            <td className="p-4" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(opp.id)}
                                                    onChange={() => handleSelectOne(opp.id)}
                                                    className="rounded border-gray-300 text-brand-blue focus:ring-primary"
                                                />
                                            </td>
                                            <td className="p-4 font-medium text-brand-blue">{opp.companyName || opp.name}</td>
                                            <td className="p-4">
                                                {opp.contactName ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                            {opp.contactName.charAt(0)}
                                                        </div>
                                                        <span className="text-sm text-gray-700">{opp.contactName}</span>
                                                    </div>
                                                ) : <span className="text-gray-400 text-sm">-</span>}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">{opp.contactPhone || '-'}</td>
                                            <td className="p-4 text-sm text-gray-600">{opp.contactEmail || '-'}</td>
                                            <td className="p-4 text-sm text-gray-600">{opp.pipelineId || '-'}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium border border-gray-200">
                                                    {stages.find(s => s.id === opp.stage)?.title || opp.stage}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-700">₹{Number(opp.value).toLocaleString()}</td>
                                            <td className="p-4 text-sm text-gray-500 max-w-[200px] truncate" title={opp.notes && opp.notes.length > 0 ? opp.notes[opp.notes.length - 1].content : ''}>
                                                {opp.notes && opp.notes.length > 0 ? opp.notes[opp.notes.length - 1].content : '-'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`uppercase text-xs font-bold ${opp.status === 'Open' ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {opp.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">{opp.owner || '-'}</td>
                                            <td className="p-4">
                                                <div className="flex gap-1 flex-wrap">
                                                    {opp.tags.map(tag => (
                                                        <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded border border-gray-200">{tag}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {opp.createdAt ? format(new Date(opp.createdAt), 'MMM d, yyyy h:mm a') : '-'}
                                            </td>
                                            <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => handleDelete(opp.id)} className="text-gray-400 hover:text-red-600 p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Sentinel row for infinite scroll */}
                                    <tr ref={listLoadMoreRef}>
                                        <td colSpan={14} className="h-4">
                                            {isLoading && hasMoreOpportunities && (
                                                <div className="flex justify-center py-4">
                                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-sm text-gray-500">
                            <span>Showing {visibleOpportunities.length} opportunities {hasMoreOpportunities && '(scroll for more)'}</span>
                            {isLoading && (
                                <div className="flex items-center gap-2 text-brand-blue">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span>Loading...</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced Opportunity Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingId ? `Edit "${formData.name}"` : 'New Opportunity'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar Tabs */}
                            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto">
                                {['Opportunity Details', 'Book/Update Appointment', 'Tasks', 'Notes'].map((tab) => {
                                    const id = tab.toLowerCase().replace(/[^a-z0-9]/g, '-');
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => setActiveTab(id)}
                                            className={`px-6 py-4 text-left text-sm font-medium border-l-4 transition-colors ${activeTab === id || (id === 'opportunity-details' && activeTab === 'details')
                                                ? 'bg-blue-50 border-primary text-brand-blue'
                                                : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 overflow-y-auto p-8 bg-white">
                                <div className="max-w-4xl mx-auto space-y-8">
                                    {/* DETAILS TAB */}
                                    {(activeTab === 'details' || activeTab === 'opportunity-details') && (
                                        <>
                                            {/* Contact Details Section */}
                                            <section>
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                        Contact details <User size={18} className="text-gray-400" />
                                                    </h3>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                                                        <input
                                                            type="text"
                                                            placeholder="Contact Name"
                                                            value={formData.contactName}
                                                            onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                                            className="w-full pl-10 p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="relative">
                                                            <Mail className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                                                            <input
                                                                type="email"
                                                                placeholder="Email Address"
                                                                value={formData.contactEmail}
                                                                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                                                                className="w-full pl-10 p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                            />
                                                        </div>
                                                        <div className="relative">
                                                            <Phone className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                                                            <input
                                                                type="tel"
                                                                placeholder="Phone Number"
                                                                value={formData.contactPhone}
                                                                onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                                                                className="w-full pl-10 p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block mb-1.5 text-sm font-medium text-gray-700">Contact Value</label>
                                                            <select
                                                                value={formData.contactValue}
                                                                onChange={e => setFormData({ ...formData, contactValue: e.target.value })}
                                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                            >
                                                                <option value="Standard">Standard</option>
                                                                <option value="Mid">Mid</option>
                                                                <option value="High">High</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block mb-1.5 text-sm font-medium text-gray-700">Company Name</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Company Name"
                                                                value={formData.companyName}
                                                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                            <hr className="border-gray-200" />

                                            {/* Opportunity Details Section */}
                                            <section>
                                                <h3 className="text-lg font-bold text-gray-900 mb-4">Opportunity Details</h3>
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Opportunity Name <span className="text-red-500">*</span></label>
                                                        <input
                                                            type="text"
                                                            value={formData.name}
                                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block mb-1.5 text-sm font-medium text-gray-700">Pipeline</label>
                                                            <select
                                                                value={formData.pipelineId}
                                                                onChange={(e) => setFormData({ ...formData, pipelineId: e.target.value })}
                                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                            >
                                                                <option value="Marketing Pipeline">Marketing Pipeline</option>
                                                                <option value="Sales Pipeline">Sales Pipeline</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block mb-1.5 text-sm font-medium text-gray-700">Stage</label>
                                                            <select
                                                                value={formData.stage}
                                                                onChange={e => setFormData({ ...formData, stage: e.target.value })}
                                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                            >
                                                                {stages.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block mb-1.5 text-sm font-medium text-gray-700">Status</label>
                                                            <select
                                                                value={formData.status}
                                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                            >
                                                                <option value="Open">Open</option>
                                                                <option value="Won">Won</option>
                                                                <option value="Lost">Lost</option>
                                                                <option value="Abandoned">Abandoned</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block mb-1.5 text-sm font-medium text-gray-700">Opportunity Value</label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-2.5 text-gray-500 text-sm">₹</span>
                                                                <input
                                                                    type="number"
                                                                    value={formData.value}
                                                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                                                    className="w-full pl-8 p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block mb-1.5 text-sm font-medium text-gray-700">Owner</label>
                                                            <select
                                                                value={formData.owner}
                                                                onChange={e => setFormData({ ...formData, owner: e.target.value })}
                                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                            >
                                                                <option value={currentUser?.id || 'Unknown'}>Me</option>
                                                                <option value="Unassigned">Unassigned</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block mb-1.5 text-sm font-medium text-gray-700">Opportunity Source</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Enter Source"
                                                                value={formData.source}
                                                                onChange={e => setFormData({ ...formData, source: e.target.value })}
                                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Tags</label>
                                                        <div className="relative">
                                                            <Tag className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                                                            <input
                                                                type="text"
                                                                placeholder="Add tags (comma separated)"
                                                                value={formData.tags}
                                                                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                                                className="w-full pl-10 p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                            />
                                                        </div>
                                                    </div>

                                                    <hr className="border-gray-200" />

                                                    <div>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                                                            <button
                                                                onClick={() => setIsAddingNote(true)}
                                                                className="text-xs text-brand-blue font-medium hover:underline"
                                                            >
                                                                + Add Note
                                                            </button>
                                                        </div>

                                                        {isAddingNote && (
                                                            <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                                <textarea
                                                                    placeholder="Write a note..."
                                                                    value={newNoteContent}
                                                                    onChange={e => setNewNoteContent(e.target.value)}
                                                                    className="w-full p-2 bg-white border border-gray-300 rounded text-sm focus:ring-primary focus:border-primary mb-2 min-h-[80px]"
                                                                />
                                                                <div className="flex justify-end gap-2">
                                                                    <button onClick={() => setIsAddingNote(false)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
                                                                    <button onClick={handleAddNote} className="px-2 py-1 text-xs text-black bg-primary rounded hover:bg-primary/90">Save</button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                                            {notes.length === 0 && !isAddingNote ? (
                                                                <p className="text-sm text-gray-400 italic">No notes yet.</p>
                                                            ) : (
                                                                notes.map(note => (
                                                                    <div key={note.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg group">
                                                                        <p className="text-sm text-gray-800 mb-1 whitespace-pre-wrap">{note.content}</p>
                                                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                                                            <span>{format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
                                                                            <button onClick={() => handleDeleteNote(note.id)} className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>
                                        </>
                                    )}

                                    {/* APPOINTMENT TAB */}
                                    {activeTab === 'book-update-appointment' && (
                                        <section>
                                            <h3 className="text-lg font-bold text-gray-900 mb-6">Book/Update Appointment</h3>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block mb-1.5 text-sm font-medium text-gray-700">Calendar <span className="text-red-500">*</span></label>
                                                    <select
                                                        value={appointmentForm.calendar}
                                                        onChange={e => setAppointmentForm({ ...appointmentForm, calendar: e.target.value })}
                                                        className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                    >
                                                        <option value="">Select calendar</option>
                                                        <option value="default">Default Calendar</option>
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Meeting Location</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Meeting Location"
                                                            value={appointmentForm.location}
                                                            onChange={e => setAppointmentForm({ ...appointmentForm, location: e.target.value })}
                                                            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Appointment Title</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Appointment Title"
                                                            value={appointmentForm.title}
                                                            onChange={e => setAppointmentForm({ ...appointmentForm, title: e.target.value })}
                                                            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-end pt-4">
                                                    <button
                                                        onClick={handleBookAppointment}
                                                        className="px-5 py-2.5 text-sm font-medium text-black bg-primary rounded-lg hover:bg-primary/90 focus:ring-4 focus:ring-primary/30"
                                                    >
                                                        Book Appointment
                                                    </button>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {/* TASKS TAB */}
                                    {activeTab === 'tasks' && (
                                        <section className="h-full flex flex-col">
                                            {!isAddingTask ? (
                                                <>
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h3 className="text-lg font-bold text-gray-900">Tasks</h3>
                                                        <div className="flex gap-2">
                                                            <button className="p-2 text-gray-400 hover:text-gray-600"><Filter size={18} /></button>
                                                        </div>
                                                    </div>

                                                    <div className="mb-6">
                                                        <button
                                                            onClick={() => {
                                                                setNewTaskTitle('');
                                                                setIsAddingTask(true);
                                                            }}
                                                            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-brand-blue font-medium hover:bg-blue-50 hover:border-primary transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Plus size={18} /> Add Task
                                                        </button>
                                                    </div>

                                                    <div className="relative mb-6">
                                                        <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search by task title"
                                                            className="w-full pl-10 p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                        />
                                                    </div>

                                                    <div className="flex-1 overflow-y-auto">
                                                        {tasks.length === 0 ? (
                                                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-brand-blue">
                                                                    <CheckSquare size={32} />
                                                                </div>
                                                                <h4 className="text-gray-900 font-medium mb-1">No tasks found</h4>
                                                                <p className="text-gray-500 text-sm mb-4">There are no tasks available</p>
                                                                <button onClick={() => setIsAddingTask(true)} className="px-4 py-2 bg-primary text-gray-900 rounded-lg text-sm font-medium hover:bg-primary/90">
                                                                    + Add New Task
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {tasks.map(task => (
                                                                    <div key={task.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm">
                                                                        <div className="flex items-center gap-3">
                                                                            <input type="checkbox" checked={task.isCompleted} readOnly className="h-4 w-4 text-brand-blue rounded border-gray-300 focus:ring-primary" />
                                                                            <div className="flex flex-col">
                                                                                <span className={`text-sm font-medium ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</span>
                                                                                {task.dueDate && (
                                                                                    <span className="text-xs text-gray-500">Due: {task.dueDate} {task.dueTime}</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 hover:text-red-600">
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="animate-in fade-in slide-in-from-right-4 h-full flex flex-col">
                                                    <div className="flex items-center gap-2 mb-6">
                                                        <button onClick={() => setIsAddingTask(false)} className="text-gray-500 hover:text-gray-700">
                                                            <ChevronDown className="rotate-90" size={20} />
                                                        </button>
                                                        <h3 className="text-lg font-bold text-gray-900">Add Task</h3>
                                                    </div>

                                                    <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                                                        <div>
                                                            <label className="block mb-1.5 text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                                                            <input
                                                                type="text"
                                                                placeholder="Task title"
                                                                value={newTaskTitle}
                                                                onChange={e => setNewTaskTitle(e.target.value)}
                                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                            />
                                                        </div>

                                                        <div>
                                                            <button className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                                                <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center">
                                                                    <div className="w-2 h-0.5 bg-gray-600"></div>
                                                                </div>
                                                                Remove description
                                                            </button>
                                                            <div className="border border-gray-300 rounded-lg overflow-hidden">
                                                                <div className="flex items-center gap-2 p-2 border-b border-gray-300 bg-gray-50 text-gray-600">
                                                                    <button className="p-1 hover:bg-gray-200 rounded"><b className="font-serif font-bold">B</b></button>
                                                                    <button className="p-1 hover:bg-gray-200 rounded"><i className="font-serif italic">I</i></button>
                                                                    <button className="p-1 hover:bg-gray-200 rounded"><u className="font-serif underline">U</u></button>
                                                                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                                                    <button className="p-1 hover:bg-gray-200 rounded text-xs">Link</button>
                                                                </div>
                                                                <textarea
                                                                    placeholder="Enter a description..."
                                                                    className="w-full p-3 text-sm focus:outline-none min-h-[120px] resize-none"
                                                                    maxLength={2000}
                                                                ></textarea>
                                                                <div className="p-2 text-right text-xs text-gray-400 border-t border-gray-100">
                                                                    0 / 2000 Characters
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block mb-1.5 text-sm font-medium text-gray-700">Due date and time (IST)</label>
                                                            <div className="flex gap-4">
                                                                <div className="relative flex-1">
                                                                    <input
                                                                        type="date"
                                                                        className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                                        defaultValue={format(new Date(), 'yyyy-MM-dd')}
                                                                    />
                                                                </div>
                                                                <div className="relative w-32">
                                                                    <input
                                                                        type="time"
                                                                        className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                                        defaultValue="08:00"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                            <span className="text-sm font-medium text-gray-900">Recurring tasks</span>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                            </label>
                                                        </div>

                                                        <div>
                                                            <label className="block mb-1.5 text-sm font-medium text-gray-700">Assign to</label>
                                                            <select className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary">
                                                                <option value="">Select assignee</option>
                                                                <option value={currentUser?.id || 'me'}>Me</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                                        <button
                                                            onClick={() => setIsAddingTask(false)}
                                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleAddTask}
                                                            className="px-4 py-2 text-sm font-medium text-black bg-primary rounded-lg hover:bg-primary/90"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </section>
                                    )}

                                    {/* NOTES TAB */}
                                    {activeTab === 'notes' && (
                                        <section className="h-full flex flex-col">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-bold text-gray-900">Notes</h3>
                                                <div className="flex gap-2">
                                                    <button className="p-2 text-gray-400 hover:text-gray-600"><Filter size={18} /></button>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <button
                                                    onClick={() => setIsAddingNote(true)}
                                                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-brand-blue font-medium hover:bg-blue-50 hover:border-primary transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={18} /> Add Note
                                                </button>
                                            </div>

                                            {isAddingNote && (
                                                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2">
                                                    <textarea
                                                        placeholder="Write a note..."
                                                        value={newNoteContent}
                                                        onChange={e => setNewNoteContent(e.target.value)}
                                                        className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary mb-3 min-h-[100px]"
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setIsAddingNote(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
                                                        <button onClick={handleAddNote} className="px-3 py-1.5 text-sm text-black bg-primary rounded hover:bg-primary/90">Add Note</button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="relative mb-6">
                                                <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                                                <input
                                                    type="text"
                                                    placeholder="Search"
                                                    className="w-full pl-10 p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                                                />
                                            </div>

                                            <div className="flex-1 overflow-y-auto">
                                                {notes.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center h-64 text-center">
                                                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-brand-blue">
                                                            <MessageSquare size={32} />
                                                        </div>
                                                        <h4 className="text-gray-900 font-medium mb-1">No notes found</h4>
                                                        <p className="text-gray-500 text-sm mb-4">Your filters does not match any notes. Please try again.</p>
                                                        <button onClick={() => setIsAddingNote(true)} className="px-4 py-2 bg-primary text-gray-900 rounded-lg text-sm font-medium hover:bg-primary/90">
                                                            + Add Note
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {notes.map(note => (
                                                            <div key={note.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm">
                                                                <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{note.content}</p>
                                                                <div className="flex justify-between items-center text-xs text-gray-500">
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock size={12} />
                                                                        <span>{format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}</span>
                                                                    </div>
                                                                    <button onClick={() => handleDeleteNote(note.id)} className="text-gray-400 hover:text-red-600">
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                                {editingId && (
                                    <>
                                        <p>Created By: Digital Mojo</p>
                                        <p>Created on: {editingId && opportunities.find(o => o.id === editingId)?.createdAt ? format(new Date(opportunities.find(o => o.id === editingId)!.createdAt!), 'MMM d, yyyy h:mm a') : '-'} (IST)</p>
                                        <a href="#" className="text-brand-blue hover:underline flex items-center gap-1 mt-1">
                                            Audit Logs: {editingId} <Download size={12} />
                                        </a>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-black bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        editingId ? 'Update' : 'Create'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }



            {/* Pipeline Modal */}
            <Modal
                isOpen={isPipelineModalOpen}
                onClose={() => setIsPipelineModalOpen(false)}
                title="Edit Pipeline Stages"
                size="2xl"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setIsPipelineModalOpen(false)} className="text-gray-700 bg-white border border-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSavePipeline} className="text-white bg-success hover:bg-success/90 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5">Save Pipeline</button>
                    </div>
                }
            >
                <div className="space-y-4">
                    {tempStages.map((stage, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-100 text-gray-500 font-bold">
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={stage.title}
                                    onChange={(e) => handleStageChange(index, 'title', e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                                    placeholder="Stage Name"
                                />
                            </div>
                            <div>
                                <input
                                    type="color"
                                    value={stage.color}
                                    onChange={(e) => handleStageChange(index, 'color', e.target.value)}
                                    className="h-10 w-14 p-1 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer"
                                />
                            </div>
                            <button
                                onClick={() => handleRemoveStage(index)}
                                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    onClick={handleAddStage}
                    className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-bold hover:border-primary hover:text-brand-blue transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={20} /> Add Stage
                </button>
            </Modal>
        </div >
    );
};

export default Opportunities;
