/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Patient, ThemeMode } from '../../types';
import { UnifiedPortalAuth } from '../auth/UnifiedPortalAuth';

interface PatientAuthPageProps {
  theme: ThemeMode;
  onLoginSuccess: (patient: Patient) => void;
  onSwitchToDoctorPortal?: () => void;
}

export const PatientAuthPage: React.FC<PatientAuthPageProps> = ({
  theme,
  onLoginSuccess,
  onSwitchToDoctorPortal
}) => {
  return (
    <UnifiedPortalAuth
      theme={theme}
      onLoginPatient={onLoginSuccess}
      onLoginDoctor={() => {
        if (onSwitchToDoctorPortal) {
          onSwitchToDoctorPortal();
        }
      }}
    />
  );
};
