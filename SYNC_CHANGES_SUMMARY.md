# Frontend-Backend Synchronization Summary

## Overview
Successfully synchronized the frontend appointment and appointment type logic with the backend Django models.

## Changes Made

### 1. API Endpoints Fixed (src/lib/apiConfig.ts)
- **Before:** `/appointment-types/`
- **After:** `/appointments/types/`
- Updated all CRUD endpoints to match the Django backend routing

### 2. AppointmentType Model Updates

#### Frontend Types (src/types/appointmentType.types.ts)
Added missing backend fields:
- `tenant_id: string` - Tenant identifier from request headers
- `duration_default: number` - Default appointment duration in minutes
- `base_consultation_fee: string` - Base consultation fee for the appointment type

#### Backend Model (BACKEND_MODEL_UPDATE.py)
Created updated Django model with:
- `code` field - Unique identifier for appointment types
- `is_active` field - Boolean to enable/disable appointment types
- `color` field - Hex color for UI display
- `duration_default` field - Default duration in minutes
- `base_consultation_fee` field - Base fee for this type
- Proper indexing and unique constraints

**Action Required:** Apply the updated model in your Django backend:
```bash
# Copy the model from BACKEND_MODEL_UPDATE.py to apps/appointments/models.py
python manage.py makemigrations appointments
python manage.py migrate appointments
```

### 3. Appointment Model Updates

#### Frontend Types (src/types/appointment.types.ts)
**Removed Fields:**
- `appointment_type` (string enum) - Replaced with `appointment_type` object
- `consultation_mode` - Not in backend
- `payment_status` - Removed from appointments
- `reason_for_visit` - Replaced with `chief_complaint`
- `diagnosis` - Not in appointment model
- `prescription` - Not in appointment model

**Added Fields:**
- `appointment_type?: AppointmentType` - Full appointment type object
- `appointment_id: string` - Backend uses this instead of appointment_number
- `priority: 'low' | 'normal' | 'high' | 'urgent'` - Appointment priority
- `chief_complaint?: string` - Replaced reason_for_visit
- `end_time?: string` - Appointment end time
- `check_in_time?: string` - Patient check-in timestamp
- `visit?: number` - Related OPD visit ID
- `original_appointment?: number` - For follow-up appointments
- `consultation_fee: string` - Consultation fee amount
- Status now includes: `'checked_in'` and `'rescheduled'`

#### Appointment Create/Update Data
- Changed `appointment_type` (string) to `appointment_type_id` (number)
- Changed `fee_amount` to `consultation_fee`
- Added `priority` field
- Added `chief_complaint` field
- Removed `consultation_mode`
- Removed `payment_status`

### 4. AppointmentBasicInfo Component (src/components/appointment-drawer/AppointmentBasicInfo.tsx)

**Updated Form Schema:**
- Uses `appointment_type_id` instead of hardcoded string enums
- Added `priority` field with enum values
- Changed to `chief_complaint` from `reason_for_visit`
- Uses `consultation_fee` instead of `fee_amount`
- Removed `consultation_mode`
- Removed `diagnosis` and `prescription` fields
- Added support for `checked_in` and `rescheduled` status

**Auto-Fee Logic:**
- Now checks appointment type's `base_consultation_fee` first
- Falls back to doctor's `consultation_fee` if no appointment type selected
- Properly handles the appointment type selection

**UI Updates:**
- Appointment Type dropdown now shows all active appointment types with color indicators
- Added Priority selector with visual badges
- Removed Consultation Mode field
- Removed Payment Status section
- Updated status badges to include new statuses

### 5. AppointmentTypes Component (src/components/AppointmentTypes.tsx)

**Added Form Fields:**
- `duration_default` - Number input for default duration in minutes
- `base_consultation_fee` - Number input for base consultation fee

**Updated Validation:**
- Validates duration is at least 5 minutes
- Includes all new fields in create/update payloads

## Testing Checklist

### Appointment Types
- [ ] Create a new appointment type with all fields
- [ ] Verify `code`, `duration_default`, and `base_consultation_fee` are saved
- [ ] Verify color is displayed correctly in the list
- [ ] Edit an existing appointment type
- [ ] Toggle active/inactive status
- [ ] Delete an appointment type

### Appointments
- [ ] Create a new appointment and select an appointment type
- [ ] Verify consultation fee auto-populates from appointment type
- [ ] Verify duration defaults from appointment type
- [ ] Test priority selection (Low, Normal, High, Urgent)
- [ ] Add chief complaint and symptoms
- [ ] Verify appointment is created with `appointment_type_id`
- [ ] Edit an appointment and change appointment type
- [ ] Test all status changes including new statuses (Checked In, Rescheduled)
- [ ] Verify appointment displays correctly with appointment type color/name

### API Integration
- [ ] Verify `/api/appointments/types/` endpoint returns data
- [ ] Verify `GET /api/appointments/types/{id}/` works
- [ ] Verify `POST /api/appointments/types/` creates with all fields
- [ ] Verify `PATCH /api/appointments/types/{id}/` updates correctly
- [ ] Verify `POST /api/appointments/` creates with `appointment_type_id`
- [ ] Verify appointment list includes appointment_type object

## Backend Migration Required

**IMPORTANT:** You must update your Django backend with the new AppointmentType model:

1. Open `apps/appointments/models.py` in your Django backend
2. Replace the `AppointmentType` model with the code from `BACKEND_MODEL_UPDATE.py`
3. Run migrations:
   ```bash
   python manage.py makemigrations appointments
   python manage.py migrate appointments
   ```
4. Create some default appointment types:
   ```python
   # Example appointment types to create
   AppointmentType.objects.create(
       tenant_id='<your-tenant-id>',
       name='Consultation',
       code='consultation',
       description='General medical consultation',
       duration_default=30,
       base_consultation_fee=100.00,
       is_active=True,
       color='#3b82f6'
   )

   AppointmentType.objects.create(
       tenant_id='<your-tenant-id>',
       name='Follow-up',
       code='follow_up',
       description='Follow-up visit',
       duration_default=15,
       base_consultation_fee=50.00,
       is_active=True,
       color='#10b981'
   )
   ```

## API Payload Examples

### Create Appointment Type
```json
{
  "name": "Consultation",
  "code": "consultation",
  "description": "General medical consultation",
  "duration_default": 30,
  "base_consultation_fee": "100.00",
  "is_active": true,
  "color": "#3b82f6"
}
```

### Create Appointment
```json
{
  "doctor_id": 1,
  "patient_id": 2,
  "appointment_date": "2025-12-01",
  "appointment_time": "10:00",
  "duration_minutes": 30,
  "appointment_type_id": 1,
  "priority": "normal",
  "chief_complaint": "Headache for 3 days",
  "symptoms": "Severe headache, sensitivity to light",
  "notes": "Patient requests morning appointment",
  "consultation_fee": 100.00
}
```

### Update Appointment
```json
{
  "status": "checked_in",
  "chief_complaint": "Updated complaint",
  "symptoms": "Updated symptoms"
}
```

## Commit Information
- Branch: `claude/appointment-backend-models-01LdtojFNBgLjKJSiHFELUmu`
- Commit: `feat: Sync frontend appointment types with backend models`
- Files Changed: 6 files (5 modified, 1 created)

## Next Steps
1. Apply the backend model changes from `BACKEND_MODEL_UPDATE.py`
2. Run Django migrations
3. Create default appointment types in your database
4. Test the frontend with the updated backend
5. Verify all API endpoints work correctly
6. Test appointment creation with appointment types
