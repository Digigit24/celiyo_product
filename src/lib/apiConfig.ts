// ==================== API CONFIGURATION ====================
// Celiyo Multi-Tenant API Configuration
// Auth API: http://127.0.0.1:8000/api (port 8000)
// CRM API: http://127.0.0.1:8001/api (port 8001)
// WhatsApp API: http://127.0.0.1:8002/api (port 8002)

export const API_CONFIG = {
  // ==================== BASE URLS ====================
  
  // You can override these via Vite env vars in .env/.env.local
  // VITE_AUTH_BASE_URL, VITE_CRM_BASE_URL, VITE_WHATSAPP_BASE_URL, VITE_WHATSAPP_WS_URL
  AUTH_BASE_URL: import.meta.env.VITE_AUTH_BASE_URL || 'https://admin.celiyo.com/api',
  CRM_BASE_URL: import.meta.env.VITE_CRM_BASE_URL || 'https://crm.celiyo.com/api',
  HMS_BASE_URL: import.meta.env.VITE_HMS_BASE_URL || 'http://127.0.0.1:8000/api',
  WHATSAPP_BASE_URL: import.meta.env.VITE_WHATSAPP_BASE_URL || 'https://whatsapp.celiyo.com/api',


  // ✅ WebSocket URL for real-time WhatsApp updates
  WHATSAPP_WS_URL: import.meta.env.VITE_WHATSAPP_WS_URL || 'wss://whatsapp.celiyo.com',
  
  
  // For development, set in .env.local instead of editing code:
  // VITE_AUTH_BASE_URL=http://localhost:8000/api
  // VITE_CRM_BASE_URL=http://localhost:8001/api
  // VITE_WHATSAPP_BASE_URL=http://localhost:8002/api
  // VITE_WHATSAPP_WS_URL=ws://localhost:8002

  // ==================== AUTHENTICATION ====================
  AUTH: {
    LOGIN: '/auth/login/',
    REFRESH: '/auth/token/refresh/',
    VERIFY: '/auth/token/verify/',
    LOGOUT: '/auth/logout/',
    // User Management endpoints
    USERS: {
      LIST: '/users/',
      DETAIL: '/users/:id/',
      CREATE: '/users/',
      UPDATE: '/users/:id/',
      DELETE: '/users/:id/',
      ASSIGN_ROLES: '/users/:id/assign_roles/',
      REMOVE_ROLE: '/users/:id/remove_role/',
      ME: '/users/me/',
      UPDATE_ME: '/users/update_me/',
    },
    // Role Management endpoints
    ROLES: {
      LIST: '/roles/',
      DETAIL: '/roles/:id/',
      CREATE: '/roles/',
      UPDATE: '/roles/:id/',
      DELETE: '/roles/:id/',
      MEMBERS: '/roles/:id/members/',
      PERMISSIONS_SCHEMA: '/roles/permissions_schema/',
    },
    // Tenant Management endpoints
    TENANTS: {
      LIST: '/tenants/',
      DETAIL: '/tenants/:id/',
      CREATE: '/tenants/',
      UPDATE: '/tenants/:id/',
      DELETE: '/tenants/:id/',
      IMAGES: {
        LIST: '/tenants/:tenant_id/images/',
        DETAIL: '/tenants/:tenant_id/images/:id/',
        CREATE: '/tenants/:tenant_id/images/',
        UPDATE: '/tenants/:tenant_id/images/:id/',
        DELETE: '/tenants/:tenant_id/images/:id/',
      },
    },
  },

  // ==================== HMS ====================
  HMS: {
    DOCTORS: {
      PROFILES_LIST: '/doctors/profiles/',
      PROFILE_DETAIL: '/doctors/profiles/:id/',
      PROFILE_CREATE: '/doctors/profiles/',
      PROFILE_CREATE_WITH_USER: '/doctors/profiles/create_with_user/',
      PROFILE_UPDATE: '/doctors/profiles/:id/',
      PROFILE_DELETE: '/doctors/profiles/:id/',
      REGISTER: '/doctors/profiles/register/',
      AVAILABILITY_LIST: '/doctors/profiles/:id/availability/',
      AVAILABILITY_CREATE: '/doctors/profiles/:id/set_availability/',
      STATISTICS: '/doctors/profiles/statistics/',
      SPECIALTIES_LIST: '/doctors/specialties/',
      SPECIALTY_DETAIL: '/doctors/specialties/:id/',
      SPECIALTY_CREATE: '/doctors/specialties/',
      SPECIALTY_UPDATE: '/doctors/specialties/:id/',
      SPECIALTY_DELETE: '/doctors/specialties/:id/',
    },
    PATIENTS: {
      PROFILES_LIST: '/patients/profiles/',
      PROFILE_DETAIL: '/patients/profiles/:id/',
      PROFILE_CREATE: '/patients/profiles/',
      PROFILE_UPDATE: '/patients/profiles/:id/',
      PROFILE_DELETE: '/patients/profiles/:id/',
      REGISTER: '/patients/profiles/register/',
      STATISTICS: '/patients/profiles/statistics/',
    },
    APPOINTMENTS: {
      LIST: '/appointments/',
      DETAIL: '/appointments/:id/',
      CREATE: '/appointments/',
      UPDATE: '/appointments/:id/',
      DELETE: '/appointments/:id/',
      STATISTICS: '/appointments/statistics/',
      BY_DOCTOR: '/appointments/by-doctor/:doctor_id/',
      BY_PATIENT: '/appointments/by-patient/:patient_id/',
      UPCOMING: '/appointments/upcoming/',
      CANCEL: '/appointments/:id/cancel/',
      COMPLETE: '/appointments/:id/complete/',
      RESCHEDULE: '/appointments/:id/reschedule/',
    },
    APPOINTMENT_TYPES: {
      LIST: '/appointments/types/',
      DETAIL: '/appointments/types/:id/',
      CREATE: '/appointments/types/',
      UPDATE: '/appointments/types/:id/',
      DELETE: '/appointments/types/:id/',
    },
    OPD: {
      VISITS: {
        LIST: '/opd/visits/',
        DETAIL: '/opd/visits/:id/',
        CREATE: '/opd/visits/',
        UPDATE: '/opd/visits/:id/',
        DELETE: '/opd/visits/:id/',
        STATISTICS: '/opd/visits/statistics/',
        TODAY: '/opd/visits/today/',
        QUEUE: '/opd/visits/queue/',
        CALL_NEXT: '/opd/visits/call_next/',
        COMPLETE: '/opd/visits/:id/complete/',
      },
      BILLS: {
        LIST: '/opd/opd-bills/',
        DETAIL: '/opd/opd-bills/:id/',
        CREATE: '/opd/opd-bills/',
        UPDATE: '/opd/opd-bills/:id/',
        DELETE: '/opd/opd-bills/:id/',
        RECORD_PAYMENT: '/opd/opd-bills/:id/record_payment/',
        PRINT: '/opd/opd-bills/:id/print/',
        STATISTICS: '/opd/opd-bills/statistics/',
      },
      CLINICAL_NOTES: {
        LIST: '/opd/clinical-notes/',
        DETAIL: '/opd/clinical-notes/:id/',
        CREATE: '/opd/clinical-notes/',
        UPDATE: '/opd/clinical-notes/:id/',
        DELETE: '/opd/clinical-notes/:id/',
      },
      VISIT_FINDINGS: {
        LIST: '/opd/visit-findings/',
        DETAIL: '/opd/visit-findings/:id/',
        CREATE: '/opd/visit-findings/',
        UPDATE: '/opd/visit-findings/:id/',
        DELETE: '/opd/visit-findings/:id/',
      },
      PROCEDURE_MASTERS: {
        LIST: '/opd/procedure-masters/',
        DETAIL: '/opd/procedure-masters/:id/',
        CREATE: '/opd/procedure-masters/',
        UPDATE: '/opd/procedure-masters/:id/',
        DELETE: '/opd/procedure-masters/:id/',
      },
      PROCEDURE_PACKAGES: {
        LIST: '/opd/procedure-packages/',
        DETAIL: '/opd/procedure-packages/:id/',
        CREATE: '/opd/procedure-packages/',
        UPDATE: '/opd/procedure-packages/:id/',
        DELETE: '/opd/procedure-packages/:id/',
      },
      PROCEDURE_BILLS: {
        LIST: '/opd/procedure-bills/',
        DETAIL: '/opd/procedure-bills/:id/',
        CREATE: '/opd/procedure-bills/',
        UPDATE: '/opd/procedure-bills/:id/',
        DELETE: '/opd/procedure-bills/:id/',
        RECORD_PAYMENT: '/opd/procedure-bills/:id/record_payment/',
        PRINT: '/opd/procedure-bills/:id/print/',
        ITEMS_LIST: '/opd/procedure-bill-items/',
        ITEM_DETAIL: '/opd/procedure-bill-items/:id/',
      },
      ATTACHMENTS: {
        LIST: '/opd/visit-attachments/',
        DETAIL: '/opd/visit-attachments/:id/',
        CREATE: '/opd/visit-attachments/',
        UPDATE: '/opd/visit-attachments/:id/',
        DELETE: '/opd/visit-attachments/:id/',
      },
      TEMPLATE_RESPONSES: {
        // General Listing/Creation
        LIST: '/opd/template-responses/', // To get all, can be filtered by visit, template, etc.
        CREATE: '/opd/template-responses/', // To create a new response instance (e.g., for a new doctor)

        // Visit-specific are convenient shortcuts
        VISIT_LIST: '/opd/visits/:visit_id/template_responses/',
        
        // Operations on a specific template response
        DETAIL: '/opd/template-responses/:id/',
        UPDATE: '/opd/template-responses/:id/',
        DELETE: '/opd/template-responses/:id/',

        // New custom actions
        COMPARE: '/opd/template-responses/:id/compare/',
        MARK_REVIEWED: '/opd/template-responses/:id/mark_reviewed/',
        CONVERT_TO_TEMPLATE: '/opd/template-responses/:id/convert_to_template/',
        APPLY_TEMPLATE: '/opd/template-responses/:id/apply_template/',

        // Nested field responses for a given template response
        FIELD_RESPONSES_LIST: '/opd/template-responses/:id/field-responses/',
        FIELD_RESPONSE_CREATE: '/opd/template-responses/:id/field-responses/',
      },

      // Separate endpoints for individual field responses (for PATCH, DELETE)
      TEMPLATE_FIELD_RESPONSES: {
        DETAIL: '/opd/template-field-responses/:id/',
        UPDATE: '/opd/template-field-responses/:id/',
        DELETE: '/opd/template-field-responses/:id/',
      },

      // New endpoints for the reusable response templates
      RESPONSE_TEMPLATES: {
        LIST: '/opd/response-templates/',
        DETAIL: '/opd/response-templates/:id/',
        CREATE: '/opd/response-templates/',
        UPDATE: '/opd/response-templates/:id/',
        DELETE: '/opd/response-templates/:id/',
        MY_TEMPLATES: '/opd/response-templates/my_templates/',
        CLONE: '/opd/response-templates/:id/clone/',
      },
    },
    PAYMENTS: {
      CATEGORIES: {
        LIST: '/payments/categories/',
        DETAIL: '/payments/categories/:id/',
        CREATE: '/payments/categories/',
        UPDATE: '/payments/categories/:id/',
        DELETE: '/payments/categories/:id/',
      },
      TRANSACTIONS: {
        LIST: '/payments/transactions/',
        DETAIL: '/payments/transactions/:id/',
        CREATE: '/payments/transactions/',
        UPDATE: '/payments/transactions/:id/',
        DELETE: '/payments/transactions/:id/',
        STATISTICS: '/payments/transactions/statistics/',
        RECONCILE: '/payments/transactions/:id/reconcile/',
      },
      ACCOUNTING_PERIODS: {
        LIST: '/payments/accounting-periods/',
        DETAIL: '/payments/accounting-periods/:id/',
        CREATE: '/payments/accounting-periods/',
        UPDATE: '/payments/accounting-periods/:id/',
        DELETE: '/payments/accounting-periods/:id/',
        RECALCULATE: '/payments/accounting-periods/:id/recalculate/',
        CLOSE: '/payments/accounting-periods/:id/close/',
      },
    },
    PHARMACY: {
      // Cart
      CART_LIST: '/pharmacy/cart/',
      CART_DETAIL: '/pharmacy/cart/:id/',
      CART_CREATE: '/pharmacy/cart/',
      CART_UPDATE: '/pharmacy/cart/:id/',
      CART_PARTIAL_UPDATE: '/pharmacy/cart/:id/',
      CART_DELETE: '/pharmacy/cart/:id/',
      CART_ADD_ITEM: '/pharmacy/cart/add_item/',
      CART_CLEAR: '/pharmacy/cart/clear/',
      CART_REMOVE_ITEM: '/pharmacy/cart/remove_item/',
      CART_UPDATE_ITEM: '/pharmacy/cart/update_item/',

      // Product Categories
      CATEGORIES_LIST: '/pharmacy/categories/',
      CATEGORY_CREATE: '/pharmacy/categories/',
      CATEGORY_DETAIL: '/pharmacy/categories/:id/',
      CATEGORY_UPDATE: '/pharmacy/categories/:id/',
      CATEGORY_PARTIAL_UPDATE: '/pharmacy/categories/:id/',
      CATEGORY_DELETE: '/pharmacy/categories/:id/',

      // Orders
      ORDERS_LIST: '/pharmacy/orders/',
      ORDER_CREATE: '/pharmacy/orders/',
      ORDER_DETAIL: '/pharmacy/orders/:id/',
      ORDER_UPDATE: '/pharmacy/orders/:id/',
      ORDER_PARTIAL_UPDATE: '/pharmacy/orders/:id/',
      ORDER_DELETE: '/pharmacy/orders/:id/',
      ORDER_CANCEL: '/pharmacy/orders/:id/cancel/',
      ORDERS_STATISTICS: '/pharmacy/orders/statistics/',

      // Products
      PRODUCTS_LIST: '/pharmacy/products/',
      PRODUCT_CREATE: '/pharmacy/products/',
      PRODUCT_DETAIL: '/pharmacy/products/:id/',
      PRODUCT_UPDATE: '/pharmacy/products/:id/',
      PRODUCT_PARTIAL_UPDATE: '/pharmacy/products/:id/',
      PRODUCT_DELETE: '/pharmacy/products/:id/',
      PRODUCTS_EXPIRED: '/pharmacy/products/expired/',
      PRODUCTS_LOW_STOCK: '/pharmacy/products/low_stock/',
      PRODUCTS_NEAR_EXPIRY: '/pharmacy/products/near_expiry/',
      PRODUCTS_STATISTICS: '/pharmacy/products/statistics/',
    },
    IPD: {
      // Wards
      WARDS: {
        LIST: '/ipd/wards/',
        DETAIL: '/ipd/wards/:id/',
        CREATE: '/ipd/wards/',
        UPDATE: '/ipd/wards/:id/',
        DELETE: '/ipd/wards/:id/',
      },
      // Beds
      BEDS: {
        LIST: '/ipd/beds/',
        DETAIL: '/ipd/beds/:id/',
        CREATE: '/ipd/beds/',
        UPDATE: '/ipd/beds/:id/',
        DELETE: '/ipd/beds/:id/',
        AVAILABLE: '/ipd/beds/available/',
      },
      // Admissions
      ADMISSIONS: {
        LIST: '/ipd/admissions/',
        DETAIL: '/ipd/admissions/:id/',
        CREATE: '/ipd/admissions/',
        UPDATE: '/ipd/admissions/:id/',
        DELETE: '/ipd/admissions/:id/',
        DISCHARGE: '/ipd/admissions/:id/discharge/',
        ACTIVE: '/ipd/admissions/active/',
      },
      // Bed Transfers
      BED_TRANSFERS: {
        LIST: '/ipd/bed-transfers/',
        DETAIL: '/ipd/bed-transfers/:id/',
        CREATE: '/ipd/bed-transfers/',
        UPDATE: '/ipd/bed-transfers/:id/',
        DELETE: '/ipd/bed-transfers/:id/',
      },
      // Billing
      BILLINGS: {
        LIST: '/ipd/billings/',
        DETAIL: '/ipd/billings/:id/',
        CREATE: '/ipd/billings/',
        UPDATE: '/ipd/billings/:id/',
        DELETE: '/ipd/billings/:id/',
        ADD_BED_CHARGES: '/ipd/billings/:id/add_bed_charges/',
        ADD_PAYMENT: '/ipd/billings/:id/add_payment/',
      },
      // Bill Items
      BILL_ITEMS: {
        LIST: '/ipd/bill-items/',
        DETAIL: '/ipd/bill-items/:id/',
        CREATE: '/ipd/bill-items/',
        UPDATE: '/ipd/bill-items/:id/',
        DELETE: '/ipd/bill-items/:id/',
      },
    },
    DIAGNOSTICS: {
      INVESTIGATIONS: {
        LIST: '/diagnostics/investigations/',
        DETAIL: '/diagnostics/investigations/:id/',
        CREATE: '/diagnostics/investigations/',
        UPDATE: '/diagnostics/investigations/:id/',
        DELETE: '/diagnostics/investigations/:id/',
      },
      REQUISITIONS: {
        LIST: '/diagnostics/requisitions/',
        DETAIL: '/diagnostics/requisitions/:id/',
        CREATE: '/diagnostics/requisitions/',
        UPDATE: '/diagnostics/requisitions/:id/',
        DELETE: '/diagnostics/requisitions/:id/',
        ADD_MEDICINE: '/diagnostics/requisitions/:id/add_medicine/',
        ADD_PROCEDURE: '/diagnostics/requisitions/:id/add_procedure/',
        ADD_PACKAGE: '/diagnostics/requisitions/:id/add_package/',
      },
      ORDERS: {
        LIST: '/diagnostics/orders/',
        DETAIL: '/diagnostics/orders/:id/',
        CREATE: '/diagnostics/orders/',
        UPDATE: '/diagnostics/orders/:id/',
        DELETE: '/diagnostics/orders/:id/',
      },
      REPORTS: {
        LIST: '/diagnostics/reports/',
        DETAIL: '/diagnostics/reports/:id/',
        CREATE: '/diagnostics/reports/',
        UPDATE: '/diagnostics/reports/:id/',
        DELETE: '/diagnostics/reports/:id/',
      },
      RANGES: {
        LIST: '/diagnostics/ranges/',
        DETAIL: '/diagnostics/ranges/:id/',
        CREATE: '/diagnostics/ranges/',
        UPDATE: '/diagnostics/ranges/:id/',
        DELETE: '/diagnostics/ranges/:id/',
      },
    }
  },


  // ==================== CRM ====================
  CRM: {
    // Lead endpoints (note: no /crm/ prefix since base URL already includes it)
    LEADS: '/crm/leads/',
    LEAD_DETAIL: '/crm/leads/:id/',
    LEAD_CREATE: '/crm/leads/',
    LEAD_UPDATE: '/crm/leads/:id/',
    LEAD_DELETE: '/crm/leads/:id/',
    LEAD_KANBAN: '/crm/leads/kanban/',
    LEAD_EXPORT: '/crm/leads/export/',
    LEAD_IMPORT: '/crm/leads/import_leads/',

    // Lead Status endpoints
    LEAD_STATUSES: '/crm/statuses/',
    LEAD_STATUS_DETAIL: '/crm/statuses/:id/',
    LEAD_STATUS_CREATE: '/crm/statuses/',
    LEAD_STATUS_UPDATE: '/crm/statuses/:id/',
    LEAD_STATUS_DELETE: '/crm/statuses/:id/',
    
    // Lead Activity endpoints
    LEAD_ACTIVITIES: '/crm/activities/',
    LEAD_ACTIVITY_DETAIL: '/crm/activities/:id/',
    LEAD_ACTIVITY_CREATE: '/crm/activities/',
    LEAD_ACTIVITY_UPDATE: '/crm/activities/:id/',
    LEAD_ACTIVITY_DELETE: '/crm/activities/:id/',
    
    // Lead Order endpoints (Kanban positioning)
    LEAD_ORDERS: '/crm/orders/',
    LEAD_ORDER_DETAIL: '/crm/orders/:id/',
    LEAD_ORDER_CREATE: '/crm/orders/',
    LEAD_ORDER_UPDATE: '/crm/orders/:id/',
    LEAD_ORDER_DELETE: '/crm/orders/:id/',

    // Task endpoints
    TASKS: '/tasks/',
    TASK_DETAIL: '/tasks/:id/',
    TASK_CREATE: '/tasks/',
    TASK_UPDATE: '/tasks/:id/',
    TASK_DELETE: '/tasks/:id/',

    // Meeting endpoints
    MEETINGS: '/meetings/',
    MEETING_DETAIL: '/meetings/:id/',
    MEETING_CREATE: '/meetings/',
    MEETING_UPDATE: '/meetings/:id/',
    MEETING_DELETE: '/meetings/:id/',
    MEETING_CALENDAR: '/meetings/calendar/',

    // Field Configuration endpoints
    FIELD_CONFIGURATIONS: '/crm/field-configurations/',
    FIELD_CONFIGURATION_DETAIL: '/crm/field-configurations/:id/',
    FIELD_CONFIGURATION_CREATE: '/crm/field-configurations/',
    FIELD_CONFIGURATION_UPDATE: '/crm/field-configurations/:id/',
    FIELD_CONFIGURATION_DELETE: '/crm/field-configurations/:id/',
    FIELD_SCHEMA: '/crm/field-configurations/field_schema/',
  },

  // ==================== WHATSAPP ====================
  WHATSAPP: {
    // Chat & Messages endpoints
    SEND_TEXT: '/messages/send',
    SEND_MEDIA: '/messages/send/media',
    SEND_LOCATION: '/messages/send/location',
    UPLOAD_MEDIA: '/messages/upload/media',
    GET_MEDIA: '/messages/media/:media_id',
    CONVERSATIONS: '/messages/conversations/',
    CONVERSATION_DETAIL: '/messages/conversations/:phone',
    DELETE_CONVERSATION: '/messages/conversations/:phone',
    MESSAGES: '/messages/messages',
    STATS: '/messages/stats',
    
    // Contacts endpoints
    CONTACTS: '/contacts/',
    CONTACT_DETAIL: '/contacts/:phone/',
    CONTACT_CREATE: '/contacts/',
    CONTACT_UPDATE: '/contacts/:phone/',
    CONTACT_DELETE: '/contacts/:phone/',
    CONTACT_IMPORT: '/contacts/import',
    
    // Groups endpoints
    GROUPS: '/groups/',
    GROUP_DETAIL: '/groups/:group_id',
    GROUP_CREATE: '/groups/',
    GROUP_UPDATE: '/groups/:group_id',
    GROUP_DELETE: '/groups/:group_id',
    
    // Templates endpoints (aligned to backend: id-based + name route)
    TEMPLATES: '/templates/',
    TEMPLATE_DETAIL: '/templates/:id',
    TEMPLATE_CREATE: '/templates/',
    TEMPLATE_UPDATE: '/templates/:id',
    TEMPLATE_DELETE: '/templates/:id',
    TEMPLATE_BY_NAME: '/templates/name/:template_name',
    TEMPLATE_LIBRARY_CREATE: '/templates/library',
    TEMPLATE_SEND: '/templates/send',
    TEMPLATE_SEND_BULK: '/templates/send/bulk',
    TEMPLATE_ANALYTICS: '/templates/:id/analytics',
    TEMPLATE_WEBHOOK_STATUS: '/templates/webhook/status',
    TEMPLATE_SYNC: '/templates/:id/sync',
    TEMPLATE_SYNC_ALL: '/templates/sync',
    
    // Campaigns endpoints (align with FastAPI router without trailing slashes)
    CAMPAIGN_BROADCAST: '/campaigns/broadcast',
    CAMPAIGN_BROADCAST_TEMPLATE: '/campaigns/broadcast/template',
    CAMPAIGNS: '/campaigns/',
    CAMPAIGN_DETAIL: '/campaigns/:id',

    // Flows endpoints
    FLOWS: '/flows/',
    FLOW_DETAIL: '/flows/:flow_id',
    FLOW_CREATE: '/flows/',
    FLOW_UPDATE: '/flows/:flow_id',
    FLOW_DELETE: '/flows/:flow_id',
    FLOW_PUBLISH: '/flows/:flow_id/publish',
    FLOW_UNPUBLISH: '/flows/:flow_id/unpublish',
    FLOW_DUPLICATE: '/flows/:flow_id/duplicate',
    FLOW_VALIDATE: '/flows/:flow_id/validate',
    
    FLOW_STATS: '/flows/stats',

    // QR Codes endpoints
    QR_CODES: '/qr-codes/',
    QR_CODE_DETAIL: '/qr-codes/:code',
    QR_CODE_CREATE: '/qr-codes/',
    QR_CODE_UPDATE: '/qr-codes/:code',
    QR_CODE_DELETE: '/qr-codes/:code',
    QR_CODE_FETCH: '/qr-codes/fetch',


    // Tenant Configuration endpoints
    TENANT_CONFIG: {
      ONBOARD_WHATSAPP: '/tenant/onboard/whatsapp-client',
      CONFIG: '/tenant/config',
      CONFIG_FULL: '/tenant/config/full',
      DEACTIVATE: '/tenant/config/deactivate',
      ACTIVATE: '/tenant/config/activate',
    },
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Build full URL with appropriate base URL
 * @param endpoint - API endpoint path
 * @param params - URL parameters to replace (e.g., {id: '1'})
 * @param apiType - 'auth' | 'crm' | 'whatsapp' to determine base URL
 * @returns Full URL string
 */
export const buildUrl = (
  endpoint: string,
  params?: Record<string, string | number>,
  apiType: 'auth' | 'crm' | 'hms' | 'whatsapp' = 'auth'
): string => {
  const baseUrl =
    apiType === 'auth' ? API_CONFIG.AUTH_BASE_URL :
    apiType === 'crm' ? API_CONFIG.CRM_BASE_URL :
    apiType === 'hms' ? API_CONFIG.HMS_BASE_URL :
    API_CONFIG.WHATSAPP_BASE_URL;
  
  let url = `${baseUrl}${endpoint}`;

  // Replace URL parameters (e.g., :id, :phone, :name) with URL-encoded values
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      const encoded = encodeURIComponent(String(value));
      url = url.replace(`:${key}`, encoded);
    });
  }

  return url;
};

/**
 * Build query string from params object
 * @param params - Query parameters object
 * @returns Query string (e.g., '?key1=value1&key2=value2')
 */
export const buildQueryString = (
  params?: Record<string, string | number | boolean | undefined>
): string => {
  if (!params) return '';

  const queryParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return queryParams ? `?${queryParams}` : '';
};

/**
 * Get full URL with query parameters
 * @param endpoint - API endpoint path
 * @param urlParams - URL parameters to replace (e.g., {id: '1'})
 * @param queryParams - Query parameters object
 * @param apiType - 'auth' | 'crm' | 'whatsapp' to determine base URL
 * @returns Full URL with query string
 */
export const getFullUrl = (
  endpoint: string,
  urlParams?: Record<string, string | number>,
  queryParams?: Record<string, string | number | boolean | undefined>,
  apiType: 'auth' | 'crm' | 'hms' | 'whatsapp' = 'auth'
): string => {
  const baseUrl = buildUrl(endpoint, urlParams, apiType);
  const queryString = buildQueryString(queryParams);
  return `${baseUrl}${queryString}`;
};