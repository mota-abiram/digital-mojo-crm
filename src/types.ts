export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  Value: 'Standard' | 'Mid' | 'High';
  owner: string;
  companyName?: string;
  type?: 'Branding' | 'Performance' | 'Creative' | '360' | '';
  status?: string;
  notes?: string;
  createdAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: string;
  dueTime?: string;
  isRecurring?: boolean;
  assignee?: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  name: string;
  value: number;
  stage: string;
  status: 'Open' | 'Won' | 'Lost' | 'Abandoned';
  owner?: string;
  tags: string[];
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyName?: string;
  source?: string;
  pipelineId?: string;
  createdAt?: string;
  updatedAt?: string;
  tasks?: Task[];
  notes?: Note[];
}

export interface PipelineColumn {
  id: string;
  title: string;
  color: string;
  totalValue: number;
  items: Opportunity[];
}

export interface Message {
  id: string;
  sender: 'me' | 'them';
  recipient?: string;
  message: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  messages: Message[];
  owner?: string;
}

export interface Appointment {
  id: string;
  title: string;
  time: string;
  date: string; // ISO date string
  assignedTo: string;
  notes: string;
  contactId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  description: string;
  contact: string;
}
