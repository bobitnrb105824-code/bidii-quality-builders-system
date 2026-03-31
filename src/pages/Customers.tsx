import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin, 
  Trash2, 
  Edit2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Customer } from '../types';
import { format } from 'date-fns';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customerData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customers');
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), {
          ...formData
        });
      } else {
        await addDoc(collection(db, 'customers'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      setFormData({ name: '', email: '', phone: '', address: '' });
    } catch (error) {
      handleFirestoreError(error, editingCustomer ? OperationType.UPDATE : OperationType.CREATE, 'customers');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteDoc(doc(db, 'customers', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
      }
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your client database and project requests.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ name: '', email: '', phone: '', address: '' });
            setIsModalOpen(true);
          }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search customers by name, email or phone..." 
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-lg focus:ring-2 focus:ring-primary outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Table/Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xl">
                {customer.name.charAt(0)}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setEditingCustomer(customer);
                    setFormData({
                      name: customer.name,
                      email: customer.email,
                      phone: customer.phone,
                      address: customer.address
                    });
                    setIsModalOpen(true);
                  }}
                  className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(customer.id)}
                  className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold mb-4">{customer.name}</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail size={16} />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone size={16} />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin size={16} />
                <span className="truncate">{customer.address}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>Added {format(new Date(customer.createdAt), 'MMM d, yyyy')}</span>
              <button className="text-primary font-medium hover:underline">View Projects</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <input 
                  required
                  type="email" 
                  className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <input 
                  required
                  type="tel" 
                  className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
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
                  {editingCustomer ? 'Save Changes' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { X } from 'lucide-react';
