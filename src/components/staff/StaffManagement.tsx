/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Staff, ThemeMode } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { 
  Users, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  Filter,
  PhoneCall
} from 'lucide-react';

interface StaffManagementProps {
  theme: ThemeMode;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [staffList, setStaffList] = useState<Staff[]>(db.getStaff());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const STAFF_PER_PAGE = 9;

  const toggleStatus = (id: string) => {
    sound.playClick();
    const staff = staffList.find(s => s.id === id);
    if (staff) {
      staff.status = staff.status === 'On Duty' ? 'On Break' : staff.status === 'On Break' ? 'Off Duty' : 'On Duty';
      setStaffList([...staffList]);
    }
  };

  const filteredStaff = staffList.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStaff.length / STAFF_PER_PAGE) || 1;
  const paginatedStaff = filteredStaff.slice((currentPage - 1) * STAFF_PER_PAGE, currentPage * STAFF_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Clinical Staff & Nursing Rosters</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            24/7 Ward nurse allocation, departmental shift coverage, and duty rotation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            {staffList.filter(s => s.status === 'On Duty').length} Active On Shift
          </span>
        </div>
      </div>

      {/* STAFF LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedStaff.map(member => (
          <div
            key={member.id}
            className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
              isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base">{member.name}</h3>
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">{member.role}</span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                  member.status === 'On Duty'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : member.status === 'On Break'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                }`}>
                  {member.status}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Assigned Unit:</span>
                  <strong className="text-slate-700 dark:text-slate-200">{member.department}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Current Shift:</span>
                  <strong className="text-slate-700 dark:text-slate-200">{member.shift}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Internal Pager:</span>
                  <strong className="text-slate-700 dark:text-slate-200 font-mono">{member.contact}</strong>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => toggleStatus(member.id)}
                className="w-full py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Toggle Status ({member.status})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
