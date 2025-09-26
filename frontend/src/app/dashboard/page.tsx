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

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', company: '', status: 'new', assignedToId: '' });
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showForm, setShowForm] = useState(false);

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

  useEffect(() => {
    fetchLeads();
    fetchUsers();
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">CRM Dashboard</h1>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Lead Statistics</h2>
            <Bar data={chartData} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => setShowForm(true)}
            >
              Add New Lead
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Lead</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="p-3 border border-gray-300 rounded"
                placeholder="Name"
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
              />
              <input
                className="p-3 border border-gray-300 rounded"
                placeholder="Email"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              />
              <input
                className="p-3 border border-gray-300 rounded"
                placeholder="Phone"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
              />
              <input
                className="p-3 border border-gray-300 rounded"
                placeholder="Company"
                value={newLead.company}
                onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
              />
              <select
                className="p-3 border border-gray-300 rounded"
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
              <select
                className="p-3 border border-gray-300 rounded"
                value={newLead.assignedToId}
                onChange={(e) => setNewLead({ ...newLead, assignedToId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div className="mt-4">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600"
                onClick={handleUpdate}
              >
                {editingLead ? 'Update Lead' : 'Create Lead'}
              </button>
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Leads</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Assigned To</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t">
                    <td className="px-4 py-2">{lead.name}</td>
                    <td className="px-4 py-2">{lead.email}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'closed' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{lead.assignedTo?.name || 'Unassigned'}</td>
                    <td className="px-4 py-2">
                      <button className="text-blue-500 hover:text-blue-700 mr-2" onClick={() => handleEdit(lead)}>Edit</button>
                      <button className="text-red-500 hover:text-red-700" onClick={() => handleDelete(lead.id)}>Delete</button>
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