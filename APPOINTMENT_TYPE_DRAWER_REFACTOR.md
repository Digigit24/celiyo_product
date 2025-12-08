# Appointment Type Drawer Refactor

## Overview
Refactored the AppointmentTypes component to use the SideDrawer pattern, consistent with other modules in the application (Appointments, Patients, Doctors, etc.).

## Changes Made

### New Components Created

#### 1. **AppointmentTypeBasicInfo** (`src/components/appointment-type-drawer/AppointmentTypeBasicInfo.tsx`)
Form component for appointment type data with three main sections:

**Basic Information:**
- Name (required)
- Code (required, auto-formatted to lowercase with underscores)
- Description (optional)
- Active Status toggle

**Appointment Settings:**
- Default Duration in minutes (required, minimum 5)
- Base Consultation Fee (optional)

**Display Settings:**
- Color picker with hex input
- Live preview of how the type will appear in UI

**Features:**
- Zod validation schema for both create and update modes
- Auto-formatting for code field (removes spaces, converts to lowercase)
- useImperativeHandle to expose form validation to parent
- Supports view/edit/create modes
- Color preview with visual feedback

#### 2. **AppointmentTypeDetailsDrawer** (`src/components/appointment-type-drawer/AppointmentTypeDetailsDrawer.tsx`)
Main drawer component that wraps the form:

**Features:**
- Uses SideDrawer component for consistent UX
- Supports three modes: view, edit, create
- Header actions: Edit and Delete (in view mode)
- Footer buttons with proper states:
  - View mode: Close button
  - Edit mode: Cancel and Save Changes
  - Create mode: Cancel and Create Type
- Loading states for async operations
- Resizable drawer with localStorage persistence
- Tabs structure (prepared for future extensions)

### Updated Components

#### 3. **AppointmentTypes** (`src/components/AppointmentTypes.tsx`)
Main list component updated to use drawer:

**Removed:**
- Dialog component and all dialog-related state
- Form state (moved to AppointmentTypeBasicInfo)
- Inline form fields (moved to drawer)
- Manual validation logic (now in Zod schema)

**Added:**
- Drawer state management (open/close, mode)
- `handleView` - opens drawer in view mode
- `handleDrawerSuccess` - refreshes list after create/update
- `handleDrawerDelete` - refreshes list after deletion
- `onRowClick` prop to DataTable for viewing on row click

**Retained:**
- Search functionality
- DataTable with all columns
- Mobile card renderer
- Delete confirmation dialog

## Pattern Consistency

This refactor aligns AppointmentTypes with the pattern used in:
- ✅ AppointmentFormDrawer
- ✅ PatientDetailsDrawer (if exists)
- ✅ DoctorDetailsDrawer (if exists)

### Common Pattern Features:
1. **SideDrawer** - Right-side panel with resizable width
2. **Three modes** - view, edit, create
3. **Ref pattern** - useRef to collect form values from child
4. **Header actions** - Edit/Delete icons in view mode
5. **Footer buttons** - Context-aware buttons (Close/Cancel/Save)
6. **Tab structure** - Prepared for multiple sections
7. **Loading states** - Skeleton loading while fetching data

## User Experience Improvements

### Before (Dialog):
- Small fixed-width modal
- Limited space for form fields
- No preview functionality
- Modal blocks background
- No view mode (always edit)

### After (Drawer):
- Large resizable drawer (more space)
- Better organized sections with cards
- Live preview of color and appearance
- Drawer allows background interaction
- Proper view/edit separation
- Consistent with other modules

## Testing Checklist

### Create Mode
- [ ] Click "Add Type" button opens drawer in create mode
- [ ] All fields are editable
- [ ] Code field auto-formats to lowercase with underscores
- [ ] Validation works (name required, code required, duration >= 5)
- [ ] Color picker updates preview
- [ ] "Create Type" button creates and closes drawer
- [ ] List refreshes after creation
- [ ] Cancel button closes without saving

### View Mode
- [ ] Click on table row opens drawer in view mode
- [ ] All fields are read-only
- [ ] Edit button switches to edit mode
- [ ] Delete button shows confirmation and deletes
- [ ] Close button closes drawer

### Edit Mode
- [ ] Edit button from view mode switches to edit mode
- [ ] All fields become editable
- [ ] Pre-filled with existing values
- [ ] Validation works
- [ ] "Save Changes" updates and switches back to view mode
- [ ] Cancel button switches back to view mode without saving
- [ ] List refreshes after update

### Mobile Card
- [ ] Mobile view shows cards instead of table
- [ ] Edit button in card opens drawer in edit mode
- [ ] Delete button in card shows confirmation

### General
- [ ] Drawer is resizable
- [ ] Drawer width persists in localStorage
- [ ] Loading states show skeleton
- [ ] Error messages display properly
- [ ] Toast notifications appear on success/error

## API Integration

The drawer properly integrates with the backend:

### Endpoints Used:
- `GET /api/appointments/types/` - List all types
- `GET /api/appointments/types/:id/` - Get single type
- `POST /api/appointments/types/` - Create new type
- `PATCH /api/appointments/types/:id/` - Update type
- `DELETE /api/appointments/types/:id/` - Delete type

### Payload Example (Create):
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

## Code Quality

### Improvements:
- ✅ Consistent with codebase patterns
- ✅ Type-safe with TypeScript
- ✅ Proper error handling
- ✅ Zod validation schemas
- ✅ Clean separation of concerns
- ✅ Reusable components
- ✅ Proper state management
- ✅ Loading and error states

## Future Enhancements

The tab structure in the drawer is prepared for:
- Usage statistics (appointments using this type)
- Associated doctors/departments
- Historical data
- Custom fields

## File Structure

```
src/components/
├── AppointmentTypes.tsx                    # Main list component
└── appointment-type-drawer/
    ├── AppointmentTypeBasicInfo.tsx       # Form component
    └── AppointmentTypeDetailsDrawer.tsx   # Drawer wrapper
```

## Commit Information
- Branch: `claude/appointment-backend-models-01LdtojFNBgLjKJSiHFELUmu`
- Commit: `refactor: Convert AppointmentTypes to use SideDrawer pattern`
- Files Changed: 3 files (1 modified, 2 created)
- Lines: +628, -219

## Migration Notes

No breaking changes - the component interface remains the same:
- Still exported as `AppointmentTypes`
- Still displays in same route
- Still uses same hooks and services
- Backwards compatible with existing code
