# Clinical Templates Consultation Workflow - Implementation Guide

## Overview

This guide explains how to implement the doctor's consultation workflow where doctors can fill in clinical templates during patient visits.

## Architecture

### Data Flow

```
Visit Detail Page
  ├─ Load Visit (GET /api/opd/visits/{id}/)
  ├─ Load Template Groups (GET /api/opd/template-groups/)
  ├─ Load Templates per Group (GET /api/opd/templates/?group={id})
  └─ Load Existing Responses (GET /api/opd/template-responses/?visit_id={id})

User Clicks Template
  ├─ Load Template Structure (GET /api/opd/templates/{id}/)
  ├─ Check for Existing Response
  │   ├─ If exists: Load Field Responses (GET /api/opd/template-field-responses/?response_id={id})
  │   └─ If not: Create Response (POST /api/opd/template-responses/)
  └─ Render Dynamic Form

User Fills Fields
  ├─ Auto-save on blur/change
  ├─ Create Field Response (POST /api/opd/template-field-responses/)
  └─ Update Field Response (PATCH /api/opd/template-field-responses/{id}/)

User Completes Template
  └─ Mark as Completed (PATCH /api/opd/template-responses/{id}/ {status: 'completed'})
```

## API Endpoints

### Visits

```
GET /api/opd/visits/{visit_id}/
```

**Response:**
```json
{
  "id": 101,
  "visit_number": "OPD-2025-0001",
  "patient_details": {
    "patient_id": "PT123456",
    "full_name": "John Doe",
    "age": 45,
    "gender": "Male"
  },
  "doctor_details": {
    "id": 1,
    "full_name": "Dr. Smith",
    "specialties": ["Cardiology"]
  },
  "visit_date": "2025-01-26",
  "status": "in_consultation"
}
```

### Template Groups

```
GET /api/opd/template-groups/
```

**Response:**
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "name": "General Examination",
      "description": "Common examination templates",
      "is_active": true
    }
  ]
}
```

### Templates

```
GET /api/opd/templates/?group={group_id}&is_active=true
```

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 10,
      "name": "Chest Pain Evaluation",
      "code": "CHEST_PAIN",
      "group": 1,
      "is_active": true,
      "fields": [
        {
          "id": 101,
          "field_type": "textarea",
          "field_label": "Chief Complaint",
          "field_key": "chief_complaint",
          "is_required": true,
          "display_order": 0
        }
      ]
    }
  ]
}
```

### Template Responses

**List for Visit:**
```
GET /api/opd/template-responses/?visit_id=101
```

**Response:**
```json
{
  "count": 2,
  "results": [
    {
      "id": 55,
      "visit": 101,
      "template": 10,
      "template_name": "Chest Pain Evaluation",
      "status": "draft",
      "filled_by": "uuid-123",
      "filled_by_name": "Dr. Smith",
      "created_at": "2025-01-26T10:30:00Z",
      "updated_at": "2025-01-26T10:35:00Z"
    }
  ]
}
```

**Create Response:**
```
POST /api/opd/template-responses/
```

**Request:**
```json
{
  "visit": 101,
  "template": 10,
  "status": "draft"
}
```

**Update Response:**
```
PATCH /api/opd/template-responses/55/
```

**Request:**
```json
{
  "status": "completed",
  "completed_at": "2025-01-26T11:00:00Z"
}
```

### Field Responses

**List for Response:**
```
GET /api/opd/template-field-responses/?response_id=55
```

**Response:**
```json
{
  "count": 3,
  "results": [
    {
      "id": 201,
      "response": 55,
      "field": 101,
      "field_label": "Chief Complaint",
      "field_type": "textarea",
      "value_text": "Chest pain on exertion for 3 days",
      "value_number": null,
      "value_date": null,
      "value_datetime": null,
      "value_boolean": null,
      "selected_options": []
    }
  ]
}
```

**Create Field Response:**
```
POST /api/opd/template-field-responses/
```

**Request (Text field):**
```json
{
  "response": 55,
  "field": 101,
  "value_text": "Chest pain on exertion for 3 days"
}
```

**Request (Number field):**
```json
{
  "response": 55,
  "field": 102,
  "value_number": 120
}
```

**Request (Select field):**
```json
{
  "response": 55,
  "field": 103,
  "selected_options": [15, 18]
}
```

**Update Field Response:**
```
PATCH /api/opd/template-field-responses/201/
```

**Request:**
```json
{
  "value_text": "Chest pain on exertion for 3 days, radiating to left arm"
}
```

## Field Value Mapping

Different field types use different value fields:

| Field Type | Value Field | Example |
|------------|-------------|---------|
| text | value_text | "John Doe" |
| textarea | value_text | "Long description..." |
| email | value_text | "john@example.com" |
| phone | value_text | "+1234567890" |
| url | value_text | "https://example.com" |
| number | value_number | 120 |
| date | value_date | "2025-01-26" |
| datetime | value_datetime | "2025-01-26T10:30:00Z" |
| checkbox | value_boolean | true |
| select | selected_options | [15] |
| radio | selected_options | [16] |
| multiselect | selected_options | [15, 16, 17] |

## Implementation Steps

### Step 1: Create Visit Detail Page with Tabs

**File:** `src/pages/opd/VisitDetail.tsx`

```typescript
export function VisitDetail() {
  const { visitId } = useParams();

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="templates">Clinical Templates</TabsTrigger>
        <TabsTrigger value="notes">Clinical Note</TabsTrigger>
        <TabsTrigger value="vitals">Vitals & Findings</TabsTrigger>
        <TabsTrigger value="attachments">Attachments</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <VisitOverview visitId={visitId} />
      </TabsContent>

      <TabsContent value="templates">
        <ClinicalTemplatesTab visitId={visitId} />
      </TabsContent>

      {/* Other tabs... */}
    </Tabs>
  );
}
```

