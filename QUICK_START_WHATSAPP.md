# Quick Start: WhatsApp API Integration

## 🚀 What Was Done

Your WhatsApp API has been configured to work with the Laravel backend at `https://whatsappapi.celiyo.com/api`.

## ✅ Files Updated

1. **src/lib/apiConfig.ts** - Base URL now points to `whatsappapi.celiyo.com/api`
2. **src/lib/externalWhatsappClient.ts** - New client for Laravel API
3. **src/services/externalWhatsappService.ts** - Service aligned with Laravel endpoints

## 📝 How to Use

### Send a Text Message

```typescript
import { externalWhatsappService } from '@/services/externalWhatsappService';

await externalWhatsappService.sendMessage({
  phone_number: "1234567890",
  message_body: "Hello from Celiyo!",
  contact: {
    first_name: "John",
    last_name: "Doe"
  }
});
```

### Send a Template Message

```typescript
await externalWhatsappService.sendTemplateMessage({
  phone_number: "1234567890",
  template_name: "welcome_message",
  template_language: "en",
  field_1: "John",
  field_2: "Doe"
});
```

### Send Media

```typescript
await externalWhatsappService.sendMediaMessage({
  phone_number: "1234567890",
  media_type: "image",
  media_url: "https://example.com/image.jpg",
  caption: "Check this out!"
});
```

## ⚠️ Current Issue: Templates Listing

The error you're seeing:
```
Request URL https://whatsappapi.celiyo.com/api/templates/?status=APPROVED&limit=100&skip=0
Error in fetching templates
```

**This happens because:**
The Laravel backend routes you provided don't include a `/templates/` listing endpoint. They only include message sending endpoints.

## 🔧 Fix Options

### Option 1: Keep Using FastAPI for Templates (Easiest)

The current code already uses FastAPI for template management. Just ensure `VITE_WHATSAPP_BASE_URL` points to your FastAPI server for templates:

```env
# .env.local
VITE_WHATSAPP_BASE_URL=http://your-fastapi-server:8002/api
```

Then use Laravel only for sending:
```typescript
// List templates (FastAPI)
import { templatesService } from '@/services/whatsapp/templatesService';
const templates = await templatesService.getTemplates();

// Send messages (Laravel)
import { externalWhatsappService } from '@/services/externalWhatsappService';
await externalWhatsappService.sendTemplateMessage({...});
```

### Option 2: Add Templates Endpoint to Laravel

Add this to your Laravel `routes/api.php`:

```php
Route::group([
    'middleware' => 'app_api.vendor.authenticate',
    'prefix' => 'vendor/',
], function () {
    Route::get('/templates', [WhatsAppServiceController::class, 'getTemplates']);
});
```

## 🔑 Required Configuration

### 1. Vendor UID

The vendor UID must be in localStorage:

```javascript
// Check in browser console:
const user = JSON.parse(localStorage.getItem('celiyo_user'));
console.log('Vendor UID:', user?.tenant?.whatsapp_vendor_uid);
```

If it's missing, add it to your user object when logging in.

### 2. Bearer Token

The token is automatically handled, but ensure you're logged in.

## 🧪 Test Your Setup

```typescript
import { externalWhatsappService } from '@/services/externalWhatsappService';

// 1. Check configuration
console.log('Vendor UID:', externalWhatsappService.getVendorUid());
console.log('Is configured:', externalWhatsappService.isConfigured());

// 2. Send test message
try {
  const result = await externalWhatsappService.sendMessage({
    phone_number: "YOUR_PHONE_NUMBER",
    message_body: "Test from Celiyo"
  });
  console.log('✅ Success:', result);
} catch (error) {
  console.error('❌ Error:', error.message);
}
```

## 📚 Full Documentation

- **WHATSAPP_API_CONFIGURATION.md** - Complete API reference with all endpoints
- **WHATSAPP_API_MIGRATION_SUMMARY.md** - Detailed migration notes

## 🆘 Troubleshooting

### Error: "Vendor UID not configured"
**Fix:** Add `whatsapp_vendor_uid` to user's tenant object in localStorage

### Error: "401 Unauthorized"
**Fix:** Ensure you're logged in and have a valid Bearer token

### Error: "Templates endpoint not found"
**Fix:** Choose Option 1 or 2 above to handle templates

### Error: "Network error"
**Fix:** Verify the API URL is correct and accessible

## 📞 Next Steps

1. ✅ Verify vendor UID is configured
2. ✅ Test sending a simple message
3. ✅ Decide on templates architecture (FastAPI vs Laravel)
4. ✅ Update any UI components as needed

## 💡 Pro Tips

- All endpoints automatically include Bearer token
- Contact creation is optional when sending messages
- Template fields use pattern: `field_1`, `field_2`, etc.
- Button parameters use pattern: `button_0`, `button_1`, etc.
- Groups should be comma-separated strings

---

**Need help?** Check the full documentation files or test with Postman first!
