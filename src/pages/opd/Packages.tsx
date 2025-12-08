// src/pages/opd/Packages.tsx
import React from 'react';
import { useProcedurePackage } from '@/hooks/useProcedurePackage';

export const ProcedurePackages: React.FC = () => {
  const { useProcedurePackages } = useProcedurePackage();

  // Fetch all procedure packages
  const { data: packages, error: packagesError, isLoading: packagesLoading } = useProcedurePackages();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>Procedure Packages API Test - Plain Output</h1>
      <hr />

      {/* ALL PROCEDURE PACKAGES */}
      <div style={{ marginTop: '20px' }}>
        <h2>ALL PROCEDURE PACKAGES API</h2>
        <p>Endpoint: GET /opd/procedure-packages/</p>
        {packagesLoading && <p>Loading procedure packages...</p>}
        {packagesError && (
          <div>
            <p style={{ color: 'red' }}>Error: {packagesError.message || 'Failed to fetch procedure packages'}</p>
            <pre style={{ background: '#ffe6e6', padding: '10px', overflow: 'auto', color: 'red' }}>
              {JSON.stringify(packagesError, null, 2)}
            </pre>
          </div>
        )}
        {packages && (
          <div>
            <p style={{ color: 'green' }}>
              Success! Found {packages.count} procedure package(s), showing {packages.results?.length || 0} on this page
            </p>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(packages, null, 2)}
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
        <p>Main Endpoint: /opd/procedure-packages/</p>
      </div>

      <hr />

      {/* PROCEDURE PACKAGE DETAILS */}
      <div style={{ marginTop: '20px' }}>
        <h2>PROCEDURE PACKAGE STRUCTURE</h2>
        <p>Each procedure package object contains:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>id: number - Unique identifier</li>
          <li>name: string - Package name (max 200 characters)</li>
          <li>code: string - Unique package code (max 50 characters)</li>
          <li>procedures: ProcedureMasterInfo[] - Array of procedure objects (ManyToMany)</li>
          <li>total_charge: string - Sum of individual procedure charges</li>
          <li>discounted_charge: string - Package discounted price</li>
          <li>discount_percent: string - Computed discount percentage (read-only)</li>
          <li>savings_amount: string - Computed savings amount (read-only)</li>
          <li>is_active: boolean - Active status</li>
          <li>created_at: string - Creation timestamp (ISO format)</li>
          <li>updated_at: string - Last update timestamp (ISO format)</li>
        </ul>
      </div>

      <hr />

      {/* PROCEDURE INFO STRUCTURE */}
      <div style={{ marginTop: '20px' }}>
        <h2>PROCEDURE INFO STRUCTURE</h2>
        <p>Each procedure within a package contains:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>id: number - Procedure master ID</li>
          <li>name: string - Procedure name</li>
          <li>code: string - Procedure code</li>
          <li>category: string - Procedure category</li>
          <li>default_charge: string - Individual procedure charge</li>
          <li>is_active: boolean - Procedure active status</li>
        </ul>
      </div>

      <hr />

      {/* AVAILABLE OPERATIONS */}
      <div style={{ marginTop: '20px' }}>
        <h2>AVAILABLE OPERATIONS</h2>
        <p>The useProcedurePackage hook provides the following operations:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>useProcedurePackages(params?) - List all procedure packages with optional filters</li>
          <li>useProcedurePackageById(id) - Get a single procedure package by ID</li>
          <li>useActiveProcedurePackages() - Get only active packages</li>
          <li>createPackage(data) - Create a new procedure package</li>
          <li>updatePackage(id, data) - Update a procedure package</li>
          <li>deletePackage(id) - Delete a procedure package</li>
        </ul>
      </div>

      <hr />

      {/* QUERY PARAMETERS */}
      <div style={{ marginTop: '20px' }}>
        <h2>AVAILABLE QUERY PARAMETERS</h2>
        <p>Filter procedure packages using these parameters:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>is_active: boolean - Filter by active status</li>
          <li>search: string - Search in name or code</li>
          <li>ordering: string - Order results (default: "name")</li>
          <li>page: number - Page number for pagination</li>
          <li>page_size: number - Number of results per page</li>
        </ul>
      </div>

      <hr />

      {/* PROCEDURE PACKAGE CREATION */}
      <div style={{ marginTop: '20px' }}>
        <h2>PROCEDURE PACKAGE CREATION</h2>
        <p>To create a procedure package, use createPackage(data) with:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>name: string (required) - Package name</li>
          <li>code: string (required) - Unique package code</li>
          <li>procedures: number[] (required) - Array of procedure master IDs</li>
          <li>total_charge: string (required) - Total charge before discount</li>
          <li>discounted_charge: string (required) - Package discounted price</li>
          <li>is_active: boolean (optional) - Active status (default: true)</li>
        </ul>
      </div>

      <hr />

      {/* EXAMPLE USAGE */}
      <div style={{ marginTop: '20px' }}>
        <h2>EXAMPLE USAGE</h2>
        <p>Example 1: Create a basic health checkup package</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { createPackage } = useProcedurePackage();

await createPackage({
  name: 'Basic Health Checkup',
  code: 'PKG001',
  procedures: [1, 2, 3, 4], // IDs of CBC, Blood Sugar, BP Check, ECG
  total_charge: '5000.00',  // Sum of individual charges
  discounted_charge: '3999.00', // Package price
  is_active: true
});

// Backend will auto-calculate:
// discount_percent: "20.02"
// savings_amount: "1001.00"`}
        </pre>
        <p>Example 2: Fetch active packages</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { useActiveProcedurePackages } = useProcedurePackage();
const { data, isLoading } = useActiveProcedurePackages();

// data will contain only active packages
console.log(data?.results); // Array of active packages`}
        </pre>
        <p>Example 3: Search for packages</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { useProcedurePackages } = useProcedurePackage();
const { data, isLoading } = useProcedurePackages({
  search: 'checkup',
  is_active: true,
  ordering: 'discounted_charge'
});

// Will return all active packages with 'checkup' in name/code`}
        </pre>
        <p>Example 4: Update package pricing</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { updatePackage } = useProcedurePackage();

await updatePackage(123, {
  total_charge: '5500.00',
  discounted_charge: '4299.00'
});

// New discount will be auto-calculated`}
        </pre>
      </div>

      <hr />

      {/* COMMON USE CASES */}
      <div style={{ marginTop: '20px' }}>
        <h2>COMMON USE CASES</h2>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>Package Selection:</strong> Use useActiveProcedurePackages() in dropdowns for billing</li>
          <li><strong>Bundled Services:</strong> Group related procedures with discounted pricing</li>
          <li><strong>Health Checkups:</strong> Create comprehensive checkup packages (Basic, Advanced, Executive)</li>
          <li><strong>Seasonal Offers:</strong> Create special packages for marketing campaigns</li>
          <li><strong>Price Comparison:</strong> Display total_charge vs discounted_charge to show savings</li>
          <li><strong>Revenue Management:</strong> Adjust package pricing without changing individual procedure prices</li>
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
          <li>procedures: Required, array of valid procedure master IDs (ManyToMany)</li>
          <li>total_charge: Required, decimal with max 10 digits, 2 decimal places</li>
          <li>discounted_charge: Required, decimal with max 10 digits, 2 decimal places</li>
          <li>discounted_charge should be less than or equal to total_charge</li>
          <li>is_active: Optional, boolean (default: true)</li>
        </ul>
      </div>

      <hr />

      {/* COMPUTED FIELDS */}
      <div style={{ marginTop: '20px' }}>
        <h2>COMPUTED FIELDS (Auto-Calculated)</h2>
        <p>The following fields are computed by the backend:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>discount_percent:</strong> ((total_charge - discounted_charge) / total_charge) × 100</li>
          <li><strong>savings_amount:</strong> total_charge - discounted_charge</li>
        </ul>
        <p>Example:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>total_charge: "5000.00"</li>
          <li>discounted_charge: "3999.00"</li>
          <li>discount_percent: "20.02" (auto-calculated)</li>
          <li>savings_amount: "1001.00" (auto-calculated)</li>
        </ul>
      </div>

      <hr />

      {/* INTEGRATION NOTES */}
      <div style={{ marginTop: '20px' }}>
        <h2>INTEGRATION NOTES</h2>
        <p>Procedure Packages are used in:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>OPD Bills:</strong> Packages can be added as line items in bills</li>
          <li><strong>Appointments:</strong> Packages can be scheduled for patients</li>
          <li><strong>Marketing:</strong> Display packages on website/app for patient self-booking</li>
          <li><strong>Revenue Reports:</strong> Track package sales vs individual procedure sales</li>
        </ul>
        <p>The procedures field uses ManyToMany relationship - each package can include multiple procedures.</p>
      </div>

      <hr />

      {/* ORDERING */}
      <div style={{ marginTop: '20px' }}>
        <h2>ORDERING OPTIONS</h2>
        <p>Sort results using the ordering parameter:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>name - Sort by package name A-Z (default)</li>
          <li>-name - Sort by package name Z-A</li>
          <li>total_charge - Sort by total charge ascending</li>
          <li>-total_charge - Sort by total charge descending</li>
          <li>discounted_charge - Sort by discounted price ascending</li>
          <li>-discounted_charge - Sort by discounted price descending</li>
          <li>created_at - Sort by creation date (oldest first)</li>
          <li>-created_at - Sort by creation date (newest first)</li>
        </ul>
      </div>

      <hr />

      {/* PACKAGE EXAMPLES */}
      <div style={{ marginTop: '20px' }}>
        <h2>TYPICAL PACKAGE EXAMPLES</h2>
        <p>Common health checkup packages:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>Basic Health Checkup:</strong> CBC, Blood Sugar, BP, BMI (₹3,999)</li>
          <li><strong>Diabetes Screening:</strong> Fasting Sugar, PP Sugar, HbA1c (₹2,499)</li>
          <li><strong>Cardiac Profile:</strong> ECG, Lipid Profile, Troponin (₹4,999)</li>
          <li><strong>Executive Checkup:</strong> Full body checkup with 20+ tests (₹9,999)</li>
          <li><strong>Women's Health:</strong> Pap Smear, Mammography, Bone Density (₹7,499)</li>
        </ul>
      </div>
    </div>
  );
};

export default ProcedurePackages;
