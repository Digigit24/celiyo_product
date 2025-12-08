// src/pages/opd/Bills.tsx
import React from 'react';
import { useOPDBill } from '@/hooks/useOPDBill';

export const OPDBills: React.FC = () => {
  const { useOPDBills, useOPDBillStatistics } = useOPDBill();

  // Fetch all bills and statistics
  const { data: bills, error: billsError, isLoading: billsLoading } = useOPDBills();
  const { data: statistics, error: statisticsError, isLoading: statisticsLoading } = useOPDBillStatistics();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>OPD Bills API Test - Plain Output</h1>
      <hr />

      {/* BILL STATISTICS */}
      <div style={{ marginTop: '20px' }}>
        <h2>BILL STATISTICS API</h2>
        <p>Endpoint: GET /opd/bills/statistics/</p>
        {statisticsLoading && <p>Loading statistics...</p>}
        {statisticsError && (
          <div>
            <p style={{ color: 'red' }}>Error: {statisticsError.message || 'Failed to fetch statistics'}</p>
            <pre style={{ background: '#ffe6e6', padding: '10px', overflow: 'auto', color: 'red' }}>
              {JSON.stringify(statisticsError, null, 2)}
            </pre>
          </div>
        )}
        {statistics && (
          <div>
            <p style={{ color: 'green' }}>Success!</p>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(statistics, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <hr />

      {/* ALL BILLS */}
      <div style={{ marginTop: '20px' }}>
        <h2>ALL BILLS API</h2>
        <p>Endpoint: GET /opd/bills/</p>
        {billsLoading && <p>Loading bills...</p>}
        {billsError && (
          <div>
            <p style={{ color: 'red' }}>Error: {billsError.message || 'Failed to fetch bills'}</p>
            <pre style={{ background: '#ffe6e6', padding: '10px', overflow: 'auto', color: 'red' }}>
              {JSON.stringify(billsError, null, 2)}
            </pre>
          </div>
        )}
        {bills && (
          <div>
            <p style={{ color: 'green' }}>
              Success! Found {bills.count} bill(s), showing {bills.results?.length || 0} on this page
            </p>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(bills, null, 2)}
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
        <p>Main Endpoint: /opd/bills/</p>
      </div>

      <hr />

      {/* BILL DETAILS */}
      <div style={{ marginTop: '20px' }}>
        <h2>BILL STRUCTURE</h2>
        <p>Each bill object contains:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>id: number - Unique identifier</li>
          <li>bill_number: string - Bill reference number</li>
          <li>bill_date: string - Date of bill</li>
          <li>patient: number - Patient ID</li>
          <li>patient_name: string - Patient name</li>
          <li>patient_phone: string - Patient phone</li>
          <li>visit: number | null - Related visit ID</li>
          <li>visit_number: string - Visit reference number</li>
          <li>doctor: number - Doctor ID</li>
          <li>doctor_name: string - Doctor name</li>
          <li>bill_type: 'hospital' | 'consultation' | 'procedure'</li>
          <li>category: string - Bill category</li>
          <li>items: array - Bill items (particulars, quantities, amounts)</li>
          <li>subtotal_amount: string - Subtotal before discount/tax</li>
          <li>discount_amount: string - Discount amount</li>
          <li>discount_percent: string - Discount percentage</li>
          <li>tax_amount: string - Tax amount</li>
          <li>total_amount: string - Total bill amount</li>
          <li>received_amount: string - Amount received</li>
          <li>balance_amount: string - Balance due</li>
          <li>payment_status: 'unpaid' | 'partial' | 'paid'</li>
          <li>payment_mode: 'cash' | 'card' | 'upi' | 'bank' | 'multiple'</li>
          <li>payment_details: string - Payment notes</li>
          <li>notes: string - Additional notes</li>
          <li>created_at: string - Creation timestamp</li>
          <li>updated_at: string - Last update timestamp</li>
        </ul>
      </div>

      <hr />

      {/* BILL ITEM STRUCTURE */}
      <div style={{ marginTop: '20px' }}>
        <h2>BILL ITEM STRUCTURE</h2>
        <p>Each bill item contains:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>id: number - Item ID</li>
          <li>particular: string - Item/service identifier</li>
          <li>particular_name: string - Item/service name</li>
          <li>quantity: number - Quantity</li>
          <li>unit_charge: string - Unit price</li>
          <li>discount_amount: string - Discount on this item</li>
          <li>total_amount: string - Total for this item</li>
          <li>item_order: number - Display order</li>
          <li>note: string - Item notes</li>
        </ul>
      </div>

      <hr />

      {/* AVAILABLE OPERATIONS */}
      <div style={{ marginTop: '20px' }}>
        <h2>AVAILABLE OPERATIONS</h2>
        <p>The useOPDBill hook provides the following operations:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>useOPDBills(params?) - List all bills with optional filters</li>
          <li>useOPDBillById(id) - Get a single bill by ID</li>
          <li>useOPDBillStatistics(params?) - Get bill statistics</li>
          <li>createBill(data) - Create a new bill</li>
          <li>updateBill(id, data) - Update a bill</li>
          <li>deleteBill(id) - Delete a bill</li>
          <li>recordBillPayment(id, data) - Record a payment for a bill</li>
          <li>printBill(id) - Generate PDF for a bill</li>
        </ul>
      </div>

      <hr />

      {/* QUERY PARAMETERS */}
      <div style={{ marginTop: '20px' }}>
        <h2>AVAILABLE QUERY PARAMETERS</h2>
        <p>Filter bills using these parameters:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>patient: number - Filter by patient ID</li>
          <li>doctor: number - Filter by doctor ID</li>
          <li>visit: number - Filter by visit ID</li>
          <li>payment_status: 'unpaid' | 'partial' | 'paid'</li>
          <li>bill_type: 'hospital' | 'consultation' | 'procedure'</li>
          <li>bill_date: string - Filter by bill date (YYYY-MM-DD)</li>
          <li>bill_date_from: string - Filter from date</li>
          <li>bill_date_to: string - Filter to date</li>
          <li>search: string - Search in bill number, patient name</li>
          <li>ordering: string - Order results (e.g., "bill_date", "-created_at")</li>
          <li>page: number - Page number for pagination</li>
          <li>page_size: number - Number of results per page</li>
        </ul>
      </div>

      <hr />

      {/* PAYMENT RECORDING */}
      <div style={{ marginTop: '20px' }}>
        <h2>PAYMENT RECORDING</h2>
        <p>To record a payment, use recordBillPayment(billId, data) with:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>amount: string - Amount being paid</li>
          <li>payment_mode: 'cash' | 'card' | 'upi' | 'bank' | 'multiple'</li>
          <li>payment_details: object | string - Payment details/notes</li>
          <li>notes: string - Additional notes</li>
        </ul>
      </div>

      <hr />

      {/* BILL CREATION */}
      <div style={{ marginTop: '20px' }}>
        <h2>BILL CREATION</h2>
        <p>To create a bill, use createBill(data) with:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>bill_date: string (required) - Date of bill</li>
          <li>patient: number (optional) - Patient ID</li>
          <li>visit: number (optional) - Visit ID</li>
          <li>doctor: number (required) - Doctor ID</li>
          <li>bill_type: 'hospital' | 'consultation' | 'procedure' (required)</li>
          <li>items: array (required) - Array of bill items</li>
          <li>payment_status: 'unpaid' | 'partial' | 'paid' (optional)</li>
          <li>payment_mode: 'cash' | 'card' | 'upi' | 'bank' | 'multiple' (optional)</li>
          <li>notes: string (optional) - Bill notes</li>
        </ul>
      </div>
    </div>
  );
};

export default OPDBills;
