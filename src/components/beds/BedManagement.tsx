/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ThemeMode, Patient } from '../../types';
import { InteractiveWardFloorplan } from '../ward/InteractiveWardFloorplan';

interface BedManagementProps {
  theme: ThemeMode;
  onSelectPatient?: (patient: Patient) => void;
  onNavigateTab?: (tab: string) => void;
}

export const BedManagement: React.FC<BedManagementProps> = ({
  theme,
  onSelectPatient,
  onNavigateTab
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <InteractiveWardFloorplan
        theme={theme}
        onSelectPatient={onSelectPatient}
        onNavigateTab={onNavigateTab}
        portalRole="admin"
      />
    </div>
  );
};
