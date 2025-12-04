'use client';

interface BedrockUsageChartProps {
  invocations: number;
  estimatedCost: number;
  byModel: Array<{ modelId: string; invocations: number }>;
}

export function BedrockUsageChart({ invocations, estimatedCost, byModel }: BedrockUsageChartProps) {
  if (invocations === 0) {
    return (
      <div className="text-center py-8 text-sm text-[var(--text-muted)]">
        No Bedrock invocations in this time period
      </div>
    );
  }

  const maxInvocations = Math.max(...byModel.map(m => m.invocations), 1);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">Total Invocations</div>
          <div className="text-2xl font-semibold text-[var(--text)]">
            {invocations.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">Estimated Cost</div>
          <div className="text-2xl font-semibold text-[var(--text)]">
            ${estimatedCost.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Model Breakdown */}
      {byModel.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-[var(--text)] mb-4">Usage by Model</h3>
          <div className="space-y-3">
            {byModel.map((model, idx) => {
              const percentage = (model.invocations / maxInvocations) * 100;
              const costPerModel = (model.invocations / invocations) * estimatedCost;
              
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text)] font-medium">
                      {model.modelId.includes('pegasus') || model.modelId.includes('Pegasus')
                        ? 'Pegasus (Participation Analysis)'
                        : model.modelId.includes('marengo') || model.modelId.includes('Marengo')
                        ? 'Marengo (Embeddings)'
                        : model.modelId}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-[var(--text-muted)]">
                        {model.invocations.toLocaleString()} invocations
                      </span>
                      <span className="text-[var(--text)] font-semibold">
                        ${costPerModel.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-[var(--accent)] to-indigo-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      <div className="pt-4 border-t border-[var(--border-subtle)]">
        <h3 className="text-sm font-medium text-[var(--text)] mb-3">Cost Breakdown</h3>
        <div className="text-xs text-[var(--text-muted)] space-y-1">
          <div>Input tokens: ~$0.001 per 1K tokens</div>
          <div>Output tokens: ~$0.003 per 1K tokens</div>
          <div className="pt-2 text-[10px] opacity-75">
            Note: Actual pricing varies by model. These are approximate estimates.
          </div>
        </div>
      </div>
    </div>
  );
}

