'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { Client, DocumentRecord } from '@/lib/types';
import {
  Users2,
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  MapPin,
  Trash2,
  Edit2,
  Loader2,
  FilePlus2,
  Receipt,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([
        fetch('/api/clients').then((r) => r.json()),
        fetch('/api/documents').then((r) => r.json()),
      ]);
      if (cRes.success) setClients(cRes.clients || []);
      if (dRes.success) setDocuments(dRes.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingClient(null);
    setName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCompanyName(client.companyName || '');
    setEmail(client.email);
    setPhone(client.phone);
    setAddress(client.address || '');
    setNotes(client.notes || '');
    setModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editingClient ? editingClient.id : undefined,
      name,
      companyName,
      email,
      phone,
      address,
      notes,
    };

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        loadData();
      } else {
        alert(data.error || 'Failed to save client');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save client');
    }
  };

  const handleDeleteClient = async (id: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete ${clientName}?`)) return;
    try {
      const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setClients((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert(data.error || 'Failed to delete client');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete client');
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase())) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-arvo font-bold text-slate-900 tracking-tight">Client Directory</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-arvo font-bold uppercase bg-[#3944BC]/10 text-[#3944BC] border border-[#3944BC]/20">
                V2 REPORT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select clients to auto-populate invoices and bills in seconds.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3944BC] hover:bg-[#2e3799] text-white text-xs font-bold shadow-md shadow-[#3944BC]/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add New Client
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            placeholder="Search clients by name, company, or email..."
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-slate-900 bg-transparent placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#3944BC]" />
            <span className="text-xs font-semibold">Loading client directory...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/90 text-center space-y-3 shadow-xs">
            <Users2 className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-900">No clients found</div>
            <p className="text-xs text-slate-500">Create your first client to speed up document generation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => {
              const clientDocs = documents.filter((d) => d.clientId === client.id);
              return (
                <div
                  key={client.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-[#3944BC]/50 hover:shadow-md transition group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-arvo font-bold text-slate-900 text-sm group-hover:text-[#3944BC] transition">
                          {client.name}
                        </div>
                        {client.companyName && (
                          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400" /> {client.companyName}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(client)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
                          title="Edit Client"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id, client.name)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"
                          title="Delete Client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      {client.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{client.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {clientDocs.length} {clientDocs.length === 1 ? 'document' : 'documents'}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/documents/new?type=invoice&clientId=${client.id}`}
                        className="px-2.5 py-1 bg-[#3944BC]/10 text-[#3944BC] border border-[#3944BC]/20 rounded-lg hover:bg-[#3944BC] hover:text-white font-bold text-[10px] flex items-center gap-1 transition"
                      >
                        <FilePlus2 className="w-3 h-3" /> + Invoice
                      </Link>
                      <Link
                        href={`/documents/new?type=bill&clientId=${client.id}`}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white font-bold text-[10px] flex items-center gap-1 transition"
                      >
                        <Receipt className="w-3 h-3" /> + Bill
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingClient ? 'Edit Client' : 'Add New Client'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Store client contact and business details for automated template rendering.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveClient} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                    placeholder="e.g. German with Gaurav"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                    placeholder="e.g. German with Gaurav Pvt Ltd"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                      placeholder="contact@company.com"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                      placeholder="+91 98200 12345"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Address / Location</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                    placeholder="e.g. Andheri West, Mumbai, Maharashtra"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Internal Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                    placeholder="Recurring terms, service requirements..."
                  />
                </div>
                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 rounded-xl font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#3944BC] text-white rounded-xl font-bold hover:bg-[#2e3799] shadow-md shadow-[#3944BC]/25 transition"
                  >
                    {editingClient ? 'Save Changes' : 'Create Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
