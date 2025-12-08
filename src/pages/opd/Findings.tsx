// src/pages/opd/Findings.tsx
import React from 'react';
import { useVisitFinding } from '@/hooks/useVisitFinding';

export const VisitFindings: React.FC = () => {
  const { useVisitFindings } = useVisitFinding();

  // Fetch all visit findings
  const { data: findings, error: findingsError, isLoading: findingsLoading } = useVisitFindings();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>Visit Findings API Test - Plain Output</h1>
      <hr />

      {/* ALL VISIT FINDINGS */}
      <div style={{ marginTop: '20px' }}>
        <h2>ALL VISIT FINDINGS API</h2>
        <p>Endpoint: GET /opd/visit-findings/</p>
        {findingsLoading && <p>Loading visit findings...</p>}
        {findingsError && (
          <div>
            <p style={{ color: 'red' }}>Error: {findingsError.message || 'Failed to fetch visit findings'}</p>
            <pre style={{ background: '#ffe6e6', padding: '10px', overflow: 'auto', color: 'red' }}>
              {JSON.stringify(findingsError, null, 2)}
            </pre>
          </div>
        )}
        {findings && (
          <div>
            <p style={{ color: 'green' }}>
              Success! Found {findings.count} visit finding(s), showing {findings.results?.length || 0} on this page
            </p>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(findings, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <hr />

      {/* API CONFIGURATION INFO */}
      <div style={{ marginTop: '20px' }}>
        <h2>API CONFIGURATION</h2>
        <p>HMS Base URL: {import.meta.env.VITE_HMS_BASE_URL || 'https://hms.celiyo.com/api'}</p>
        <p>All requests use hmsClient with automatic tenant headers and JWT auth</p>
        <p>Main Endpoint: /opd/visit-findings/</p>
      </div>

      <hr />

      {/* VISIT FINDING DETAILS */}
      <div style={{ marginTop: '20px' }}>
        <h2>VISIT FINDING STRUCTURE</h2>
        <p>Each visit finding object contains:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>id: number - Unique identifier</li>
          <li>visit: number - Related visit ID (ForeignKey)</li>
          <li>finding_date: string - Date/time of finding (auto_now_add)</li>
          <li>finding_type: 'examination' | 'systemic' - Type of finding</li>
          <li>visit_number: string - Visit reference number (read-only)</li>
          <li>patient_name: string - Patient name (read-only)</li>
          <li>recorded_by_name: string - Recorded by user name (read-only)</li>
          <li>blood_pressure: string - Computed as "systolic/diastolic" (read-only)</li>
          <li>bmi_category: string - BMI category: Underweight/Normal/Overweight/Obese (read-only)</li>
          <li><strong>VITAL SIGNS:</strong></li>
          <li>&nbsp;&nbsp;temperature: string | null - Body temperature in °F (range: 90.0-110.0)</li>
          <li>&nbsp;&nbsp;pulse: number | null - Pulse rate per minute (range: 30-300)</li>
          <li>&nbsp;&nbsp;bp_systolic: number | null - Systolic blood pressure (range: 50-300)</li>
          <li>&nbsp;&nbsp;bp_diastolic: number | null - Diastolic blood pressure (range: 30-200)</li>
          <li>&nbsp;&nbsp;weight: string | null - Weight in kg (range: 0.5-500.0)</li>
          <li>&nbsp;&nbsp;height: string | null - Height in cm (range: 30.0-300.0)</li>
          <li>&nbsp;&nbsp;bmi: string | null - Auto-calculated BMI (read-only)</li>
          <li>&nbsp;&nbsp;spo2: number | null - Oxygen saturation % (range: 0-100)</li>
          <li>&nbsp;&nbsp;respiratory_rate: number | null - Breaths per minute (range: 5-60)</li>
          <li><strong>SYSTEMIC EXAMINATION:</strong></li>
          <li>&nbsp;&nbsp;tongue: string - Tongue examination findings</li>
          <li>&nbsp;&nbsp;throat: string - Throat examination findings</li>
          <li>&nbsp;&nbsp;cns: string - Central Nervous System findings</li>
          <li>&nbsp;&nbsp;rs: string - Respiratory System findings</li>
          <li>&nbsp;&nbsp;cvs: string - Cardiovascular System findings</li>
          <li>&nbsp;&nbsp;pa: string - Per Abdomen findings</li>
          <li>recorded_by: number | null - User ID who recorded</li>
          <li>created_at: string - Creation timestamp</li>
          <li>updated_at: string - Last update timestamp</li>
        </ul>
      </div>

      <hr />

      {/* AVAILABLE OPERATIONS */}
      <div style={{ marginTop: '20px' }}>
        <h2>AVAILABLE OPERATIONS</h2>
        <p>The useVisitFinding hook provides the following operations:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>useVisitFindings(params?) - List all visit findings with optional filters</li>
          <li>useVisitFindingById(id) - Get a single visit finding by ID</li>
          <li>useFindingsByVisit(visitId) - Get all findings for a specific visit</li>
          <li>useLatestVitals(visitId) - Get the most recent vital signs for a visit</li>
          <li>createFinding(data) - Create a new visit finding</li>
          <li>updateFinding(id, data) - Update a visit finding</li>
          <li>deleteFinding(id) - Delete a visit finding</li>
        </ul>
      </div>

      <hr />

      {/* QUERY PARAMETERS */}
      <div style={{ marginTop: '20px' }}>
        <h2>AVAILABLE QUERY PARAMETERS</h2>
        <p>Filter visit findings using these parameters:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>visit: number - Filter by visit ID</li>
          <li>finding_type: 'examination' | 'systemic' - Filter by finding type</li>
          <li>finding_date: string - Filter by finding date (YYYY-MM-DD)</li>
          <li>search: string - Search in finding fields</li>
          <li>ordering: string - Order results (default: "-finding_date")</li>
          <li>page: number - Page number for pagination</li>
          <li>page_size: number - Number of results per page</li>
        </ul>
      </div>

      <hr />

      {/* VISIT FINDING CREATION */}
      <div style={{ marginTop: '20px' }}>
        <h2>VISIT FINDING CREATION</h2>
        <p>To create a visit finding, use createFinding(data) with:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>visit: number (required) - Visit ID</li>
          <li>finding_type: 'examination' | 'systemic' (required) - Type of finding</li>
          <li><strong>Optional Vital Signs:</strong></li>
          <li>&nbsp;&nbsp;temperature: string - Body temperature in °F</li>
          <li>&nbsp;&nbsp;pulse: number - Pulse rate per minute</li>
          <li>&nbsp;&nbsp;bp_systolic: number - Systolic blood pressure</li>
          <li>&nbsp;&nbsp;bp_diastolic: number - Diastolic blood pressure</li>
          <li>&nbsp;&nbsp;weight: string - Weight in kg</li>
          <li>&nbsp;&nbsp;height: string - Height in cm</li>
          <li>&nbsp;&nbsp;spo2: number - Oxygen saturation %</li>
          <li>&nbsp;&nbsp;respiratory_rate: number - Breaths per minute</li>
          <li><strong>Optional Systemic Examination:</strong></li>
          <li>&nbsp;&nbsp;tongue: string - Tongue findings</li>
          <li>&nbsp;&nbsp;throat: string - Throat findings</li>
          <li>&nbsp;&nbsp;cns: string - CNS findings</li>
          <li>&nbsp;&nbsp;rs: string - Respiratory System findings</li>
          <li>&nbsp;&nbsp;cvs: string - Cardiovascular findings</li>
          <li>&nbsp;&nbsp;pa: string - Per Abdomen findings</li>
        </ul>
      </div>

      <hr />

      {/* FINDING TYPES */}
      <div style={{ marginTop: '20px' }}>
        <h2>FINDING TYPES</h2>
        <p>Visit findings are categorized into two types:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>examination:</strong> Physical examination findings including vital signs (temperature, pulse, BP, weight, height, BMI, SpO2, respiratory rate)</li>
          <li><strong>systemic:</strong> System-wise examination findings (tongue, throat, CNS, respiratory, cardiovascular, abdominal)</li>
        </ul>
        <p>Note: A visit can have multiple findings of different types recorded at different times.</p>
      </div>

      <hr />

      {/* COMPUTED FIELDS */}
      <div style={{ marginTop: '20px' }}>
        <h2>COMPUTED FIELDS</h2>
        <p>The following fields are auto-calculated by the backend:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>bmi:</strong> Auto-calculated from weight and height (weight_kg / (height_m)²)</li>
          <li><strong>bmi_category:</strong> Calculated from BMI value:
            <ul style={{ marginLeft: '20px' }}>
              <li>&lt; 18.5: Underweight</li>
              <li>18.5 - 24.9: Normal</li>
              <li>25.0 - 29.9: Overweight</li>
              <li>≥ 30.0: Obese</li>
            </ul>
          </li>
          <li><strong>blood_pressure:</strong> Formatted as "systolic/diastolic" (e.g., "120/80")</li>
        </ul>
      </div>

      <hr />

      {/* EXAMPLE USAGE */}
      <div style={{ marginTop: '20px' }}>
        <h2>EXAMPLE USAGE</h2>
        <p>Example 1: Record vital signs for a visit</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { createFinding } = useVisitFinding();

await createFinding({
  visit: 123,
  finding_type: 'examination',
  temperature: '98.6',
  pulse: 72,
  bp_systolic: 120,
  bp_diastolic: 80,
  weight: '70.5',
  height: '175.0',
  spo2: 98,
  respiratory_rate: 16
});`}
        </pre>
        <p>Example 2: Record systemic examination</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { createFinding } = useVisitFinding();

await createFinding({
  visit: 123,
  finding_type: 'systemic',
  tongue: 'Coated',
  throat: 'Normal',
  cns: 'NAD (No Abnormality Detected)',
  rs: 'Clear, no wheezing',
  cvs: 'S1 S2 normal, no murmur',
  pa: 'Soft, non-tender'
});`}
        </pre>
        <p>Example 3: Get latest vitals for a visit</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { useLatestVitals } = useVisitFinding();
const { data: vitals, isLoading } = useLatestVitals(123);

// vitals will contain the most recent examination finding
console.log(vitals?.blood_pressure); // "120/80"
console.log(vitals?.bmi); // "23.02"
console.log(vitals?.bmi_category); // "Normal"`}
        </pre>
      </div>

      <hr />

      {/* VALIDATION RULES */}
      <div style={{ marginTop: '20px' }}>
        <h2>VALIDATION RULES</h2>
        <p>Field validation (enforced by backend):</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>Temperature: 90.0 - 110.0 °F</li>
          <li>Pulse: 30 - 300 bpm</li>
          <li>BP Systolic: 50 - 300 mmHg</li>
          <li>BP Diastolic: 30 - 200 mmHg</li>
          <li>Weight: 0.5 - 500.0 kg</li>
          <li>Height: 30.0 - 300.0 cm</li>
          <li>SpO2: 0 - 100 %</li>
          <li>Respiratory Rate: 5 - 60 breaths/min</li>
          <li>Text fields (tongue, throat, etc.): Max 200 characters</li>
        </ul>
      </div>
    </div>
  );
};

export default VisitFindings;
