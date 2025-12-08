// src/services/whatsapp/campaignsService.ts
import { whatsappClient } from '@/lib/whatsappClient';
import { API_CONFIG, buildUrl, buildQueryString } from '@/lib/apiConfig';
import {
  BroadcastCampaignPayload,
  BroadcastCampaignResponse,
  Campaign,
  CampaignDetail,
  CampaignsListQuery,
  CampaignsListResponse,
  // Backend-aligned types
  WACampaign,
  WACampaignListResponse,
  CreateCampaignPayload,
  CampaignListQuery,
} from '@/types/whatsappTypes';

class CampaignsService {
  /**
   * Send a broadcast campaign
   */
  async sendBroadcast(payload: BroadcastCampaignPayload): Promise<BroadcastCampaignResponse> {
    try {
      console.log('📤 Sending broadcast campaign:', {
        campaign_name: payload.campaign_name,
        recipients: payload.recipients.length
      });
      
      const response = await whatsappClient.post<BroadcastCampaignResponse>(
        API_CONFIG.WHATSAPP.CAMPAIGN_BROADCAST,
        payload
      );
      
      console.log('✅ Broadcast sent:', {
        campaign_id: response.data.campaign_id,
        sent: response.data.sent,
        failed: response.data.failed
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send broadcast:', error);
      
      if (error.response?.status === 403) {
        throw new Error('WhatsApp module not enabled');
      }
      
      const message = error.response?.data?.detail || 'Failed to send broadcast';
      throw new Error(message);
    }
  }

  /**
   * Backend-aligned: Create broadcast (POST /campaigns/broadcast)
   */
  async createBroadcast(payload: CreateCampaignPayload): Promise<WACampaign> {
    try {
      console.log('📤 Creating broadcast (backend-aligned):', {
        campaign_name: payload.campaign_name,
        recipients: payload.recipients.length
      });

      const response = await whatsappClient.post<WACampaign>(
        API_CONFIG.WHATSAPP.CAMPAIGN_BROADCAST,
        payload
      );

      console.log('✅ Broadcast created:', {
        campaign_id: response.data.campaign_id,
        total_recipients: response.data.total_recipients
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create broadcast:', error);
      const message = error.response?.data?.detail || 'Failed to create broadcast';
      throw new Error(message);
    }
  }

  /**
   * Backend-aligned: List campaigns (GET /campaigns)
   * Returns an array (no wrapper)
   */
  async listCampaigns(query?: CampaignListQuery): Promise<WACampaignListResponse> {
    try {
      const qs = buildQueryString(query as unknown as Record<string, string | number | boolean>);
      const url = `${API_CONFIG.WHATSAPP.CAMPAIGNS}${qs}`;
      const response = await whatsappClient.get<WACampaignListResponse | any>(url);

      const raw = response?.data;
      const arr: WACampaign[] = Array.isArray(raw) ? raw : Array.isArray(raw?.campaigns) ? raw.campaigns : [];
      console.log('✅ Campaigns fetched (backend-aligned):', { count: arr.length });
      return arr;
    } catch (error: any) {
      console.error('❌ Failed to list campaigns:', error);
      const message = error.response?.data?.detail || 'Failed to fetch campaigns';
      throw new Error(message);
    }
  }

  /**
   * Backend-aligned: Get single campaign (GET /campaigns/:id)
   */
  async getCampaignById(id: string): Promise<WACampaign> {
    try {
      const url = buildUrl(API_CONFIG.WHATSAPP.CAMPAIGN_DETAIL, { id }, 'whatsapp');
      const response = await whatsappClient.get<WACampaign>(url);
      console.log('✅ Campaign fetched (backend-aligned):', { campaign_id: response.data.campaign_id });
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch campaign (backend-aligned):', error);
      if (error.response?.status === 404) {
        throw new Error('Campaign not found');
      }
      const message = error.response?.data?.detail || 'Failed to fetch campaign';
      throw new Error(message);
    }
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(query?: CampaignsListQuery): Promise<CampaignsListResponse> {
    try {
      console.log('📋 Fetching campaigns:', query);
      
      const queryString = buildQueryString(query as unknown as Record<string, string | number | boolean>);
      const url = `${API_CONFIG.WHATSAPP.CAMPAIGNS}${queryString}`;
      
      const response = await whatsappClient.get<CampaignsListResponse | any>(url);

      // Normalize empty or variant responses to a consistent shape so UI doesn't error
      const raw = response?.data;
      const data: CampaignsListResponse =
        raw && typeof raw === 'object' && Array.isArray(raw.campaigns)
          ? { total: Number(raw.total ?? raw.campaigns.length) || 0, campaigns: raw.campaigns }
          : Array.isArray(raw)
            ? { total: raw.length, campaigns: raw }
            : { total: Number(raw?.total) || 0, campaigns: Array.isArray(raw?.campaigns) ? raw.campaigns : [] };

      console.log('✅ Campaigns fetched:', {
        total: data.total ?? 0,
        count: data.campaigns?.length ?? 0
      });
      
      return data;
    } catch (error: any) {
      console.error('❌ Failed to fetch campaigns:', error);
      const message = error.response?.data?.detail || 'Failed to fetch campaigns';
      throw new Error(message);
    }
  }

  /**
   * Get campaign details by ID
   */
  async getCampaign(id: string): Promise<CampaignDetail> {
    try {
      console.log('📋 Fetching campaign:', id);
      
      const url = buildUrl(
        API_CONFIG.WHATSAPP.CAMPAIGN_DETAIL,
        { id },
        'whatsapp'
      );
      
      const response = await whatsappClient.get<CampaignDetail>(url);
      
      console.log('✅ Campaign fetched:', {
        campaign_id: response.data?.campaign_id,
        sent: response.data?.sent,
        failed: response.data?.failed
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch campaign:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Campaign not found');
      }
      
      const message = error.response?.data?.detail || 'Failed to fetch campaign';
      throw new Error(message);
    }
  }

  /**
   * Get recent campaigns
   */
  async getRecentCampaigns(limit: number = 10): Promise<CampaignsListResponse> {
    return this.getCampaigns({ limit });
  }

  /**
   * Calculate campaign success rate
   */
  calculateSuccessRate(campaign: Campaign | CampaignDetail | WACampaign): number {
    const total = (campaign as any).total_recipients ?? 0;
    const sent = (campaign as any).sent ?? (campaign as any).sent_count ?? 0;
    if (!total) return 0;
    return (sent / total) * 100;
  }

  /**
   * Get campaign statistics
   */
  getCampaignStats(campaign: Campaign | CampaignDetail | WACampaign) {
    const successRate = this.calculateSuccessRate(campaign);
    const failureRate = 100 - successRate;

    const total = (campaign as any).total_recipients ?? 0;
    const sent = (campaign as any).sent ?? (campaign as any).sent_count ?? 0;
    const failed = (campaign as any).failed ?? (campaign as any).failed_count ?? 0;
    
    return {
      total_recipients: total,
      sent,
      failed,
      success_rate: successRate,
      failure_rate: failureRate,
    };
  }

  /**
   * Get failed recipients from a campaign
   */
  getFailedRecipients(campaign: any): string[] {
    const results = (campaign as any)?.results;
    if (!Array.isArray(results)) return [];
    return results
      .filter((result: any) => result.status === 'failed')
      .map((result: any) => result.phone);
  }

  /**
   * Get successful recipients from a campaign
   */
  getSuccessfulRecipients(campaign: any): string[] {
    const results = (campaign as any)?.results;
    if (!Array.isArray(results)) return [];
    return results
      .filter((result: any) => result.status === 'sent')
      .map((result: any) => result.phone);
  }

  /**
   * Retry failed messages from a campaign
   */
  async retryFailedMessages(campaignId: string, message: string): Promise<BroadcastCampaignResponse> {
    try {
      // First get the campaign details
      const campaign = await this.getCampaign(campaignId);
      
      // Get failed recipients
      const failedRecipients = this.getFailedRecipients(campaign);
      
      if (failedRecipients.length === 0) {
        throw new Error('No failed messages to retry');
      }
      
      console.log('🔄 Retrying failed messages:', {
        original_campaign: campaignId,
        failed_count: failedRecipients.length
      });
      
      // Send new broadcast to failed recipients
      return this.sendBroadcast({
        campaign_name: `${campaign.campaign_name} - Retry`,
        recipients: failedRecipients,
        message,
      });
    } catch (error: any) {
      console.error('❌ Failed to retry messages:', error);
      throw error;
    }
  }

  /**
   * Send campaign with template
   */
  async sendTemplatedCampaign(
    templateName: string,
    recipients: string[],
    variables: Record<string, string>,
    campaignName?: string
  ): Promise<BroadcastCampaignResponse> {
    return this.sendBroadcast({
      campaign_name: campaignName || `Campaign - ${templateName}`,
      recipients,
      message: '', // Message will be generated from template
      template_name: templateName,
      template_variables: variables,
    });
  }
}

export const campaignsService = new CampaignsService();