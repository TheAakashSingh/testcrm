'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  assignedTo?: { id: number; name: string };
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', company: '', status: 'new', assignedToId: '' });
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'SalesRep' });

  const fetchLeads = async () => {
    const token = localStorage.getItem('token');
    if (!token) return window.location.href = '/login';
    try {
      const res = await axios.get('http://localhost:3001/api/leads', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads(res.data);
    } catch (err) {
      window.location.href = '/login';
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('http://localhost:3001/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      // ignore if not admin
    }
  };

  const fetchAllUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('http://localhost:3001/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllUsers(res.data);
    } catch (err) {
      // ignore if not admin
    }
  };

  const decodeUserRole = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
  };

  const handleCreateUser = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:3001/api/users', newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewUser({ name: '', email: '', password: '', role: 'SalesRep' });
      setShowUserForm(false);
      fetchAllUsers();
    } catch (err) {
      alert('Error creating user');
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchUsers();
    fetchAllUsers();
    decodeUserRole();
    const socket = io('http://localhost:3001');
    socket.on('leadUpdate', fetchLeads);
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');
    try {
      if (editingLead) {
        await axios.put(`http://localhost:3001/api/leads/${editingLead.id}`, {
          ...newLead,
          assignedToId: newLead.assignedToId ? parseInt(newLead.assignedToId) : undefined,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEditingLead(null);
      } else {
        await axios.post('http://localhost:3001/api/leads', {
          ...newLead,
          assignedToId: newLead.assignedToId ? parseInt(newLead.assignedToId) : undefined,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setNewLead({ name: '', email: '', phone: '', company: '', status: 'new', assignedToId: '' });
      setShowForm(false);
    } catch (err) {
      alert('Error saving lead');
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:3001/api/leads/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      alert('Error deleting lead');
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setNewLead({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      status: lead.status,
      assignedToId: lead.assignedTo?.id?.toString() || '',
    });
    setShowForm(true);
  };

  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: 'Leads',
        data: Object.values(statusCounts),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's your sales overview.</p>
          </div>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Lead Statistics</h2>
            <Bar data={chartData} />
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Actions</h2>
            <div className="space-y-3">
              <button
                className="btn-primary w-full"
                onClick={() => setShowForm(true)}
              >
                ➕ Add New Lead
              </button>
              {userRole === 'Admin' && (
                <button
                  className="btn-primary w-full bg-green-600 hover:bg-green-700"
                  onClick={() => setShowUserForm(true)}
                >
                  👤 Add Team Member
                </button>
              )}
            </div>
          </div>
        </div>

        {userRole === 'Admin' && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">👥 Team Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showForm && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              {editingLead ? 'Edit Lead' : 'Add New Lead'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  className="input-field"
                  placeholder="Enter lead's full name"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="Enter email address"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  className="input-field"
                  placeholder="Enter phone number"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <input
                  className="input-field"
                  placeholder="Enter company name"
                  value={newLead.company}
                  onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  className="input-field"
                  value={newLead.status}
                  onChange={(e) => setNewLead({ ...newLead, status: e.target.value })}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                <select
                  className="input-field"
                  value={newLead.assignedToId}
                  onChange={(e) => setNewLead({ ...newLead, assignedToId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                className="btn-primary"
                onClick={handleUpdate}
              >
                {editingLead ? 'Update Lead' : 'Create Lead'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showUserForm && userRole === 'Admin' && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Add New Team Member</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  className="input-field"
                  placeholder="Enter full name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="Enter email address"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Create a secure password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  className="input-field"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="SalesRep">Sales Representative</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                className="btn-primary"
                onClick={handleCreateUser}
              >
                Create User
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowUserForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">📋 Leads Overview</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{lead.email}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'closed' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.assignedTo?.name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        onClick={() => handleEdit(lead)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 transition-colors"
                        onClick={() => handleDelete(lead.id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}