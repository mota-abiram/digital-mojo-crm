import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download, Edit, Trash2, X, MoreHorizontal, ChevronDown, CheckSquare } from 'lucide-react';
import { Contact } from '../types';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { Modal } from '../components/Modal';
import { useParams, useNavigate } from 'react-router-dom';
import { COUNTRY_CODES } from '../utils/countryCodes';

const Contacts: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { contacts, fetchContacts, fetchContact, searchContacts, addContact, updateContact, deleteContact, bulkDeleteContacts, bulkAddTagsToContacts, isLoading, currentUser, hasMoreContacts, loadMoreContacts } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const { id } = useParams();
    const navigate = useNavigate();

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
    const [bulkTags, setBulkTags] = useState('');

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm) {
                searchContacts(searchTerm);
            } else {
                fetchContacts();
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, searchContacts, fetchContacts]);

    // Form state
    const [countryCode, setCountryCode] = useState('+1');
    const [localPhone, setLocalPhone] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        type: 'Lead',
        tags: ''
    });

    // Initial fetch handled by search effect when term is empty, but we need to ensure it runs on mount if empty
    // Actually, the effect above runs on mount. If searchTerm is '', it calls fetchContacts().
    // So we can remove the separate useEffect for fetchContacts.

    useEffect(() => {
        const loadContact = async () => {
            if (id) {
                const contact = contacts.find(c => c.id === id);
                if (contact) {
                    handleOpenModal(contact);
                } else {
                    const fetchedContact = await fetchContact(id);
                    if (fetchedContact) {
                        handleOpenModal(fetchedContact);
                    } else {
                        toast.error('Contact not found');
                        navigate('/contacts');
                    }
                }
            }
        };
        loadContact();
    }, [id, contacts, fetchContact, navigate]);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterType, setFilterType] = useState('All');
    const [filterTag, setFilterTag] = useState('');

    const filteredContacts = contacts.filter(contact => {
        // Search is now handled server-side, but we keep client-side filter for Type and Tag
        // const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        //     contact.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || contact.type === filterType;
        const matchesTag = !filterTag || contact.tags.some(t => t.toLowerCase().includes(filterTag.toLowerCase()));
        return matchesType && matchesTag;
    });

    const handleOpenModal = (contact?: Contact) => {
        if (contact) {
            setEditingId(contact.id);

            // Parse phone number
            const matchingCode = COUNTRY_CODES.find(c => contact.phone && contact.phone.startsWith(c.code));
            if (matchingCode) {
                setCountryCode(matchingCode.code);
                setLocalPhone(contact.phone.slice(matchingCode.code.length));
            } else {
                setCountryCode('+1');
                setLocalPhone(contact.phone || '');
            }

            setFormData({
                name: contact.name,
                email: contact.email,
                type: contact.type,
                tags: contact.tags.join(', ')
            });
        } else {
            setEditingId(null);
            setCountryCode('+1');
            setLocalPhone('');
            setFormData({ name: '', email: '', type: 'Lead', tags: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.email) {
            toast.error('Name and Email are required');
            return;
        }

        const contactData = {
            name: formData.name,
            email: formData.email,
            phone: countryCode + localPhone,
            type: formData.type as 'Lead' | 'Customer' | 'Prospect' | 'High-Value',
            tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
            owner: currentUser?.id || 'Unknown'
        };

        try {
            if (editingId) {
                await updateContact(editingId, contactData);
                toast.success('Contact updated successfully');
            } else {
                await addContact(contactData);
                toast.success('Contact created successfully');
            }
            setIsModalOpen(false);
            setFormData({ name: '', email: '', type: 'Lead', tags: '' });
            setCountryCode('+1');
            setLocalPhone('');
        } catch (error: any) {
            console.error('Error saving contact:', error);
            toast.error('Failed to save contact: ' + (error.message || 'Unknown error'));
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            try {
                await deleteContact(id);
                toast.success('Contact deleted successfully');
                // Remove from selection if selected
                if (selectedIds.has(id)) {
                    const newSelected = new Set(selectedIds);
                    newSelected.delete(id);
                    setSelectedIds(newSelected);
                }
            } catch (error) {
                toast.error('Failed to delete contact');
            }
        }
    };

    // Bulk Actions Handlers
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = new Set(filteredContacts.map(c => c.id));
            setSelectedIds(allIds);
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
        if (window.confirm(`Are you sure you want to delete ${selectedIds.size} contacts?`)) {
            try {
                await bulkDeleteContacts(Array.from(selectedIds));
                toast.success(`${selectedIds.size} contacts deleted successfully`);
                setSelectedIds(new Set());
            } catch (error) {
                toast.error('Failed to delete contacts');
            }
        }
    };

    const handleBulkAddTags = async () => {
        if (!bulkTags) return;
        const tags = bulkTags.split(',').map(t => t.trim()).filter(t => t);
        try {
            await bulkAddTagsToContacts(Array.from(selectedIds), tags);
            toast.success('Tags added successfully');
            setIsBulkTagModalOpen(false);
            setBulkTags('');
            setSelectedIds(new Set());
        } catch (error) {
            toast.error('Failed to add tags');
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 shrink-0">
                <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm">Import</button>
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm">Export</button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={18} /> New Contact
                    </button>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm font-medium text-blue-800">{selectedIds.size} contacts selected</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsBulkTagModalOpen(true)}
                            className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded text-sm font-medium hover:bg-blue-50"
                        >
                            Add Tags
                        </button>
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

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col gap-4 shrink-0">
                    <div className="flex gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                }}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div className="flex gap-2 relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`px-3 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 flex items-center gap-2 ${isFilterOpen ? 'bg-gray-100 border-gray-400' : 'bg-gray-50 border-gray-300'}`}
                            >
                                <Filter size={20} /> Filters
                            </button>
                            <button className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100"><Download size={20} /></button>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {isFilterOpen && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="p-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-1 focus:ring-primary"
                                >
                                    <option value="All">All Types</option>
                                    <option value="Lead">Lead</option>
                                    <option value="Customer">Customer</option>
                                    <option value="Prospect">Prospect</option>
                                    <option value="High-Value">High-Value</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Tag</label>
                                <input
                                    type="text"
                                    placeholder="Filter by tag..."
                                    value={filterTag}
                                    onChange={(e) => setFilterTag(e.target.value)}
                                    className="p-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => { setFilterType('All'); setFilterTag(''); }}
                                    className="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-2"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 border-b border-gray-200 w-8">
                                    <input
                                        type="checkbox"
                                        checked={filteredContacts.length > 0 && selectedIds.size === filteredContacts.length}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Name</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Email</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Phone</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Type</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Tags</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredContacts.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No contacts found.</td></tr>
                            ) : (
                                <>
                                    {filteredContacts.map((contact) => (
                                        <tr key={contact.id} className={`hover:bg-gray-50 transition-colors group ${selectedIds.has(contact.id) ? 'bg-blue-50/50' : ''}`}>
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(contact.id)}
                                                    onChange={() => handleSelectOne(contact.id)}
                                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                        {contact.name.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-gray-900">{contact.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">{contact.email}</td>
                                            <td className="p-4 text-sm text-gray-600">{contact.phone}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${contact.type === 'Customer' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    contact.type === 'Lead' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-gray-50 text-gray-700 border-gray-100'
                                                    }`}>
                                                    {contact.type}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-1 flex-wrap">
                                                    {contact.tags.map(tag => (
                                                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">{tag}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleOpenModal(contact)}
                                                        className="p-1 text-gray-400 hover:text-primary rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(contact.id)}
                                                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {hasMoreContacts && !searchTerm && filterType === 'All' && !filterTag && (
                                        <tr>
                                            <td colSpan={7} className="p-4 text-center">
                                                <button
                                                    onClick={() => loadMoreContacts()}
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                                                >
                                                    Load More
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bulk Tag Modal */}
            <Modal
                isOpen={isBulkTagModalOpen}
                onClose={() => setIsBulkTagModalOpen(false)}
                title="Add Tags to Selected Contacts"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                        <input
                            type="text"
                            value={bulkTags}
                            onChange={(e) => setBulkTags(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                            placeholder="Tag1, Tag2, Tag3"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsBulkTagModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBulkAddTags}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
                        >
                            Add Tags
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Contact Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Edit Contact' : 'New Contact'}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            placeholder="name@company.com"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">Phone Number</label>
                        <div className="flex gap-2">
                            <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-32 p-2.5"
                            >
                                {COUNTRY_CODES.map((country) => (
                                    <option key={country.name} value={country.code}>
                                        {country.flag} {country.name} ({country.code})
                                    </option>
                                ))}
                            </select>
                            <input
                                type="tel"
                                value={localPhone}
                                onChange={(e) => setLocalPhone(e.target.value)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                placeholder="123 456 7890"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            >
                                <option value="Lead">Lead</option>
                                <option value="Customer">Customer</option>
                                <option value="Prospect">Prospect</option>
                                <option value="High-Value">High-Value</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900">Tags</label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                placeholder="Tag1, Tag2"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="text-gray-700 bg-white border border-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="text-white bg-primary hover:bg-primary/90 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
                        >
                            {editingId ? 'Update Contact' : 'Save Contact'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Contacts;
