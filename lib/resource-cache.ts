// Resource data cache to prevent refetching
const resourceCache = new Map<string, unknown>();

export function getCachedResource<T>(key: string): T | null {
  return (resourceCache.get(key) as T) || null;
}

export function setCachedResource(key: string, data: unknown): void {
  resourceCache.set(key, data);
}

export function clearResourceCache(): void {
  resourceCache.clear();
}

// Prefetch resource data before modal opens (on hover)
export async function prefetchResource(
  type: 'slides' | 'flashcards' | 'quiz' | 'video',
  partId: string
): Promise<void> {
  const cacheKey = `${type}-${partId}`;
  
  // Already cached
  if (resourceCache.has(cacheKey)) return;

  try {
    const endpoint = type === 'video' 
      ? `/api/part/${partId}/assets`
      : `/api/${type}/${partId}`;
      
    const response = await fetch(endpoint);
    if (!response.ok) return;
    
    const data = await response.json();
    resourceCache.set(cacheKey, data);
  } catch (error) {
    console.error(`Failed to prefetch ${type}:`, error);
  }
}
