import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Package, 
  Receipt, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  ChevronRight,
  MoreVertical,
  Download,
  Eye,
  Check,
  XCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  orderBy,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { auth, db } from './firebase';

// --- Types ---

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

interface Estimate {
  id: string;
  projectName: string;
  clientName: string;
  visitDate: string;
  status: 'pending' | 'approved' | 'rejected';
  estimatedCost: number;
}

interface Job {
  id: string;
  title: string;
  clientName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'on-hold';
  budget: number;
  progress: number;
}

interface Worker {
  id: string;
  name: string;
  trade: string;
  phone: string;
  status: 'active' | 'inactive';
  photoUrl: string;
}

// --- Mock Data for Charts ---

const revenueData = [
  { month: 'Jan', revenue: 4000 },
  { month: 'Feb', revenue: 3000 },
  { month: 'Mar', revenue: 2000 },
  { month: 'Apr', revenue: 3500 },
  { month: 'May', revenue: 2500 },
  { month: 'Jun', revenue: 4500 },
];

const jobDistribution = [
  { name: 'Residential', value: 45 },
  { name: 'Commercial', value: 30 },
  { name: 'Renovation', value: 25 },
];

const COLORS = ['#4F46E5', '#10B981', '#F59E0B'];

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, onLogout }: { activeTab: string, setActiveTab: (id: string) => void, onLogout: () => void }) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'estimates', label: 'Estimates', icon: FileText },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'materials', label: 'Materials', icon: Package },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'workers', label: 'Workers', icon: Users },
  ];

  return (
    <div className="w-64 bg-[#1E293B] text-white h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
          <Briefcase className="text-white" size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">BIDII BUILDERS</h1>
      </div>
      
      <nav className="flex-1 mt-6 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, trend }: StatCardProps) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {trend && (
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="text-white" size={24} />
      </div>
    </div>
  </div>
);

