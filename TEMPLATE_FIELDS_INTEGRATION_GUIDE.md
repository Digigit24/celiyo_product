# Template Fields & Options Integration Guide

## Overview

This guide explains how the Template Fields & Options functionality is integrated into your application.

## Architecture

### Data Flow

```
User Interface (Components)
    ↓
React Hooks (useOPDTemplate)
    ↓
API Service (opdTemplateService)
    ↓
Backend API (/api/opd/*)
```

## Components Structure

### 1. Template Designer Flow

```
OPD Settings Page (/opd/settings/general)
└─ GeneralSettingsTab
   └─ TemplateListDrawer (Click "View Templates")
      └─ TemplateDesigner (Click "Design")
         └─ TemplateFieldEditor (Click "Add Field" or "Edit")
```

## API Integration

### Base URL
All API calls use the base path: `/api/opd`

### Available Endpoints

#### Template Fields
- **GET** `/api/opd/template-fields/` - List all fields
  - Query params: `template`, `is_active`, `page`, `page_size`, `ordering`
- **GET** `/api/opd/template-fields/{id}/` - Get single field
- **POST** `/api/opd/template-fields/` - Create field
- **PATCH** `/api/opd/template-fields/{id}/` - Update field
- **DELETE** `/api/opd/template-fields/{id}/` - Delete field

#### Field Options
- **GET** `/api/opd/template-field-options/` - List all options
  - Query params: `field`, `is_active`, `page`, `page_size`, `ordering`
- **GET** `/api/opd/template-field-options/{id}/` - Get single option
- **POST** `/api/opd/template-field-options/` - Create option
- **PATCH** `/api/opd/template-field-options/{id}/` - Update option
- **DELETE** `/api/opd/template-field-options/{id}/` - Delete option

## Field Types Supported

1. **text** - Single line text input
2. **textarea** - Multi-line text input
3. **number** - Numeric input
4. **email** - Email input with validation
5. **phone** - Phone number input
6. **url** - URL input with validation
7. **date** - Date picker
8. **datetime** - Date and time picker
9. **checkbox** - Checkbox
10. **select** - Dropdown (requires options)
11. **radio** - Radio buttons (requires options)
12. **multiselect** - Multi-select dropdown (requires options)

## How Field Options Work

### Creating a Field with Options

When creating a field of type `select`, `radio`, or `multiselect`:

1. **Create the field first:**
```typescript
const field = await createTemplateField({
  template: templateId,
  field_type: 'select',
  field_label: 'Blood Type',
  field_key: 'blood_type',
  is_required: true,
});
```

2. **Then create the options:**
```typescript
await createTemplateFieldOption({
  field: field.id,
  label: 'A+',
  value: 'a_positive',
  display_order: 0,
});

await createTemplateFieldOption({
  field: field.id,
  label: 'B+',
  value: 'b_positive',
  display_order: 1,
});
```

### Updating Field Options

The `TemplateFieldEditor` automatically handles options:

- **New options** (no ID) are created via POST
- **Existing options** are updated via PATCH
- **Deleted options** are removed via DELETE

All operations happen when you save the field.

## Usage Examples

### 1. Using the Hook

```typescript
import { useOPDTemplate } from '@/hooks/useOPDTemplate';

function MyComponent() {
  const {
    useTemplateFields,
    createTemplateField,
    updateTemplateField,
    deleteTemplateField,
    createTemplateFieldOption,
    updateTemplateFieldOption,
    deleteTemplateFieldOption,
  } = useOPDTemplate();

  // Fetch fields for a template
  const { data: fieldsData, mutate } = useTemplateFields({
    template: templateId,
    ordering: 'display_order',
  });

  // Create a new field
  const handleCreateField = async () => {
    const field = await createTemplateField({
      template: templateId,
      field_type: 'text',
      field_label: 'Patient Name',
      field_key: 'patient_name',
      is_required: true,
    });

    mutate(); // Refresh the list
  };
}
```

### 2. Reordering Fields

Fields can be reordered by updating their `display_order`:

