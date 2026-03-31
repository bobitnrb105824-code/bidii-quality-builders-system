export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Estimate {
  id: string;
  customerId: string;
  requestDate: string;
  visitDate?: string;
  description: string;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Job {
  id: string;
  estimateId: string;
  customerId: string;
  startDate?: string;
  endDate?: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  progress: number;
  createdAt: string;
}

export interface Material {
  id: string;
  jobId: string;
  name: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  orderDate?: string;
  deliveryDate?: string;
  status: 'ordered' | 'delivered';
  createdAt: string;
}

export interface Invoice {
  id: string;
  jobId: string;
  customerId: string;
  amount: number;
  dueDate: string;
  status: 'unpaid' | 'paid';
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  paymentDate: string;
  method: string;
  createdAt: string;
}
