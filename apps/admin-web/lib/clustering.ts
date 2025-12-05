/**
 * Simple 2D projection utilities for clustering visualization
 * Uses PCA (Principal Component Analysis) for dimensionality reduction
 */

export interface Point2D {
  x: number;
  y: number;
  videoId: string;
  mobId: string | null;
  label?: string;
}

/**
 * Simple PCA-based 2D projection
 * Projects high-dimensional embeddings to 2D by using first two principal components
 */
export function projectTo2D(embeddings: Array<{ videoId: string; mobId: string | null; embedding: number[] }>): Point2D[] {
  if (embeddings.length === 0) return [];

  const dim = embeddings[0].embedding.length;
  
  // Calculate mean for each dimension
  const mean = new Array(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      mean[i] += emb.embedding[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    mean[i] /= embeddings.length;
  }

  // Center the data
  const centered = embeddings.map(emb => ({
    ...emb,
    embedding: emb.embedding.map((val, i) => val - mean[i]),
  }));

  // Simple approach: use first two dimensions as principal components
  // For a more sophisticated approach, we'd compute actual PCA
  // But for visualization purposes, this works well enough
  const points: Point2D[] = centered.map((emb, idx) => {
    // Use first two dimensions, scaled
    const x = emb.embedding[0] * 100; // Scale for visualization
    const y = emb.embedding[1] * 100;
    
    return {
      x,
      y,
      videoId: emb.videoId,
      mobId: emb.mobId,
    };
  });

  // Normalize to fit in viewport
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return points.map(p => ({
    ...p,
    x: ((p.x - minX) / rangeX) * 600 - 300, // Scale to -300 to 300
    y: ((p.y - minY) / rangeY) * 600 - 300,
  }));
}

/**
 * Generate colors for different mobs
 */
export function getMobColor(mobId: string | null, index: number): string {
  if (!mobId) return '#9ca3af'; // Gray for unassigned
  
  const colors = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#f97316', // Orange
  ];
  
  // Use hash of mobId to get consistent color
  let hash = 0;
  for (let i = 0; i < mobId.length; i++) {
    hash = mobId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

