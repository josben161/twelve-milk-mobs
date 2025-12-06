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
 * Compute dot product of two vectors
 */
function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

/**
 * Normalize a vector
 */
function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(dotProduct(vector, vector));
  if (norm === 0) return vector;
  return vector.map(v => v / norm);
}

/**
 * Power iteration to find principal component
 * Finds the eigenvector corresponding to the largest eigenvalue
 */
function powerIteration(
  matrix: number[][],
  dim: number,
  iterations: number = 100,
  orthogonal?: number[]
): number[] {
  // Initialize with random vector
  let vector = new Array(dim).fill(0).map(() => Math.random() - 0.5);
  vector = normalize(vector);
  
  for (let i = 0; i < iterations; i++) {
    // Multiply matrix by vector: newVector = matrix * vector
    const newVector = new Array(dim).fill(0);
    for (let j = 0; j < dim; j++) {
      for (let k = 0; k < dim; k++) {
        newVector[j] += matrix[j][k] * vector[k];
      }
    }
    
    // Orthogonalize if needed (for second principal component)
    if (orthogonal) {
      const proj = dotProduct(newVector, orthogonal);
      for (let j = 0; j < dim; j++) {
        newVector[j] -= proj * orthogonal[j];
      }
    }
    
    // Normalize
    vector = normalize(newVector);
  }
  
  return vector;
}

/**
 * Compute covariance matrix from centered data
 */
function computeCovarianceMatrix(centered: number[][], dim: number, n: number): number[][] {
  const covariance: number[][] = [];
  
  for (let i = 0; i < dim; i++) {
    covariance[i] = new Array(dim).fill(0);
    for (let j = 0; j < dim; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += centered[k][i] * centered[k][j];
      }
      covariance[i][j] = sum / (n - 1);
    }
  }
  
  return covariance;
}

/**
 * Proper PCA-based 2D projection
 * Computes actual principal components using covariance matrix and power iteration
 */
export function projectTo2D(embeddings: Array<{ videoId: string; mobId: string | null; embedding: number[] }>): Point2D[] {
  if (embeddings.length === 0) return [];
  
  // Handle single point case
  if (embeddings.length === 1) {
    return [{
      x: 0,
      y: 0,
      videoId: embeddings[0].videoId,
      mobId: embeddings[0].mobId,
    }];
  }

  const dim = embeddings[0].embedding.length;
  const n = embeddings.length;
  
  // Calculate mean for each dimension
  const mean = new Array(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      mean[i] += emb.embedding[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    mean[i] /= n;
  }

  // Center the data
  const centered = embeddings.map(emb => 
    emb.embedding.map((val, i) => val - mean[i])
  );

  // Compute covariance matrix
  const covariance = computeCovarianceMatrix(centered, dim, n);

  // Find first principal component
  const pc1 = powerIteration(covariance, dim, 100);
  
  // Find second principal component (orthogonal to first)
  const pc2 = powerIteration(covariance, dim, 100, pc1);

  // Project data onto principal components
  const points: Point2D[] = embeddings.map((emb, idx) => {
    const centeredEmb = emb.embedding.map((val, i) => val - mean[i]);
    
    const x = dotProduct(centeredEmb, pc1);
    const y = dotProduct(centeredEmb, pc2);
    
    return {
      x,
      y,
      videoId: emb.videoId,
      mobId: emb.mobId,
    };
  });

  // Normalize to fit in viewport with padding
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const padding = 0.1; // 10% padding on each side

  return points.map(p => ({
    ...p,
    x: ((p.x - minX) / rangeX) * (1 - 2 * padding) * 600 - 300 + padding * 600,
    y: ((p.y - minY) / rangeY) * (1 - 2 * padding) * 600 - 300 + padding * 600,
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

