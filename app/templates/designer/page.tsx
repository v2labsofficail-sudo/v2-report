'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { DocumentTemplate, TemplateField } from '@/lib/types';
import {
  Sliders,
  Save,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Loader2,
} from 'lucide-react';

export default function TemplateDesignerPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('v2-invoice');
  const [currentTemplate, setCurrentTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>('invoice_number');
  const [zoom, setZoom] = useState<number>(0.75);
  const [activeTab, setActiveTab] = useState<'fields' | 'table' | 'checkboxes' | 'boxes'>('fields');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        if (data.success && data.templates) {
          setTemplates(data.templates);
          const active = data.templates.find((t: DocumentTemplate) => t.id === selectedTemplateId) || data.templates[0];
          setCurrentTemplate(active);
          if (active?.fields) {
            const firstKey = Object.keys(active.fields)[0];
            setSelectedFieldKey(firstKey);
          }
        }
      } catch (err) {
        console.error('Failed to load templates', err);
      }
    }
    loadTemplates();
  }, [selectedTemplateId]);

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = templates.find((t) => t.id === id);
    if (tmpl) {
      setCurrentTemplate(tmpl);
      const firstKey = Object.keys(tmpl.fields || {})[0];
      setSelectedFieldKey(firstKey);
    }
  };

  const handleFieldPropChange = (prop: keyof TemplateField, value: any) => {
    if (!currentTemplate || !selectedFieldKey) return;
    const existingField = currentTemplate.fields[selectedFieldKey];
    if (!existingField) return;

    const updatedField = {
      ...existingField,
      [prop]: ['x', 'y', 'width', 'height', 'font_size', 'max_characters'].includes(prop)
        ? (Number(value) || 0)
        : value,
    };

    setCurrentTemplate({
      ...currentTemplate,
      fields: {
        ...currentTemplate.fields,
        [selectedFieldKey]: updatedField,
      },
    });
  };

  const handleTablePropChange = (prop: string, value: any) => {
    if (!currentTemplate || !currentTemplate.table) return;
    setCurrentTemplate({
      ...currentTemplate,
      table: {
        ...currentTemplate.table,
        [prop]: Number(value) || 0,
      },
    });
  };

  const handleSaveTemplate = async () => {
    if (!currentTemplate) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTemplate),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage('Coordinates Saved to Store!');
        setTimeout(() => setSaveMessage(''), 3500);
      } else {
        alert(data.error || 'Failed to save template coordinates');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving template coordinates');
    } finally {
      setSaving(false);
    }
  };

  if (!currentTemplate) {
    return (
      <AppShell>
        <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#3944BC]" />
          <span className="text-sm font-semibold">Loading Template Designer...</span>
        </div>
      </AppShell>
    );
  }

  const selectedField = currentTemplate.fields[selectedFieldKey];

  return (
    <AppShell>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50">
        {/* Top Control Bar */}
        <div className="h-14 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#3944BC]" />
              <span className="font-arvo font-bold text-sm text-slate-900 tracking-tight">Template Designer</span>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">Master Template:</span>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition focus:border-[#3944BC] focus:outline-none"
              >
                <option value="v2-invoice">V2 Labs Global Invoice</option>
                <option value="v2-bill">V2 Labs Global Bill</option>
              </select>
            </div>

            {saveMessage && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> {saveMessage}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs text-slate-700">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] font-bold text-slate-900">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
                className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleSaveTemplate}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#3944BC] hover:bg-[#2e3799] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3944BC]/25 transition disabled:opacity-50 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Coordinates'}</span>
            </button>
          </div>
        </div>

        {/* Main Work Area: Left Visual Canvas, Right Properties Inspector */}
        <div className="flex-1 flex overflow-hidden">
          {/* VISUAL CANVAS PANE (LIGHT NEUTRAL BACKGROUND) */}
          <div className="flex-1 bg-slate-100/90 overflow-auto p-4 sm:p-8 flex justify-center items-start">
            <div
              style={{
                width: `${currentTemplate.canvasWidth * zoom}px`,
                height: `${currentTemplate.canvasHeight * zoom}px`,
                transition: 'width 0.15s ease, height 0.15s ease',
              }}
              className="relative shrink-0 shadow-2xl rounded-sm overflow-hidden select-none bg-white border border-slate-300"
            >
              {/* Scaled Template Surface */}
              <div
                style={{
                  width: `${currentTemplate.canvasWidth}px`,
                  height: `${currentTemplate.canvasHeight}px`,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
                className="relative bg-white"
              >
                {/* Background Master Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentTemplate.background_image}
                  alt={currentTemplate.name}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85"
                />

                {/* Field Bounding Boxes Overlay */}
                {Object.entries(currentTemplate.fields).map(([key, f]) => {
                  const isSelected = selectedFieldKey === key;
                  return (
                    <div
                      key={key}
                      onClick={() => {
                        setSelectedFieldKey(key);
                        setActiveTab('fields');
                      }}
                      style={{
                        position: 'absolute',
                        left: `${f.x}px`,
                        top: `${f.y}px`,
                        width: `${f.width}px`,
                        height: `${f.height || 20}px`,
                      }}
                      className={`cursor-pointer transition border rounded-xs flex items-center px-1 text-[9px] font-mono select-none ${
                        isSelected
                          ? 'border-[#3944BC] bg-[#3944BC]/25 text-[#3944BC] font-bold ring-2 ring-[#3944BC] z-30'
                          : 'border-dashed border-slate-400 bg-slate-500/10 text-slate-700 hover:border-[#3944BC] hover:bg-[#3944BC]/15 z-10'
                      }`}
                      title={`${f.field_name} (x:${f.x}, y:${f.y}, w:${f.width}, h:${f.height})`}
                    >
                      <span className="truncate">{f.field_name}</span>
                    </div>
                  );
                })}

                {/* Table Bounding Box Overlay */}
                {currentTemplate.table && (
                  <div
                    onClick={() => setActiveTab('table')}
                    style={{
                      position: 'absolute',
                      left: `${currentTemplate.table.x}px`,
                      top: `${currentTemplate.table.y}px`,
                      width: `${currentTemplate.table.width}px`,
                      height: `${currentTemplate.table.max_rows_page_1 * currentTemplate.table.row_height + currentTemplate.table.total_row_height}px`,
                    }}
                    className={`cursor-pointer border-2 transition rounded-xs p-2 text-xs font-bold ${
                      activeTab === 'table'
                        ? 'border-emerald-600 bg-emerald-500/20 text-emerald-950 z-20 ring-2 ring-emerald-400'
                        : 'border-dashed border-emerald-400/80 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20'
                    }`}
                  >
                    <div className="bg-emerald-800 text-white text-[10px] px-2 py-0.5 rounded w-max">
                      Service Table Area (Capacity: {currentTemplate.table.max_rows_page_1} rows)
                    </div>
                  </div>
                )}

                {/* Checkboxes Overlay (Invoice) */}
                {currentTemplate.checkboxes?.map((cb) => (
                  <div
                    key={cb.id}
                    onClick={() => setActiveTab('checkboxes')}
                    style={{
                      position: 'absolute',
                      left: `${cb.x}px`,
                      top: `${cb.y}px`,
                      width: `${cb.size}px`,
                      height: `${cb.size}px`,
                    }}
                    className="border-2 border-indigo-500 bg-indigo-500/30 rounded-xs cursor-pointer z-20 hover:scale-110 transition"
                    title={`Checkbox: ${cb.label} (x:${cb.x}, y:${cb.y})`}
                  />
                ))}

                {/* Declaration Box Overlay */}
                {currentTemplate.declaration_box && (
                  <div
                    onClick={() => setActiveTab('boxes')}
                    style={{
                      position: 'absolute',
                      left: `${currentTemplate.declaration_box.x}px`,
                      top: `${currentTemplate.declaration_box.y}px`,
                      width: `${currentTemplate.declaration_box.width}px`,
                      height: `${currentTemplate.declaration_box.height}px`,
                    }}
                    className={`cursor-pointer border-2 transition rounded-xs p-2 text-[10px] font-bold ${
                      activeTab === 'boxes'
                        ? 'border-purple-600 bg-purple-500/20 text-purple-950 z-20 ring-2 ring-purple-400'
                        : 'border-dashed border-purple-400 bg-purple-500/10 text-purple-800'
                    }`}
                  >
                    Declaration Box Anchor
                  </div>
                )}

                {/* Notes Box Overlay (Bill) */}
                {currentTemplate.notes_box && (
                  <div
                    onClick={() => setActiveTab('boxes')}
                    style={{
                      position: 'absolute',
                      left: `${currentTemplate.notes_box.x}px`,
                      top: `${currentTemplate.notes_box.y}px`,
                      width: `${currentTemplate.notes_box.width}px`,
                      height: `${currentTemplate.notes_box.height}px`,
                    }}
                    className={`cursor-pointer border-2 transition rounded-xs p-2 text-[10px] font-bold ${
                      activeTab === 'boxes'
                        ? 'border-purple-600 bg-purple-500/20 text-purple-950 z-20 ring-2 ring-purple-400'
                        : 'border-dashed border-purple-400 bg-purple-500/10 text-purple-800'
                    }`}
                  >
                    Notes Box Anchor
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT INSPECTOR PANEL */}
          <div className="w-80 sm:w-96 border-l border-slate-200 bg-white flex flex-col shrink-0 shadow-xs">
            {/* Inspector Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
              <button
                onClick={() => setActiveTab('fields')}
                className={`flex-1 py-3 text-center border-b-2 transition ${
                  activeTab === 'fields'
                    ? 'border-[#3944BC] text-[#3944BC] bg-white font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                Fields
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`flex-1 py-3 text-center border-b-2 transition ${
                  activeTab === 'table'
                    ? 'border-[#3944BC] text-[#3944BC] bg-white font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                Table
              </button>
              {currentTemplate.checkboxes && (
                <button
                  onClick={() => setActiveTab('checkboxes')}
                  className={`flex-1 py-3 text-center border-b-2 transition ${
                    activeTab === 'checkboxes'
                      ? 'border-[#3944BC] text-[#3944BC] bg-white font-bold'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  Checkboxes
                </button>
              )}
              <button
                onClick={() => setActiveTab('boxes')}
                className={`flex-1 py-3 text-center border-b-2 transition ${
                  activeTab === 'boxes'
                    ? 'border-[#3944BC] text-[#3944BC] bg-white font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                Anchors
              </button>
            </div>

            {/* Tab 1: Field Inspector */}
            {activeTab === 'fields' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Field to Inspect</label>
                  <select
                    value={selectedFieldKey}
                    onChange={(e) => setSelectedFieldKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-[#3944BC] focus:outline-none"
                  >
                    {Object.entries(currentTemplate.fields).map(([key, f]) => (
                      <option key={key} value={key}>
                        {f.field_name} ({key})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedField && (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="bg-[#3944BC]/10 p-3 rounded-xl border border-[#3944BC]/20">
                      <div className="font-extrabold text-[#3944BC] text-xs">{selectedField.field_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {selectedField.field_id}</div>
                    </div>

                    {/* Coordinates */}
                    <div>
                      <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">
                        Canvas Coordinates (Pixels)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">X Position</label>
                          <input
                            type="number"
                            value={selectedField.x}
                            onChange={(e) => handleFieldPropChange('x', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:border-[#3944BC] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Y Position</label>
                          <input
                            type="number"
                            value={selectedField.y}
                            onChange={(e) => handleFieldPropChange('y', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:border-[#3944BC] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Width</label>
                          <input
                            type="number"
                            value={selectedField.width}
                            onChange={(e) => handleFieldPropChange('width', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:border-[#3944BC] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Height</label>
                          <input
                            type="number"
                            value={selectedField.height || 18}
                            onChange={(e) => handleFieldPropChange('height', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:border-[#3944BC] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Typography */}
                    <div>
                      <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">
                        Typography & Styling
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Font Size (pt)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={selectedField.font_size || 10}
                            onChange={(e) => handleFieldPropChange('font_size', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:border-[#3944BC] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Font Weight</label>
                          <select
                            value={selectedField.font_weight || 'normal'}
                            onChange={(e) => handleFieldPropChange('font_weight', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#3944BC] focus:outline-none"
                          >
                            <option value="normal">Normal</option>
                            <option value="500">Medium (500)</option>
                            <option value="600">Semi-Bold (600)</option>
                            <option value="bold">Bold (700)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Text Color</label>
                          <input
                            type="text"
                            value={selectedField.text_color || '#0F172A'}
                            onChange={(e) => handleFieldPropChange('text_color', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-[#3944BC] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Alignment</label>
                          <select
                            value={selectedField.alignment || 'left'}
                            onChange={(e) => handleFieldPropChange('alignment', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#3944BC] focus:outline-none"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Constraints */}
                    <div>
                      <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">
                        Constraints & Overflow
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Max Characters</label>
                          <input
                            type="number"
                            value={selectedField.max_characters || 40}
                            onChange={(e) => handleFieldPropChange('max_characters', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#3944BC] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Overflow Behavior</label>
                          <select
                            value={selectedField.overflow_behavior || 'truncate'}
                            onChange={(e) => handleFieldPropChange('overflow_behavior', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-[#3944BC] focus:outline-none"
                          >
                            <option value="truncate">Truncate</option>
                            <option value="wrap">Wrap</option>
                            <option value="shrink">Shrink Font</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Table Inspector */}
            {activeTab === 'table' && currentTemplate.table && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <div className="font-extrabold text-emerald-900 text-xs">Master Service Table Dimensions</div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">
                    Controls physical height available for items on Page 1 before triggering continuation.
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Table X</label>
                      <input
                        type="number"
                        value={currentTemplate.table.x}
                        onChange={(e) => handleTablePropChange('x', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:border-[#3944BC] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Table Y</label>
                      <input
                        type="number"
                        value={currentTemplate.table.y}
                        onChange={(e) => handleTablePropChange('y', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:border-[#3944BC] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Table Width</label>
                      <input
                        type="number"
                        value={currentTemplate.table.width}
                        onChange={(e) => handleTablePropChange('width', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:border-[#3944BC] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Row Height</label>
                      <input
                        type="number"
                        value={currentTemplate.table.row_height}
                        onChange={(e) => handleTablePropChange('row_height', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:border-[#3944BC] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Header Height</label>
                      <input
                        type="number"
                        value={currentTemplate.table.header_height}
                        onChange={(e) => handleTablePropChange('header_height', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:border-[#3944BC] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Max Rows Page 1</label>
                      <input
                        type="number"
                        value={currentTemplate.table.max_rows_page_1}
                        onChange={(e) => handleTablePropChange('max_rows_page_1', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[#3944BC] font-mono font-bold focus:border-[#3944BC] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">
                      Table Columns ({currentTemplate.table.columns.length})
                    </div>
                    <div className="space-y-1.5">
                      {currentTemplate.table.columns.map((col) => (
                        <div key={col.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{col.label}</div>
                            <div className="text-[10px] text-slate-500">Key: {col.key} | Align: {col.alignment}</div>
                          </div>
                          <div className="font-mono font-bold text-[#3944BC] text-xs">
                            {col.width}px
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Checkboxes (Invoice) */}
            {activeTab === 'checkboxes' && currentTemplate.checkboxes && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                  <div className="font-extrabold text-indigo-900 text-xs">Project Section Checkboxes</div>
                  <div className="text-[10px] text-indigo-700 mt-0.5">
                    Exact fixed anchors for vector checkmarks on the master template.
                  </div>
                </div>

                <div className="space-y-2">
                  {currentTemplate.checkboxes.map((cb) => (
                    <div key={cb.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between font-bold text-slate-900 mb-1">
                        <span>{cb.label}</span>
                        <span className="font-mono text-indigo-600">{cb.size}x{cb.size}px</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                        <div>X: <span className="font-mono font-bold text-slate-900">{cb.x}</span></div>
                        <div>Y: <span className="font-mono font-bold text-slate-900">{cb.y}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Anchors */}
            {activeTab === 'boxes' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="font-bold text-purple-900">Declaration & Stamp Positions</div>
                  <div className="text-[10px] text-purple-700 mt-0.5">
                    Predefined bounding boxes where dynamic declaration text, notes, and authorization stamps are rendered.
                  </div>
                </div>

                {currentTemplate.declaration_box && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">Declaration Box</div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-slate-600">
                      <div>X: {currentTemplate.declaration_box.x}</div>
                      <div>Y: {currentTemplate.declaration_box.y}</div>
                      <div>Width: {currentTemplate.declaration_box.width}</div>
                      <div>Height: {currentTemplate.declaration_box.height}</div>
                    </div>
                  </div>
                )}

                {currentTemplate.notes_box && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">Notes Box</div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-slate-600">
                      <div>X: {currentTemplate.notes_box.x}</div>
                      <div>Y: {currentTemplate.notes_box.y}</div>
                      <div>Width: {currentTemplate.notes_box.width}</div>
                      <div>Height: {currentTemplate.notes_box.height}</div>
                    </div>
                  </div>
                )}

                {currentTemplate.stamp && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">Stamp Anchor</div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-slate-600">
                      <div>X: {currentTemplate.stamp.x}</div>
                      <div>Y: {currentTemplate.stamp.y}</div>
                      <div>Width: {currentTemplate.stamp.width}</div>
                      <div>Height: {currentTemplate.stamp.height}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
