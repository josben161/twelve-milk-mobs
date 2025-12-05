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
  twelveLabsData?: {
    participation?: {
      participationScore?: number;
      mentionsMilk?: boolean;
      showsMilkObject?: boolean;
      showsActionAligned?: boolean;
      rationale?: string;
      highlights?: Array<{ timestamp: number; description: string; score?: number }>;
    };
    embedding?: {
      dim?: number;
      vectorLength?: number;
    };
    validation?: {
      status?: string;
      validationScore?: number;
      reasons?: string[];
    };
    clustering?: {
      mobId?: string;
      method?: 'embedding' | 'keyword';
      similarityScore?: number;
    };
  };
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
  const url = `${apiBase}/execution-history?videoId=${encodeURIComponent(videoId)}`;
  
  console.log('[getExecutionHistory] ===== START REQUEST =====');
  console.log('[getExecutionHistory] videoId:', videoId);
  console.log('[getExecutionHistory] API Base:', apiBase);
  console.log('[getExecutionHistory] Full URL:', url);
  console.log('[getExecutionHistory] Timestamp:', new Date().toISOString());
  
  try {
    const startTime = Date.now();
    const res = await fetch(url);
    const duration = Date.now() - startTime;

    console.log('[getExecutionHistory] Response received:', {
      status: res.status,
      statusText: res.statusText,
      duration: `${duration}ms`,
      headers: Object.fromEntries(res.headers.entries()),
    });

    // Always read the response body (even on errors) for debugging
    const responseText = await res.text();
    console.log('[getExecutionHistory] Response body (raw):', responseText.substring(0, 500));

    if (!res.ok) {
      let errorData: any;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = responseText;
      }
      
      console.error('[getExecutionHistory] ===== ERROR RESPONSE =====');
      console.error('[getExecutionHistory] Status:', res.status);
      console.error('[getExecutionHistory] Error data:', errorData);
      console.error('[getExecutionHistory] Full response text:', responseText);
      
      const error = new Error(`Failed to fetch execution history (${res.status}): ${typeof errorData === 'string' ? errorData : JSON.stringify(errorData)}`);
      (error as any).status = res.status;
      (error as any).responseData = errorData;
      throw error;
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('[getExecutionHistory] Failed to parse JSON response:', parseErr);
      console.error('[getExecutionHistory] Response text:', responseText);
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
    }

    console.log('[getExecutionHistory] ===== SUCCESS RESPONSE =====');
    console.log('[getExecutionHistory] Parsed data structure:', {
      hasExecution: !!data.execution,
      executionArn: data.execution?.executionArn,
      executionStatus: data.execution?.status,
      stepsCount: data.execution?.steps?.length || 0,
      stepIds: data.execution?.steps?.map((s: any) => s.id) || [],
      message: data.message,
    });
    console.log('[getExecutionHistory] Full response data:', JSON.stringify(data, null, 2));
    console.log('[getExecutionHistory] ===== END REQUEST =====');

    return data;
  } catch (err) {
    console.error('[getExecutionHistory] ===== FETCH ERROR =====');
    console.error('[getExecutionHistory] Error type:', err instanceof Error ? err.constructor.name : typeof err);
    console.error('[getExecutionHistory] Error message:', err instanceof Error ? err.message : String(err));
    console.error('[getExecutionHistory] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    if (err instanceof Error && 'status' in err) {
      console.error('[getExecutionHistory] HTTP Status:', (err as any).status);
    }
    if (err instanceof Error && 'responseData' in err) {
      console.error('[getExecutionHistory] Response data:', (err as any).responseData);
    }
    console.error('[getExecutionHistory] ===== END ERROR =====');
    throw err;
  }
}

export async function deleteVideo(videoId: string): Promise<{ success: boolean; message: string; videoId: string }> {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/admin/videos/${encodeURIComponent(videoId)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to delete video' }));
    throw new Error(errorData.error || `Failed to delete video (${res.status})`);
  }

  return res.json();
}

export interface VideoEmbedding {
  videoId: string;
  mobId: string | null;
  embedding: number[];
  userHandle?: string;
  thumbnailUrl?: string;
}

export async function getEmbeddings(mobId?: string, limit?: number): Promise<{ videos: VideoEmbedding[]; count: number }> {
  const apiBase = getApiBase();
  const params = new URLSearchParams();
  if (mobId) params.append('mobId', mobId);
  if (limit) params.append('limit', limit.toString());

  const url = `${apiBase}/admin/embeddings${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch embeddings (${res.status})`);
  }

  return res.json();
}

