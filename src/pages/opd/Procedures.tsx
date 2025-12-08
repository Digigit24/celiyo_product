// src/pages/opd/Procedures.tsx
import React from 'react';
import { useProcedureMaster } from '@/hooks/useProcedureMaster';

export const ProcedureMasters: React.FC = () => {
  const { useProcedureMasters } = useProcedureMaster();

  // Fetch all procedure masters
  const { data: procedures, error: proceduresError, isLoading: proceduresLoading } = useProcedureMasters();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>Procedure Masters API Test - Plain Output</h1>
      <hr />

      {/* ALL PROCEDURE MASTERS */}
      <div style={{ marginTop: '20px' }}>
        <h2>ALL PROCEDURE MASTERS API</h2>
        <p>Endpoint: GET /opd/procedure-masters/</p>
        {proceduresLoading && <p>Loading procedure masters...</p>}
        {proceduresError && (
          <div>
            <p style={{ color: 'red' }}>Error: {proceduresError.message || 'Failed to fetch procedure masters'}</p>
            <pre style={{ background: '#ffe6e6', padding: '10px', overflow: 'auto', color: 'red' }}>
              {JSON.stringify(proceduresError, null, 2)}
            </pre>
          </div>
        )}
        {procedures && (
          <div>
            <p style={{ color: 'green' }}>
              Success! Found {procedures.count} procedure master(s), showing {procedures.results?.length || 0} on this page
            </p>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(procedures, null, 2)}
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
        <p>Main Endpoint: /opd/procedure-masters/</p>
      </div>

      <hr />

      {/* PROCEDURE MASTER DETAILS */}
      <div style={{ marginTop: '20px' }}>
        <h2>PROCEDURE MASTER STRUCTURE</h2>
        <p>Each procedure master object contains:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>id: number - Unique identifier</li>
          <li>name: string - Procedure name (max 200 characters)</li>
          <li>code: string - Unique procedure code (max 50 characters)</li>
          <li>category: ProcedureCategory - Category type</li>
          <li>description: string - Detailed description</li>
          <li>default_charge: string - Default charge amount (DecimalField)</li>
          <li>is_active: boolean - Active status</li>
          <li>created_at: string - Creation timestamp (ISO format)</li>
          <li>updated_at: string - Last update timestamp (ISO format)</li>
        </ul>
      </div>

      <hr />

      {/* PROCEDURE CATEGORIES */}
      <div style={{ marginTop: '20px' }}>
        <h2>PROCEDURE CATEGORIES</h2>
        <p>Available procedure categories:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>laboratory</strong> - Laboratory tests and investigations</li>
          <li><strong>radiology</strong> - Radiological procedures</li>
          <li><strong>cardiology</strong> - Cardiac procedures and tests</li>
          <li><strong>pathology</strong> - Pathology tests</li>
          <li><strong>ultrasound</strong> - Ultrasound scans</li>
          <li><strong>ct_scan</strong> - CT scan procedures</li>
          <li><strong>mri</strong> - MRI scans</li>
          <li><strong>ecg</strong> - Electrocardiogram tests</li>
          <li><strong>xray</strong> - X-ray imaging</li>
          <li><strong>other</strong> - Other procedures</li>
        </ul>
      </div>

      <hr />

      {/* AVAILABLE OPERATIONS */}
      <div style={{ marginTop: '20px' }}>
        <h2>AVAILABLE OPERATIONS</h2>
        <p>The useProcedureMaster hook provides the following operations:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>useProcedureMasters(params?) - List all procedure masters with optional filters</li>
          <li>useProcedureMasterById(id) - Get a single procedure master by ID</li>
          <li>useActiveProcedureMasters(category?) - Get active procedures, optionally by category</li>
          <li>createProcedure(data) - Create a new procedure master</li>
          <li>updateProcedure(id, data) - Update a procedure master</li>
          <li>deleteProcedure(id) - Delete a procedure master</li>
        </ul>
      </div>

      <hr />

      {/* QUERY PARAMETERS */}
      <div style={{ marginTop: '20px' }}>
        <h2>AVAILABLE QUERY PARAMETERS</h2>
        <p>Filter procedure masters using these parameters:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>category: string - Filter by category (e.g., 'laboratory', 'radiology')</li>
          <li>is_active: boolean - Filter by active status</li>
          <li>search: string - Search in name, code, or description</li>
          <li>ordering: string - Order results (default: "category,name")</li>
          <li>page: number - Page number for pagination</li>
          <li>page_size: number - Number of results per page</li>
        </ul>
      </div>

      <hr />

      {/* PROCEDURE MASTER CREATION */}
      <div style={{ marginTop: '20px' }}>
        <h2>PROCEDURE MASTER CREATION</h2>
        <p>To create a procedure master, use createProcedure(data) with:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>name: string (required) - Procedure name</li>
          <li>code: string (required) - Unique procedure code</li>
          <li>category: ProcedureCategory (required) - Category type</li>
          <li>default_charge: string (required) - Default charge amount</li>
          <li>description: string (optional) - Procedure description</li>
          <li>is_active: boolean (optional) - Active status (default: true)</li>
        </ul>
      </div>

      <hr />

      {/* EXAMPLE USAGE */}
      <div style={{ marginTop: '20px' }}>
        <h2>EXAMPLE USAGE</h2>
        <p>Example 1: Create a laboratory procedure</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { createProcedure } = useProcedureMaster();

await createProcedure({
  name: 'Complete Blood Count',
  code: 'CBC001',
  category: 'laboratory',
  description: 'Full blood count with differential',
  default_charge: '500.00',
  is_active: true
});`}
        </pre>
        <p>Example 2: Fetch active laboratory procedures</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { useActiveProcedureMasters } = useProcedureMaster();
const { data, isLoading } = useActiveProcedureMasters('laboratory');

// data will contain only active laboratory procedures
console.log(data?.results); // Array of active lab procedures`}
        </pre>
        <p>Example 3: Search for procedures</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { useProcedureMasters } = useProcedureMaster();
const { data, isLoading } = useProcedureMasters({
  search: 'blood',
  is_active: true,
  ordering: 'name'
});

// Will return all active procedures with 'blood' in name/code/description`}
        </pre>
        <p>Example 4: Update procedure charge</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { updateProcedure } = useProcedureMaster();

await updateProcedure(123, {
  default_charge: '550.00'
});`}
        </pre>
      </div>

      <hr />

      {/* COMMON USE CASES */}
      <div style={{ marginTop: '20px' }}>
        <h2>COMMON USE CASES</h2>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>Procedure Selection:</strong> Use useActiveProcedureMasters() in dropdowns for billing</li>
          <li><strong>Category Filtering:</strong> Filter by category when showing department-specific procedures</li>
          <li><strong>Price Management:</strong> Update default_charge to manage procedure pricing</li>
          <li><strong>Master Data:</strong> Centralized procedure definitions used across billing and appointments</li>
          <li><strong>Search:</strong> Use search parameter to find procedures by name, code, or description</li>
        </ul>
      </div>

      <hr />

      {/* VALIDATION RULES */}
      <div style={{ marginTop: '20px' }}>
        <h2>VALIDATION RULES</h2>
        <p>Field validation (enforced by backend):</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>name: Required, max 200 characters</li>
          <li>code: Required, unique, max 50 characters</li>
          <li>category: Required, must be one of the valid categories</li>
          <li>default_charge: Required, decimal with max 10 digits, 2 decimal places</li>
          <li>description: Optional, text field</li>
          <li>is_active: Optional, boolean (default: true)</li>
        </ul>
      </div>

      <hr />

      {/* INTEGRATION NOTES */}
      <div style={{ marginTop: '20px' }}>
        <h2>INTEGRATION NOTES</h2>
        <p>Procedure Masters are used in:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>OPD Bills:</strong> Procedures can be added as bill items</li>
          <li><strong>Appointments:</strong> Procedures scheduled for patients</li>
          <li><strong>Packages:</strong> Bundled procedures in packages</li>
          <li><strong>Procedure Bills:</strong> Dedicated billing for procedures</li>
        </ul>
        <p>The default_charge serves as the base price but can be overridden in bills.</p>
      </div>

      <hr />

      {/* ORDERING */}
      <div style={{ marginTop: '20px' }}>
        <h2>ORDERING OPTIONS</h2>
        <p>Sort results using the ordering parameter:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>name - Sort by procedure name A-Z</li>
          <li>-name - Sort by procedure name Z-A</li>
          <li>category - Sort by category</li>
          <li>default_charge - Sort by price ascending</li>
          <li>-default_charge - Sort by price descending</li>
          <li>created_at - Sort by creation date (oldest first)</li>
          <li>-created_at - Sort by creation date (newest first)</li>
          <li>category,name - Sort by category first, then name (default)</li>
        </ul>
      </div>
    </div>
  );
};

export default ProcedureMasters;
