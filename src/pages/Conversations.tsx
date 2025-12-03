import React, { useEffect, useState } from 'react';
import { Search, Phone, UserPlus, Paperclip, Smile, Send, Mail, Tag, Clock, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Conversation, Contact } from '../types';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';

const Conversations: React.FC = () => {
    const { conversations, activeConversationId, setActiveConversation, fetchConversations, sendMessage, contacts, fetchContacts, addContact } = useStore();
    const [messageText, setMessageText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [contactSearch, setContactSearch] = useState('');

    useEffect(() => {
        fetchConversations();
        if (contacts.length === 0) fetchContacts();
    }, [fetchConversations, fetchContacts, contacts.length]);

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    const filteredConversations = conversations.filter(c =>
        c.contactName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(contactSearch.toLowerCase())
    );

    const handleSend = async () => {
        if (!messageText.trim()) return;
        await sendMessage(messageText);
        setMessageText('');
    };

    const startNewChat = async (contact: Contact) => {
        try {
            // Check if conversation already exists
            const existing = conversations.find(c => c.contactId === contact.id);
            if (existing) {
                setActiveConversation(existing.id);
            } else {
                await useStore.getState().createConversation(contact.id, contact.name);
            }
            setIsNewChatModalOpen(false);
            setContactSearch('');
        } catch (error) {
            console.error("Failed to create conversation:", error);
            toast.error("Failed to start conversation");
        }
    };

    return (
        <div className="flex h-full bg-white border-t border-gray-200">
            {/* Left Sidebar: List */}
            <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Messages</h2>
                        <button
                            onClick={() => setIsNewChatModalOpen(true)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                            title="New Conversation"
                        >
                            <UserPlus size={20} />
                        </button>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                        {['Unread', 'All', 'Starred'].map((tab, idx) => (
                            <button
                                key={tab}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${idx === 1 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search conversations"
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 && (
                        <div className="p-4 text-center text-gray-500 text-sm">No conversations found.</div>
                    )}
                    {filteredConversations.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => setActiveConversation(chat.id)}
                            className={`p-4 flex gap-3 cursor-pointer border-l-4 hover:bg-gray-50 transition-colors ${activeConversationId === chat.id ? 'bg-primary/5 border-primary' : 'border-transparent'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 bg-gray-400`}>
                                {chat.contactName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className={`text-sm font-semibold truncate ${activeConversationId === chat.id ? 'text-gray-900' : 'text-gray-700'}`}>{chat.contactName}</h4>
                                    <span className="text-xs text-gray-400 shrink-0">{chat.time}</span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Middle: Chat Area */}
            <div className="flex-1 flex flex-col bg-background-light">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold text-gray-900">{activeConversation.contactName}</h2>
                                <span className="text-sm text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">Contact ID: {activeConversation.contactId}</span>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><Phone size={20} /></button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {activeConversation.messages?.map((msg) => (
                                <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white ${msg.sender === 'me' ? 'bg-primary' : 'bg-gray-400'}`}>
                                        {msg.sender === 'me' ? 'Me' : activeConversation.contactName.charAt(0)}
                                    </div>
                                    <div className={`${msg.sender === 'me' ? 'bg-primary text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'} p-3 rounded-2xl shadow-sm max-w-md text-sm`}>
                                        {msg.message}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-200">
                            <div className="relative">
                                <textarea
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    className="w-full border border-gray-300 rounded-xl p-3 pr-32 focus:ring-2 focus:ring-primary focus:border-primary resize-none text-sm"
                                    rows={3}
                                    placeholder="Type a message..."
                                ></textarea>
                                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                    <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><Smile size={20} /></button>
                                    <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><Paperclip size={20} /></button>
                                    <button
                                        onClick={handleSend}
                                        className="bg-success hover:bg-success/90 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                                    >
                                        Send <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        Select a conversation to start chatting
                    </div>
                )}
            </div>

            {/* Right Sidebar: Profile */}
            {activeConversation && (() => {
                const contact = contacts.find(c => c.id === activeConversation.contactId);
                return (
                    <div className="w-80 border-l border-gray-200 bg-white flex flex-col overflow-y-auto">
                        <div className="p-8 flex flex-col items-center border-b border-gray-100">
                            <div className="w-24 h-24 rounded-full mb-4 shadow-sm bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
                                {activeConversation.contactName.charAt(0)}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{activeConversation.contactName}</h3>
                            <p className="text-sm text-gray-500">{contact?.type || 'Lead'}</p>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Details</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-700">
                                        <Mail size={16} className="text-gray-400" />
                                        {contact?.email || 'No email'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-700">
                                        <Phone size={16} className="text-gray-400" />
                                        {contact?.phone || 'No phone'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {contact?.tags && contact.tags.length > 0 ? (
                                        contact.tags.map((tag, i) => (
                                            <span key={i} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">{tag}</span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-400">No tags</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 mt-auto bg-gray-50 border-t border-gray-100 space-y-3">
                            <button className="w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Add Tag</button>
                            <button className="w-full py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">Book Appointment</button>
                        </div>
                    </div>
                );
            })()}

            {/* New Chat Modal */}
            <Modal
                isOpen={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
                title="New Conversation"
                size="md"
            >
                <div>
                    <input
                        type="text"
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        placeholder="Search contacts..."
                        className="w-full p-2 border border-gray-300 rounded-lg mb-4 text-sm"
                    />
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {filteredContacts.map(contact => (
                            <div
                                key={contact.id}
                                onClick={() => startNewChat(contact)}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                    {contact.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{contact.name}</p>
                                    <p className="text-xs text-gray-500">{contact.email}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Conversations;
