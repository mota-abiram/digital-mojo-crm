import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';

interface SortableStageItemProps {
    stage: any;
    onRemove: (id: string) => void;
    onChange: (id: string, title: string) => void;
    onColorChange: (id: string, color: string) => void;
}

const SortableStageItem: React.FC<SortableStageItemProps> = ({ stage, onRemove, onChange, onColorChange }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: stage.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
                <GripVertical size={20} />
            </div>
            <input
                type="text"
                value={stage.title}
                onChange={(e) => onChange(stage.id, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                placeholder="Stage Name"
            />
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
                <input
                    type="color"
                    value={stage.color}
                    onChange={(e) => onColorChange(stage.id, e.target.value)}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                />
            </div>
            <button
                onClick={() => onRemove(stage.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
};

const Settings: React.FC = () => {
    const { stages, updateStages, removeDuplicateContacts, removeDuplicateOpportunities } = useStore();
    const [localStages, setLocalStages] = useState(stages);
    const [activeTab, setActiveTab] = useState('pipelines');
    const [isCleaningContacts, setIsCleaningContacts] = useState(false);
    const [isCleaningOpportunities, setIsCleaningOpportunities] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setLocalStages((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleStageChange = (id: string, newTitle: string) => {
        setLocalStages(localStages.map(s => s.id === id ? { ...s, title: newTitle } : s));
    };

    const handleStageColorChange = (id: string, newColor: string) => {
        setLocalStages(localStages.map(s => s.id === id ? { ...s, color: newColor } : s));
    };

    const handleAddStage = () => {
        const newStage = {
            id: `stage-${Date.now()}`,
            title: 'New Stage',
            color: '#E2E8F0',
            order: localStages.length
        };
        setLocalStages([...localStages, newStage]);
    };

    const handleRemoveStage = (id: string) => {
        if (localStages.length <= 1) {
            toast.error('You must have at least one stage');
            return;
        }
        setLocalStages(localStages.filter(s => s.id !== id));
    };

    const handleSave = async () => {
        try {
            await updateStages(localStages);
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
        }
    };

    return (
        <div className="p-8 h-full flex flex-col bg-gray-50/50">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 shadow-sm transition-all"
                >
                    <Save size={18} />
                    Save Changes
                </button>
            </div>

            <div className="flex gap-8 flex-1 min-h-0">
                {/* Sidebar */}
                <div className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setActiveTab('pipelines')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'pipelines'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-transparent text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Pipeline Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('team')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'team'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-transparent text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Team Management
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'profile'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-transparent text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Company Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('cleanup')}
                            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${activeTab === 'cleanup'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-transparent text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Data Cleanup
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-y-auto">
                    {activeTab === 'pipelines' && (
                        <div className="max-w-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Pipeline Stages</h2>
                                    <p className="text-sm text-gray-500 mt-1">Customize the stages of your sales pipeline</p>
                                </div>
                                <button
                                    onClick={handleAddStage}
                                    className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                                >
                                    <Plus size={16} /> Add Stage
                                </button>
                            </div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={localStages.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-3">
                                        {localStages.map((stage) => (
                                            <SortableStageItem
                                                key={stage.id}
                                                stage={stage}
                                                onRemove={handleRemoveStage}
                                                onChange={handleStageChange}
                                                onColorChange={handleStageColorChange}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Team Management</h3>
                            <p className="text-gray-500 mt-2">Invite and manage team members (Coming Soon)</p>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Company Profile</h3>
                            <p className="text-gray-500 mt-2">Manage company details and branding (Coming Soon)</p>
                        </div>
                    )}

                    {activeTab === 'cleanup' && (
                        <div className="max-w-2xl">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Data Cleanup</h2>
                                <p className="text-sm text-gray-500 mt-1">Remove duplicate records from your database</p>
                            </div>

                            <div className="space-y-4">
                                {/* Remove Duplicate Contacts */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium text-gray-900">Remove Duplicate Contacts</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Finds contacts with the same email or name and removes duplicates, keeping the oldest record.
                                            </p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                setIsCleaningContacts(true);
                                                try {
                                                    const result = await removeDuplicateContacts();
                                                    toast.success(`Removed ${result.removed} duplicate contacts. ${result.kept} unique contacts remain.`);
                                                } catch (error) {
                                                    toast.error('Failed to remove duplicate contacts');
                                                }
                                                setIsCleaningContacts(false);
                                            }}
                                            disabled={isCleaningContacts}
                                            className="px-4 py-2 bg-brand-orange text-white rounded-lg font-medium hover:bg-brand-orange/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isCleaningContacts ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Cleaning...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 size={16} />
                                                    Clean Contacts
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Remove Duplicate Opportunities */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium text-gray-900">Remove Duplicate Opportunities</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Finds opportunities with the same name and linked contact, and removes duplicates, keeping the oldest record.
                                            </p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                setIsCleaningOpportunities(true);
                                                try {
                                                    const result = await removeDuplicateOpportunities();
                                                    toast.success(`Removed ${result.removed} duplicate opportunities. ${result.kept} unique opportunities remain.`);
                                                } catch (error) {
                                                    toast.error('Failed to remove duplicate opportunities');
                                                }
                                                setIsCleaningOpportunities(false);
                                            }}
                                            disabled={isCleaningOpportunities}
                                            className="px-4 py-2 bg-brand-orange text-white rounded-lg font-medium hover:bg-brand-orange/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isCleaningOpportunities ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Cleaning...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 size={16} />
                                                    Clean Opportunities
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Warning:</strong> This action cannot be undone. Make sure you have a backup of your data before proceeding.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper icon component for empty states
const Users = ({ size, className }: { size: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

export default Settings;
