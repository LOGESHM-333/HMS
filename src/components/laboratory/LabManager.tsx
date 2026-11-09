/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MediCore HMS — Clinical Pathology & Diagnostic Laboratory Management
 * Integrated with PostgreSQL / MySQL Dual-Engine & 1,000 Live Members
 */

import React, { useState, useEffect, useMemo } from 'react';
import { LabOrder, LabTest, ThemeMode } from '../../types';
import { db } from '../../services/mockDatabase';
import { api } from '../../services/api';
import { sound } from '../../services/audioService';
import { 
  FlaskConical, 
  CheckCircle2, 
  Plus, 
  Search,
  Trash2,
  Printer,
  QrCode,
  Activity,
  Layers,
  FileCheck,
  X,
  AlertTriangle,
  Database
} from 'lucide-react';

interface LabManagerProps {
  theme: ThemeMode;
}

export const LabManager: React.FC<LabManagerProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  // Live state
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => db.getLabOrders());
  const [labTests, setLabTests] = useState<LabTest[]>(() => db.getLabTests());
  const patients = db.getPatients();
  const doctors = db.getDoctors();

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [selectedReportOrder, setSelectedReportOrder] = useState<any | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Order Form State
  const [patientSearch, setPatientSearch] = useState('');
  const [newOrder, setNewOrder] = useState({
    patientId: patients[0]?.id || 'pat-1',
    doctorId: doctors[0]?.id || 'doc-1',
    testId: labTests[0]?.id || 'test-cbc',
    priority: 'Routine Morning Round',
    clinicalNotes: 'Routine diagnostic screening & baseline evaluation',
  });

  // Result Entry Form State
  const [resultForm, setResultForm] = useState({
    resultValue: '',
    unit: '',
    interpretation: 'Normal' as LabOrder['interpretation'],
    referenceRange: '',
    technicianNotes: 'Assay calibrated and completed according to standard clinical laboratory SOP.',
  });

  // Sync with Backend on Mount
  useEffect(() => {
    let mounted = true;
    api.getLabOrders().then(orders => {
      if (mounted && orders && orders.length > 0) {
        setLabOrders(orders);
      }
    }).catch(() => {});

    api.getLabTests().then(tests => {
      if (mounted && tests && tests.length > 0) {
        setLabTests(tests);
      }
    }).catch(() => {});

    return () => { mounted = false; };
  }, []);

  const showToast = (msg: string) => {
    sound.playSuccess();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Status metrics
  const totalOrdersCount = labOrders.length;
  const criticalOrdersCount = labOrders.filter(o => o.interpretation === 'Critical').length;
  const analyzingOrdersCount = labOrders.filter(o => o.status === 'Analyzing').length;
  const pendingCollectionCount = labOrders.filter(o => o.status === 'Ordered').length;
  const completedOrdersCount = labOrders.filter(o => o.status === 'Completed').length;

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    labTests.forEach(t => { if (t.category) set.add(t.category); });
    return ['All', ...Array.from(set)];
  }, [labTests]);

  // Filtered Patients for Order Modal
  const modalFilteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 15);
    const q = patientSearch.toLowerCase();
    return patients.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.patientCode.toLowerCase().includes(q) ||
      (p.diagnosis && p.diagnosis.toLowerCase().includes(q))
    ).slice(0, 25);
  }, [patients, patientSearch]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return labOrders.filter(o => {
      const matchStatus = 
        selectedStatus === 'All' ? true :
        selectedStatus === 'Critical' ? o.interpretation === 'Critical' :
        o.status === selectedStatus;

      const test = labTests.find(t => t.id === o.testId);
      const matchCategory = selectedCategory === 'All' || (test && test.category === selectedCategory);

      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ? true : (
        o.patientName?.toLowerCase().includes(q) ||
        o.testName?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        (o as any).specimenBarcode?.toLowerCase().includes(q) ||
        (o as any).doctorName?.toLowerCase().includes(q)
      );

      return matchStatus && matchCategory && matchQuery;
    });
  }, [labOrders, labTests, selectedStatus, selectedCategory, searchQuery]);

  // Handlers
  const handleCollectSpecimen = (orderId: string) => {
    sound.playClick();
    const barcode = `MED-BC-${Math.floor(100000 + Math.random() * 900000)}`;
    db.updateLabOrderStatus(orderId, 'Sample Collected', `Specimen tube barcoded (${barcode}) and received in accessioning.`, 'Normal');
    setLabOrders([...db.getLabOrders()]);
    showToast(`Specimen tube barcoded [${barcode}] & routed to analyzer queue.`);
  };

  const handleStartAnalysis = (orderId: string) => {
    sound.playClick();
    db.updateLabOrderStatus(orderId, 'Analyzing', 'Specimen loaded into continuous clinical spectrophotometry analyzer...', 'Normal');
    setLabOrders([...db.getLabOrders()]);
    showToast('Specimen loaded into automated analyzer. Optical cycle in progress.');
  };

  const handleOpenResultModal = (order: any) => {
    sound.playClick();
    setEditingOrder(order);
    const test = labTests.find(t => t.id === order.testId);
    setResultForm({
      resultValue: order.resultValue || (test ? `Quantitative value: within reference standard (${test.normalRange})` : 'Normal parameters verified'),
      unit: order.unit || (test ? test.unit : 'mg/dL'),
      interpretation: order.interpretation || 'Normal',
      referenceRange: (order as any).referenceRange || (test ? test.normalRange : 'Normal'),
      technicianNotes: (order as any).technicianNotes || 'Automated multi-analyte assay verified by Clinical Pathology staff.',
    });
    setIsResultModalOpen(true);
  };

  const handleSaveResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    sound.playSuccess();

    db.updateLabOrderStatus(
      editingOrder.id,
      'Completed',
      resultForm.resultValue,
      resultForm.interpretation
    );

    // Also notify backend API with enriched fields
    api.updateLabOrder(editingOrder.id, {
      status: 'Completed',
      resultValue: resultForm.resultValue,
      unit: resultForm.unit,
      interpretation: resultForm.interpretation,
      technicianNotes: resultForm.technicianNotes,
      completedDate: new Date().toISOString().split('T')[0]
    } as any).catch(() => {});

    setLabOrders([...db.getLabOrders()]);
    setIsResultModalOpen(false);
    showToast(`Verified diagnostic report published for ${editingOrder.patientName}.`);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    const pat = patients.find(p => p.id === newOrder.patientId);
    const doc = doctors.find(d => d.id === newOrder.doctorId);
    const test = labTests.find(t => t.id === newOrder.testId);

    if (pat && doc && test) {
      const barcode = `MED-BC-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderPayload: any = {
        patientId: pat.id,
        patientName: pat.name,
        doctorId: doc.id,
        doctorName: doc.name,
        testId: test.id,
        testName: test.testName,
        priority: newOrder.priority,
        specimenBarcode: barcode,
        specimenType: (test as any).specimenType || 'Whole Blood (EDTA)',
        referenceRange: test.normalRange,
        unit: test.unit,
        technicianNotes: newOrder.clinicalNotes,
        interpretation: 'Normal',
      };

      db.orderLabTest(orderPayload);
      setLabOrders([...db.getLabOrders()]);
      setIsOrderModalOpen(false);
      showToast(`Diagnostic order for "${test.testName}" placed [Barcode: ${barcode}].`);
    }
  };

  const handleDeleteOrder = (order: any) => {
    sound.playClick();
    db.deleteLabOrder(order.id);
    setLabOrders([...db.getLabOrders()]);
    setDeleteConfirmOrder(null);
    showToast(`Diagnostic order #${order.id} cancelled and removed from database.`);
  };

  const handleViewReport = (order: any) => {
    sound.playClick();
    setSelectedReportOrder(order);
    setIsReportModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-teal-600 text-white shadow-2xl animate-in slide-in-from-top-4 duration-200 text-xs font-bold border border-teal-400/40">
          <CheckCircle2 className="w-4 h-4 text-teal-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDark ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-[#142C43] shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight">Clinical Pathology & Diagnostic Laboratory</h1>
                <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Dual SQL Synced
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Automated biochemistry assays, barcode specimen tracking, panic critical alerts, and official PDF pathology reports
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                setIsCatalogModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold glass-btn-neutral flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Test Battery Catalog ({labTests.length})</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setIsOrderModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold glass-btn-teal flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Order Diagnostic Test</span>
            </button>
          </div>
        </div>

        {/* METRICS OVERVIEW BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Total Orders</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalOrdersCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Across 1,000 members</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block mb-0.5">Critical / Panic</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{criticalOrdersCount}</span>
            <span className="text-[10px] text-rose-500/80 block mt-0.5">Immediate doctor notified</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-0.5">In Analyzer</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{analyzingOrdersCount}</span>
            <span className="text-[10px] text-amber-600/80 block mt-0.5">Continuous optical run</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-0.5">Pending Collection</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{pendingCollectionCount}</span>
            <span className="text-[10px] text-blue-600/80 block mt-0.5">Phlebotomy cart round</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">Final Published</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedOrdersCount}</span>
            <span className="text-[10px] text-emerald-600/80 block mt-0.5">EMR chart verified</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'All', label: 'All Orders', count: labOrders.length },
              { id: 'Ordered', label: 'Ordered', count: pendingCollectionCount },
              { id: 'Sample Collected', label: 'Collected', count: labOrders.filter(o => o.status === 'Sample Collected').length },
              { id: 'Analyzing', label: 'Analyzing', count: analyzingOrdersCount },
              { id: 'Completed', label: 'Completed', count: completedOrdersCount },
              { id: 'Critical', label: '🚨 Panic Critical', count: criticalOrdersCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedStatus(tab.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedStatus === tab.id
                    ? tab.id === 'Critical' 
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-900 text-white dark:bg-teal-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedStatus === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box & Category Select */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, barcode, test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none border transition-all ${
                  isDark ? 'bg-slate-800/70 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => {
                sound.playClick();
                setSelectedCategory(e.target.value);
              }}
              className={`w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-semibold outline-none border cursor-pointer ${
                isDark ? 'bg-slate-800/70 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Diagnostic Categories' : c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30 text-teal-500" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">No diagnostic orders match the selected filters</h4>
            <p className="text-xs mt-1">Try resetting search keywords or switching category filters.</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isCritical = order.interpretation === 'Critical';
            const isAbnormal = order.interpretation === 'Abnormal';
            const isBorderline = order.interpretation === 'Borderline';
            const isCompleted = order.status === 'Completed';
            const isAnalyzing = order.status === 'Analyzing';
            const isCollected = order.status === 'Sample Collected';

            return (
              <div
                key={order.id}
                className={`p-5 sm:p-6 rounded-3xl border transition-all hover:shadow-md ${
                  isDark ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-[#142C43] shadow-xs'
                } ${isCritical ? 'ring-1 ring-rose-500/40 border-rose-500/40' : ''}`}
              >
                {/* Header row: Test name, Barcode, Patient, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-3.5">
                    <div className={`p-3 rounded-2xl shrink-0 ${
                      isCritical
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : isAnalyzing
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                    }`}>
                      <FlaskConical className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-base tracking-tight">{order.testName}</h3>
                        {(order as any).specimenBarcode && (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            <QrCode className="w-3 h-3 text-teal-500" />
                            {(order as any).specimenBarcode}
                          </span>
                        )}
                        {(order as any).priority && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (order as any).priority.includes('STAT')
                              ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {(order as any).priority}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                        <span>Patient: <strong className="text-slate-800 dark:text-slate-200">{order.patientName}</strong> ({order.patientId})</span>
                        <span>•</span>
                        <span>Attending: <strong className="text-slate-700 dark:text-slate-300">{(order as any).doctorName || 'Dr. Roger Sterling, MD'}</strong></span>
                        <span>•</span>
                        <span>Ordered: <strong className="font-mono">{order.orderedDate}</strong></span>
                        {order.completedDate && (
                          <>
                            <span>•</span>
                            <span>Verified: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{order.completedDate}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    {order.interpretation && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCritical
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : isAbnormal
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : isBorderline
                          ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {order.interpretation}
                      </span>
                    )}

                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isAnalyzing
                        ? 'bg-amber-500 text-white animate-pulse'
                        : isCollected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-white'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Finding & Diagnostic Readout */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="md:col-span-2 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Pathology Finding / Diagnostic Readout
                    </span>
                    <p className={`font-mono text-xs p-3 rounded-2xl border leading-relaxed ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/80 text-slate-900'
                    }`}>
                      {order.resultValue || 'Awaiting specimen collection and automated instrument cycle...'}
                    </p>

                    {((order as any).technicianNotes || (order as any).referenceRange) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-400">
                        {(order as any).referenceRange && (
                          <span>Reference Range: <strong className="text-slate-600 dark:text-slate-300 font-mono">{(order as any).referenceRange}</strong></span>
                        )}
                        {(order as any).technicianNotes && (
                          <span>Notes: <span className="italic text-slate-500 dark:text-slate-400">{(order as any).technicianNotes}</span></span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-col sm:flex-row md:flex-col justify-end items-stretch sm:items-center md:items-end gap-2 shrink-0">
                    {order.status === 'Ordered' && (
                      <button
                        onClick={() => handleCollectSpecimen(order.id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Collect Specimen</span>
                      </button>
                    )}

                    {order.status === 'Sample Collected' && (
                      <button
                        onClick={() => handleStartAnalysis(order.id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        <span>Load Analyzer</span>
                      </button>
                    )}

                    {order.status === 'Analyzing' && (
                      <button
                        onClick={() => handleOpenResultModal(order)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Enter / Publish Findings</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <button
                        onClick={() => handleViewReport(order)}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-semibold glass-btn-neutral flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        title="View Official Diagnostic PDF Report"
                      >
                        <Printer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>Official Report</span>
                      </button>

                      <button
                        onClick={() => setDeleteConfirmOrder(order)}
                        className="px-2.5 py-1.5 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Cancel / Delete Lab Order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL: ORDER DIAGNOSTIC TEST ================= */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-xl rounded-3xl p-6 shadow-2xl border ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Request Laboratory / Diagnostic Test</h3>
                  <p className="text-[11px] text-slate-400">Generates accession tube barcode & queues to central automated laboratory</p>
                </div>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 mt-4 text-xs">
              {/* Patient Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Select Patient (1,000 Members Live Catalog)</label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Search patient by name or code (e.g. Magnus, P-12563)..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <select
                    value={newOrder.patientId}
                    onChange={(e) => setNewOrder({ ...newOrder, patientId: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-semibold ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  >
                    {modalFilteredPatients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.patientCode}) • Age {p.age} • {p.bloodGroup} • {p.admissionStatus}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Doctor Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Ordering Attending Physician</label>
                <select
                  value={newOrder.doctorId}
                  onChange={(e) => setNewOrder({ ...newOrder, doctorId: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-semibold ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                  }`}
                >
                  {doctors.slice(0, 20).map(d => (
                    <option key={d.id} value={d.id}>{d.name} — {d.specialization} ({d.department})</option>
                  ))}
                </select>
              </div>

              {/* Diagnostic Test Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Diagnostic Test Battery</label>
                <select
                  value={newOrder.testId}
                  onChange={(e) => setNewOrder({ ...newOrder, testId: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-semibold ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                  }`}
                >
                  {labTests.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.testName} — ₹{t.price} ({t.category} • {t.durationHours}h TAT)
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority & Clinical Indications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Clinical Priority</label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-semibold ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  >
                    <option value="STAT Emergency (Immediate)">STAT Emergency (1 Hour Turnaround)</option>
                    <option value="Routine Morning Round">Routine Morning Round (Same Day)</option>
                    <option value="Pre-Operative Clearance">Pre-Operative Surgical Clearance</option>
                    <option value="Fasting 12-Hour Assay">Fasting 12-Hour Morning Assay</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Clinical Indication / Symptoms</label>
                  <input
                    type="text"
                    value={newOrder.clinicalNotes}
                    onChange={(e) => setNewOrder({ ...newOrder, clinicalNotes: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold glass-btn-teal shadow-md cursor-pointer"
                >
                  Submit Order & Assign Barcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ENTER / PUBLISH FINDINGS ================= */}
      {isResultModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Enter Verified Diagnostic Findings</h3>
                  <p className="text-[11px] text-slate-400">{editingOrder.testName} • {editingOrder.patientName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsResultModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResult} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Analyte Quantitative Value / Readout</label>
                <textarea
                  rows={3}
                  value={resultForm.resultValue}
                  onChange={(e) => setResultForm({ ...resultForm, resultValue: e.target.value })}
                  className={`w-full p-3 rounded-xl text-xs font-mono border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  placeholder="e.g. Total Chol: 198 mg/dL, LDL: 122 mg/dL, HDL: 44 mg/dL..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Clinical Interpretation</label>
                  <select
                    value={resultForm.interpretation}
                    onChange={(e) => setResultForm({ ...resultForm, interpretation: e.target.value as any })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  >
                    <option value="Normal">Normal (Within Biological Reference Interval)</option>
                    <option value="Borderline">Borderline / Mild Shift</option>
                    <option value="Abnormal">Abnormal / Diagnostic Significance</option>
                    <option value="Critical">🚨 Critical Panic Value (Urgent Doctor Alert)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Reference Range Interval</label>
                  <input
                    type="text"
                    value={resultForm.referenceRange}
                    onChange={(e) => setResultForm({ ...resultForm, referenceRange: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Medical Technologist Verification Notes</label>
                <input
                  type="text"
                  value={resultForm.technicianNotes}
                  onChange={(e) => setResultForm({ ...resultForm, technicianNotes: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResultModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer"
                >
                  Verify & Publish to Patient EMR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: OFFICIAL PDF REPORT VIEWER ================= */}
      {isReportModalOpen && selectedReportOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-300 max-h-[90vh] overflow-y-auto">
            {/* Header / Brand */}
            <div className="flex items-start justify-between pb-4 border-b-2 border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  M+
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">MediCore Global Health System</h2>
                  <p className="text-xs font-bold text-teal-700">DEPARTMENT OF PATHOLOGY & CLINICAL DIAGNOSTICS</p>
                  <p className="text-[10px] text-slate-500">ISO 15189 & CAP Accredited Diagnostic Laboratory • CLIA #99D2084712</p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-xs font-bold text-slate-900 block">REPORT ID: {selectedReportOrder.id}</span>
                <span className="font-mono text-[10px] text-slate-500 block">BARCODE: {(selectedReportOrder as any).specimenBarcode || 'MED-BC-90001'}</span>
                <span className="text-[10px] text-slate-500 block">ISSUED: {selectedReportOrder.completedDate || selectedReportOrder.orderedDate}</span>
              </div>
            </div>

            {/* Patient & Requisition Demographics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Patient Name</span>
                <strong className="text-slate-900">{selectedReportOrder.patientName}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Patient ID / MRN</span>
                <strong className="font-mono text-slate-900">{selectedReportOrder.patientId}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Attending Physician</span>
                <strong className="text-slate-900">{(selectedReportOrder as any).doctorName || 'Dr. Roger Sterling, MD'}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Specimen Matrix</span>
                <strong className="text-slate-900">{(selectedReportOrder as any).specimenType || 'Whole Blood (EDTA)'}</strong>
              </div>
            </div>

            {/* Analyte Diagnostic Table */}
            <div className="mt-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Diagnostic Analysis & Quantitation
              </h4>
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <th className="p-2.5">Test / Analyte Battery</th>
                    <th className="p-2.5">Diagnostic Finding / Result</th>
                    <th className="p-2.5">Reference Interval</th>
                    <th className="p-2.5 text-center">Status Flag</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 font-bold text-slate-900">
                      {selectedReportOrder.testName}
                    </td>
                    <td className="p-2.5 font-mono text-slate-800">
                      {selectedReportOrder.resultValue || 'Pending laboratory instrument cycle completion'}
                    </td>
                    <td className="p-2.5 font-mono text-slate-600">
                      {(selectedReportOrder as any).referenceRange || 'Standard anatomical standard'}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        selectedReportOrder.interpretation === 'Critical'
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : selectedReportOrder.interpretation === 'Abnormal'
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      }`}>
                        {selectedReportOrder.interpretation || 'Normal'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Technologist Notes */}
            {(selectedReportOrder as any).technicianNotes && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Clinical Pathology Impressions</span>
                <p className="text-slate-700 italic">{(selectedReportOrder as any).technicianNotes}</p>
              </div>
            )}

            {/* Sign-Off Stamp */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Electronically Certified by:</span>
                <strong className="text-slate-800">Dr. Eleanor Vance, MD, CISSP</strong>
                <span className="text-[10px] text-slate-500 block">Director of Pathology & Enterprise Laboratory Services</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white flex items-center gap-1.5 shadow-md cursor-pointer hover:bg-teal-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Official PDF</span>
                </button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TEST BATTERY CATALOG ================= */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-3xl rounded-3xl p-6 shadow-2xl border max-h-[85vh] overflow-y-auto ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Standard Diagnostic Laboratory Catalog</h3>
                  <p className="text-[11px] text-slate-400">18 clinical diagnostic assays across Hematology, Biochemistry, Cardiac & Imaging</p>
                </div>
              </div>
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {labTests.map(test => (
                <div
                  key={test.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{test.testName}</h4>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold block mt-0.5">{test.category}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white shrink-0">₹{test.price}</span>
                  </div>

                  <div className="mt-2.5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <p>Sample: <strong className="text-slate-700 dark:text-slate-300">{(test as any).specimenType || 'Whole Blood'}</strong></p>
                    <p>Reference: <strong className="font-mono text-slate-700 dark:text-slate-300">{test.normalRange}</strong></p>
                    <p>TAT: <strong className="text-slate-700 dark:text-slate-300">{test.durationHours} Hours</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <div className="p-3 bg-rose-500/10 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base">Cancel & Delete Lab Order?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to cancel and remove <strong>{deleteConfirmOrder.testName}</strong> for <strong>{deleteConfirmOrder.patientName}</strong>? This action will be permanently recorded in the HIPAA audit logs.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setDeleteConfirmOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                Keep Order
              </button>
              <button
                onClick={() => handleDeleteOrder(deleteConfirmOrder)}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md cursor-pointer"
              >
                Delete from Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
