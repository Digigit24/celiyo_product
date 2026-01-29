// src/services/whatsapp/campaignsService.ts
// Updated to use external Laravel API via externalWhatsappService

import { externalWhatsappService } from '@/services/externalWhatsappService';
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
  CreateTemplateCampaignPayload,
  CampaignListQuery,
  TemplateBroadcastBulkPayload,
  TemplateBroadcastBulkResponse,
} from '@/types/whatsappTypes';

class CampaignsService {
  /**
   * Map Laravel API campaign response to frontend Campaign format
   */
  private mapLaravelCampaign(laravelCampaign: any): Campaign {
    return {
      id: laravelCampaign._uid || laravelCampaign.id || laravelCampaign.campaign_id,
      campaign_id: laravelCampaign._uid || laravelCampaign.campaign_id || laravelCampaign.id,
      campaign_name: laravelCampaign.title || laravelCampaign.campaign_name || laravelCampaign.name || '',
      status: laravelCampaign.status || 'pending',
      total_recipients: laravelCampaign.contacts_count || laravelCampaign.total_recipients || 0,
      sent: laravelCampaign.executed_at ? (laravelCampaign.contacts_count || 0) : 0,
      failed: 0,
      created_at: laravelCampaign.created_at || new Date().toISOString(),
      updated_at: laravelCampaign.updated_at || new Date().toISOString(),
      scheduled_at: laravelCampaign.scheduled_at,
      completed_at: laravelCampaign.executed_at,
      message_text: laravelCampaign.message_text || '',
      template_name: laravelCampaign.template_name,
      template_language: laravelCampaign.template_language,
    } as Campaign;
  }

  /**
   * Map Laravel API campaign to WACampaign format
   */
  private mapToWACampaign(laravelCampaign: any): WACampaign {
    return {
      campaign_id: laravelCampaign._uid || laravelCampaign.campaign_id || laravelCampaign.id,
      campaign_name: laravelCampaign.title || laravelCampaign.campaign_name || laravelCampaign.name || '',
      status: laravelCampaign.status || 'pending',
      total_recipients: laravelCampaign.contacts_count || laravelCampaign.total_recipients || 0,
      sent_count: laravelCampaign.executed_at ? (laravelCampaign.contacts_count || 0) : 0,
      failed_count: 0,
      created_at: laravelCampaign.created_at || new Date().toISOString(),
      completed_at: laravelCampaign.executed_at,
      message_text: laravelCampaign.message_text,
      template_name: laravelCampaign.template_name,
    };
  }

  /**
   * Get all campaigns using external Laravel API
   */
  async getCampaigns(query?: CampaignsListQuery): Promise<CampaignsListResponse> {
    try {
      console.log('📋 Fetching campaigns via external API:', query);

      // Call external API
      const response = await externalWhatsappService.getCampaigns({
        status: query?.status as 'active' | 'archived' | undefined,
      });

      // Normalize response - Laravel API may return different formats
      const raw = response;
      let campaigns: any[] = [];

      if (Array.isArray(raw)) {
        campaigns = raw;
      } else if (raw?.data && Array.isArray(raw.data)) {
        campaigns = raw.data;
      } else if (raw?.campaigns && Array.isArray(raw.campaigns)) {
        campaigns = raw.campaigns;
      }

      // Map to frontend format
      const mappedCampaigns = campaigns.map((c: any) => this.mapLaravelCampaign(c));

      console.log('✅ Campaigns fetched:', {
        total: mappedCampaigns.length,
        count: mappedCampaigns.length
      });

      return {
        total: mappedCampaigns.length,
        campaigns: mappedCampaigns,
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch campaigns:', error);
      const message = error.message || 'Failed to fetch campaigns';
      throw new Error(message);
    }
  }

  /**
   * Backend-aligned: List campaigns
   */
  async listCampaigns(query?: CampaignListQuery): Promise<WACampaignListResponse> {
    try {
      const response = await externalWhatsappService.getCampaigns({
        status: query?.status as 'active' | 'archived' | undefined,
      });

      // Normalize response
      const raw = response;
      let campaigns: any[] = [];

      if (Array.isArray(raw)) {
        campaigns = raw;
      } else if (raw?.data && Array.isArray(raw.data)) {
        campaigns = raw.data;
      } else if (raw?.campaigns && Array.isArray(raw.campaigns)) {
        campaigns = raw.campaigns;
      }

      const mappedCampaigns = campaigns.map((c: any) => this.mapToWACampaign(c));
      console.log('✅ Campaigns fetched (backend-aligned):', { count: mappedCampaigns.length });
      return mappedCampaigns;
    } catch (error: any) {
      console.error('❌ Failed to list campaigns:', error);
      const message = error.message || 'Failed to fetch campaigns';
      throw new Error(message);
    }
  }

  /**
   * Get campaign details by ID using external Laravel API
   */
  async getCampaign(id: string): Promise<CampaignDetail> {
    try {
      console.log('📋 Fetching campaign via external API:', id);

      const response = await externalWhatsappService.getCampaign(id);

      // Map to frontend format
      const campaign = response?.data || response;
      const mappedCampaign = this.mapLaravelCampaign(campaign);

      // Get campaign status for detailed stats
      try {
        const statusResponse = await externalWhatsappService.getCampaignStatus(id);
        mappedCampaign.sent = statusResponse.sent || statusResponse.delivered || 0;
        mappedCampaign.failed = statusResponse.failed || 0;
        mappedCampaign.total_recipients = statusResponse.total_recipients || mappedCampaign.total_recipients;
      } catch (statusError) {
        console.warn('⚠️ Could not fetch campaign status:', statusError);
      }

      console.log('✅ Campaign fetched:', {
        campaign_id: mappedCampaign.campaign_id,
        sent: mappedCampaign.sent,
        failed: mappedCampaign.failed
      });

      return mappedCampaign as CampaignDetail;
    } catch (error: any) {
      console.error('❌ Failed to fetch campaign:', error);

      if (error.message?.includes('not found')) {
        throw new Error('Campaign not found');
      }

      const message = error.message || 'Failed to fetch campaign';
      throw new Error(message);
    }
  }

  /**
   * Backend-aligned: Get single campaign
   */
  async getCampaignById(id: string): Promise<WACampaign> {
    try {
      const response = await externalWhatsappService.getCampaign(id);
      const campaign = response?.data || response;
      const mappedCampaign = this.mapToWACampaign(campaign);
      console.log('✅ Campaign fetched (backend-aligned):', { campaign_id: mappedCampaign.campaign_id });
      return mappedCampaign;
    } catch (error: any) {
      console.error('❌ Failed to fetch campaign (backend-aligned):', error);
      if (error.message?.includes('not found')) {
        throw new Error('Campaign not found');
      }
      const message = error.message || 'Failed to fetch campaign';
      throw new Error(message);
    }
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting campaign:', id);
      await externalWhatsappService.deleteCampaign(id);
      console.log('✅ Campaign deleted:', id);
    } catch (error: any) {
      console.error('❌ Failed to delete campaign:', error);
      throw error;
    }
  }

