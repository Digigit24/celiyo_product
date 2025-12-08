// src/pages/opd/ClinicalNotes.tsx
import React from 'react';
import { useClinicalNote } from '@/hooks/useClinicalNote';

export const ClinicalNotes: React.FC = () => {
  const { useClinicalNotes } = useClinicalNote();

  // Fetch all clinical notes
  const { data: notes, error: notesError, isLoading: notesLoading } = useClinicalNotes();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>Clinical Notes API Test - Plain Output</h1>
      <hr />

      {/* ALL CLINICAL NOTES */}
      <div style={{ marginTop: '20px' }}>
        <h2>ALL CLINICAL NOTES API</h2>
        <p>Endpoint: GET /opd/clinical-notes/</p>
        {notesLoading && <p>Loading clinical notes...</p>}
        {notesError && (
          <div>
            <p style={{ color: 'red' }}>Error: {notesError.message || 'Failed to fetch clinical notes'}</p>
            <pre style={{ background: '#ffe6e6', padding: '10px', overflow: 'auto', color: 'red' }}>
              {JSON.stringify(notesError, null, 2)}
            </pre>
          </div>
        )}
        {notes && (
          <div>
            <p style={{ color: 'green' }}>
              Success! Found {notes.count} clinical note(s), showing {notes.results?.length || 0} on this page
            </p>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(notes, null, 2)}
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
        <p>Main Endpoint: /opd/clinical-notes/</p>
      </div>

      <hr />

      {/* CLINICAL NOTE DETAILS */}
      <div style={{ marginTop: '20px' }}>
        <h2>CLINICAL NOTE STRUCTURE</h2>
        <p>Each clinical note object contains:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>id: number - Unique identifier</li>
          <li>visit: number - Related visit ID (OneToOne relationship)</li>
          <li>ehr_number: string - Electronic Health Record ID</li>
          <li>note_date: string - Date/time of note creation</li>
          <li>visit_number: string - Visit reference number</li>
          <li>patient_name: string - Patient name</li>
          <li>referred_doctor_name: string - Referred doctor name</li>
          <li>created_by_name: string - Created by user name</li>
          <li>present_complaints: string - Patient's presenting complaints</li>
          <li>observation: string - Doctor's observations</li>
          <li>diagnosis: string - Clinical diagnosis</li>
          <li>investigation: string - Investigations ordered</li>
          <li>treatment_plan: string - Recommended treatment</li>
          <li>medicines_prescribed: any - List of prescribed medicines (JSON)</li>
          <li>doctor_advice: string - Doctor's advice to patient</li>
          <li>suggested_surgery_name: string - Suggested surgery name</li>
          <li>suggested_surgery_reason: string - Reason for surgery</li>
          <li>referred_doctor: number | null - Referred doctor ID</li>
          <li>next_followup_date: string | null - Next follow-up date (YYYY-MM-DD)</li>
          <li>created_by: number | null - Created by user ID</li>
          <li>created_at: string - Creation timestamp</li>
          <li>updated_at: string - Last update timestamp</li>
        </ul>
      </div>

      <hr />

      {/* AVAILABLE OPERATIONS */}
      <div style={{ marginTop: '20px' }}>
        <h2>AVAILABLE OPERATIONS</h2>
        <p>The useClinicalNote hook provides the following operations:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>useClinicalNotes(params?) - List all clinical notes with optional filters</li>
          <li>useClinicalNoteById(id) - Get a single clinical note by ID</li>
          <li>useClinicalNoteByVisit(visitId) - Get clinical note for a specific visit</li>
          <li>createNote(data) - Create a new clinical note</li>
          <li>updateNote(id, data) - Update a clinical note</li>
          <li>deleteNote(id) - Delete a clinical note</li>
        </ul>
      </div>

      <hr />

      {/* QUERY PARAMETERS */}
      <div style={{ marginTop: '20px' }}>
        <h2>AVAILABLE QUERY PARAMETERS</h2>
        <p>Filter clinical notes using these parameters:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>visit: number - Filter by visit ID</li>
          <li>note_date: string - Filter by note date (YYYY-MM-DD)</li>
          <li>search: string - Search in clinical note fields</li>
          <li>ordering: string - Order results (default: "-note_date")</li>
          <li>page: number - Page number for pagination</li>
          <li>page_size: number - Number of results per page</li>
        </ul>
      </div>

      <hr />

      {/* CLINICAL NOTE CREATION */}
      <div style={{ marginTop: '20px' }}>
        <h2>CLINICAL NOTE CREATION</h2>
        <p>To create a clinical note, use createNote(data) with:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>visit: number (required) - Visit ID</li>
          <li>ehr_number: string (optional) - Electronic Health Record ID</li>
          <li>present_complaints: string (optional) - Patient's complaints</li>
          <li>observation: string (optional) - Doctor's observations</li>
          <li>diagnosis: string (optional) - Clinical diagnosis</li>
          <li>investigation: string (optional) - Investigations ordered</li>
          <li>treatment_plan: string (optional) - Recommended treatment</li>
          <li>medicines_prescribed: any (optional) - Prescribed medicines (JSON)</li>
          <li>doctor_advice: string (optional) - Doctor's advice</li>
          <li>suggested_surgery_name: string (optional) - Surgery name</li>
          <li>suggested_surgery_reason: string (optional) - Surgery reason</li>
          <li>referred_doctor: number (optional) - Referred doctor ID</li>
          <li>next_followup_date: string (optional) - Follow-up date (YYYY-MM-DD)</li>
        </ul>
      </div>

      <hr />

      {/* RELATIONSHIP INFO */}
      <div style={{ marginTop: '20px' }}>
        <h2>RELATIONSHIP INFORMATION</h2>
        <p>Clinical Notes have a OneToOne relationship with Visits:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>Each visit can have only one clinical note</li>
          <li>Use useClinicalNoteByVisit(visitId) to get the note for a specific visit</li>
          <li>The visit field is required when creating a clinical note</li>
          <li>Clinical notes contain comprehensive medical documentation for a visit</li>
        </ul>
      </div>

      <hr />

      {/* MEDICINES PRESCRIBED FORMAT */}
      <div style={{ marginTop: '20px' }}>
        <h2>MEDICINES PRESCRIBED FORMAT</h2>
        <p>The medicines_prescribed field is a JSON field that can contain:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>Array of medicine objects with name, dosage, frequency, duration</li>
          <li>Any custom structure as needed by your application</li>
          <li>Example: [{`{name: "Medicine A", dosage: "500mg", frequency: "twice daily", duration: "7 days"}`}]</li>
        </ul>
      </div>
    </div>
  );
};

export default ClinicalNotes;
