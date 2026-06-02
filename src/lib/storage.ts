import type { Campaign, ApiCredentials } from '@/types';

const CAMPAIGNS_KEY = 'fm_campaigns';
const CREDS_KEY = 'fm_credentials';

export function saveCampaign(campaign: Campaign): void {
  const all = getCampaigns();
  const idx = all.findIndex((c) => c.id === campaign.id);
  if (idx >= 0) all[idx] = campaign;
  else all.unshift(campaign);
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(all));
}

export function getCampaigns(): Campaign[] {
  try {
    return JSON.parse(localStorage.getItem(CAMPAIGNS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function getCampaign(id: string): Campaign | undefined {
  return getCampaigns().find((c) => c.id === id);
}

export function deleteCampaign(id: string): void {
  const all = getCampaigns().filter((c) => c.id !== id);
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(all));
}

export function saveCredentials(creds: ApiCredentials): void {
  localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
}

export function getCredentials(): ApiCredentials | null {
  try {
    return JSON.parse(localStorage.getItem(CREDS_KEY) ?? 'null');
  } catch {
    return null;
  }
}
