// src/pages/doctor.tsx
// Simple HMS Doctor API Test - Plain Output (No UI)
import React from 'react';
import { useDoctor } from '@/hooks/useDoctor';

export const DoctorTest: React.FC = () => {
  const { useDoctors, useSpecialties, useDoctorStatistics } = useDoctor();

  // Fetch all data
  const { data: doctors, error: doctorsError, isLoading: doctorsLoading } = useDoctors();
  const { data: specialties, error: specialtiesError, isLoading: specialtiesLoading } = useSpecialties();
  const { data: statistics, error: statisticsError, isLoading: statisticsLoading } = useDoctorStatistics();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>HMS Doctor API Test - Plain Output</h1>
      <hr />

      {/* DOCTOR STATISTICS */}
      <div style={{ marginTop: '20px' }}>
        <h2>DOCTOR STATISTICS API</h2>
        <p>Endpoint: GET /doctors/profiles/statistics/</p>
        {statisticsLoading && <p>Loading statistics...</p>}
        {statisticsError && <p style={{ color: 'red' }}>Error: {statisticsError.message}</p>}
        {statistics && (
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(statistics, null, 2)}
          </pre>
        )}
      </div>

      <hr />

      {/* SPECIALTIES */}
      <div style={{ marginTop: '20px' }}>
        <h2>SPECIALTIES API</h2>
        <p>Endpoint: GET /doctors/specialties/</p>
        {specialtiesLoading && <p>Loading specialties...</p>}
        {specialtiesError && <p style={{ color: 'red' }}>Error: {specialtiesError.message}</p>}
        {specialties && (
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(specialties, null, 2)}
          </pre>
        )}
      </div>

      <hr />

      {/* DOCTORS */}
      <div style={{ marginTop: '20px' }}>
        <h2>DOCTORS API</h2>
        <p>Endpoint: GET /doctors/profiles/</p>
        {doctorsLoading && <p>Loading doctors...</p>}
        {doctorsError && <p style={{ color: 'red' }}>Error: {doctorsError.message}</p>}
        {doctors && (
          <div>
            <p style={{ color: 'green' }}>
              Success! Found {doctors.count} doctor(s), showing {doctors.results.length} on this page
            </p>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(doctors, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <hr />

      {/* API CONFIGURATION INFO */}
      <div style={{ marginTop: '20px' }}>
        <h2>API CONFIGURATION</h2>
        <p>HMS Base URL: {import.meta.env.VITE_HMS_BASE_URL || 'http://127.0.0.1:8000/api'}</p>
        <p>All requests use hmsClient with automatic tenant headers and JWT auth</p>
      </div>
    </div>
  );
};

export default DoctorTest;
