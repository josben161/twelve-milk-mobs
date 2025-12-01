import type { AdminStats } from '@twelve/core-types';

const getApiBase = () => {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  if (!apiBase) {
    throw new Error('API base URL is not configured');
  }
  return apiBase.replace(/\/$/, '');
};

export async function getDashboardStats(): Promise<AdminStats> {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/admin/stats`);

  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard stats (${res.status})`);
  }

  return res.json();
}

export async function getUsageStats(timeRange: string): Promise<any> {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/admin/usage-stats?timeRange=${timeRange}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch usage stats (${res.status})`);
  }

  return res.json();
}

