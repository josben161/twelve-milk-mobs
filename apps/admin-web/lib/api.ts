import type { AdminStats } from '@twelve/core-types';

export const getApiBase = () => {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  if (!apiBase) {
    // Clear message for both users and developers on how to fix this.
    throw new Error(
      'API base URL is not configured. Set NEXT_PUBLIC_API_BASE to the MilkMobs API Gateway base URL (see CloudFormation output ApiBaseUrl).'
    );
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

export interface ExecutionStep {
  id: string;
  name: string;
  type: string;
  status: 'succeeded' | 'failed' | 'in_progress' | 'not_started';
  startTime?: string;
  endTime?: string;
  error?: string;
}

export interface ExecutionGraph {
  executionArn: string;
  status: string;
  startDate: string;
  stopDate?: string;
  steps: ExecutionStep[];
}

export async function getExecutionHistory(videoId: string): Promise<{ execution: ExecutionGraph | null }> {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/execution-history?videoId=${encodeURIComponent(videoId)}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch execution history (${res.status})`);
  }

  return res.json();
}

