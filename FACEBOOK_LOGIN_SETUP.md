# Facebook Embedded Signup Integration Guide

This guide explains how to set up and use the Facebook Embedded Signup flow for WhatsApp Business API integration.

## Overview

The Facebook Embedded Signup UI has been integrated into the WhatsApp QR Codes page. This allows users to connect their Facebook Business account and set up WhatsApp Business API directly from your application.

## Features Implemented

✅ **Facebook SDK Integration** - Dynamically loads Facebook JavaScript SDK
✅ **Custom React Hook** - `useFacebookSDK` for managing SDK lifecycle
✅ **Login Button Component** - Reusable `FacebookLoginButton` component
✅ **Login Status Management** - Automatic checking and handling of login states
✅ **Error Handling** - User-friendly error messages and notifications

## File Structure

```
src/
├── hooks/
│   └── useFacebookSDK.ts          # Facebook SDK management hook
├── components/
│   └── FacebookLoginButton.tsx    # Reusable Facebook login button
└── pages/
    └── QRCodes.tsx                # WhatsApp QR codes page with Facebook login
```

## Setup Instructions

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" as the app type
4. Fill in your app details:
   - App Name: Your app name
   - App Contact Email: Your email
   - Business Account: Select or create a business account

### 2. Configure WhatsApp Product

1. In your Facebook App dashboard, add the "WhatsApp" product
2. Set up the WhatsApp Business API
3. Configure your webhook (if needed)

### 3. Get Your App Credentials

1. Go to **Settings** → **Basic** in your Facebook App
2. Copy your **App ID**
3. For Embedded Signup, you'll need a **Configuration ID**:
   - Go to WhatsApp → Configuration
   - Create or select an Embedded Signup configuration
   - Copy the Configuration ID

### 4. Configure Environment Variables

Edit your `.env` file and add:

```env
VITE_FACEBOOK_APP_ID=your-facebook-app-id
VITE_FACEBOOK_CONFIG_ID=your-facebook-config-id
```

Replace the placeholder values with your actual credentials from step 3.

### 5. Configure OAuth Redirect URIs

In your Facebook App settings:

1. Go to **Settings** → **Basic**
2. Add your app's URL to **App Domains**
3. Go to **Facebook Login** → **Settings**
4. Add your redirect URIs to **Valid OAuth Redirect URIs**:
   ```
   http://localhost:5173/
   https://yourdomain.com/
   ```

### 6. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the WhatsApp QR Codes page
3. Scroll to the bottom to see the "Connect with Facebook" section
4. Click "Login with Facebook"
5. Complete the Facebook login flow

## How It Works

### SDK Initialization

The `useFacebookSDK` hook automatically:
- Loads the Facebook JavaScript SDK
- Initializes the SDK with your App ID
- Checks the user's login status
- Provides methods for login and status checking

```typescript
const { isSDKLoaded, loginStatus, login, checkLoginState } = useFacebookSDK({
  appId: 'your-app-id',
  configId: 'your-config-id',
  onStatusChange: (response) => {
    console.log('Login status changed:', response);
  }
});
```

### Login Flow (Authorization Code Flow)

When a user clicks "Login with Facebook", the following happens:

1. **FB.login()** is called with these critical options:
   ```javascript
   {
     scope: 'whatsapp_business_management,business_management',
     response_type: 'code',                    // Forces Authorization Code Flow
     override_default_response_type: true,     // Required for System User tokens
     config_id: 'your-config-id',              // Your Embedded Signup config
     extras: { sessionInfoVersion: 2 }         // Returns WABA/Phone ID
   }
   ```

2. Facebook opens the **Embedded Signup** flow
3. User logs in and authorizes your app
4. User selects/creates a WhatsApp Business Account (WABA)
5. Facebook returns an `authResponse` with:
   - `code` - **Authorization code** (not a token!) to exchange for a long-lived access token
   - `grantedScopes` - Permissions granted by the user
   - Additional data including WABA ID and Phone Number ID (with sessionInfoVersion: 2)

6. **You must exchange the code** on your backend:
   ```
   POST https://graph.facebook.com/v18.0/oauth/access_token
   ?client_id=YOUR_APP_ID
   &client_secret=YOUR_APP_SECRET
   &code=AUTHORIZATION_CODE
   ```

7. Facebook returns a **long-lived access token** you can use for WhatsApp API calls

### Login Response Structure

The response object contains:

```typescript
{
  status: 'connected' | 'not_authorized' | 'unknown',
  authResponse?: {
    code: string,              // Authorization code (with response_type: 'code')
    grantedScopes: string,     // Permissions granted
    // May also include WABA/Phone ID with sessionInfoVersion: 2
  }
}
```

**Status values:**
- `connected` - User is logged into Facebook and authorized your app
- `not_authorized` - User is logged into Facebook but not your app
- `unknown` - User is not logged into Facebook

**Important**: With `response_type: 'code'`, you receive an **authorization code**, not an access token. You must exchange this code on your backend for a long-lived access token.

## Usage Example

### Basic Usage

```tsx
import { FacebookLoginButton } from '@/components/FacebookLoginButton';

function MyComponent() {
  return (
    <FacebookLoginButton
      appId={import.meta.env.VITE_FACEBOOK_APP_ID}
      configId={import.meta.env.VITE_FACEBOOK_CONFIG_ID}
      onSuccess={(response) => {
        console.log('Access Token:', response.authResponse.accessToken);
        // Send the token to your backend
      }}
      onError={(error) => {
        console.error('Login failed:', error);
      }}
    />
  );
}
```

