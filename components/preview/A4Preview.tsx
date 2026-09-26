'use client';

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { DocumentRecord, DocumentTemplate, OrganizationSettings } from '@/lib/types';
import { formatINR, formatDateDisplay, getDeclarationText, generateBillingPeriodText } from '@/lib/template-engine';

interface A4PreviewProps {
  document: DocumentRecord;
  template: DocumentTemplate;
  organization: OrganizationSettings;
}

export default function A4Preview({ document: doc, template, organization: org }: A4PreviewProps) {
  const [zoom, setZoom] = useState<number>(0.85);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const canvasWidth = template.canvasWidth || 683;
  const canvasHeight = template.canvasHeight || 1024;
  const isInvoice = template.type === 'invoice';
  const isBill = template.type === 'bill';

  const items = doc.items || [];
  const maxRowsP1 = isBill ? 4 : 3;
  const totalPages = items.length > maxRowsP1 ? 2 : 1;

  const handleZoomIn = () => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))));
  const handleResetZoom = () => setZoom(0.85);
  const handleFit = () => setZoom(0.7);

  const declaration = doc.declarationText || getDeclarationText(doc.payment.status, org.declarationPresets);
  const billingPeriod = doc.billingPeriod?.displayText || generateBillingPeriodText(doc.billingPeriod?.startDate, doc.billingPeriod?.endDate);

  // Exact row configurations matching the blank template image
  const invoiceRowDefs = [
    { top: 350, height: 68 },
    { top: 418, height: 55 },
    { top: 473, height: 57 },
  ];

  const billRowDefs = [
    { top: 541, height: 55 },
    { top: 596, height: 55 },
    { top: 651, height: 54 },
    { top: 705, height: 54 },
  ];

  const invBoxes: Record<string, { x: number; y: number; size: number }> = {
    'Web Development': { x: 30, y: 639, size: 15 },
    'Mobile Development': { x: 167, y: 639, size: 15 },
    'Digital Marketing': { x: 302, y: 639, size: 15 },
    'SEO': { x: 415, y: 639, size: 15 },
    'AI Solution': { x: 470, y: 639, size: 15 },
    'ERP CRM SYSTEM': { x: 558, y: 639, size: 15 },
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/95 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Preview Toolbar */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#3944BC] animate-pulse" />
          <span className="text-xs font-arvo font-bold uppercase tracking-wider text-slate-300">Live A4 Preview</span>
          <span className="text-[10px] text-slate-500 font-mono">({Math.round(zoom * 100)}%)</span>
        </div>

        <div className="flex items-center gap-1.5">
          {totalPages > 1 && (
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 mr-2 text-xs">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 transition"
                title="Page 1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-semibold text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(2)}
                disabled={currentPage === 2}
                className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 transition"
                title="Page 2"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs text-slate-300">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-700 rounded transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 hover:bg-slate-700 rounded text-[11px] font-mono transition"
              title="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-700 rounded transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleFit}
              className="p-1.5 hover:bg-slate-700 rounded transition ml-1"
              title="Fit to Page"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* A4 Canvas Container */}
      <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
        <div
          style={{
            width: `${canvasWidth * zoom}px`,
            height: `${canvasHeight * zoom}px`,
            transition: 'width 0.15s ease, height 0.15s ease',
          }}
          className="relative shrink-0 shadow-2xl rounded-sm overflow-hidden select-none bg-white"
        >
          {/* Scaled Inner Canvas */}
          <div
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
            className="relative bg-white text-slate-900"
          >
            {/* ======================================================== */}
            {/* PAGE 1 CONTENT                                            */}
            {/* ======================================================== */}
            {currentPage === 1 ? (
              <>
                {/* Master Template Blank Background Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.background_image}
                  alt={template.name}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />

                {/* ----------------- INVOICE FIELDS ----------------- */}
                {isInvoice && (
                  <>
                    {/* Header Right Details (Colons at x=475, values start at x=488) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '488px',
                        top: '108px',
                        width: '165px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#0F172A',
                      }}
                      className="truncate"
                    >
                      {doc.documentNumber}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '488px',
                        top: '137px',
                        width: '165px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9.5px',
                        fontWeight: '500',
                        color: '#0F172A',
                      }}
                      className="truncate"
                    >
                      {formatDateDisplay(doc.documentDate)}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '488px',
                        top: '167px',
                        width: '165px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9.5px',
                        fontWeight: '600',
                        color: '#0F172A',
                      }}
                      className="truncate"
                    >
                      {doc.clientData?.name}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '488px',
                        top: '198px',
                        width: '165px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9px',
                        color: '#334155',
                      }}
                      className="truncate"
                    >
                      {doc.clientData?.email}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '488px',
                        top: '230px',
                        width: '165px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9.5px',
                        fontWeight: '500',
                        color: '#0F172A',
                      }}
                      className="truncate"
                    >
                      {doc.purpose}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '488px',
                        top: '260px',
                        width: '165px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9.5px',
                        fontWeight: '700',
                        color: '#0F172A',
                      }}
                      className="truncate"
                    >
                      {doc.currency || 'INR'}
                    </div>

                    {/* Table Service Rows (Page 1) */}
                    {items.slice(0, 3).map((item, idx) => {
                      const rowDef = invoiceRowDefs[idx] || { top: 350 + idx * 60, height: 60 };
                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            position: 'absolute',
                            left: '26px',
                            top: `${rowDef.top}px`,
                            width: '628px',
                            height: `${rowDef.height}px`,
                          }}
                          className="flex items-center pointer-events-none"
                        >
                          {/* Col 1: Sr No (width 80px) */}
                          <div
                            style={{
                              width: '80px',
                              textAlign: 'center',
                              fontSize: '10px',
                              fontWeight: '500',
                              color: '#0F172A',
                            }}
                          >
                            {item.srNo}
                          </div>

                          {/* Col 2: Project / Service (left: 116px, width: 168px) */}
                          <div
                            style={{
                              width: '183px',
                              paddingLeft: '10px',
                              paddingRight: '5px',
                              fontSize: '9.5px',
                              fontWeight: '600',
                              lineHeight: '1.25',
                              color: '#0F172A',
                            }}
                            className="line-clamp-2"
                          >
                            {item.name}
                          </div>

                          {/* Col 3: Description (width: 227px) */}
                          <div
                            style={{
                              width: '227px',
                              paddingLeft: '10px',
                              paddingRight: '7px',
                              fontSize: '8.5px',
                              lineHeight: '1.25',
                              color: '#334155',
                            }}
                            className="line-clamp-3"
                          >
                            {item.description}
                          </div>

                          {/* Col 4: Amount (width: 138px) */}
                          <div
                            style={{
                              width: '138px',
                              paddingRight: '12px',
                              textAlign: 'right',
                              fontSize: '10.5px',
                              fontWeight: '700',
                              color: '#0F172A',
                            }}
                          >
                            {formatINR(item.amount)}
                          </div>
                        </div>
                      );
                    })}

                    {/* Total Amount Row (530 to 578) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '516px',
                        top: '530px',
                        width: '126px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        fontSize: '11.5px',
                        fontWeight: '800',
                        color: '#0F172A',
                      }}
                    >
                      {totalPages > 1 ? (
                        <span className="text-[10px] text-blue-600 font-semibold">(Continued...)</span>
                      ) : (
                        formatINR(doc.payment.totalAmount)
                      )}
                    </div>

                    {/* Vector Checkboxes for Project Section */}
                    {Object.entries(invBoxes).map(([label, box]) => {
                      const isSelected = (doc.projectCategories || []).includes(label);
                      if (!isSelected) return null;

                      return (
                        <div
                          key={label}
                          style={{
                            position: 'absolute',
                            left: `${box.x}px`,
                            top: `${box.y}px`,
                            width: `${box.size}px`,
                            height: `${box.size}px`,
                          }}
                          className="flex items-center justify-center pointer-events-none"
                        >
                          <svg
                            viewBox="0 0 16 16"
                            className="w-full h-full text-blue-600 drop-shadow-xs"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 8.5 6.5 12 13 4" />
                          </svg>
                        </div>
                      );
                    })}

                    {/* Payment Summary (Values at x=198) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '198px',
                        top: '717px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#0F172A',
                      }}
                    >
                      {formatINR(doc.payment.totalAmount)}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '198px',
                        top: '740px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9.5px',
                        fontWeight: '500',
                        color: '#0F172A',
                      }}
                    >
                      {formatINR(doc.payment.amountPaid)}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '198px',
                        top: '764px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#0F172A',
                      }}
                    >
                      {formatINR(doc.payment.balanceAmount)}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '198px',
                        top: '788px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9.5px',
                        fontWeight: '500',
                        color: '#0F172A',
                      }}
                    >
                      {doc.payment.currency || 'INR'}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '198px',
                        top: '812px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: doc.payment.status === 'PAID' ? '#15803d' : '#2563EB',
                      }}
                    >
                      {doc.payment.status}
                    </div>

                    {/* Declaration Text (x=428, y=746, width=214) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '428px',
                        top: '746px',
                        width: '214px',
                        height: '75px',
                        fontSize: '8.5px',
                        lineHeight: '1.4',
                        color: '#1E293B',
                      }}
                      className="overflow-hidden"
                    >
                      {declaration}
                    </div>

                    {/* Prepared By (Values at x=154) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '154px',
                        top: '875px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9.5px',
                        fontWeight: '700',
                        color: '#0F172A',
                      }}
                    >
                      {doc.preparedBy?.name || org.teamMembers[0]?.name}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '154px',
                        top: '898px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9px',
                        color: '#334155',
                      }}
                    >
                      {doc.preparedBy?.organization || org.name}
                    </div>
                  </>
                )}

                {/* ----------------- BILL FIELDS ----------------- */}
                {isBill && (
                  <>
                    {/* Header Right (Colons at x=544, values start at x=556) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '556px',
                        top: '153px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#0F172A',
                      }}
                    >
                      {doc.documentNumber}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '556px',
                        top: '187px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9.5px',
                        fontWeight: '500',
                        color: '#0F172A',
                      }}
                    >
                      {formatDateDisplay(doc.documentDate)}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '556px',
                        top: '224px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9.5px',
                        fontWeight: '500',
                        color: '#0F172A',
                      }}
                    >
                      {formatDateDisplay(doc.dueDate)}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '556px',
                        top: '257px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9px',
                        fontWeight: '500',
                        color: '#0F172A',
                      }}
                    >
                      {billingPeriod}
                    </div>

                    {/* Billed To Box (Colons at x=180, values start at x=194) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '194px',
                        top: '369px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#0F172A',
                      }}
                    >
                      {doc.clientData?.name}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '194px',
                        top: '399px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9.5px',
                        fontWeight: '500',
                        color: '#0F172A',
                      }}
                    >
                      {doc.clientData?.companyName}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '194px',
                        top: '429px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9.5px',
                        color: '#334155',
                      }}
                    >
                      {doc.clientData?.email}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '194px',
                        top: '458px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '9.5px',
                        color: '#334155',
                      }}
                    >
                      {doc.clientData?.phone}
                    </div>

                    {/* Table Service Rows (Page 1) */}
                    {items.slice(0, 4).map((item, idx) => {
                      const rowDef = billRowDefs[idx] || { top: 541 + idx * 55, height: 55 };
                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            position: 'absolute',
                            left: '32px',
                            top: `${rowDef.top}px`,
                            width: '657px',
                            height: `${rowDef.height}px`,
                          }}
                          className="flex items-center pointer-events-none"
                        >
                          {/* Col 1: Sr No is already printed in master image */}
                          <div style={{ width: '73px' }} />

                          {/* Col 2: Service / Description (left 105 to 375, width 270) */}
                          <div
                            style={{
                              width: '270px',
                              paddingLeft: '10px',
                              paddingRight: '10px',
                              fontSize: '9.5px',
                              fontWeight: '600',
                              lineHeight: '1.25',
                              color: '#0F172A',
                            }}
                            className="line-clamp-2"
                          >
                            {item.name}
                          </div>

                          {/* Col 3: Duration (left 375 to 558, width 183) */}
                          <div
                            style={{
                              width: '183px',
                              textAlign: 'center',
                              fontSize: '9.5px',
                              fontWeight: '500',
                              color: '#0F172A',
                            }}
                          >
                            {item.duration || '-'}
                          </div>

                          {/* Col 4: Amount (left 558 to 689, width 131) */}
                          <div
                            style={{
                              width: '131px',
                              paddingRight: '14px',
                              textAlign: 'right',
                              fontSize: '10.5px',
                              fontWeight: '700',
                              color: '#0F172A',
                            }}
                          >
                            {formatINR(item.amount)}
                          </div>
                        </div>
                      );
                    })}

                    {/* Total Amount Row (759 to 800) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '558px',
                        top: '759px',
                        width: '117px',
                        height: '41px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        fontSize: '11.5px',
                        fontWeight: '800',
                        color: '#0F172A',
                      }}
                    >
                      {totalPages > 1 ? (
                        <span className="text-[10px] text-blue-600 font-semibold">(Continued...)</span>
                      ) : (
                        formatINR(doc.payment.totalAmount)
                      )}
                    </div>

                    {/* Notes Box (x=48, y=846, width=300) */}
                    {doc.notes && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '48px',
                          top: '846px',
                          width: '300px',
                          height: '95px',
                          fontSize: '9px',
                          lineHeight: '1.4',
                          color: '#1E293B',
                        }}
                        className="overflow-hidden"
                      >
                        {doc.notes}
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              /* ======================================================== */
              /* PAGE 2 CONTINUATION VIEW                                 */
              /* ======================================================== */
              <div className="w-full h-full bg-white p-8 flex flex-col justify-between">
                <div>
                  {/* Page 2 Header */}
                  <div className="bg-slate-900 text-white p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-base tracking-wide">
                        {org.name} — {isInvoice ? 'INVOICE' : 'BILL'} (CONTINUED)
                      </div>
                      <div className="text-xs text-slate-300 font-mono mt-0.5">
                        Document No: {doc.documentNumber} | Date: {formatDateDisplay(doc.documentDate)}
                      </div>
                    </div>
                    <div className="text-xs font-bold px-2.5 py-1 bg-blue-600 rounded">
                      Page 2 of 2
                    </div>
                  </div>

                  {/* Continuation Table */}
                  <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold">
                          <th className="py-2.5 px-3 w-16 text-center">Sr.</th>
                          <th className="py-2.5 px-3">Service / Description</th>
                          {isBill && <th className="py-2.5 px-3 text-center">Duration</th>}
                          <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {items.slice(maxRowsP1).map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 text-center font-medium text-slate-500">{item.srNo}</td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{item.name}</div>
                              {item.description && (
                                <div className="text-[11px] text-slate-500">{item.description}</div>
                              )}
                            </td>
                            {isBill && <td className="py-3 px-3 text-center">{item.duration || '-'}</td>}
                            <td className="py-3 px-3 text-right font-bold text-slate-900">
                              {formatINR(item.amount)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-blue-50/60 font-bold text-sm">
                          <td colSpan={isBill ? 3 : 2} className="py-3 px-4 text-slate-800 text-right">
                            Final Total Amount:
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-blue-900">
                            {formatINR(doc.payment.totalAmount)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Invoice Summary and Declaration on Page 2 */}
                  {isInvoice && (
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                        <div className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide">
                          Payment Summary
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Total Amount:</span>
                            <span className="font-bold">{formatINR(doc.payment.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Amount Paid:</span>
                            <span className="font-semibold text-emerald-700">{formatINR(doc.payment.amountPaid)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Balance:</span>
                            <span className="font-bold">{formatINR(doc.payment.balanceAmount)}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200">
                            <span className="text-slate-600">Status:</span>
                            <span className="font-bold text-blue-700">{doc.payment.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                        <div className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide">
                          Declaration
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          {declaration}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer on Page 2 */}
                <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
                  <div className="font-semibold text-slate-700">{org.name} — Build • Innovate • Scale</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {org.website} | {org.email} | {org.phone} | {org.location}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
