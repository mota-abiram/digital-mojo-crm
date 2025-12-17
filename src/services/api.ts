import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, arrayUnion, query, orderBy, onSnapshot, where, startAfter, limit } from 'firebase/firestore';
import { Contact, Opportunity, Appointment, Conversation, Message, Notification } from '../types';

export const api = {
    contacts: {
        // SHARED: Contacts are visible to ALL logged-in users (no userId filter)
        getAll: async (userId?: string, lastDoc?: any, limitCount = 20) => {
            try {
                const constraints: any[] = [];
                // NO userId filtering - contacts shared across all accounts
                constraints.push(orderBy('createdAt', 'desc'));
                if (lastDoc) constraints.push(startAfter(lastDoc));
                constraints.push(limit(limitCount));

                const q = query(collection(db, 'contacts'), ...constraints);
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
                return { data, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
            } catch (error: any) {
                console.warn("Index query failed, falling back to simple query:", error);

                const constraints: any[] = [];
                // NO userId filtering - contacts shared across all accounts
                if (lastDoc) constraints.push(startAfter(lastDoc));
                constraints.push(limit(limitCount));

                const q = query(collection(db, 'contacts'), ...constraints);
                const querySnapshot = await getDocs(q);
                let data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));

                // Client-side sort
                data = data.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });

                return { data, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
            }
        },
        get: async (id: string) => {
            const docRef = doc(db, 'contacts', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Contact;
            }
            return null;
        },
        // SHARED: Search across ALL contacts (no userId filter)
        // Fetches all contacts and performs client-side search for comprehensive matching
        search: async (userId: string | undefined, term: string) => {
            // Fetch ALL contacts from the database to perform comprehensive search
            const q = query(collection(db, 'contacts'));
            const querySnapshot = await getDocs(q);
            const allContacts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));

            // Perform case-insensitive search across multiple fields
            const searchTermLower = term.toLowerCase().trim();

            return allContacts.filter(contact => {
                const nameMatch = contact.name?.toLowerCase().includes(searchTermLower);
                const emailMatch = contact.email?.toLowerCase().includes(searchTermLower);
                const phoneMatch = contact.phone?.toLowerCase().includes(searchTermLower);
                const companyMatch = contact.companyName?.toLowerCase().includes(searchTermLower);

                return nameMatch || emailMatch || phoneMatch || companyMatch;
            });
        },
        // SHARED: Subscribe to ALL contacts (no userId filter)
        subscribe: (callback: (data: Contact[]) => void, userId?: string) => {
            // Contacts are shared across all accounts
            const q = query(collection(db, 'contacts'), limit(100));
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
                callback(data);
            });
        },
        create: async (contact: Omit<Contact, 'id'>) => {
            contact.createdAt = new Date().toISOString();
            const docRef = await addDoc(collection(db, 'contacts'), contact);
            return { id: docRef.id, ...contact } as Contact;
        },
        update: async (id: string, contact: Partial<Contact>) => {
            const docRef = doc(db, 'contacts', id);
            await updateDoc(docRef, contact);
        },
        delete: async (id: string) => {
            const docRef = doc(db, 'contacts', id);
            await deleteDoc(docRef);
        },
        bulkDelete: async (ids: string[]) => {
            const promises = ids.map(id => deleteDoc(doc(db, 'contacts', id)));
            await Promise.all(promises);
        },
        bulkAddTags: async (ids: string[], tags: string[]) => {
            const promises = ids.map(id => updateDoc(doc(db, 'contacts', id), {
                tags: arrayUnion(...tags)
            }));
            await Promise.all(promises);
        },
        // Remove duplicate contacts based on email or name
        removeDuplicates: async () => {
            const q = query(collection(db, 'contacts'));
            const querySnapshot = await getDocs(q);
            const contacts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort by createdAt to keep the oldest
            contacts.sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateA - dateB;
            });

            const seen = new Map<string, string>(); // key -> id to keep
            const duplicateIds: string[] = [];

            contacts.forEach((contact: any) => {
                // Create a unique key based on email (primary) or name
                const email = (contact.email || '').toLowerCase().trim();
                const name = (contact.name || '').toLowerCase().trim();
                const key = email || name;

                if (key && seen.has(key)) {
                    // This is a duplicate
                    duplicateIds.push(contact.id);
                } else if (key) {
                    seen.set(key, contact.id);
                }
            });

            // Delete duplicates
            if (duplicateIds.length > 0) {
                const promises = duplicateIds.map(id => deleteDoc(doc(db, 'contacts', id)));
                await Promise.all(promises);
            }

            return { removed: duplicateIds.length, kept: seen.size };
        }
    },
    opportunities: {
        // SHARED: Opportunities are visible to ALL logged-in users (no userId filter)
        getAll: async (userId?: string, lastDoc?: any, limitCount: number = 20) => {
            try {
                const constraints: any[] = [];
                // NO userId filtering - opportunities shared across all accounts
                constraints.push(orderBy('createdAt', 'desc'));

                if (lastDoc) {
                    constraints.push(startAfter(lastDoc));
                }

                constraints.push(limit(limitCount));

                const q = query(collection(db, 'opportunities'), ...constraints);

                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Opportunity));
                return { data, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
            } catch (error) {
                console.warn("Index query failed for opportunities, falling back:", error);

                const constraints: any[] = [];
                // NO userId filtering - opportunities shared across all accounts
                if (lastDoc) constraints.push(startAfter(lastDoc));
                constraints.push(limit(limitCount));

                const q = query(collection(db, 'opportunities'), ...constraints);
                const querySnapshot = await getDocs(q);
                let data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Opportunity));

                // Client-side sort
                data = data.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });

                return { data, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
            }
        },
        // Fetch opportunities by stage with pagination
        getByStage: async (stageId: string, lastDoc?: any, limitCount: number = 10) => {
            try {
                const constraints: any[] = [];
                constraints.push(where('stage', '==', stageId));
                constraints.push(orderBy('createdAt', 'desc'));

                if (lastDoc) {
                    constraints.push(startAfter(lastDoc));
                }

                constraints.push(limit(limitCount));

                const q = query(collection(db, 'opportunities'), ...constraints);
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Opportunity));
                return {
                    data,
                    lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
                    hasMore: querySnapshot.docs.length === limitCount
                };
            } catch (error) {
                console.warn("Index query failed for opportunities by stage, falling back:", error);

                // Fallback: fetch all for this stage and paginate client-side
                const q = query(collection(db, 'opportunities'), where('stage', '==', stageId));
                const querySnapshot = await getDocs(q);
                let data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Opportunity));

                // Client-side sort
                data = data.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });

                return {
                    data,
                    lastDoc: null,
                    hasMore: false
                };
            }
        },
        // SHARED: Subscribe to ALL opportunities (no userId filter)
        subscribe: (callback: (data: Opportunity[]) => void, userId?: string) => {
            // Opportunities are shared across all accounts
            const q = query(collection(db, 'opportunities'));
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Opportunity));
                callback(data);
            });
        },
        create: async (opp: Omit<Opportunity, 'id'>) => {
            const docRef = await addDoc(collection(db, 'opportunities'), {
                ...opp,
                createdAt: new Date().toISOString()
            });
            return { id: docRef.id, ...opp };
        },
        update: async (id: string, opp: Partial<Opportunity>) => {
            await updateDoc(doc(db, 'opportunities', id), opp);
        },
        delete: async (id: string) => {
            await deleteDoc(doc(db, 'opportunities', id));
        },
        bulkDelete: async (ids: string[]) => {
            const promises = ids.map(id => deleteDoc(doc(db, 'opportunities', id)));
            await Promise.all(promises);
        },
        // Get total counts and values per stage
        getStageCounts: async () => {
            const q = query(collection(db, 'opportunities'));
            const querySnapshot = await getDocs(q);
            const counts: Record<string, { count: number; value: number }> = {};

            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                const stage = data.stage || 'Unknown';
                const value = Number(data.value) || 0;

                if (!counts[stage]) {
                    counts[stage] = { count: 0, value: 0 };
                }
                counts[stage].count += 1;
                counts[stage].value += value;
            });

            return counts;
        },
        // Get comprehensive dashboard statistics
        getDashboardStats: async (daysBack: number = 30) => {
            const q = query(collection(db, 'opportunities'));
            const querySnapshot = await getDocs(q);
            const allOpportunities = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Opportunity));

            const now = new Date();
            const pastDate = new Date();
            pastDate.setDate(now.getDate() - daysBack);
            pastDate.setHours(0, 0, 0, 0);

            // Filter by time range
            const filteredOpportunities = allOpportunities.filter(opp => {
                if (!opp.createdAt) return false;
                const oppDate = new Date(opp.createdAt);
                return oppDate >= pastDate;
            });

            // Calculate stats
            const totalOpportunities = filteredOpportunities.length;
            const totalPipelineValue = filteredOpportunities.reduce((sum, opp) => sum + Number(opp.value || 0), 0);
            const wonOpportunities = filteredOpportunities.filter(opp => opp.status === 'Won' || opp.stage === '10').length;
            const lostOpportunities = filteredOpportunities.filter(opp => opp.status === 'Lost').length;
            const openOpportunities = filteredOpportunities.filter(opp => opp.status === 'Open').length;
            const conversionRate = totalOpportunities > 0 ? ((wonOpportunities / totalOpportunities) * 100) : 0;

            // Stage breakdown
            const stageBreakdown: Record<string, { count: number; value: number }> = {};
            filteredOpportunities.forEach(opp => {
                const stage = opp.stage || 'Unknown';
                if (!stageBreakdown[stage]) {
                    stageBreakdown[stage] = { count: 0, value: 0 };
                }
                stageBreakdown[stage].count += 1;
                stageBreakdown[stage].value += Number(opp.value || 0);
            });

            // Pipeline trend (cumulative value over time)
            const sortedOpps = [...filteredOpportunities].sort((a, b) =>
                new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
            );

            let cumulativeValue = 0;
            const trendMap = new Map<string, number>();
            sortedOpps.forEach(opp => {
                if (opp.createdAt) {
                    const date = new Date(opp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    cumulativeValue += Number(opp.value || 0);
                    trendMap.set(date, cumulativeValue);
                }
            });
            const pipelineTrend = Array.from(trendMap.entries()).map(([name, value]) => ({ name, value }));

            // Task breakdown
            const allTasks = filteredOpportunities.flatMap(o => o.tasks || []);
            const completedTasks = allTasks.filter(t => t.isCompleted).length;
            const pendingTasks = allTasks.length - completedTasks;

            return {
                totalOpportunities,
                totalPipelineValue,
                wonOpportunities,
                lostOpportunities,
                openOpportunities,
                conversionRate,
                stageBreakdown,
                pipelineTrend,
                taskStats: {
                    completed: completedTasks,
                    pending: pendingTasks,
                    total: allTasks.length
                },
                allOpportunities: filteredOpportunities
            };
        },
        // Remove duplicate opportunities based on name + contactId
        removeDuplicates: async () => {
            const q = query(collection(db, 'opportunities'));
            const querySnapshot = await getDocs(q);
            const opportunities = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort by createdAt to keep the oldest
            opportunities.sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateA - dateB;
            });

            const seen = new Map<string, string>(); // key -> id to keep
            const duplicateIds: string[] = [];

            opportunities.forEach((opp: any) => {
                // Create a unique key based on name + contactId (or just name if no contact)
                const name = (opp.name || '').toLowerCase().trim();
                const contactId = opp.contactId || '';
                const key = `${name}_${contactId}`;

                if (name && seen.has(key)) {
                    // This is a duplicate
                    duplicateIds.push(opp.id);
                } else if (name) {
                    seen.set(key, opp.id);
                }
            });

            // Delete duplicates
            if (duplicateIds.length > 0) {
                const promises = duplicateIds.map(id => deleteDoc(doc(db, 'opportunities', id)));
                await Promise.all(promises);
            }

            return { removed: duplicateIds.length, kept: seen.size };
        }
    },
    appointments: {
        getAll: async (userId?: string) => {
            let q = query(collection(db, 'appointments'));
            if (userId) {
                q = query(collection(db, 'appointments'), where('assignedTo', '==', userId));
            }
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        },
        subscribe: (callback: (data: Appointment[]) => void, userId?: string) => {
            let q = query(collection(db, 'appointments'));
            if (userId) {
                q = query(collection(db, 'appointments'), where('assignedTo', '==', userId));
            }
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
                callback(data);
            });
        },
        create: async (apt: Omit<Appointment, 'id'>) => {
            const docRef = await addDoc(collection(db, 'appointments'), {
                ...apt,
                createdAt: new Date().toISOString()
            });
            return { id: docRef.id, ...apt };
        },
        update: async (id: string, apt: Partial<Appointment>) => {
            await updateDoc(doc(db, 'appointments', id), apt);
        },
        delete: async (id: string) => {
            await deleteDoc(doc(db, 'appointments', id));
        }
    },
    conversations: {
        // SHARED: Conversations are visible to ALL logged-in users (no userId filter)
        getAll: async (userId?: string) => {
            const q = query(collection(db, 'conversations'), orderBy('time', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
        },
        // SHARED: Subscribe to ALL conversations (no userId filter)
        subscribe: (callback: (data: Conversation[]) => void, userId?: string) => {
            const q = query(collection(db, 'conversations'), orderBy('time', 'desc'));
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
                callback(data);
            });
        },
        sendMessage: async (conversationId: string, message: Message) => {
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationDoc = await getDoc(conversationRef);

            if (conversationDoc.exists()) {
                await updateDoc(conversationRef, {
                    messages: arrayUnion(message),
                    lastMessage: message.message,
                    time: 'Just now'
                });
            }
        },
        create: async (conversation: Omit<Conversation, 'id'>) => {
            const docRef = await addDoc(collection(db, 'conversations'), conversation);
            return { id: docRef.id, ...conversation };
        }
    },
    notifications: {
        getAll: async () => {
            return [] as Notification[];
        }
    }
};