### Step 2: Create Clinical Templates Tab

**File:** `src/components/visit/ClinicalTemplatesTab.tsx`

This component:
- Loads template groups
- Shows templates grouped by category
- Shows response status badges (Not filled, Draft, Completed)
- Opens template form when clicked

### Step 3: Create Template Form Component

**File:** `src/components/visit/TemplateForm.tsx`

This component:
- Loads template structure with fields
- Checks for existing response
- Creates response if needed
- Renders dynamic form based on field types
- Implements auto-save logic

### Step 4: Create Dynamic Field Renderer

**File:** `src/components/visit/DynamicField.tsx`

This component renders different field types:
- Text input for text/email/phone/url
- Textarea for textarea
- Number input for number
- Date picker for date/datetime
- Checkbox for checkbox
- Select/Radio/Multi-select for option fields

### Step 5: Implement Auto-Save Logic

**Hook:** `src/hooks/useTemplateFormAutoSave.ts`

Features:
- Debounced save (500ms delay)
- Track field changes
- Create or update field responses
- Show save status indicator

## Usage Example

### Loading Templates for a Visit

```typescript
const { visitId } = useParams();
const {
  useTemplateGroups,
  useTemplates,
  useTemplateResponses,
} = useOPDTemplate();

// Load template groups
const { data: groupsData } = useTemplateGroups({
  show_inactive: false,
});

// Load templates (combine all groups or fetch per group)
const { data: templatesData } = useTemplates({
  is_active: true,
});

// Load existing responses for this visit
const { data: responsesData } = useTemplateResponses({
  visit: visitId,
});

// Map responses by template ID for quick lookup
const responsesByTemplate = useMemo(() => {
  const map = new Map();
  responsesData?.results.forEach((response) => {
    map.set(response.template, response);
  });
  return map;
}, [responsesData]);

// Get status for a template
const getTemplateStatus = (templateId: number) => {
  const response = responsesByTemplate.get(templateId);
  if (!response) return 'not_filled';
  return response.status; // 'draft' or 'completed'
};
```

### Opening a Template

```typescript
const handleTemplateClick = async (template: Template) => {
  // Check if response exists
  let responseId = responsesByTemplate.get(template.id)?.id;

  if (!responseId) {
    // Create new response
    const response = await createTemplateResponse({
      visit: visitId,
      template: template.id,
      status: 'draft',
    });
    responseId = response.id;
  }

  // Open form with responseId
  setSelectedResponseId(responseId);
  setTemplateFormOpen(true);
};
```

### Rendering Dynamic Form

```typescript
function TemplateForm({ responseId, templateId }) {
  const { useTemplate, useTemplateFieldResponses } = useOPDTemplate();

  // Load template structure
  const { data: template } = useTemplate(templateId);

  // Load existing field responses
  const { data: fieldResponsesData } = useTemplateFieldResponses({
    response: responseId,
  });

  // Map field responses by field ID
  const responsesByField = useMemo(() => {
    const map = new Map();
    fieldResponsesData?.results.forEach((fr) => {
      map.set(fr.field, fr);
    });
    return map;
  }, [fieldResponsesData]);

  return (
    <form>
      {template?.fields?.map((field) => (
        <DynamicField
          key={field.id}
          field={field}
          responseId={responseId}
          existingResponse={responsesByField.get(field.id)}
        />
      ))}
    </form>
  );
}
```

### Auto-Save Field Value

```typescript
function DynamicField({ field, responseId, existingResponse }) {
  const [value, setValue] = useState(existingResponse?.value_text || '');
  const { createTemplateFieldResponse, updateTemplateFieldResponse } = useOPDTemplate();

  // Debounced save
  const debouncedSave = useMemo(
    () =>
      debounce(async (newValue) => {
        try {
          if (existingResponse) {
            // Update existing
            await updateTemplateFieldResponse(existingResponse.id, {
              value_text: newValue,
            });
          } else {
            // Create new
            await createTemplateFieldResponse({
              response: responseId,
              field: field.id,
              value_text: newValue,
            });
          }
          toast.success('Saved');
        } catch (error) {
          toast.error('Failed to save');
        }
      }, 500),
    [existingResponse, responseId, field.id]
  );

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedSave(newValue);
  };

  return (
    <Input
      value={value}
      onChange={handleChange}
      placeholder={field.placeholder}
    />
  );
}
```

## Status Badges

Use different badges to show template completion status:

```typescript
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'not_filled':
      return <Badge variant="outline">Not Filled</Badge>;
    case 'draft':
      return <Badge variant="secondary">Draft</Badge>;
    case 'completed':
      return <Badge variant="default">Completed</Badge>;
  }
};
```

## Best Practices

1. **Always create response first** before creating field responses
2. **Debounce auto-save** to avoid too many API calls (500ms recommended)
3. **Show save indicators** so users know data is being saved
4. **Handle errors gracefully** - show toast notifications
5. **Use SWR caching** to avoid redundant API calls
6. **Validate required fields** before marking as completed
7. **Optimistic updates** for better UX (update UI before API confirms)

## Next Steps

1. Implement the UI components (detailed code provided separately)
2. Add validation logic for required fields
3. Add "Mark as Completed" button that validates all required fields
4. Add print/export functionality for completed templates
5. Add search/filter for templates
6. Add template favorites for quick access

## Related Files

- Types: `src/types/opdTemplate.types.ts`
- Service: `src/services/opdTemplate.service.ts`
- Hook: `src/hooks/useOPDTemplate.ts`
- Components: Create in `src/components/visit/`
- Pages: Create in `src/pages/opd/`
