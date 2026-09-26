'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { OrganizationSettings, TeamMember } from '@/lib/types';
import { initialOrganization } from '@/data/initial-data';
import {
  Building2,
  Save,
  CheckCircle2,
  Users2,
  Trash2,
  ShieldCheck,
  FileCheck,
  Loader2,
} from 'lucide-react';

export default function SettingsPage() {
  const [org, setOrg] = useState<OrganizationSettings>(initialOrganization);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // New Team Member Form
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberContact, setNewMemberContact] = useState('');
  const [newMemberLocation, setNewMemberLocation] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/organization');
        const data = await res.json();
        if (data.success && data.organization) {
          setOrg(data.organization);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(org),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Failed to save settings: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      alert('Please enter a team member name');
      return;
    }
    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: newMemberName,
      role: newMemberRole || 'Representative',
      email: newMemberEmail || org.email,
      contact: newMemberContact || org.phone,
      location: newMemberLocation || org.location,
    };
    setOrg({
      ...org,
      teamMembers: [...org.teamMembers, newMember],
    });
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberEmail('');
    setNewMemberContact('');
    setNewMemberLocation('');
  };

  const handleRemoveMember = (id: string) => {
    setOrg({
      ...org,
      teamMembers: org.teamMembers.filter((m) => m.id !== id),
    });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#3944BC]" />
          <span className="text-sm font-semibold">Loading settings...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-arvo font-bold text-slate-900 tracking-tight">Company Settings</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-arvo font-bold uppercase bg-[#3944BC]/10 text-[#3944BC] border border-[#3944BC]/20">
                V2 REPORT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure V2 Labs Global master organization information, team members, and declaration presets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" /> Settings Saved!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#3944BC] hover:bg-[#2e3799] text-white text-xs font-bold shadow-md shadow-[#3944BC]/25 transition disabled:opacity-50 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* SECTION 1: ORGANIZATION PROFILE */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-[#3944BC]" />
              <h2 className="text-sm font-extrabold text-slate-900">Organization Profile</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  value={org.name}
                  onChange={(e) => setOrg({ ...org, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Website</label>
                <input
                  type="text"
                  value={org.website}
                  onChange={(e) => setOrg({ ...org, website: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={org.email}
                  onChange={(e) => setOrg({ ...org, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Contact Phone</label>
                <input
                  type="text"
                  value={org.phone}
                  onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location (Default / Bill Master)</label>
                <input
                  type="text"
                  value={org.secondaryLocation || 'Bhayandar, Maharashtra, India'}
                  onChange={(e) => setOrg({ ...org, secondaryLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Invoice Master Location</label>
                <input
                  type="text"
                  value={org.location}
                  onChange={(e) => setOrg({ ...org, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: DECLARATION PRESETS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileCheck className="w-4 h-4 text-[#3944BC]" />
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Dynamic Declaration Presets</h2>
                <p className="text-[11px] text-slate-500">
                  Customizable legal statements automatically inserted based on payment status.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-emerald-800 mb-1">
                  Paid In Full (Status: PAID)
                </label>
                <textarea
                  rows={2}
                  value={org.declarationPresets?.paid || ''}
                  onChange={(e) =>
                    setOrg({
                      ...org,
                      declarationPresets: {
                        ...org.declarationPresets,
                        paid: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#3944BC] mb-1">
                  Partially Paid (Status: PARTIALLY_PAID)
                </label>
                <textarea
                  rows={2}
                  value={org.declarationPresets?.partially_paid || ''}
                  onChange={(e) =>
                    setOrg({
                      ...org,
                      declarationPresets: {
                        ...org.declarationPresets,
                        partially_paid: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-800 mb-1">
                  Pending / Unpaid (Status: PENDING)
                </label>
                <textarea
                  rows={2}
                  value={org.declarationPresets?.pending || ''}
                  onChange={(e) =>
                    setOrg({
                      ...org,
                      declarationPresets: {
                        ...org.declarationPresets,
                        pending: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: TEAM MEMBERS (PREPARED BY) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users2 className="w-4 h-4 text-[#3944BC]" />
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Team Members ("Prepared By")</h2>
                <p className="text-[11px] text-slate-500">
                  Selectable signers and representatives in invoices and bills.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {org.teamMembers.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {m.name} <span className="font-normal text-slate-500">({m.role})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {m.email} • {m.contact} • {m.location}
                    </div>
                  </div>
                  {org.teamMembers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                      title="Remove Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Team Member Sub-form */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-bold text-[#3944BC] mb-2">+ Add Another Team Member</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Role / Title"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#3944BC] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddMember}
                className="mt-3 px-4 py-2 bg-[#3944BC] hover:bg-[#2e3799] text-white rounded-xl text-xs font-bold transition shadow-md shadow-[#3944BC]/25"
              >
                Add Member
              </button>
            </div>
          </div>

          {/* SECTION 4: AUTHORIZATION ASSETS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-[#3944BC]" />
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Authorization Stamp & Signature</h2>
                <p className="text-[11px] text-slate-500">
                  Fixed anchors on master templates with toggleable visibility defaults.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Organization Circular Stamp</div>
                <p className="text-[11px] text-slate-500">
                  High-res V2 Labs Global circular seal embedded into PDF documents.
                </p>
                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={org.showStampDefault}
                    onChange={(e) => setOrg({ ...org, showStampDefault: e.target.checked })}
                    className="rounded text-[#3944BC] h-4 w-4"
                  />
                  <span className="font-semibold text-slate-700">Display by default on new documents</span>
                </label>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Authorized Signature</div>
                <p className="text-[11px] text-slate-500">
                  Director / authorized signature placed beside official stamp.
                </p>
                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={org.showSignatureDefault}
                    onChange={(e) => setOrg({ ...org, showSignatureDefault: e.target.checked })}
                    className="rounded text-[#3944BC] h-4 w-4"
                  />
                  <span className="font-semibold text-slate-700">Display by default on new documents</span>
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
