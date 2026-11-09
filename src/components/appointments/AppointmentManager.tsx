/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Appointment, Doctor, Patient, ThemeMode } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Stethoscope, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Search,
  Sparkles
} from 'lucide-react';

interface AppointmentManagerProps {
  theme: ThemeMode;
}

export const AppointmentManager: React.FC<AppointmentManagerProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [appointments, setAppointments] = useState<Appointment[]>(db.getAppointments());
  const patients = db.getPatients();
  const doctors = db.getDoctors();

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setAppointments([...db.getAppointments()]);
    });
    return unsub;
  }, []);
  
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected date in mini calendar
  const [selectedDate, setSelectedDate] = useState<string>('2026-04-03');

  // New booking form
  const [newBooking, setNewBooking] = useState({
    patientId: patients[0]?.id || '',
    doctorId: doctors[0]?.id || '',
    date: '2026-04-05',
    time: '10:30 AM',
    visitType: 'Consultation' as const,
    notes: '',
  });

  const handleStatusChange = (id: string, status: Appointment['status']) => {
    sound.playClick();
    db.updateAppointmentStatus(id, status);
    setAppointments([...db.getAppointments()]);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    const pat = patients.find(p => p.id === newBooking.patientId);
    const doc = doctors.find(d => d.id === newBooking.doctorId);

    if (!pat || !doc) return;

    db.addAppointment({
      patientId: pat.id,
      patientName: pat.name,
      doctorId: doc.id,
      doctorName: doc.name,
      department: doc.department,
      date: newBooking.date,
      time: newBooking.time,
      status: 'Scheduled',
      visitType: newBooking.visitType,
      notes: newBooking.notes || 'Routine consultation scheduled.',
    });

    setAppointments([...db.getAppointments()]);
    setIsBookModalOpen(false);
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'All' || apt.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calendar days grid generator for April 2026
  const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER & NEW BOOKING BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Clinical Consultation & Schedule Engine</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated conflict-prevented patient appointment queues & operating theater scheduling
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setIsBookModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md shadow-teal-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* TOP CALENDAR & UPCOMING SCHEDULE ROW (DIRECTLY MATCHING VIDEO 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Mini Calendar with specialist indicator */}
        <div className={`lg:col-span-4 p-5 rounded-3xl border transition-all ${
          isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-500">
                Schedule Engine
              </span>
              <h3 className="font-extrabold text-sm">Appointment Schedule</h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">Apr 2026</span>
          </div>

          {/* Mini Calendar Month Grid */}
          <div className="mt-4">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Empty padding for days before month start */}
              <div /><div /><div />
              {calendarDays.slice(0, 28).map((day) => {
                const dateStr = `2026-04-${day < 10 ? '0' + day : day}`;
                const hasApt = appointments.some(a => a.date === dateStr);
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={day}
                    onClick={() => {
                      sound.playClick();
                      setSelectedDate(dateStr);
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold relative transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : hasApt
                        ? isDark ? 'bg-slate-800 text-teal-400 font-bold' : 'bg-teal-50 text-teal-700 font-bold'
                        : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>{day}</span>
                    {hasApt && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specialist On-Duty Badge (Inspired by Pulmonologist badge in Video 1) */}
          <div className="mt-5 p-3 rounded-2xl bg-gradient-to-r from-blue-900/40 to-teal-900/30 border border-teal-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-teal-300 font-semibold uppercase block">
                  Lead Attending
                </span>
                <span className="text-xs font-bold text-white">Dr. Roger S. (Pulmonologist)</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
              Available
            </span>
          </div>
        </div>

        {/* Right Column (8 cols): Appointment History & Queue Table (Directly Matching Video 1 Table) */}
        <div className={`lg:col-span-8 p-5 rounded-3xl border transition-all ${
          isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm">Appointment History & Live Clinical Queue</h3>
              <span className="text-xs text-slate-400">Filtered consultations for {selectedDate}</span>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['All', 'Scheduled', 'In-Progress', 'Completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    sound.playClick();
                    setFilterStatus(status);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Date & Time</th>
                  <th className="pb-3 font-semibold">Care Provider</th>
                  <th className="pb-3 font-semibold">Medical Center / Ward</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Visit Type</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-teal-50/20 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 pr-3">
                      <div className="font-semibold">{apt.date}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-teal-500" />
                        {apt.time}
                      </div>
                    </td>

                    <td className="py-3.5 pr-3">
                      <div className="font-bold flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-[10px]">
                          {apt.doctorName[4]}
                        </div>
                        <span>{apt.doctorName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 ml-8">Patient: {apt.patientName}</div>
                    </td>

                    <td className="py-3.5 pr-3 text-slate-600 dark:text-slate-300 font-medium">
                      {apt.department}
                    </td>

                    <td className="py-3.5 pr-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                        apt.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : apt.status === 'In-Progress'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                          : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {apt.status === 'Completed' && <CheckCircle className="w-3 h-3" />}
                        {apt.status}
                      </span>
                    </td>

                    <td className="py-3.5 pr-3 text-slate-500 dark:text-slate-400 font-medium">
                      {apt.visitType}
                    </td>

                    <td className="py-3.5 text-right space-x-1">
                      {apt.status === 'Scheduled' && (
                        <button
                          onClick={() => handleStatusChange(apt.id, 'In-Progress')}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          Start
                        </button>
                      )}
                      {apt.status === 'In-Progress' && (
                        <button
                          onClick={() => handleStatusChange(apt.id, 'Completed')}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          Finish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BOOKING MODAL */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <h3 className="font-extrabold text-base mb-4">Schedule Clinical Appointment</h3>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Select Patient</label>
                <select
                  value={newBooking.patientId}
                  onChange={(e) => setNewBooking({ ...newBooking, patientId: e.target.value })}
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
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Select Attending Doctor</label>
                <select
                  value={newBooking.doctorId}
                  onChange={(e) => setNewBooking({ ...newBooking, doctorId: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                  }`}
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} — {d.department} (₹{d.consultationFee})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newBooking.date}
                    onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Time Slot</label>
                  <select
                    value={newBooking.time}
                    onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  >
                    {['08:30 AM', '09:30 AM', '10:30 AM', '11:15 AM', '02:00 PM', '03:30 PM', '04:45 PM'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Clinical Visit Type</label>
                <select
                  value={newBooking.visitType}
                  onChange={(e) => setNewBooking({ ...newBooking, visitType: e.target.value as any })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                  }`}
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Treatment">Treatment</option>
                  <option value="Diagnostic">Diagnostic</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Clinical Notes</label>
                <textarea
                  rows={2}
                  placeholder="Primary complaint, symptoms or reason for visit..."
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow-md"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
