export interface Ticket {
  id: number;
  subject: string;
  status: 'OPEN' | 'CLOSED';
  priority: 'low' | 'medium' | 'high';
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}