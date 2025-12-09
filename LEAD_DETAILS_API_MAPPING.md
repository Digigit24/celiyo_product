# Lead Details Page - API Mapping Documentation

This document outlines the API endpoints used in the LeadDetailsPage component and how data is fetched and displayed in each tab.

## Overview

**Component**: `src/pages/LeadDetailsPage.tsx`
**Route**: `/crm/leads/:leadId`

---

## Data Fetching Summary

### 1. Lead Details Tab

**Purpose**: Display and edit lead information

**API Endpoint**: `GET /api/crm/leads/{id}/`

**Hook Used**: `useLead(leadIdNum)`
- **Service**: `src/hooks/useCRM.ts` → `crmService.getLead(id)`
- **Implementation**: `src/services/crmService.ts`
- **Endpoint**: `/crm/leads/:id/`

**Data Retrieved**:
- Basic Info: name, phone, email, company, title
- Status & Priority: status, priority, assigned_to
- Business Info: value, currency, source
- Dates: next_follow_up, created_at, updated_at
- Address: address_line1, address_line2, city, state, country, postal_code
- Custom Fields: Dynamic fields based on configuration
- Notes: General notes

**Query Parameters**: None (single resource fetch by ID)

**Component**: `LeadDetailsForm` (reused from drawer)

---

### 2. Activities Tab

**Purpose**: Display timeline of all activities related to the lead

**API Endpoint**: `GET /api/crm/activities/?lead={leadId}`

**Hook Used**: `useLeadActivities({ lead: leadId, ordering: '-happened_at', page_size: 10 })`
- **Service**: `src/hooks/useCRM.ts` → `crmService.getLeadActivities(params)`
- **Implementation**: `src/services/crmService.ts`
- **Endpoint**: `/crm/activities/`

**Query Parameters**:
```typescript
{
  lead: number,              // Filter by lead ID
  ordering: '-happened_at',  // Sort by most recent first
  page_size: 10 | 100,       // Limit results (expandable)
}
```

**Data Retrieved**:
- Activity type: CALL, EMAIL, MEETING, NOTE, SMS
- Content: Description of the activity
- Metadata: Duration, outcome, etc.
- Timestamps: happened_at, created_at
- User: Created by (user info)
- Attachments: Related files

**Component**: `LeadActivities` (reused from drawer)

**Activity Types Displayed**:
- 📞 CALL (Blue badge)
- 📧 EMAIL (Purple badge)
- 📅 MEETING (Green badge)
- 📝 NOTE (Gray badge)
- 📱 SMS (Yellow badge)

---

### 3. Status Tab

**Purpose**: Display current status information and timeline

**API Endpoints**:
1. Lead data (already fetched): `GET /api/crm/leads/{id}/`
2. Status list: `GET /api/crm/statuses/`

**Hooks Used**:
- `useLead(leadIdNum)` - For lead.status, lead.priority, lead.next_follow_up
- `useLeadStatuses()` - For status details (name, color)

**Service**: `src/hooks/useCRM.ts` → `crmService.getLeadStatuses()`
- **Implementation**: `src/services/crmService.ts`
- **Endpoint**: `/crm/statuses/`

**Query Parameters**: None (fetches all active statuses)

**Data Displayed**:
- **Current Status**:
  - Status name with color-coded badge
  - Retrieved from: `statuses.find(s => s.id === lead.status)`
- **Priority**:
  - Lead priority level (high, medium, low)
  - Retrieved from: `lead.priority`
- **Next Follow-up**:
  - Scheduled follow-up date
  - Retrieved from: `lead.next_follow_up`
- **Last Updated**:
  - When lead was last modified
  - Retrieved from: `lead.updated_at`
- **Created**:
  - When lead was created
  - Retrieved from: `lead.created_at`

**Note**: There is no status history endpoint in the current API, so we display the current status information only.

---

### 4. Meetings Tab

**Purpose**: Display all meetings scheduled for this lead

**API Endpoint**: `GET /api/meetings/?lead={leadId}`

**Hook Used**: `useMeetingsByLead(leadIdNum)`
- **Service**: `src/hooks/useMeeting.ts` → `meetingService.getMeetingsByLead(leadId)`
- **Implementation**: `src/services/meeting.service.ts`
- **Endpoint**: `/meetings/`

**Query Parameters**:
```typescript
{
  lead: number,  // Filter by lead ID
}
```

**Data Retrieved**:
- Meeting details: id, title, description
- Schedule: start_at, end_at
- Location: Physical or virtual location
- Status: Calculated based on current time vs meeting time
- Lead association: lead (ID), lead_name

**Data Displayed**:
- **Meeting Title**: Main heading
- **Status Badge**:
  - ✅ Completed (Gray) - end_at is in the past
  - 🟢 In Progress (Green) - currently happening
  - 🔵 Today (Blue) - starts today
  - 🟣 Upcoming (Purple) - starts in the future
- **Date**: Formatted as "MMM dd, yyyy"
- **Time**: Formatted as "hh:mm a - hh:mm a"
- **Location**: Physical or virtual location
- **Description**: Meeting notes/details

