/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LabOrder, LabTest, ThemeMode } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { 
  FlaskConical, 
  Dna, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  Plus, 
  Search,
  Filter
} from 'lucide-react';

interface LabManagerProps {
  theme: ThemeMode;
}

export const LabManager: React.FC<LabManagerProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [labOrders, setLabOrders] = useState<LabOrder[]>(db.getLabOrders());
  const labTests = db.getLabTests();
  const patients = db.getPatients();
  const doctors = db.getDoctors();

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [newOrder, setNewOrder] = useState({
    patientId: patients[0]?.id || '',
    doctorId: doctors[0]?.id || '',
    testId: labTests[0]?.id || '',
  });

  const handleUpdateStatus = (id: string, status: LabOrder['status']) => {
    sound.playClick();
    db.updateLabOrderStatus(id, status, 'Parenchymal density within normal anatomical variances', 'Normal');
    setLabOrders([...db.getLabOrders()]);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const pat = patients.find(p => p.id === newOrder.patientId);
    const doc = doctors.find(d => d.id === newOrder.doctorId);
    const test = labTests.find(t => t.id === newOrder.testId);

    if (pat && doc && test) {
      db.orderLabTest({
        patientId: pat.id,
        patientName: pat.name,
        doctorId: doc.id,
        testId: test.id,
        testName: test.testName,
      });
      setLabOrders([...db.getLabOrders()]);
      setIsOrderModalOpen(false);
    }
  };

  const filteredOrders = labOrders.filter(o => 
    selectedStatus === 'All' || o.status === selectedStatus
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Clinical Pathology & Diagnostic Laboratory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Specimen tracking pipeline, automated biochemistry assays, and 3D imaging volumetry reports
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setIsOrderModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Order Diagnostic Test</span>
        </button>
      </div>

      {/* FILTER BUTTONS */}
      <div className={`p-4 rounded-3xl border flex items-center justify-between gap-4 ${
        isDark ? 'bg-[#0E2035]/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center gap-2 overflow-x-auto">
          {['All', 'Ordered', 'Sample Collected', 'Analyzing', 'Completed'].map((s) => (
            <button
              key={s}
              onClick={() => {
                sound.playClick();
                setSelectedStatus(s);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === s
                  ? 'bg-blue-600 text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 hidden sm:block">
          Active Diagnostic Orders: <strong className="text-teal-600 dark:text-teal-400">{labOrders.length}</strong>
        </span>
      </div>

      {/* LAB ORDERS LIST */}
      <div className="space-y-4">
        {filteredOrders.map(order => (
          <div
            key={order.id}
            className={`p-6 rounded-3xl border transition-all ${
              isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{order.testName}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Patient: <strong className="text-slate-700 dark:text-slate-200">{order.patientName}</strong> • Ordered: {order.orderedDate}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {order.interpretation && (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    order.interpretation === 'Critical'
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      : order.interpretation === 'Borderline'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  }`}>
                    {order.interpretation}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  order.status === 'Completed'
                    ? 'bg-emerald-500 text-white'
                    : order.status === 'Analyzing'
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-blue-600 text-white'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>

            {/* Diagnostic findings */}
            <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-xs">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Pathology Finding / Diagnostic Readout
                </span>
                <p className="font-mono text-sm text-slate-700 dark:text-slate-200">
                  {order.resultValue || 'Awaiting laboratory automated assay completion...'}
                </p>
              </div>

              {/* Status progression triggers */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                {order.status === 'Ordered' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'Sample Collected')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                  >
                    Collect Specimen
                  </button>
                )}
                {order.status === 'Sample Collected' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'Analyzing')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                  >
                    Begin Analysis
                  </button>
                )}
                {order.status === 'Analyzing' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'Completed')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs"
                  >
                    Publish Verified Report
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ORDER TEST MODAL */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <h3 className="font-extrabold text-base mb-4">Request Laboratory / Imaging Test</h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Patient</label>
                <select
                  value={newOrder.patientId}
                  onChange={(e) => setNewOrder({ ...newOrder, patientId: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                  }`}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.patientCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Diagnostic Test Catalog</label>
                <select
                  value={newOrder.testId}
                  onChange={(e) => setNewOrder({ ...newOrder, testId: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                  }`}
                >
                  {labTests.map(t => (
                    <option key={t.id} value={t.id}>{t.testName} - ${t.price}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow-md"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
