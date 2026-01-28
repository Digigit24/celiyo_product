# WhatsApp API Configuration Guide

## Overview

The WhatsApp API has been configured to work with the Laravel backend at `https://whatsappapi.celiyo.com/api`. All endpoints follow the Laravel route structure with vendor UID in the URL path.

## API Base URL

```
https://whatsappapi.celiyo.com/api
```

## Authentication

All requests require a Bearer token in the Authorization header:

```
Authorization: Bearer {token}
```

The token is automatically attached by the `externalWhatsappClient` interceptor.

## Vendor UID

The vendor UID is required in the URL path for all endpoints. It's automatically retrieved from localStorage (`celiyo_user.tenant.whatsapp_vendor_uid`).

URL Pattern: `/{vendorUid}/...`

## Available Endpoints

### 1. Send Text Message

**Endpoint:** `POST /{vendorUid}/contact/send-message`

**Payload:**
```typescript
{
  from_phone_number_id?: string; // optional, uses default if not provided
  phone_number: string;
  message_body: string;
  contact?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    country?: string;
    language_code?: string;
    groups?: string; // comma-separated
    custom_fields?: Record<string, any>;
  };
}
```

**Usage:**
```typescript
import { externalWhatsappService } from '@/services/externalWhatsappService';

await externalWhatsappService.sendMessage({
  phone_number: "1234567890",
  message_body: "Hello from Celiyo!",
  contact: {
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com"
  }
});
```

### 2. Send Media Message

**Endpoint:** `POST /{vendorUid}/contact/send-media-message`

**Payload:**
```typescript
{
  from_phone_number_id?: string;
  phone_number: string;
  media_type: 'image' | 'video' | 'audio' | 'document';
  media_url: string;
  caption?: string; // for image or video
  file_name?: string; // for document
  contact?: ContactInfo;
}
```

**Usage:**
```typescript
await externalWhatsappService.sendMediaMessage({
  phone_number: "1234567890",
  media_type: "image",
  media_url: "https://example.com/image.jpg",
  caption: "Check out this image!"
});
```

### 3. Send Template Message

**Endpoint:** `POST /{vendorUid}/contact/send-template-message`

**Payload:**
```typescript
{
  from_phone_number_id?: string;
  phone_number: string;
  template_name: string;
  template_language: string;
  
  // Header parameters
  header_image?: string;
  header_video?: string;
  header_document?: string;
  header_document_name?: string;
  header_field_1?: string;
  
  // Location parameters
  location_latitude?: string;
  location_longitude?: string;
  location_name?: string;
  location_address?: string;
  
  // Body parameters
  field_1?: string;
  field_2?: string;
  field_3?: string;
  field_4?: string;
  
  // Button parameters
  button_0?: string;
  button_1?: string;
  
  // Copy code
  copy_code?: string;
  
  contact?: ContactInfo;
}
```

**Usage:**
```typescript
await externalWhatsappService.sendTemplateMessage({
  phone_number: "1234567890",
  template_name: "welcome_message",
  template_language: "en",
  field_1: "John",
  field_2: "Doe",
  contact: {
    first_name: "John",
    last_name: "Doe"
  }
});
```

### 4. Send Interactive Message

**Endpoint:** `POST /{vendorUid}/contact/send-interactive-message`

**Payload:**
```typescript
{
  from_phone_number_id?: string;
  phone_number: string;
  interactive_type: 'button' | 'list';
  body_text: string;
  header_text?: string;
  footer_text?: string;
  buttons?: Array<{ id: string; title: string }>;
  list_sections?: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
  contact?: ContactInfo;
}
```

**Usage:**
```typescript
await externalWhatsappService.sendInteractiveMessage({
  phone_number: "1234567890",
  interactive_type: "button",
  body_text: "Choose an option:",
  buttons: [
    { id: "1", title: "Option 1" },
    { id: "2", title: "Option 2" }
  ]
});
```

### 5. Create Contact

**Endpoint:** `POST /{vendorUid}/contact/create`

**Payload:**
```typescript
{
  first_name: string;
  last_name?: string;
  phone_number: string;
  email?: string;
  country?: string;
  language_code?: string;
  groups?: string; // comma-separated
  custom_fields?: Record<string, any>;
}
```

**Usage:**
```typescript
await externalWhatsappService.createContact({
  first_name: "John",
  last_name: "Doe",
  phone_number: "1234567890",
  email: "john@example.com",
  country: "USA",
  groups: "customers,vip"
});
```

