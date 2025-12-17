// src/hooks/whatsapp/useCampaigns.ts
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { campaignsService } from '@/services/whatsapp/campaignsService';
import type {
  WACampaign,
  CampaignListQuery,
  CreateCampaignPayload,
  CreateTemplateCampaignPayload,
  TemplateBroadcastBulkPayload,
  TemplateBroadcastBulkResponse,
} from '@/types/whatsappTypes';

export interface UseCampaignsOptions {
  initialQuery?: CampaignListQuery;
  autoFetch?: boolean;
}

export interface UseCampaignsReturn {
  // Data
  campaigns: WACampaign[];
  count: number;

  // Query
  query: CampaignListQuery;

  // Loading
  isLoading: boolean;
  isCreating: boolean;

  // Error
  error: string | null;

  // Actions
  fetchCampaigns: (newQuery?: CampaignListQuery) => Promise<void>;
  createCampaign: (payload: CreateCampaignPayload) => Promise<WACampaign | null>;
  createTemplateCampaign: (payload: CreateTemplateCampaignPayload) => Promise<WACampaign | null>;
  sendTemplateBroadcastBulk: (payload: TemplateBroadcastBulkPayload) => Promise<TemplateBroadcastBulkResponse | null>;
  getCampaign: (campaignId: string) => Promise<WACampaign | null>;
  refetch: () => Promise<void>;

  // Helpers
  successRate: (c: WACampaign) => number;
  stats: (c: WACampaign) => {
    total_recipients: number;
    sent: number;
    failed: number;
    success_rate: number;
    failure_rate: number;
  };
}

const defaultQuery: CampaignListQuery = {
  skip: 0,
  limit: 50,
};

export function useCampaigns(options: UseCampaignsOptions = {}): UseCampaignsReturn {
  const { initialQuery = defaultQuery, autoFetch = true } = options;

  // State
  const [campaigns, setCampaigns] = useState<WACampaign[]>([]);
  const [query, setQuery] = useState<CampaignListQuery>(initialQuery);

  // Loading / error
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async (newQuery?: CampaignListQuery) => {
    try {
      setIsLoading(true);
      setError(null);

      const q = newQuery ?? query;
      const data = await campaignsService.listCampaigns(q);

      setCampaigns(Array.isArray(data) ? data : []);
      if (newQuery) setQuery(newQuery);
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch campaigns';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const createCampaign = useCallback(async (payload: CreateCampaignPayload) => {
    try {
      setIsCreating(true);
      setError(null);

      const created = await campaignsService.createBroadcast(payload);
      // Optimistic prepend
      setCampaigns((prev) => [created, ...prev]);
      toast.success(`Campaign "${created.campaign_name || created.campaign_id}" created`);
      return created;
    } catch (err: any) {
      const msg = err?.message || 'Failed to create campaign';
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const createTemplateCampaign = useCallback(async (payload: CreateTemplateCampaignPayload) => {
    try {
      setIsCreating(true);
      setError(null);

      const created = await campaignsService.createTemplateBroadcast(payload);
      // Optimistic prepend
      setCampaigns((prev) => [created, ...prev]);
      toast.success(`Template campaign "${created.campaign_name || created.campaign_id}" created`);
      return created;
    } catch (err: any) {
      const msg = err?.message || 'Failed to create template campaign';
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * NEW: Send template broadcast using bulk send endpoint (bypasses 24hr window)
   */
  const sendTemplateBroadcastBulk = useCallback(async (payload: TemplateBroadcastBulkPayload) => {
    try {
      setIsCreating(true);
      setError(null);

      const result = await campaignsService.sendTemplateBroadcastBulk(payload);

      toast.success(
        `Campaign "${result.campaign_name}" sent: ${result.sent}/${result.total} successful`,
        { duration: 5000 }
      );

      // Refresh campaigns list to show the new campaign
      await fetchCampaigns();

      return result;
    } catch (err: any) {
      const msg = err?.message || 'Failed to send template broadcast';
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [fetchCampaigns]);

  const getCampaign = useCallback(async (campaignId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const item = await campaignsService.getCampaignById(campaignId);
      return item;
    } catch (err: any) {
      const msg = err?.message || 'Failed to load campaign';
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchCampaigns();
  }, [fetchCampaigns]);

  // Helpers
  const successRate = useCallback((c: WACampaign) => {
    return campaignsService.calculateSuccessRate(c);
  }, []);

  const stats = useCallback((c: WACampaign) => {
    return campaignsService.getCampaignStats(c) as {
      total_recipients: number;
      sent: number;
      failed: number;
      success_rate: number;
      failure_rate: number;
    };
  }, []);

  // Auto-load
  useEffect(() => {
    if (autoFetch) {
      fetchCampaigns();
    }
  }, [autoFetch, fetchCampaigns]);

  return {
    campaigns,
    count: campaigns.length,
    query,
    isLoading,
    isCreating,
    error,
    fetchCampaigns,
    createCampaign,
    createTemplateCampaign,
    sendTemplateBroadcastBulk,
    getCampaign,
    refetch,
    successRate,
    stats,
  };
}