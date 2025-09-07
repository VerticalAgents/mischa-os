import { useState, useEffect, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface QuantidadesCache {
  separadas: Record<string, number>;
  despachadas: Record<string, number>;
}

// Cache TTL de 2 minutos
const CACHE_TTL = 2 * 60 * 1000;

export const useQuantidadesCache = () => {
  const [cache, setCache] = useState<Map<string, CacheItem<QuantidadesCache>>>(new Map());

  const isExpired = useCallback((item: CacheItem<any>): boolean => {
    return Date.now() - item.timestamp > item.ttl;
  }, []);

  const getFromCache = useCallback((key: string): QuantidadesCache | null => {
    const item = cache.get(key);
    if (!item) return null;
    
    if (isExpired(item)) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }
    
    return item.data;
  }, [cache, isExpired]);

  const setToCache = useCallback((key: string, data: QuantidadesCache) => {
    const item: CacheItem<QuantidadesCache> = {
      data,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    };
    
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, item);
      return newCache;
    });
  }, []);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  // Limpar cache expirado a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCache(prev => {
        const newCache = new Map(prev);
        for (const [key, item] of newCache.entries()) {
          if (isExpired(item)) {
            newCache.delete(key);
          }
        }
        return newCache;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [isExpired]);

  return {
    getFromCache,
    setToCache,
    clearCache
  };
};