```typescript
// Drag and drop handler
const handleDragEnd = async (event) => {
  const reorderedFields = arrayMove(fields, oldIndex, newIndex);

  // Update display_order for all fields
  const promises = reorderedFields.map((field, index) =>
    updateTemplateField(field.id, { display_order: index })
  );

  await Promise.all(promises);
  mutate(); // Refresh
};
```

### 3. Managing Field Options

```typescript
// Create field with options
const fieldId = await createField({
  field_type: 'select',
  field_label: 'Gender',
  field_key: 'gender',
});

// Add options
const options = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

for (const [index, option] of options.entries()) {
  await createTemplateFieldOption({
    field: fieldId,
    label: option.label,
    value: option.value,
    display_order: index,
  });
}
```

## Validation

### Field Validation

- **field_label**: Required
- **field_key**: Required, must match `^[a-z0-9_]+$`
- **template**: Required
- **Options**: Required for `select`, `radio`, `multiselect` types

### Option Validation

- **label**: Required
- **value**: Required
- **field**: Required (field ID)

## Data Types

### TemplateField

```typescript
interface TemplateField {
  id: number;
  tenant_id: string;
  template: number;
  field_type: FieldType;
  field_label: string;
  field_key: string;
  placeholder?: string;
  help_text?: string;
  is_required: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  default_value?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  options?: TemplateFieldOption[];
}
```

### TemplateFieldOption

```typescript
interface TemplateFieldOption {
  id: number;
  tenant_id: string;
  field: number;
  label: string;
  value: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

## Features

### 1. Template Designer (TemplateDesigner.tsx)

**Features:**
- Drag-and-drop field reordering
- Add/Edit/Delete fields
- Visual field type badges
- Required/Inactive field indicators
- Auto-save order changes

**Location:** `src/components/opd-settings/TemplateDesigner.tsx`

### 2. Field Editor (TemplateFieldEditor.tsx)

**Features:**
- Create/Edit fields
- All 12 field types
- Options management for select/radio/multiselect
- Validation rules (min/max length, min/max value)
- Auto-generate field_key from field_label

**Location:** `src/components/opd-settings/TemplateFieldEditor.tsx`

### 3. Field Options Management

**Features:**
- Add multiple options
- Auto-generate option values from labels
- Track display order
- Soft delete (marks as deleted, removes on save)
- Create/Update/Delete via API

## Best Practices

1. **Always use the hook** - Don't call the service directly
2. **Mutate after changes** - Call `mutate()` to refresh data
3. **Use display_order** - For proper field/option ordering
4. **Validate field_key** - Must be lowercase, alphanumeric with underscores
5. **Handle errors** - All API calls can throw errors
6. **Use TypeScript types** - Import types from `@/types/opdTemplate.types`

## Troubleshooting

### Options not showing
- Ensure field type is `select`, `radio`, or `multiselect`
- Check if options were created with correct `field` ID
- Verify `is_active` is true

### Field order not saving
- Check if `display_order` is being updated
- Ensure `mutate()` is called after update
- Verify API response is successful

### Validation errors
- Check field_key pattern: `^[a-z0-9_]+$`
- Ensure at least one option for select/radio/multiselect
- Verify template ID exists

## File Structure

```
src/
├── components/opd-settings/
│   ├── TemplateDesigner.tsx          # Main designer with drag-drop
│   ├── TemplateFieldEditor.tsx       # Field create/edit form
│   ├── TemplateListDrawer.tsx        # Template list
│   └── TemplateFormDrawer.tsx        # Template create/edit
├── hooks/
│   └── useOPDTemplate.ts             # Main hook with all methods
├── services/
│   └── opdTemplate.service.ts        # API service layer
└── types/
    └── opdTemplate.types.ts          # TypeScript definitions
```

## Next Steps

1. Test the integration with your backend
2. Add any custom validation rules
3. Customize field type badges/colors
4. Add more field types if needed
5. Implement field conditions/dependencies (if required)

## Support

For issues or questions:
1. Check the TypeScript types for correct payload structure
2. Review the service layer for API endpoint details
3. Test with API directly using tools like Postman
4. Check browser console for errors