### Custom Styling

```tsx
<FacebookLoginButton
  appId="..."
  configId="..."
  buttonText="Connect Facebook Account"
  variant="outline"
  size="lg"
  className="custom-class"
/>
```

## Integration with Backend

After successful login, you **must** exchange the authorization code for a long-lived access token:

### Frontend: Capture the Authorization Code

```typescript
onSuccess={(response) => {
  const authCode = response.authResponse?.code;

  if (authCode) {
    // Send the code to your backend for token exchange
    exchangeCodeForToken(authCode);
  }
}}
```

### Backend: Exchange Code for Access Token

**CRITICAL**: The code exchange **must happen on your backend** to keep your App Secret secure.

```javascript
// Node.js/Express example
app.post('/api/facebook/exchange-token', async (req, res) => {
  const { code } = req.body;

  try {
    // Exchange authorization code for access token
    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${process.env.FACEBOOK_APP_ID}&` +
      `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
      `code=${code}`
    );

    const data = await response.json();

    if (data.access_token) {
      // Store the access token securely in your database
      await saveAccessToken(data.access_token);

      res.json({ success: true, access_token: data.access_token });
    } else {
      res.status(400).json({ error: 'Failed to exchange code' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Frontend: Complete Integration

```typescript
const exchangeCodeForToken = async (authCode: string) => {
  try {
    const response = await fetch('/api/facebook/exchange-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: authCode }),
    });

    const data = await response.json();

    if (data.access_token) {
      toast.success('Access token received and saved!');
      // Now you can use the access token for WhatsApp API calls
    }
  } catch (error) {
    toast.error('Failed to exchange authorization code');
  }
};
```

### Steps Summary

1. **Frontend**: User clicks "Login with Facebook"
2. **Facebook**: Opens Embedded Signup flow
3. **Facebook**: Returns authorization code to frontend
4. **Frontend**: Sends code to backend
5. **Backend**: Exchanges code for long-lived access token using App Secret
6. **Backend**: Stores token securely in database
7. **Backend**: Uses token for WhatsApp Business API calls

## Checking Login Status

To check if a user is already logged in:

```typescript
const { checkLoginState, loginStatus } = useFacebookSDK({
  appId: 'your-app-id',
});

// Check status manually
checkLoginState();

// Or use the loginStatus state
useEffect(() => {
  if (loginStatus?.status === 'connected') {
    console.log('User is already logged in!');
  }
}, [loginStatus]);
```

## Security Considerations

1. **Never expose App Secret** - Keep it on your backend only
2. **Verify tokens server-side** - Don't trust client-side tokens
3. **Use HTTPS** - Always use secure connections in production
4. **Validate redirect URIs** - Ensure only your domains are whitelisted
5. **Check token expiration** - Refresh tokens before they expire

## Troubleshooting

### SDK Not Loading

If the Facebook SDK fails to load:
- Check your internet connection
- Verify the App ID is correct
- Check browser console for errors
- Ensure you're not blocking third-party scripts

### Login Fails

If login fails:
- Verify your App ID and Config ID are correct
- Check that your redirect URIs are configured
- Ensure your app is not in Development Mode (or add test users)
- Check Facebook App Review status

### "App Not Setup" Error

This usually means:
- Invalid App ID
- App is in Development Mode and user is not a tester
- WhatsApp product is not added to your app

## API Reference

### useFacebookSDK Hook

```typescript
interface UseFacebookSDKOptions {
  appId: string;              // Your Facebook App ID
  configId?: string;          // Embedded Signup Configuration ID
  version?: string;           // SDK version (default: 'v18.0')
  onStatusChange?: (response: FacebookLoginStatusResponse) => void;
}

const {
  isSDKLoaded,     // boolean - Is SDK loaded and ready?
  isLoading,       // boolean - Is SDK currently loading?
  loginStatus,     // LoginStatusResponse - Current login status
  checkLoginState, // () => void - Check login status manually
  login,           // (callback?) => void - Trigger login flow
} = useFacebookSDK(options);
```

### FacebookLoginButton Props

```typescript
interface FacebookLoginButtonProps {
  appId: string;                                    // Required
  configId?: string;                                // Optional
  onSuccess?: (response: any) => void;              // Success callback
  onError?: (error: any) => void;                   // Error callback
  buttonText?: string;                              // Button label
  variant?: 'default' | 'outline' | 'secondary';    // Button style
  size?: 'default' | 'sm' | 'lg';                   // Button size
  className?: string;                               // Additional CSS classes
}
```

## Next Steps

After integrating the Facebook login:

1. **Handle the access token** - Send it to your backend
2. **Store user data** - Save Facebook user ID and token
3. **Set up webhooks** - Configure WhatsApp webhooks for messages
4. **Test the flow** - Test with test users before going live
5. **Submit for review** - Submit your app for Facebook review if needed

## Additional Resources

- [Facebook Embedded Signup Documentation](https://developers.facebook.com/docs/whatsapp/embedded-signup)
- [Facebook JavaScript SDK Reference](https://developers.facebook.com/docs/javascript)
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Facebook Login Best Practices](https://developers.facebook.com/docs/facebook-login/best-practices)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all environment variables are set correctly
3. Review the Facebook App dashboard for configuration issues
4. Check the Network tab for failed API calls