### 6. Update Contact

**Endpoint:** `POST /{vendorUid}/contact/update/{phoneNumber}`

**Payload:**
```typescript
{
  first_name?: string;
  last_name?: string;
  email?: string;
  country?: string;
  language_code?: string;
  groups?: string;
  custom_fields?: Record<string, any>;
}
```

**Usage:**
```typescript
await externalWhatsappService.updateContact("1234567890", {
  first_name: "Jane",
  email: "jane@example.com"
});
```

### 7. Assign Team Member

**Endpoint:** `POST /{vendorUid}/contact/assign-team-member`

**Payload:**
```typescript
{
  phone_number: string;
  user_id: number;
}
```

**Usage:**
```typescript
await externalWhatsappService.assignTeamMember({
  phone_number: "1234567890",
  user_id: 123
});
```

## Configuration

### Environment Variables

Add to your `.env` or `.env.local`:

```env
# WhatsApp API Base URL
VITE_WHATSAPP_BASE_URL=https://whatsappapi.celiyo.com/api
VITE_WHATSAPP_EXTERNAL_BASE_URL=https://whatsappapi.celiyo.com/api
```

### Vendor UID Setup

The vendor UID must be stored in the user object in localStorage:

```typescript
{
  tenant: {
    whatsapp_vendor_uid: "your-vendor-uid-here"
  }
}
```

You can check if the vendor UID is configured:

```typescript
import { externalWhatsappService } from '@/services/externalWhatsappService';

if (!externalWhatsappService.isConfigured()) {
  console.error('WhatsApp Vendor UID not configured');
}
```

## Error Handling

All service methods throw errors with descriptive messages. Always wrap calls in try-catch:

```typescript
try {
  await externalWhatsappService.sendMessage({
    phone_number: "1234567890",
    message_body: "Hello!"
  });
} catch (error) {
  console.error('Failed to send message:', error.message);
  // Handle error appropriately
}
```

## Mobile App API Endpoints

Additional endpoints are available for mobile app integration (not yet fully implemented in the service):

- `GET /vendor/whatsapp/chat/unread-count` - Get unread message count
- `GET /vendor/contact/contacts-data/:contactUid?` - Get contacts data
- `GET /vendor/whatsapp/contact/chat/:contactUid?` - Get chat view
- `POST /vendor/whatsapp/contact/chat/send` - Send chat message
- `POST /vendor/whatsapp/contact/chat/update-notes` - Update contact notes
- `POST /vendor/whatsapp/contact/chat/assign-user` - Assign user to chat
- `POST /vendor/whatsapp/contact/chat/assign-labels` - Assign labels to contact
- `POST /vendor/whatsapp/contact/chat/clear-history/:contactUid` - Clear chat history
- `POST /vendor/whatsapp/contact/create-label` - Create label
- `POST /vendor/whatsapp/contact/chat/edit-label` - Edit label
- `POST /vendor/whatsapp/contact/chat/delete-label/:labelUid` - Delete label

## Files Modified

1. **src/lib/apiConfig.ts** - Updated WHATSAPP_BASE_URL and added WHATSAPP_EXTERNAL endpoints
2. **src/lib/externalWhatsappClient.ts** - Created new client for external WhatsApp API
3. **src/services/externalWhatsappService.ts** - Updated to align with Laravel API structure

## Testing

To test the API integration:

1. Ensure you have a valid Bearer token
2. Ensure the vendor UID is configured in localStorage
3. Use the service methods as shown in the usage examples above

```typescript
import { externalWhatsappService } from '@/services/externalWhatsappService';

// Check configuration
console.log('Vendor UID:', externalWhatsappService.getVendorUid());
console.log('Is configured:', externalWhatsappService.isConfigured());

// Send a test message
try {
  const result = await externalWhatsappService.sendMessage({
    phone_number: "1234567890",
    message_body: "Test message from Celiyo"
  });
  console.log('Message sent:', result);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Notes

- All endpoints require authentication via Bearer token
- The vendor UID is automatically injected into URLs
- Contact creation is optional when sending messages - if provided, the contact will be created if it doesn't exist
- Template field names follow the pattern: `field_1`, `field_2`, etc.
- Button parameters follow the pattern: `button_0`, `button_1`, etc.
- Groups should be comma-separated strings
- Custom fields can be any key-value pairs

## Support

For issues or questions, refer to the Laravel backend API documentation or contact the backend team.
