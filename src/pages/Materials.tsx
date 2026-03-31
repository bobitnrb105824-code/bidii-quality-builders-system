import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ShoppingCart,
  X,
  User,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Material, Job, Customer } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    jobId: '',
    name: '',
    supplier: '',
    quantity: 0,
    unitPrice: 0,
    orderDate: '',
    deliveryDate: '',
    status: 'ordered' as const
  });

  useEffect(() => {
    const qMaterials = query(collection(db, 'materials'), orderBy('createdAt', 'desc'));
    const unsubscribeMaterials = onSnapshot(qMaterials, (snapshot) => {
      setMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Material[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'materials');
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
      unsubscribeMaterials();
      unsubscribeJobs();
      unsubscribeCustomers();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        quantity: Number(formData.quantity),
        unitPrice: Number(formData.unitPrice),
        createdAt: editingMaterial ? editingMaterial.createdAt : new Date().toISOString()
      };

      if (editingMaterial) {
        await updateDoc(doc(db, 'materials', editingMaterial.id), data);
      } else {
        await addDoc(collection(db, 'materials'), data);
      }

      setIsModalOpen(false);
      setEditingMaterial(null);
      setFormData({
        jobId: '',
        name: '',
        supplier: '',
        quantity: 0,
        unitPrice: 0,
        orderDate: '',
        deliveryDate: '',
        status: 'ordered'
      });
    } catch (error) {
      handleFirestoreError(error, editingMaterial ? OperationType.UPDATE : OperationType.CREATE, 'materials');
    }
  };

  const getCustomerName = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return 'Unknown Job';
    return customers.find(c => c.id === job.customerId)?.name || 'Unknown Customer';
  };

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCustomerName(m.jobId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Materials</h1>
          <p className="text-muted-foreground">Order and track building materials for your jobs.</p>
        </div>
        <button 
          onClick={() => {
            setEditingMaterial(null);
            setFormData({
              jobId: '',
              name: '',
              supplier: '',
              quantity: 0,
              unitPrice: 0,
              orderDate: '',
              deliveryDate: '',
              status: 'ordered'
            });
            setIsModalOpen(true);
          }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Order Material</span>
        </button>
      </div>

      <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search materials by name, supplier or customer..." 
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-lg focus:ring-2 focus:ring-primary outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredMaterials.map((material) => (
          <div 
            key={material.id} 
            className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6"
          >
            <div className={cn(
              "p-4 rounded-xl shrink-0 flex items-center justify-center",
              material.status === 'delivered' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
            )}>
              {material.status === 'delivered' ? <CheckCircle2 size={24} /> : <Truck size={24} />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold truncate">{material.name}</h3>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  material.status === 'delivered' ? "bg-green-500 text-white" : "bg-blue-500 text-white"
                )}>
                  {material.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase size={14} />
                <span>Job: {getCustomerName(material.jobId)}</span>
                <span className="mx-1">•</span>
                <span>Supplier: {material.supplier}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ShoppingCart size={14} />
                  <span>Ordered: {material.orderDate ? format(new Date(material.orderDate), 'MMM d, yyyy') : 'Not set'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck size={14} />
                  <span>Delivery: {material.deliveryDate ? format(new Date(material.deliveryDate), 'MMM d, yyyy') : 'Pending'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-xl font-bold text-primary">${(material.quantity * material.unitPrice).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{material.quantity} units @ ${material.unitPrice}/unit</div>
              <button 
                onClick={() => {
                  setEditingMaterial(material);
                  setFormData({
                    jobId: material.jobId,
                    name: material.name,
                    supplier: material.supplier,
                    quantity: material.quantity,
                    unitPrice: material.unitPrice,
                    orderDate: material.orderDate?.split('T')[0] || '',
                    deliveryDate: material.deliveryDate?.split('T')[0] || '',
                    status: material.status
                  });
                  setIsModalOpen(true);
                }}
                className="text-sm font-medium hover:underline text-muted-foreground hover:text-foreground mt-2"
              >
                Update Status
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingMaterial ? 'Update Material' : 'Order New Material'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium">Job</label>
                <select 
                  required
                  className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.jobId}
                  onChange={(e) => setFormData({...formData, jobId: e.target.value})}
                >
                  <option value="">Select a job</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{getCustomerName(j.id)} (Job #{j.id.slice(0, 6)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Material Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supplier</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit Price ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input 
                      required
                      type="number" 
                      className="w-full pl-10 pr-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({...formData, unitPrice: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({...formData, orderDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Delivery Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select 
                  required
                  className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="ordered">Ordered</option>
                  <option value="delivered">Delivered</option>
                </select>
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
                  {editingMaterial ? 'Update Material' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
