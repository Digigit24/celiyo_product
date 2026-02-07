/**
 * Celiyo CRM - Landing Page Lead Capture Integration
 *
 * HOW TO USE:
 * 1. Copy the CRM_CONFIG block and the two functions (getCRMAccessToken, submitToCRM)
 *    into your landing page's <script> tag, right after the existing API_URL line.
 * 2. Add the submitToCRM() call inside submitHeroForm() and handleModalFormSubmit()
 *    as shown in the INTEGRATION POINTS section below.
 * 3. Refresh token expires in ~7 days. Replace REFRESH_TOKEN when it expires.
 * 4. Ensure your backend allows CORS from your landing page domain.
 *
 * FIELD MAPPING:
 *   name  → form fullName
 *   phone → form phone
 *   email → form email
 *   source → "Website" (always)
 *   notes  → all other details (unit type, enquiry type, action clicked, etc.)
 */

// ====== CELIYO CRM CONFIG — paste after your API_URL line ======
const CRM_CONFIG = {
    TENANT_ID: '73eca586-b1c0-4653-8b57-8411ca4ad81b',
    OWNER_USER_ID: '15edd788-f935-46d3-a1d8-cbfebc2cebec',
    REFRESH_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MTA1Mzc3NywiaWF0IjoxNzcwNDQ4OTc3LCJqdGkiOiJlYTZiNmRlMjhlZDA0M2E3YTkxY2Y4ODhmNzZlYjFkYiIsInVzZXJfaWQiOiIxNWVkZDc4OC1mOTM1LTQ2ZDMtYTFkOC1jYmZlYmMyY2ViZWMiLCJlbWFpbCI6ImNhcHJpcmF2ZXRAZ21haWwuY29tIiwidGVuYW50X2lkIjoiNzNlY2E1ODYtYjFjMC00NjUzLThiNTctODQxMWNhNGFkODFiIiwidGVuYW50X3NsdWciOiJjYXByaS1yYXZldCIsImlzX3N1cGVyX2FkbWluIjp0cnVlLCJwZXJtaXNzaW9ucyI6e30sImVuYWJsZWRfbW9kdWxlcyI6WyJjcm0iXX0.tNj6vyYqdLsUFC0NpZawldYchpxtDW8FKzOALcm0_NI',
    AUTH_URL: 'https://admin.celiyo.com/api/auth/token/refresh/',
    LEAD_URL: 'https://crm.celiyo.com/api/crm/leads/'
};

async function getCRMAccessToken() {
    const res = await fetch(CRM_CONFIG.AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: CRM_CONFIG.REFRESH_TOKEN })
    });
    if (!res.ok) throw new Error('CRM token refresh failed');
    const data = await res.json();
    return data.access;
}

async function submitToCRM(name, phone, email, notes) {
    try {
        const accessToken = await getCRMAccessToken();
        await fetch(CRM_CONFIG.LEAD_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken,
                'X-Tenant-Id': CRM_CONFIG.TENANT_ID,
                'tenanttoken': CRM_CONFIG.TENANT_ID
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                email: email || '',
                source: 'Website',
                priority: 'MEDIUM',
                owner_user_id: CRM_CONFIG.OWNER_USER_ID,
                notes: notes
            })
        });
    } catch (err) {
        console.error('CRM lead creation failed:', err);
    }
}


// ====== INTEGRATION POINTS ======

// --- Inside submitHeroForm(), add BEFORE the submitToApi() call: ---
//
//   const crmNotes = [
//       'Enquiry: Hero Section',
//       'Action: ' + actionName,
//       'Unit Type: ' + (formData.get('requirement') || '3 BHK')
//   ].join('\n');
//   submitToCRM(fullName, formData.get('phone'), formData.get('email'), crmNotes);


// --- Inside handleModalFormSubmit(), add BEFORE the submitToApi() call: ---
//
//   const crmNotes = [
//       'Enquiry: ' + source,
//       'Requirement: ' + (payload.requirement || '3 BHK')
//   ].join('\n');
//   submitToCRM(fullName, formData.get('phone'), formData.get('email'), crmNotes);
