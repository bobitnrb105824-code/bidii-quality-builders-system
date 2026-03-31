import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  User,
  DollarSign
} from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Estimate, Customer } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Estimates() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    requestDate: new Date().toISOString().split('T')[0],
    visitDate: '',
    description: '',
    totalAmount: 0,
    status: 'pending' as const
  });

  useEffect(() => {
    const qEstimates = query(collection(db, 'estimates'), orderBy('createdAt', 'desc'));
    const unsubscribeEstimates = onSnapshot(qEstimates, (snapshot) => {
      setEstimates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Estimate[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'estimates');
    });

    const qCustomers = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const unsubscribeCustomers = onSnapshot(qCustomers, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customers');
    });

    return () => {
      unsubscribeEstimates();
      unsubscribeCustomers();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        totalAmount: Number(formData.totalAmount),
        createdAt: editingEstimate ? editingEstimate.createdAt : new Date().toISOString()
      };

      if (editingEstimate) {
        await updateDoc(doc(db, 'estimates', editingEstimate.id), data);
      } else {
        await addDoc(collection(db, 'estimates'), data);
      }
      
      // If approved, automatically create a job
      if (formData.status === 'approved' && (!editingEstimate || editingEstimate.status !== 'approved')) {
        await addDoc(collection(db, 'jobs'), {
          estimateId: editingEstimate?.id || '', 
          customerId: formData.customerId,
          status: 'scheduled',
          progress: 0,
          createdAt: new Date().toISOString()
        });
      }

      setIsModalOpen(false);
      setEditingEstimate(null);
      setFormData({
        customerId: '',
        requestDate: new Date().toISOString().split('T')[0],
        visitDate: '',
        description: '',
        totalAmount: 0,
        status: 'pending'
      });
    } catch (error) {
      handleFirestoreError(error, editingEstimate ? OperationType.UPDATE : OperationType.CREATE, 'estimates');
    }
  };

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Unknown Customer';

  const filteredEstimates = estimates.filter(e => 
    getCustomerName(e.customerId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estimates</h1>
          <p className="text-muted-foreground">Prepare and track project cost estimates.</p>
        </div>
        <button 
          onClick={() => {
            setEditingEstimate(null);
            setFormData({
              customerId: '',
              requestDate: new Date().toISOString().split('T')[0],
              visitDate: '',
              description: '',
              totalAmount: 0,
              status: 'pending'
            });
            setIsModalOpen(true);
          }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          <span>New Estimate</span>
        </button>
      </div>

      <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search estimates by customer or description..." 
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-lg focus:ring-2 focus:ring-primary outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredEstimates.map((estimate) => (
          <div 
            key={estimate.id} 
            className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6"
          >
            <div className={cn(
              "p-4 rounded-xl shrink-0 flex items-center justify-center",
              estimate.status === 'approved' ? "bg-green-100 text-green-600" :
              estimate.status === 'rejected' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
            )}>
              {estimate.status === 'approved' ? <CheckCircle2 size={24} /> :
               estimate.status === 'rejected' ? <AlertCircle size={24} /> : <Clock size={24} />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold truncate">{getCustomerName(estimate.customerId)}</h3>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  estimate.status === 'approved' ? "bg-green-500 text-white" :
                  estimate.status === 'rejected' ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                )}>
                  {estimate.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{estimate.description}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>Requested: {format(new Date(estimate.requestDate), 'MMM d, yyyy')}</span>
                </div>
                {estimate.visitDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>Visit: {format(new Date(estimate.visitDate), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-xl font-bold text-primary">${estimate.totalAmount.toLocaleString()}</div>
              <button 
                onClick={() => {
                  setEditingEstimate(estimate);
                  setFormData({
                    customerId: estimate.customerId,
                    requestDate: estimate.requestDate.split('T')[0],
                    visitDate: estimate.visitDate?.split('T')[0] || '',
                    description: estimate.description,
                    totalAmount: estimate.totalAmount,
                    status: estimate.status
                  });
                  setIsModalOpen(true);
                }}
                className="text-sm font-medium hover:underline text-muted-foreground hover:text-foreground"
              >
                Edit Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingEstimate ? 'Edit Estimate' : 'New Estimate Request'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer</label>
                  <select 
                    required
                    className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.customerId}
                    onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                  >
                    <option value="">Select a customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select 
                    required
                    className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Request Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.requestDate}
                    onChange={(e) => setFormData({...formData, requestDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visit Date (Optional)</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.visitDate}
                    onChange={(e) => setFormData({...formData, visitDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Estimated Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="number" 
                    className="w-full pl-10 pr-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({...formData, totalAmount: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Description</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                  {editingEstimate ? 'Update Estimate' : 'Create Estimate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