**Status Logic**:
```typescript
if (isPast(end_at)) → "Completed" (Gray)
else if (now >= start_at && now <= end_at) → "In Progress" (Green)
else if (isToday(start_at)) → "Today" (Blue)
else if (isFuture(start_at)) → "Upcoming" (Purple)
```

---

## Additional Features

### Edit & Save Functionality

**Update Lead API**: `PUT /api/crm/leads/{id}/`

**Hook Used**: `updateLead(lead.id, formValues)`
- **Service**: `src/hooks/useCRM.ts` → `crmService.updateLead(id, payload)`
- **Implementation**: `src/services/crmService.ts`
- **Endpoint**: `/crm/leads/:id/`

**Payload**: Complete lead object with all fields

---

### Delete Functionality

**Delete Lead API**: `DELETE /api/crm/leads/{id}/`

**Hook Used**: `deleteLead(lead.id)`
- **Service**: `src/hooks/useCRM.ts` → `crmService.deleteLead(id)`
- **Implementation**: `src/services/crmService.ts`
- **Endpoint**: `/crm/leads/:id/`

**Behavior**: After successful deletion, navigates back to `/crm/leads`

---

## API Configuration

All API endpoints are configured in: `src/lib/apiConfig.ts`

```typescript
CRM: {
  // Leads
  LEADS: '/crm/leads/',
  LEAD_DETAIL: '/crm/leads/:id/',

  // Activities
  LEAD_ACTIVITIES: '/crm/activities/',

  // Statuses
  LEAD_STATUSES: '/crm/statuses/',

  // Meetings
  MEETINGS: '/meetings/',
}
```

---

## Data Flow Diagram

```
LeadDetailsPage
├── useLead(leadIdNum)
│   └── GET /api/crm/leads/{id}/
│       → Lead details, status, priority, dates
│
├── Tab: Lead Details
│   └── LeadDetailsForm
│       └── Displays lead data
│       └── Edit mode → PUT /api/crm/leads/{id}/
│
├── Tab: Activities
│   └── LeadActivities
│       └── useLeadActivities({ lead: leadId })
│           └── GET /api/crm/activities/?lead={leadId}&ordering=-happened_at
│               → Activity timeline
│
├── Tab: Status
│   └── useLeadStatuses()
│       └── GET /api/crm/statuses/
│           → All status definitions
│   └── Display current status from lead object
│
└── Tab: Meetings
    └── useMeetingsByLead(leadIdNum)
        └── GET /api/meetings/?lead={leadId}
            → All meetings for this lead
```

---

## Query Parameter Reference

### Meetings API (`/api/meetings/`)
Supported filters:
- `lead` - Filter by lead ID
- `search` - Search by title, location, description
- `start_at__gte` - Start date range (greater than or equal)
- `start_at__lte` - Start date range (less than or equal)
- `end_at__gte` - End date range
- `end_at__lte` - End date range
- `ordering` - Sort field (e.g., 'start_at', '-created_at')
- `page` - Pagination page number
- `page_size` - Results per page

### Activities API (`/api/crm/activities/`)
Supported filters:
- `lead` - Filter by lead ID ⭐
- `type` - Filter by activity type (CALL, EMAIL, MEETING, NOTE, SMS)
- `by_user_id` - Filter by user who created the activity
- `happened_at__gte` - Activity date range
- `happened_at__lte` - Activity date range
- `ordering` - Sort field (e.g., '-happened_at')
- `page` - Pagination page number
- `page_size` - Results per page

### Statuses API (`/api/crm/statuses/`)
Supported filters:
- `is_won` - Filter won statuses
- `is_lost` - Filter lost statuses
- `is_active` - Filter active statuses
- `ordering` - Sort field (e.g., 'order_index')
- `page` - Pagination page number
- `page_size` - Results per page

---

## Performance Optimizations

1. **SWR Caching**: All data fetching uses SWR for automatic caching and revalidation
2. **Parallel Fetching**: Lead, statuses, and meetings are fetched in parallel
3. **Conditional Fetching**: Activities only fetch when tab is accessed (via LeadActivities component)
4. **Pagination**: Activities support "show all" expansion (10 → 100 items)

---

## Future Enhancements

Potential improvements based on API availability:

1. **Status History**: If backend adds `/api/crm/leads/{id}/status_history/` endpoint
   - Display timeline of status changes
   - Show who changed the status and when

2. **Activity Creation**: Add "New Activity" button in Activities tab
   - POST to `/api/crm/activities/`
   - Quick log calls, emails, notes

3. **Meeting Creation**: Add "Schedule Meeting" button in Meetings tab
   - POST to `/api/meetings/`
   - Pre-populate lead field

4. **Real-time Updates**: WebSocket integration for live updates
   - When meetings are created/updated
   - When activities are logged
   - When status changes

---

## Summary

✅ **All APIs are correctly mapped and filtering by lead ID**
✅ **Data is efficiently fetched using SWR hooks**
✅ **Each tab displays relevant, filtered data**
✅ **Edit and delete operations work correctly**

The implementation follows best practices and makes optimal use of the available API endpoints.
