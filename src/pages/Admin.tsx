import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Search, 
  UserPlus, 
  Settings, 
  Activity,
  MoreVertical,
  ShieldCheck,
  ShieldAlert,
  Database,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, setDoc, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Customer } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'customers' | 'system'>('users');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'staff'>('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch Users
    const qUsers = query(collection(db, 'users'), orderBy('email', 'asc'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // Fetch Customers
    const qCustomers = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    const unsubscribeCustomers = onSnapshot(qCustomers, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customers');
    });

    return () => {
      unsubscribeUsers();
      unsubscribeCustomers();
    };
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;

    setIsSubmitting(true);
    try {
      // Check if user already exists
      const q = query(collection(db, 'users'), where('email', '==', newUserEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('A user with this email already exists.');
        setIsSubmitting(false);
        return;
      }

      // Create a placeholder user document (UID will be updated on first login)
      // We use a random ID for now, or the email as ID if we want to be strict
      const userRef = doc(collection(db, 'users'));
      await setDoc(userRef, {
        email: newUserEmail,
        role: newUserRole,
        createdAt: new Date().toISOString(),
        status: 'invited'
      });

      setNewUserEmail('');
      setNewUserRole('staff');
      setIsAddUserModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">Manage system users, permissions, and master data.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === 'users' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('customers')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === 'customers' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Customers
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === 'system' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            System
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button 
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
            >
              <UserPlus size={18} />
              Add Staff User
            </button>
          </div>

          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Last Login</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {user.email?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold">{user.displayName || 'Pending Login'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider bg-transparent border-none focus:ring-0 cursor-pointer",
                            user.role === 'admin' ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          <option value="admin">Admin</option>
                          <option value="staff">Staff</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, HH:mm') : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "flex items-center gap-1.5 text-xs font-medium",
                          user.uid ? "text-green-500" : "text-amber-500"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", user.uid ? "bg-green-500" : "bg-amber-500")} />
                          {user.uid ? 'Active' : 'Invited'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                          <Settings size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
            <h3 className="font-bold">Master Customer Records</h3>
            <button className="text-sm text-primary font-medium hover:underline">Export CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm">{customer.name}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{customer.email}</p>
                      <p className="text-xs text-muted-foreground">{customer.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-[200px]">
                      {customer.address}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card p-6 rounded-2xl border shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              System Health
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <span className="text-sm font-medium">Database Connection</span>
                <span className="text-xs font-bold text-green-500 uppercase">Stable</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <span className="text-sm font-medium">Auth Service</span>
                <span className="text-xs font-bold text-green-500 uppercase">Online</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <span className="text-sm font-medium">Storage Quota</span>
                <span className="text-xs font-bold text-blue-500 uppercase">2% Used</span>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary" />
              Security Overview
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <span className="text-sm font-medium">Admin Users</span>
                <span className="text-sm font-bold">{users.filter(u => u.role === 'admin').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <span className="text-sm font-medium">Staff Users</span>
                <span className="text-sm font-bold">{users.filter(u => u.role === 'staff').length}</span>
              </div>
              <button className="w-full mt-2 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg shadow-sm hover:opacity-90 transition-all">
                Audit Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border animate-in zoom-in duration-300">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Add Staff User</h2>
              <button onClick={() => setIsAddUserModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground px-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="staff@example.com"
                  className="w-full px-4 py-3 bg-muted/30 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground px-1">System Role</label>
                <select 
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'staff')}
                  className="w-full px-4 py-3 bg-muted/30 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="staff">Staff Member</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="bg-primary/5 p-4 rounded-xl flex gap-3">
                <AlertCircle className="text-primary shrink-0" size={20} />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The user will be granted access once they sign in with this email address using Google.
                </p>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add User'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