const Dashboard = () => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Proprietor Dashboard</h2>
        <p className="text-slate-500 mt-1">Welcome back, Bidii Quality Builders Admin</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">Proprietor</p>
          <p className="text-xs text-slate-500">Admin</p>
        </div>
        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
          P
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard label="Active Jobs" value="0" icon={Briefcase} color="bg-indigo-500" />
      <StatCard label="Completed Jobs" value="0" icon={CheckCircle2} color="bg-emerald-500" />
      <StatCard label="Total Revenue" value="KES 0" icon={TrendingUp} color="bg-orange-500" />
      <StatCard label="Pending Invoices" value="0" icon={Clock} color="bg-rose-500" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="text-orange-500" size={20} />
              Monthly Revenue Trends
            </h3>
            <select className="bg-slate-50 border-none text-sm font-medium text-slate-600 rounded-lg px-3 py-2 outline-none">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#F97316" 
                  strokeWidth={3} 
                  dot={{r: 6, fill: '#F97316', strokeWidth: 2, stroke: '#fff'}}
                  activeDot={{r: 8, strokeWidth: 0}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider">Next Month Revenue Forecast</p>
              <h4 className="text-2xl font-bold text-slate-900">KES 4,850,000</h4>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">+12% Growth</span>
            <p className="text-[10px] text-slate-400 mt-1">Forecasted using Python linear growth model</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
          <Briefcase className="text-orange-500" size={20} />
          Job Distribution
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={jobDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {jobDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-4 mt-6">
          {jobDistribution.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index]}}></div>
                <span className="text-sm font-medium text-slate-600">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Estimates = () => {
  const [estimates, setEstimates] = useState<Estimate[]>([
    { id: '001', projectName: 'Residential Perimeter Wall Construction', clientName: 'John Smith', visitDate: 'March 31st, 2026', status: 'pending', estimatedCost: 0 },
    { id: '002', projectName: 'Modern 3-Bedroom Bungalow Foundation', clientName: 'Jane Smith', visitDate: 'March 20th, 2026', status: 'approved', estimatedCost: 1250000 },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Estimate Requests</h2>
          <p className="text-slate-500 mt-1">Manage incoming project inquiries</p>
        </div>
        <button className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
          <Plus size={20} />
          New Request
        </button>
      </div>

      <div className="space-y-4">
        {estimates.map((est) => (
          <div key={est.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all">
            <div className="flex items-center gap-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                est.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {est.status === 'approved' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    est.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {est.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">#{est.id}</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900">{est.projectName}</h4>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Users size={14} /> {est.clientName}</span>
                  <span className="flex items-center gap-1"><CalendarIcon size={14} /> Visit: {est.visitDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              {est.status === 'approved' && (
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Estimated Cost</p>
                  <p className="text-xl font-bold text-slate-900">KES {est.estimatedCost.toLocaleString()}</p>
                </div>
              )}
              {est.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all rounded-lg">
                    <Check size={20} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-lg">
                    <XCircle size={20} />
                  </button>
                </div>
              )}
              <button className="p-2 text-slate-300 hover:text-slate-600 transition-all">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Workers = () => {
  const workers: Worker[] = [
    { id: '1', name: 'John Doe', trade: 'Foreman', phone: '0712345678', status: 'active', photoUrl: '' },
    { id: '2', name: 'Jane Smith', trade: 'Plumber', phone: '0723456789', status: 'active', photoUrl: '' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Worker Management</h2>
          <p className="text-slate-500 mt-1">Manage your team and their assignments</p>
        </div>
        <button className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
          <Plus size={20} />
          Add Worker
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((worker) => (
          <div key={worker.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-400">
                {worker.name.charAt(0)}
              </div>
              <div className="flex flex-col items-end">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  ACTIVE
                </span>
              </div>
            </div>
            
            <h4 className="text-xl font-bold text-slate-900">{worker.name}</h4>
            <p className="text-slate-500 font-medium">{worker.trade}</p>
            
            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-4 text-slate-500 text-sm">
              <span className="flex items-center gap-2"><Phone size={14} /> {worker.phone}</span>
            </div>

            <button className="w-full mt-6 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">
              View Work History
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Jobs = () => {
  const jobs: Job[] = [
    { id: 'J001', title: 'Perimeter Wall - Syokimau', clientName: 'John Smith', startDate: '2026-03-01', endDate: '2026-04-15', status: 'active', budget: 450000, progress: 65 },
    { id: 'J002', title: 'Foundation - Kitengela', clientName: 'Jane Smith', startDate: '2026-02-15', endDate: '2026-03-20', status: 'completed', budget: 1250000, progress: 100 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Construction Jobs</h2>
          <p className="text-slate-500 mt-1">Track active and completed projects</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center">
            <button className="px-4 py-2 bg-slate-100 text-slate-900 rounded-lg text-sm font-bold">List View</button>
            <button className="px-4 py-2 text-slate-500 rounded-lg text-sm font-bold">Calendar View</button>
          </div>
          <button className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
            <Plus size={20} />
            New Job
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-orange-200 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  job.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <Briefcase size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{job.title}</h4>
                  <p className="text-sm text-slate-500">{job.clientName}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                  job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {job.status}
                </span>
                <p className="text-sm font-bold text-slate-900 mt-2">KES {job.budget.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Progress</span>
                <span>{job.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    job.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Materials = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Materials & Suppliers</h2>
          <p className="text-slate-500 mt-1">Manage inventory and procurement</p>
        </div>
        <button className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
          <Plus size={20} />
          Create Order
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Orders</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Cement (50kg Bags)</p>
                    <p className="text-xs text-slate-500">Ordered from Global Cement Ltd</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">100 Units</p>
                  <span className="text-[10px] font-bold text-orange-600 uppercase">Pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Approved Suppliers</h3>
          <div className="space-y-6">
            {[
              { name: 'Global Cement Ltd', email: 'sales@globalcement.com' },
              { name: 'Steel & Iron Works', email: 'orders@steeliron.com' }
            ].map((s) => (
              <div key={s.name} className="space-y-2">
                <p className="font-bold text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-2"><Mail size={12} /> {s.email}</p>
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">VERIFIED PARTNER</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Invoices = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Invoices & Payments</h2>
          <p className="text-slate-500 mt-1">Track billing and collections</p>
        </div>
        <button className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
          <Download size={20} />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl text-white">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Billed</p>
          <h3 className="text-2xl font-bold">KES 4,520,000</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="text-emerald-500" size={16} />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Received</p>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">KES 3,215,000</h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">71% collection rate this month</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="text-orange-500" size={16} />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending</p>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">KES 1,305,000</h3>
          <p className="text-xs text-orange-600 font-medium mt-1">4 invoices pending payment</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[1, 2, 3].map((i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-slate-600">#INV-2026-00{i}</td>
                <td className="px-6 py-4 font-bold text-slate-900">John Smith</td>
                <td className="px-6 py-4 text-sm text-slate-500">Perimeter Wall</td>
                <td className="px-6 py-4 font-bold text-slate-900">KES 150,000</td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">PAID</span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-slate-400 hover:text-orange-500 transition-colors">
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('admin@bidii.com');
  const [password, setPassword] = useState('password');

  return (
    <div className="min-h-screen bg-[#1E293B] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-orange-500 to-transparent rotate-12"></div>
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/40">
              <Briefcase className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">BIDII QUALITY BUILDERS</h2>
            <p className="text-slate-400 mt-2 font-medium">Construction Management System</p>
          </div>
        </div>

        <div className="p-10 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-orange-500 transition-all font-medium"
                placeholder="admin@bidii.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
            <div className="relative">
              <XCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-orange-500 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            onClick={onLogin}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 hover:bg-orange-600 hover:translate-y-[-2px] active:translate-y-[0] transition-all"
          >
            Sign In
          </button>

          <p className="text-center text-slate-400 text-sm font-medium">
            Bidii Admin Implementation v1.0.4
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = () => {
    // For demo purposes, we'll just set a mock user
    setUser({ uid: '123', email: 'admin@bidii.com' } as User);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              <Menu size={24} />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm w-64 outline-none focus:ring-2 ring-orange-500/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors">
              <AlertCircle size={20} />
              <span className="text-sm font-medium">System Status</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative">
              <Receipt size={20} />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></div>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'estimates' && <Estimates />}
              {activeTab === 'jobs' && <Jobs />}
              {activeTab === 'materials' && <Materials />}
              {activeTab === 'invoices' && <Invoices />}
              {activeTab === 'workers' && <Workers />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
