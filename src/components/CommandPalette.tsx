import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Target, Calendar, MessageSquare, LayoutDashboard, Rocket } from 'lucide-react';
import { useStore } from '../store/useStore';

const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const { contacts, opportunities } = useStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isOpen) return null;

    const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
    const filteredOpportunities = opportunities.filter(o => o.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

    const pages = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Launchpad', path: '/', icon: Rocket },
        { name: 'Conversations', path: '/conversations', icon: MessageSquare },
        { name: 'Calendars', path: '/calendars', icon: Calendar },
        { name: 'Contacts', path: '/contacts', icon: User },
        { name: 'Opportunities', path: '/opportunities', icon: Target },
    ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

    const handleSelect = (path: string) => {
        navigate(path);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 ring-1 ring-gray-200">
                <div className="flex items-center border-b border-gray-100 px-4 py-3">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        type="text"
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent border-none outline-none text-lg text-gray-800 placeholder:text-gray-400"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="flex items-center gap-1">
                        <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">ESC</kbd>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto py-2">
                    {pages.length > 0 && (
                        <div className="px-2 mb-2">
                            <h3 className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Pages</h3>
                            {pages.map(page => (
                                <button
                                    key={page.path}
                                    onClick={() => handleSelect(page.path)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 hover:text-primary transition-colors text-left"
                                >
                                    <page.icon size={18} />
                                    {page.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {filteredContacts.length > 0 && (
                        <div className="px-2 mb-2">
                            <h3 className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contacts</h3>
                            {filteredContacts.map(contact => (
                                <button
                                    key={contact.id}
                                    onClick={() => handleSelect('/contacts')}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 hover:text-primary transition-colors text-left"
                                >
                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                        {contact.name.charAt(0)}
                                    </div>
                                    {contact.name}
                                    <span className="ml-auto text-xs text-gray-400">{contact.email}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {filteredOpportunities.length > 0 && (
                        <div className="px-2 mb-2">
                            <h3 className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Opportunities</h3>
                            {filteredOpportunities.map(opp => (
                                <button
                                    key={opp.id}
                                    onClick={() => handleSelect('/opportunities')}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 hover:text-primary transition-colors text-left"
                                >
                                    <Target size={18} className="text-gray-400" />
                                    {opp.name}
                                    <span className="ml-auto text-xs text-gray-400">${opp.value}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {pages.length === 0 && filteredContacts.length === 0 && filteredOpportunities.length === 0 && (
                        <div className="py-12 text-center text-gray-500">
                            No results found.
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                    <span>Search for pages, contacts, and more</span>
                    <div className="flex gap-2">
                        <span><kbd className="font-sans">↑↓</kbd> to navigate</span>
                        <span><kbd className="font-sans">↵</kbd> to select</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
