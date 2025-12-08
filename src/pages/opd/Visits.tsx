// src/pages/opd/Visits.tsx
import React from 'react';
import { useVisit } from '@/hooks/useVisit';

export const OPDVisits: React.FC = () => {
  const { useVisits, useTodayVisits, useQueue, useVisitStatistics } = useVisit();

  // Fetch all visits, today's visits, queue, and statistics
  const { data: visits, error: visitsError, isLoading: visitsLoading } = useVisits();
  const { data: todayVisits, error: todayError, isLoading: todayLoading } = useTodayVisits();
  const { data: queue, error: queueError, isLoading: queueLoading } = useQueue();
  const { data: statistics, error: statisticsError, isLoading: statisticsLoading } = useVisitStatistics();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>OPD Visits API Test - Plain Output</h1>
      <hr />

      {/* VISIT STATISTICS */}
      <div style={{ marginTop: '20px' }}>
        <h2>VISIT STATISTICS API</h2>
        <p>Endpoint: GET /opd/visits/statistics/</p>
        {statisticsLoading && <p>Loading statistics...</p>}
        {statisticsError && !statistics && (
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

      {/* QUEUE STATUS */}
      <div style={{ marginTop: '20px' }}>
        <h2>QUEUE STATUS API</h2>
        <p>Endpoint: GET /opd/visits/queue/</p>
        {queueLoading && <p>Loading queue...</p>}
        {queueError && !queue && (
          <div>
            <p style={{ color: 'red' }}>Error: {queueError.message || 'Failed to fetch queue'}</p>
            <pre style={{ background: '#ffe6e6', padding: '10px', overflow: 'auto', color: 'red' }}>
              {JSON.stringify(queueError, null, 2)}
            </pre>
          </div>
        )}
        {queue && (
          <div>
            <p style={{ color: 'green' }}>
              Success! Waiting: {queue.waiting?.length || 0}, Called: {queue.called?.length || 0}, In Consultation: {queue.in_consultation?.length || 0}
            </p>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(queue, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <hr />

      {/* TODAY'S VISITS */}
      <div style={{ marginTop: '20px' }}>
        <h2>TODAY'S VISITS API</h2>
        <p>Endpoint: GET /opd/visits/today/</p>
        {todayLoading && <p>Loading today's visits...</p>}
        {todayError && !todayVisits && (
          <div>
            <p style={{ color: 'red' }}>Error: {todayError.message || "Failed to fetch today's visits"}</p>
            <pre style={{ background: '#ffe6e6', padding: '10px', overflow: 'auto', color: 'red' }}>
              {JSON.stringify(todayError, null, 2)}
            </pre>
          </div>
        )}
        {todayVisits && (
          <div>
            <p style={{ color: 'green' }}>
              Success! Found {todayVisits.length} visit(s) today
            </p>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(todayVisits, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <hr />

      {/* ALL VISITS */}
      <div style={{ marginTop: '20px' }}>
        <h2>ALL VISITS API</h2>
        <p>Endpoint: GET /opd/visits/</p>
        {visitsLoading && <p>Loading visits...</p>}
        {visitsError && !visits && (
          <div>
            <p style={{ color: 'red' }}>Error: {visitsError.message || 'Failed to fetch visits'}</p>
            <pre style={{ background: '#ffe6e6', padding: '10px', overflow: 'auto', color: 'red' }}>
              {JSON.stringify(visitsError, null, 2)}
            </pre>
          </div>
        )}
        {visits && (
          <div>
            <p style={{ color: 'green' }}>
              Success! Found {visits.count} visit(s), showing {visits.results?.length || 0} on this page
            </p>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(visits, null, 2)}
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
        <p>Main Endpoint: /opd/visits/</p>
      </div>

      <hr />

      {/* VISIT DETAILS */}
      <div style={{ marginTop: '20px' }}>
        <h2>VISIT STRUCTURE</h2>
        <p>Each visit object contains:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>id: number - Unique identifier</li>
          <li>visit_number: string - Visit reference number</li>
          <li>patient: number - Patient ID</li>
          <li>doctor: number | null - Doctor ID</li>
          <li>patient_details: object - Patient information</li>
          <li>doctor_details: object - Doctor information</li>
          <li>visit_date: string - Date of visit</li>
          <li>visit_type: 'new' | 'follow_up' | 'emergency'</li>
          <li>status: 'waiting' | 'called' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show'</li>
          <li>queue_position: number | null - Position in queue</li>
          <li>payment_status: 'unpaid' | 'partial' | 'paid'</li>
          <li>total_amount: string - Total bill amount</li>
          <li>paid_amount: string - Amount paid</li>
          <li>balance_amount: string - Pending amount</li>
          <li>waiting_time: number | null - Waiting time in minutes</li>
          <li>created_at: string - Creation timestamp</li>
          <li>updated_at: string - Last update timestamp</li>
        </ul>
      </div>

      <hr />

      {/* AVAILABLE OPERATIONS */}
      <div style={{ marginTop: '20px' }}>
        <h2>AVAILABLE OPERATIONS</h2>
        <p>The useVisit hook provides the following operations:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>useVisits(params?) - List all visits with optional filters</li>
          <li>useVisitById(id) - Get a single visit by ID</li>
          <li>useTodayVisits() - Get today's visits</li>
          <li>useQueue() - Get queue status (waiting, called, in_consultation)</li>
          <li>useVisitStatistics(period?) - Get visit statistics</li>
          <li>createVisit(data) - Create a new visit</li>
          <li>updateVisit(id, data) - Full update of a visit</li>
          <li>patchVisit(id, data) - Partial update of a visit</li>
          <li>deleteVisit(id) - Delete a visit</li>
          <li>callNextPatient() - Call next patient from queue</li>
          <li>completeVisit(id) - Mark visit as completed</li>
        </ul>
      </div>

      <hr />

      {/* QUERY PARAMETERS */}
      <div style={{ marginTop: '20px' }}>
        <h2>AVAILABLE QUERY PARAMETERS</h2>
        <p>Filter visits using these parameters:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>patient: number - Filter by patient ID</li>
          <li>doctor: number - Filter by doctor ID</li>
          <li>status: 'waiting' | 'called' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show'</li>
          <li>payment_status: 'unpaid' | 'partial' | 'paid'</li>
          <li>visit_type: 'new' | 'follow_up' | 'emergency'</li>
          <li>visit_date: string - Filter by visit date (YYYY-MM-DD)</li>
          <li>search: string - Search in visit number, patient name</li>
          <li>ordering: string - Order results (e.g., "visit_date", "-entry_time")</li>
          <li>page: number - Page number for pagination</li>
          <li>page_size: number - Number of results per page</li>
        </ul>
      </div>
    </div>
  );
};

export default OPDVisits;
