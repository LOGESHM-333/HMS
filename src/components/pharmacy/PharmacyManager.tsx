/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Medicine, Prescription, ThemeMode } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { 
  Pill, 
  Package, 
  AlertTriangle, 
  Check, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2,
  Printer
} from 'lucide-react';
import { PrintablePrescriptionModal } from '../export';

interface PharmacyManagerProps {
  theme: ThemeMode;
}

export const PharmacyManager: React.FC<PharmacyManagerProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [medicines, setMedicines] = useState<Medicine[]>(db.getMedicines());
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(db.getPrescriptions());

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setMedicines([...db.getMedicines()]);
      setPrescriptions([...db.getPrescriptions()]);
    });
    return unsub;
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions'>('inventory');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRxForPrint, setSelectedRxForPrint] = useState<Prescription | null>(null);

  const [newMed, setNewMed] = useState({
    name: '',
    genericName: '',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    strength: '25 mg',
    batchNumber: 'BCH-2026-901',
    stock: 200,
    minThreshold: 50,
    unitPrice: 12.5,
    expiryDate: '2028-01-01',
  });

  const handleDispense = (prescriptionId: string, medicineId: string) => {
    sound.playClick();
    db.dispenseMedicine(prescriptionId, medicineId);
    setMedicines([...db.getMedicines()]);
    setPrescriptions([...db.getPrescriptions()]);
  };

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    db.addMedicine({
      name: newMed.name,
      genericName: newMed.genericName,
      category: newMed.category,
      dosageForm: newMed.dosageForm,
      strength: newMed.strength,
      batchNumber: newMed.batchNumber,
      stock: Number(newMed.stock),
      minThreshold: Number(newMed.minThreshold),
      unitPrice: Number(newMed.unitPrice),
      expiryDate: newMed.expiryDate,
      status: 'In Stock',
    });
    setMedicines([...db.getMedicines()]);
    setIsAddModalOpen(false);
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Pharmacy & Medication Formulary</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated prescription dispensing, batch expiry tracking, and inventory control
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medicine Batch</span>
        </button>
      </div>

      {/* TABS & SEARCH */}
      <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
        isDark ? 'bg-[#0E2035]/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('inventory');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            Inventory Stock ({medicines.length})
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('prescriptions');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
              activeTab === 'prescriptions'
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            Prescription Dispensing Queue ({prescriptions.length})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search medications, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-2xl text-xs border outline-none ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
            }`}
          />
        </div>
      </div>

      {/* TAB 1: INVENTORY TABLE */}
      {activeTab === 'inventory' && (
        <div className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43]'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Medication & Strength</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Batch No.</th>
                  <th className="pb-3 font-semibold">Stock Quantity</th>
                  <th className="pb-3 font-semibold">Expiry Date</th>
                  <th className="pb-3 font-semibold">Unit Price</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMedicines.map(m => (
                  <tr key={m.id} className="hover:bg-teal-50/20 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 pr-3">
                      <div className="font-bold">{m.name}</div>
                      <div className="text-[11px] text-slate-400">{m.dosageForm} • {m.strength}</div>
                    </td>
                    <td className="py-3.5 pr-3 text-teal-600 dark:text-teal-400 font-semibold">{m.category}</td>
                    <td className="py-3.5 pr-3 font-mono text-[11px] text-slate-400">{m.batchNumber}</td>
                    <td className="py-3.5 pr-3">
                      <div className="font-bold text-sm">{m.stock} units</div>
                      <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${m.stock <= m.minThreshold ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min(100, (m.stock / 200) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 pr-3 font-mono text-slate-400">{m.expiryDate}</td>
                    <td className="py-3.5 pr-3 font-bold text-emerald-600 dark:text-emerald-400">₹{m.unitPrice.toFixed(2)}</td>
                    <td className="py-3.5 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        m.status === 'In Stock' 
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PRESCRIPTION DISPENSING */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptions.map(rx => (
            <div
              key={rx.id}
              className={`p-6 rounded-3xl border transition-all ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">{rx.patientName}</h3>
                    <span className="text-xs font-mono text-teal-600 dark:text-teal-400 font-semibold">{rx.id}</span>
                  </div>
                  <span className="text-xs text-slate-400">Prescribing Doctor: {rx.doctorName} • {rx.date}</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  {rx.status}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {rx.items.map(item => (
                  <div
                    key={item.medicineId}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                      item.dispensed 
                        ? isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">{item.medicineName}</div>
                      <div className="text-slate-400 mt-0.5">
                        Dosage: {item.dosage} • {item.frequency} • {item.duration} ({item.quantity} units)
                      </div>
                    </div>

                    {item.dispensed ? (
                      <span className="flex items-center gap-1 font-bold text-emerald-500 text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Dispensed</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDispense(rx.id, item.medicineId)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-xs"
                      >
                        Dispense Medication
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD MEDICINE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <h3 className="font-extrabold text-base mb-4">Add Pharmacy Batch Item</h3>
            <form onSubmit={handleAddMedicine} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Medication Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lisinopril Tablets"
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Category</label>
                  <input
                    type="text"
                    value={newMed.category}
                    onChange={(e) => setNewMed({ ...newMed, category: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Strength</label>
                  <input
                    type="text"
                    value={newMed.strength}
                    onChange={(e) => setNewMed({ ...newMed, strength: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={newMed.stock}
                    onChange={(e) => setNewMed({ ...newMed, stock: parseInt(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMed.unitPrice}
                    onChange={(e) => setNewMed({ ...newMed, unitPrice: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow-md"
                >
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