  /**
   * Archive a campaign
   */
  async archiveCampaign(id: string): Promise<void> {
    try {
      console.log('📦 Archiving campaign:', id);
      await externalWhatsappService.archiveCampaign(id);
      console.log('✅ Campaign archived:', id);
    } catch (error: any) {
      console.error('❌ Failed to archive campaign:', error);
      throw error;
    }
  }

  /**
   * Unarchive a campaign
   */
  async unarchiveCampaign(id: string): Promise<void> {
    try {
      console.log('📤 Unarchiving campaign:', id);
      await externalWhatsappService.unarchiveCampaign(id);
      console.log('✅ Campaign unarchived:', id);
    } catch (error: any) {
      console.error('❌ Failed to unarchive campaign:', error);
      throw error;
    }
  }

  /**
   * Get recent campaigns
   */
  async getRecentCampaigns(limit: number = 10): Promise<CampaignsListResponse> {
    const result = await this.getCampaigns({ limit });
    // Slice to limit if needed
    if (result.campaigns.length > limit) {
      result.campaigns = result.campaigns.slice(0, limit);
      result.total = limit;
    }
    return result;
  }

  /**
   * Send a broadcast campaign
   * Note: This may need to be implemented via a different endpoint
   * depending on the Laravel API structure
   */
  async sendBroadcast(payload: BroadcastCampaignPayload): Promise<BroadcastCampaignResponse> {
    try {
      const recipientInfo = {
        campaign_name: payload.campaign_name,
        direct_recipients: payload.recipients?.length || 0,
        contact_ids: payload.contact_ids?.length || 0,
        group_ids: payload.group_ids?.length || 0
      };

      console.log('📤 Sending broadcast campaign:', recipientInfo);

      // For now, throw an error indicating this needs Laravel API endpoint
      // The actual implementation depends on what endpoints are available
      throw new Error('Broadcast sending not yet implemented for external API. Please use template broadcast.');
    } catch (error: any) {
      console.error('❌ Failed to send broadcast:', error);
      throw error;
    }
  }

  /**
   * Backend-aligned: Create broadcast
   */
  async createBroadcast(payload: CreateCampaignPayload): Promise<WACampaign> {
    try {
      console.log('📤 Creating broadcast (backend-aligned):', {
        campaign_name: payload.campaign_name,
        direct_recipients: payload.recipients?.length || 0,
      });

      // This needs to be implemented based on Laravel API endpoints
      throw new Error('Broadcast creation not yet implemented for external API. Please use template broadcast.');
    } catch (error: any) {
      console.error('❌ Failed to create broadcast:', error);
      throw error;
    }
  }

  /**
   * Backend-aligned: Create template broadcast
   */
  async createTemplateBroadcast(payload: CreateTemplateCampaignPayload): Promise<WACampaign> {
    try {
      console.log('📤 Creating template broadcast:', {
        campaign_name: payload.campaign_name,
        template_name: payload.template_name,
      });

      // This needs to be implemented based on Laravel API endpoints
      throw new Error('Template broadcast creation not yet implemented for external API.');
    } catch (error: any) {
      console.error('❌ Failed to create template broadcast:', error);
      throw error;
    }
  }

  /**
   * Send template broadcast using bulk endpoint
   */
  async sendTemplateBroadcastBulk(payload: TemplateBroadcastBulkPayload): Promise<TemplateBroadcastBulkResponse> {
    try {
      console.log('📤 Sending template broadcast (bulk):', {
        campaign_name: payload.campaign_name,
        template_name: payload.template_name,
        recipients: payload.recipients?.length || 0
      });

      // This needs to be implemented based on Laravel API endpoints
      throw new Error('Bulk template broadcast not yet implemented for external API.');
    } catch (error: any) {
      console.error('❌ Failed to send template broadcast (bulk):', error);
      throw error;
    }
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
        message_text: message,
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
      message_text: '', // Message will be generated from template
      template_name: templateName,
      template_variables: variables,
    });
  }
}

export const campaignsService = new CampaignsService();
