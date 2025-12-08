// WhatsApp Module Types for Celiyo Multi-Tenant Architecture

// ==================== MESSAGE TYPES ====================

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string | null;
  text: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Conversation {
  phone: string;
  name: string;
  last_message: string;
  last_timestamp: string;
  message_count: number;
  direction: 'incoming' | 'outgoing';
}

export interface ConversationDetail {
  phone: string;
  name: string;
  messages: WhatsAppMessage[];
}

export interface MessageStats {
  total_messages: number;
  incoming_messages: number;
  outgoing_messages: number;
  total_conversations: number;
  messages_today: number;
  messages_this_week: number;
  messages_this_month: number;
}

export interface SendTextMessagePayload {
  to: string;
  text: string;
}

export interface SendTextMessageResponse {
  message_id: string;
  status: 'sent' | 'pending';
  to: string;
  text: string;
  timestamp: string;
}

export interface SendMediaMessagePayload {
  to: string;
  media_type: 'image' | 'video' | 'audio' | 'document';
  media_url: string;
  caption?: string;
  filename?: string;
}

export interface SendMediaMessageResponse {
  message_id: string;
  status: 'sent' | 'pending';
  to: string;
  media_type: string;
  media_url: string;
  timestamp: string;
}

export interface SendLocationMessagePayload {
  to: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface SendLocationMessageResponse {
  message_id: string;
  status: 'sent' | 'pending';
  to: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface RecentMessagesQuery {
  limit?: number;
  offset?: number;
  direction?: 'incoming' | 'outgoing';
  phone?: string;
}

export interface RecentMessagesResponse {
  total: number;
  limit: number;
  offset: number;
  messages: Array<{
    id: string;
    phone: string;
    contact_name: string;
    text: string;
    type: string;
    direction: 'incoming' | 'outgoing';
    timestamp: string;
  }>;
}

export interface DeleteConversationResponse {
  message: string;
  phone: string;
  deleted_count: number;
}

// ==================== CONTACT TYPES ====================

export interface Contact {
  id: number;
  phone: string;
  name: string | null;
  profile_pic_url: string | null;
  status: string | null;
  is_business: boolean;
  business_description: string | null;
  labels: string[];
  groups: string[];
  notes: string | null;
  last_seen: string | null;
  created_at: string;
  tenant_id: string;
}

export interface ContactsListQuery {
  search?: string;
  labels?: string;
  groups?: string;
  limit?: number;
  offset?: number;
}

export interface ContactsListResponse {
  total: number;
  contacts: Contact[];
}

export interface CreateContactPayload {
  phone: string;
  name?: string;
  notes?: string;
  labels?: string[];
  groups?: string[];
  is_business?: boolean;
  business_description?: string;
}

export interface UpdateContactPayload {
  name?: string;
  notes?: string;
  labels?: string[];
  groups?: string[];
  is_business?: boolean;
  business_description?: string;
}

export interface DeleteContactResponse {
  message: string;
  phone: string;
}

// ==================== GROUP TYPES ====================

export interface Group {
  id: number;
  group_id: string;
  name: string;
  description: string | null;
  participants: string[];
  admins: string[];
  created_by: string | null;
  group_invite_link: string | null;
  is_active: boolean;
  participant_count: number;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export interface GroupsListQuery {
  active_only?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface GroupsListResponse {
  total: number;
  groups: Group[];
}

export interface CreateGroupPayload {
  group_id: string; // Required - WhatsApp Group ID from WhatsApp
  name: string;
  description?: string;
  participants?: string[];
  admins?: string[];
  group_invite_link?: string;
  created_by?: string;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  participants?: string[];
  admins?: string[];
  group_invite_link?: string;
  is_active?: boolean;
}

export interface DeleteGroupResponse {
  message: string;
  group_id: string;
}

// ==================== TEMPLATE TYPES ====================

export enum TemplateStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAUSED = "PAUSED",
  DISABLED = "DISABLED"
}

export enum TemplateCategory {
  MARKETING = "MARKETING",
  UTILITY = "UTILITY",
  AUTHENTICATION = "AUTHENTICATION"
}

export enum TemplateLanguage {
  ENGLISH = "en",
  ENGLISH_US = "en_US",
  ENGLISH_UK = "en_GB",
  HINDI = "hi",
  SPANISH = "es",
  FRENCH = "fr",
  GERMAN = "de",
  PORTUGUESE = "pt_BR",
  ARABIC = "ar"
}

// Component Types
export interface ButtonComponent {
  type: string; // QUICK_REPLY, URL, PHONE_NUMBER
  text: string;
  url?: string;
  phone_number?: string;
  example?: string[];
}

export interface TemplateComponent {
  type: string; // HEADER, BODY, FOOTER, BUTTONS
  format?: string;
  text?: string;
  buttons?: ButtonComponent[];
  example?: Record<string, any>;
}

export interface Template {
  id: number;
  tenant_id: string;
  template_id?: string;
  name: string;
  language: string;
  category: TemplateCategory;
  status: TemplateStatus;
  components: TemplateComponent[];
  quality_score?: string;
  rejection_reason?: string;
  usage_count: number;
  last_used_at?: string;
  library_template_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplatesListQuery {
  status?: TemplateStatus;
  category?: TemplateCategory;
  language?: string;
  skip?: number;
  limit?: number;
}

export interface TemplatesListResponse {
  total: number;
  items: Template[];
  page: number;
  page_size: number;
}

export interface CreateTemplatePayload {
  name: string;
  language: TemplateLanguage;
  category: TemplateCategory;
  components: TemplateComponent[];
  library_template_name?: string;
}

export interface UpdateTemplatePayload {
  status?: TemplateStatus;
  usage_count?: number;
}

export interface DeleteTemplateResponse {
  ok: boolean;
  message: string;
}

// Template Send Types
export interface ParameterValue {
  type: string;
  text?: string;
  image?: Record<string, string>;
  document?: Record<string, string>;
  video?: Record<string, string>;
}

export interface ComponentParameter {
  type: string;
  parameters: ParameterValue[];
  sub_type?: string;
  index?: number;
}

export interface TemplateSendRequest {
  to: string;
  template_name: string;
  language: TemplateLanguage;
  components?: ComponentParameter[];
  parameters?: Record<string, string>;
}

export interface TemplateSendResponse {
  ok: boolean;
  message_id?: string;
  phone: string;
  template_name: string;
  status: string;
}

export interface TemplateBulkSendRequest {
  template_name: string;
  language: TemplateLanguage;
  recipients: string[];
  parameters_per_recipient?: Record<string, string>[];
  default_parameters?: Record<string, string>;
}

export interface TemplateBulkSendResponse {
  total: number;
  sent: number;
  failed: number;
  results: Record<string, any>[];
}

export interface TemplateAnalytics {
  template_id: number;
  template_name: string;
  status: string;
  usage_count: number;
  total_sends: number;
  successful_sends: number;
  failed_sends: number;
  success_rate: number;
  last_used_at?: string;
}

// ==================== CAMPAIGN TYPES ====================

export interface CampaignResult {
  phone: string;
  status: 'sent' | 'failed';
  message_id?: string;
  error?: string;
}

export interface Campaign {
  campaign_id: string;
  campaign_name: string;
  total_recipients: number;
  sent: number;
  failed: number;
  timestamp: string;
  tenant_id: string;
}

export interface CampaignDetail extends Campaign {
  message_text: string;
  results: CampaignResult[];
}

export interface BroadcastCampaignPayload {
  campaign_name?: string;
  recipients: string[];
  message: string;
  template_name?: string;
  template_variables?: Record<string, string>;
}

export interface BroadcastCampaignResponse {
  campaign_id: string;
  campaign_name: string;
  total_recipients: number;
  sent: number;
  failed: number;
  timestamp: string;
  results: CampaignResult[];
}

export interface CampaignsListQuery {
  limit?: number;
  offset?: number;
}

export interface CampaignsListResponse {
  total: number;
  campaigns: Campaign[];
}

// ==================== ERROR TYPES ====================

export interface WhatsAppErrorResponse {
  detail: string;
  field?: string;
}

export interface WhatsAppApiError {
  response?: {
    status: number;
    data: WhatsAppErrorResponse;
  };
  message: string;
}

// ==================== WHATSAPP CAMPAIGNS (Backend-aligned) ====================

/**
 * Backend Campaign item as returned by FastAPI CampaignResponse
 * - list endpoint returns: WACampaign[]
 * - detail endpoint returns: WACampaign
 * - create broadcast endpoint returns: WACampaign
 */
export interface WACampaign {
  id: number;
  tenant_id: string;
  campaign_id: string;
  campaign_name?: string | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  results?: CampaignResult[] | null;
  created_at: string;
}

/** Backend create payload for broadcast campaigns */
export interface CreateCampaignPayload {
  campaign_name: string;
  message_text: string;
  recipients: string[]; // phone numbers
}

/** Backend list query for campaigns */
export interface CampaignListQuery {
  skip?: number;
  limit?: number;
}

/** The backend returns a raw array for list */
export type WACampaignListResponse = WACampaign[];