import type { Campaign, ApiCredentials, LeadGroup } from '@/types';

const CAMPAIGNS_KEY = 'fm_campaigns';
const CREDS_KEY = 'fm_credentials';
const GROUPS_KEY = 'fm_lead_groups';

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

export function saveLeadGroup(group: LeadGroup): void {
  const all = getLeadGroups();
  const idx = all.findIndex((g) => g.id === group.id);
  if (idx >= 0) all[idx] = group;
  else all.unshift(group);
  localStorage.setItem(GROUPS_KEY, JSON.stringify(all));
}

export function getLeadGroups(): LeadGroup[] {
  try {
    return JSON.parse(localStorage.getItem(GROUPS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function getLeadGroup(id: string): LeadGroup | undefined {
  return getLeadGroups().find((g) => g.id === id);
}

export function deleteLeadGroup(id: string): void {
  const all = getLeadGroups().filter((g) => g.id !== id);
  localStorage.setItem(GROUPS_KEY, JSON.stringify(all));
}
