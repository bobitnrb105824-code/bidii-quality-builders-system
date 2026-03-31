import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  Briefcase,
  Users,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { collection, query, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
  <div className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <div className={cn("flex items-center gap-1 text-sm font-medium", trend === 'up' ? "text-green-500" : "text-red-500")}>
          {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {trendValue}
        </div>
      )}
    </div>
    <div>
      <p className="text-muted-foreground text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
    </div>
  </div>
);

import { cn } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedJobs: 0,
    pendingJobs: 0,
    totalRevenue: 0,
    totalCustomers: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Stats
    const fetchStats = async () => {
      const jobsSnap = await getDocs(collection(db, 'jobs'));
      const paymentsSnap = await getDocs(collection(db, 'payments'));
      const customersSnap = await getDocs(collection(db, 'customers'));

      const jobs = jobsSnap.docs.map(doc => doc.data());
      const payments = paymentsSnap.docs.map(doc => doc.data());

      setStats({
        totalProjects: jobs.length,
        completedJobs: jobs.filter(j => j.status === 'completed').length,
        pendingJobs: jobs.filter(j => j.status !== 'completed').length,
        totalRevenue: payments.reduce((acc, p) => acc + (p.amount || 0), 0),
        totalCustomers: customersSnap.size
      });

      // Recent Jobs
      const sortedJobs = jobsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      setRecentJobs(sortedJobs);

      // Revenue Chart Data (Last 6 months)
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthName = format(date, 'MMM');
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        
        const monthRevenue = payments
          .filter(p => {
            const pDate = new Date(p.paymentDate);
            return pDate >= monthStart && pDate <= monthEnd;
          })
          .reduce((acc, p) => acc + p.amount, 0);
        
        months.push({ name: monthName, revenue: monthRevenue });
      }
      setRevenueData(months);
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium shadow-sm hover:opacity-90 transition-all flex items-center gap-2">
            <TrendingUp size={18} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Projects" 
          value={stats.totalProjects} 
          icon={Briefcase} 
          color="bg-blue-500"
          trend="up"
          trendValue="12%"
        />
        <StatCard 
          title="Completed Jobs" 
          value={stats.completedJobs} 
          icon={CheckCircle2} 
          color="bg-green-500"
          trend="up"
          trendValue="8%"
        />
        <StatCard 
          title="Pending Jobs" 
          value={stats.pendingJobs} 
          icon={Clock} 
          color="bg-amber-500"
          trend="down"
          trendValue="3%"
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-primary"
          trend="up"
          trendValue="24%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Revenue Overview</h3>
            <select className="bg-muted border-none rounded-md text-sm px-2 py-1 outline-none">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <h3 className="text-lg font-bold mb-6">Recent Jobs</h3>
          <div className="space-y-6">
            {recentJobs.length > 0 ? recentJobs.map((job) => (
              <div key={job.id} className="flex items-start gap-4">
                <div className={cn(
                  "w-2 h-2 mt-2 rounded-full shrink-0",
                  job.status === 'completed' ? "bg-green-500" : 
                  job.status === 'in-progress' ? "bg-blue-500" : "bg-amber-500"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">Job #{job.id.slice(0, 6)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)} • {job.progress}%
                  </p>
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  {format(new Date(job.createdAt), 'MMM d')}
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent jobs found.</p>
            )}
          </div>
          <button className="w-full mt-8 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors">
            View All Jobs
          </button>
        </div>
      </div>
    </div>
  );
}
