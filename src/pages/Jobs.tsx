import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  PlayCircle,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  X,
  User,
  Plus
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Job, Customer, Estimate } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    status: 'scheduled' as const,
    progress: 0,
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const qJobs = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
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
      unsubscribeJobs();
      unsubscribeCustomers();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    try {
      await updateDoc(doc(db, 'jobs', editingJob.id), {
        ...formData,
        progress: Number(formData.progress)
      });

      // If completed, automatically create an invoice
      if (formData.status === 'completed' && editingJob.status !== 'completed') {
        await addDoc(collection(db, 'invoices'), {
          jobId: editingJob.id,
          customerId: editingJob.customerId,
          amount: 0, 
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'unpaid',
          createdAt: new Date().toISOString()
        });
      }

      setIsModalOpen(false);
      setEditingJob(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `jobs/${editingJob.id}`);
    }
  };

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Unknown Customer';

  const filteredJobs = jobs.filter(j => 
    getCustomerName(j.customerId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">Schedule and track construction project progress.</p>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search jobs by customer or status..." 
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-lg focus:ring-2 focus:ring-primary outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-3 rounded-xl",
                  job.status === 'completed' ? "bg-green-100 text-green-600" :
                  job.status === 'in-progress' ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
                )}>
                  {job.status === 'completed' ? <CheckCircle2 size={24} /> :
                   job.status === 'in-progress' ? <PlayCircle size={24} /> : <Clock size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{getCustomerName(job.customerId)}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{job.status}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setEditingJob(job);
                  setFormData({
                    status: job.status,
                    progress: job.progress,
                    startDate: job.startDate?.split('T')[0] || '',
                    endDate: job.endDate?.split('T')[0] || ''
                  });
                  setIsModalOpen(true);
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground font-medium">Progress</span>
                <span className="font-bold">{job.progress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    job.status === 'completed' ? "bg-green-500" : "bg-primary"
                  )}
                  style={{ width: `${job.progress}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Start Date</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span>{job.startDate ? format(new Date(job.startDate), 'MMM d, yyyy') : 'Not set'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">End Date</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span>{job.endDate ? format(new Date(job.endDate), 'MMM d, yyyy') : 'Not set'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button className="flex-1 py-2 text-xs font-bold uppercase bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                View Details
              </button>
              <button className="flex-1 py-2 text-xs font-bold uppercase bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors">
                Manage Materials
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Update Job Progress</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select 
                  required
                  className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Progress (%)</label>
                  <span className="text-sm font-bold">{formData.progress}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100"
                  className="w-full accent-primary"
                  value={formData.progress}
                  onChange={(e) => setFormData({...formData, progress: Number(e.target.value)})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2 bg-muted/50 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
