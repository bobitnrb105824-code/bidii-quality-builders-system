import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  User,
  DollarSign,
  Briefcase,
  Calendar,
  Download,
  Receipt
} from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Invoice, Job, Customer, Payment } from '../types';
import { format, addDays } from 'date-fns';
import { cn } from '../lib/utils';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    jobId: '',
    customerId: '',
    amount: 0,
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    status: 'unpaid' as const
  });
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    method: 'Bank Transfer'
  });

  useEffect(() => {
    const qInvoices = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
    const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Invoice[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'invoices');
    });

    const qJobs = query(collection(db, 'jobs'));
    const unsubscribeJobs = onSnapshot(qJobs, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Job[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'jobs');
    });

    const qCustomers = query(collection(db, 'customers'));
    const unsubscribeCustomers = onSnapshot(qCustomers, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customers');
    });

    return () => {
      unsubscribeInvoices();
      unsubscribeJobs();
      unsubscribeCustomers();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        amount: Number(formData.amount),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'invoices'), data);

      setIsModalOpen(false);
      setFormData({
        jobId: '',
        customerId: '',
        amount: 0,
        dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        status: 'unpaid'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'invoices');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      // Record payment
      await addDoc(collection(db, 'payments'), {
        invoiceId: selectedInvoice.id,
        customerId: selectedInvoice.customerId,
        amount: Number(paymentData.amount),
        paymentDate: paymentData.paymentDate,
        method: paymentData.method,
        createdAt: new Date().toISOString()
      });

      // Update invoice status if fully paid
      if (Number(paymentData.amount) >= selectedInvoice.amount) {
        await updateDoc(doc(db, 'invoices', selectedInvoice.id), {
          status: 'paid'
        });
      }

      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      setPaymentData({
        amount: 0,
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        method: 'Bank Transfer'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payments');
    }
  };

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Unknown Customer';

  const filteredInvoices = invoices.filter(i => 
    getCustomerName(i.customerId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices & Payments</h1>
          <p className="text-muted-foreground">Manage billing and track customer payments.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Create Invoice</span>
        </button>
      </div>

      <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search invoices by customer or status..." 
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-lg focus:ring-2 focus:ring-primary outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredInvoices.map((invoice) => (
          <div 
            key={invoice.id} 
            className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6"
          >
            <div className={cn(
              "p-4 rounded-xl shrink-0 flex items-center justify-center",
              invoice.status === 'paid' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
            )}>
              {invoice.status === 'paid' ? <CheckCircle2 size={24} /> : <Receipt size={24} />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold truncate">{getCustomerName(invoice.customerId)}</h3>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  invoice.status === 'paid' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                )}>
                  {invoice.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase size={14} />
                <span>Job #{invoice.jobId.slice(0, 6)}</span>
                <span className="mx-1">•</span>
                <Calendar size={14} />
                <span>Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-xl font-bold text-primary">${invoice.amount.toLocaleString()}</div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors" title="Download PDF">
                  <Download size={18} />
                </button>
                {invoice.status !== 'paid' && (
                  <button 
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setPaymentData({
                        amount: invoice.amount,
                        paymentDate: format(new Date(), 'yyyy-MM-dd'),
                        method: 'Bank Transfer'
                      });
                      setIsPaymentModalOpen(true);
                    }}
                    className="bg-primary/10 text-primary px-4 py-1.5 rounded-lg text-sm font-bold uppercase hover:bg-primary/20 transition-all"
                  >
                    Record Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Create New Invoice</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Job</label>
                <select 
                  required
                  className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.jobId}
                  onChange={(e) => {
                    const job = jobs.find(j => j.id === e.target.value);
                    setFormData({
                      ...formData, 
                      jobId: e.target.value,
                      customerId: job?.customerId || ''
                    });
                  }}
                >
                  <option value="">Select a job</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{getCustomerName(j.customerId)} (Job #{j.id.slice(0, 6)})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    required
                    type="number" 
                    className="w-full pl-10 pr-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-sm hover:opacity-90 transition-all"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Record Payment</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-muted rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="bg-muted/50 p-4 rounded-xl mb-4">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Invoice For</p>
                <p className="font-bold">{getCustomerName(selectedInvoice?.customerId || '')}</p>
                <p className="text-sm text-muted-foreground">Amount Due: ${selectedInvoice?.amount.toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    required
                    type="number" 
                    className="w-full pl-10 pr-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Date</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <select 
                  required
                  className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                  <option value="Mobile Money">Mobile Money</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-sm hover:opacity-90 transition-all"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
