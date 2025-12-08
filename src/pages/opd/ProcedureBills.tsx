// src/pages/opd/ProcedureBills.tsx
import React from 'react';
import { useProcedureBill } from '@/hooks/useProcedureBill';

export const ProcedureBills: React.FC = () => {
  const { useProcedureBills } = useProcedureBill();

  // Fetch all procedure bills
  const { data: bills, error: billsError, isLoading: billsLoading } = useProcedureBills();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>Procedure Bills API Test - Plain Output</h1>
      <hr />

      {/* ALL PROCEDURE BILLS */}
      <div style={{ marginTop: '20px' }}>
        <h2>ALL PROCEDURE BILLS API</h2>
        <p>Endpoint: GET /opd/procedure-bills/</p>
        {billsLoading && <p>Loading procedure bills...</p>}
        {billsError && (
          <div>
            <p style={{ color: 'red' }}>Error: {billsError.message || 'Failed to fetch procedure bills'}</p>
            <pre style={{ background: '#ffe6e6', padding: '10px', overflow: 'auto', color: 'red' }}>
              {JSON.stringify(billsError, null, 2)}
            </pre>
          </div>
        )}
        {bills && (
          <div>
            <p style={{ color: 'green' }}>
              Success! Found {bills.count} procedure bill(s), showing {bills.results?.length || 0} on this page
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
        <p>Main Endpoint: /opd/procedure-bills/</p>
      </div>

      <hr />

      {/* PROCEDURE BILL DETAILS */}
      <div style={{ marginTop: '20px' }}>
        <h2>PROCEDURE BILL STRUCTURE</h2>
        <p>Each procedure bill object contains:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>id: number - Unique identifier</li>
          <li>bill_number: string - Unique bill number (format: PB-YYYYMMDD-####)</li>
          <li>bill_date: string - Date of bill</li>
          <li>visit: number - Related visit ID (optional)</li>
          <li>patient: number - Patient ID (optional)</li>
          <li>patient_name: string - Patient name (read-only)</li>
          <li>patient_phone: string - Patient phone (read-only)</li>
          <li>doctor: number - Doctor ID (required)</li>
          <li>doctor_name: string - Doctor name (read-only)</li>
          <li>bill_type: 'hospital' - Bill type</li>
          <li>category: string - Bill category (optional)</li>
          <li>items: ProcedureBillItem[] - Array of procedure items</li>
          <li>subtotal_amount: string - Subtotal before discount/tax</li>
          <li>discount_amount: string - Discount amount</li>
          <li>discount_percent: string - Discount percentage</li>
          <li>tax_amount: string - Tax amount</li>
          <li>total_amount: string - Total bill amount</li>
          <li>received_amount: string - Amount received</li>
          <li>balance_amount: string - Balance due</li>
          <li>payment_status: 'unpaid' | 'partial' | 'paid'</li>
          <li>payment_mode: 'cash' | 'card' | 'upi' | 'bank' | 'multiple'</li>
          <li>payment_details: string - Payment notes (optional)</li>
          <li>created_at: string - Creation timestamp</li>
          <li>updated_at: string - Last update timestamp</li>
        </ul>
      </div>

      <hr />

      {/* PROCEDURE BILL ITEM STRUCTURE */}
      <div style={{ marginTop: '20px' }}>
        <h2>PROCEDURE BILL ITEM STRUCTURE</h2>
        <p>Each procedure bill item contains:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>id: number - Item ID (optional)</li>
          <li>procedure: number - Procedure master ID (required)</li>
          <li>particular_name: string - Procedure name (optional, auto-filled)</li>
          <li>note: string - Item notes (optional)</li>
          <li>quantity: number - Quantity (required)</li>
          <li>unit_charge: string - Unit price (required)</li>
          <li>item_order: number - Display order (optional)</li>
        </ul>
      </div>

      <hr />

      {/* AVAILABLE OPERATIONS */}
      <div style={{ marginTop: '20px' }}>
        <h2>AVAILABLE OPERATIONS</h2>
        <p>The useProcedureBill hook provides the following operations:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>useProcedureBills(params?) - List all procedure bills with optional filters</li>
          <li>useProcedureBillById(id) - Get a single procedure bill by ID</li>
          <li>useProcedureBillItems() - Get all procedure bill items</li>
          <li>useProcedureBillItemById(id) - Get a single procedure bill item by ID</li>
          <li>createBill(data) - Create a new procedure bill</li>
          <li>updateBill(id, data) - Update a procedure bill</li>
          <li>deleteBill(id) - Delete a procedure bill</li>
          <li>recordPayment(id, data) - Record a payment for a bill</li>
          <li>printBill(id) - Generate PDF for a bill</li>
        </ul>
      </div>

      <hr />

      {/* QUERY PARAMETERS */}
      <div style={{ marginTop: '20px' }}>
        <h2>AVAILABLE QUERY PARAMETERS</h2>
        <p>Filter procedure bills using these parameters:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>payment_status: 'unpaid' | 'partial' | 'paid' - Filter by payment status</li>
          <li>search: string - Search in bill number, patient name</li>
          <li>bill_date: string - Filter by bill date (YYYY-MM-DD)</li>
          <li>visit: number - Filter by visit ID</li>
          <li>page: number - Page number for pagination</li>
          <li>page_size: number - Number of results per page</li>
        </ul>
      </div>

      <hr />

      {/* PROCEDURE BILL CREATION */}
      <div style={{ marginTop: '20px' }}>
        <h2>PROCEDURE BILL CREATION</h2>
        <p>To create a procedure bill, use createBill(data) with:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>doctor: number (required) - Doctor ID</li>
          <li>bill_type: 'hospital' (required) - Bill type</li>
          <li>items: array (required) - Array of procedure items with:
            <ul style={{ marginLeft: '20px' }}>
              <li>procedure: number - Procedure master ID</li>
              <li>quantity: number - Quantity</li>
              <li>unit_charge: string - Unit price</li>
              <li>particular_name: string (optional) - Procedure name</li>
              <li>note: string (optional) - Item notes</li>
              <li>item_order: number (optional) - Display order</li>
            </ul>
          </li>
          <li>visit: number (optional) - Visit ID</li>
          <li>category: string (optional) - Bill category</li>
          <li>discount_percent: string (optional) - Discount percentage</li>
          <li>payment_mode: PaymentMode (optional) - Payment method</li>
          <li>payment_details: string (optional) - Payment notes</li>
          <li>received_amount: string (optional) - Amount received</li>
        </ul>
      </div>

      <hr />

      {/* EXAMPLE USAGE */}
      <div style={{ marginTop: '20px' }}>
        <h2>EXAMPLE USAGE</h2>
        <p>Example 1: Create a procedure bill</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { createBill } = useProcedureBill();

await createBill({
  doctor: 1,
  bill_type: 'hospital',
  items: [
    {
      procedure: 1, // CBC test ID
      quantity: 1,
      unit_charge: '500.00',
      particular_name: 'Complete Blood Count'
    },
    {
      procedure: 2, // ECG test ID
      quantity: 1,
      unit_charge: '300.00',
      particular_name: 'Electrocardiogram'
    }
  ],
  discount_percent: '10',
  payment_mode: 'cash',
  received_amount: '720.00'
});`}
        </pre>
        <p>Example 2: Fetch unpaid bills</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { useProcedureBills } = useProcedureBill();
const { data, isLoading } = useProcedureBills({
  payment_status: 'unpaid'
});

// data will contain only unpaid bills
console.log(data?.results);`}
        </pre>
        <p>Example 3: Record a payment</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { recordPayment } = useProcedureBill();

await recordPayment(123, {
  amount: '500.00',
  payment_mode: 'card',
  payment_details: {
    card_number: '****1234',
    transaction_id: 'TXN12345'
  }
});`}
        </pre>
        <p>Example 4: Print/generate PDF</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
{`const { printBill } = useProcedureBill();

const result = await printBill(123);
console.log(result.pdf_url); // URL to download PDF`}
        </pre>
      </div>

      <hr />

      {/* COMMON USE CASES */}
      <div style={{ marginTop: '20px' }}>
        <h2>COMMON USE CASES</h2>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>Procedure Billing:</strong> Create bills for specific medical procedures</li>
          <li><strong>Payment Tracking:</strong> Track unpaid, partial, and paid bills</li>
          <li><strong>Multi-Item Bills:</strong> Add multiple procedures to a single bill</li>
          <li><strong>Payment Recording:</strong> Record partial or full payments</li>
          <li><strong>PDF Generation:</strong> Generate printable invoices</li>
          <li><strong>Visit Linking:</strong> Link bills to specific patient visits</li>
        </ul>
      </div>

      <hr />

      {/* PAYMENT STATUS */}
      <div style={{ marginTop: '20px' }}>
        <h2>PAYMENT STATUS</h2>
        <p>Bills can have three payment statuses:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>unpaid:</strong> No payment received (balance_amount = total_amount)</li>
          <li><strong>partial:</strong> Partial payment received (0 &lt; received_amount &lt; total_amount)</li>
          <li><strong>paid:</strong> Full payment received (received_amount = total_amount)</li>
        </ul>
        <p>The payment_status is auto-calculated based on received_amount vs total_amount.</p>
      </div>

      <hr />

      {/* PAYMENT MODES */}
      <div style={{ marginTop: '20px' }}>
        <h2>PAYMENT MODES</h2>
        <p>Supported payment methods:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>cash:</strong> Cash payment</li>
          <li><strong>card:</strong> Credit/Debit card payment</li>
          <li><strong>upi:</strong> UPI payment (PhonePe, GooglePay, etc.)</li>
          <li><strong>bank:</strong> Bank transfer/NEFT/RTGS</li>
          <li><strong>multiple:</strong> Multiple payment methods used</li>
        </ul>
      </div>

      <hr />

      {/* BILL NUMBER FORMAT */}
      <div style={{ marginTop: '20px' }}>
        <h2>BILL NUMBER FORMAT</h2>
        <p>Bill numbers follow this format: <strong>PB-YYYYMMDD-####</strong></p>
        <ul style={{ marginLeft: '20px' }}>
          <li>PB - Procedure Bill prefix</li>
          <li>YYYYMMDD - Bill date</li>
          <li>#### - Sequential number for that day (4 digits)</li>
        </ul>
        <p>Examples: PB-20250115-0001, PB-20250115-0002</p>
        <p>Bill numbers are auto-generated by the backend.</p>
      </div>

      <hr />

      {/* INTEGRATION NOTES */}
      <div style={{ marginTop: '20px' }}>
        <h2>INTEGRATION NOTES</h2>
        <p>Procedure Bills integrate with:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>Procedure Masters:</strong> Items reference procedure_id from Procedure Masters</li>
          <li><strong>Visits:</strong> Bills can be linked to patient visits</li>
          <li><strong>Doctors:</strong> Bills must have an assigned doctor</li>
          <li><strong>Patients:</strong> Bills can reference patients directly or via visits</li>
          <li><strong>Packages:</strong> Can bill for entire procedure packages</li>
        </ul>
      </div>

      <hr />

      {/* CALCULATION LOGIC */}
      <div style={{ marginTop: '20px' }}>
        <h2>CALCULATION LOGIC</h2>
        <p>Bill amounts are calculated as follows:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li><strong>subtotal_amount:</strong> Sum of (quantity × unit_charge) for all items</li>
          <li><strong>discount_amount:</strong> (subtotal_amount × discount_percent) / 100</li>
          <li><strong>tax_amount:</strong> Tax on (subtotal_amount - discount_amount)</li>
          <li><strong>total_amount:</strong> subtotal_amount - discount_amount + tax_amount</li>
          <li><strong>balance_amount:</strong> total_amount - received_amount</li>
        </ul>
        <p>All calculations are handled by the backend.</p>
      </div>

      <hr />

      {/* VALIDATION RULES */}
      <div style={{ marginTop: '20px' }}>
        <h2>VALIDATION RULES</h2>
        <p>Field validation (enforced by backend):</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>doctor: Required, must be a valid doctor ID</li>
          <li>bill_type: Required, must be 'hospital'</li>
          <li>items: Required, must have at least one item</li>
          <li>procedure: Each item must reference a valid procedure master</li>
          <li>quantity: Must be greater than 0</li>
          <li>unit_charge: Must be a valid decimal amount</li>
          <li>received_amount: Cannot exceed total_amount</li>
        </ul>
      </div>
    </div>
  );
};

export default ProcedureBills;
