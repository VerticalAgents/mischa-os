// PR-C: Cache versioning para invalidar caches corrompidos

const SCHEMA_VERSION = 'clientes.v3';
const CACHE_PREFIX = 'cliente_app_';

// Função para verificar e limpar cache quando schema mudar
export function checkAndClearOutdatedCache(): void {
  try {
    const currentVersion = localStorage.getItem(`${CACHE_PREFIX}schemaVersion`);
    
    if (currentVersion !== SCHEMA_VERSION) {
      console.log('🔄 [Cache] Schema desatualizado, limpando cache...', {
        currentVersion,
        expectedVersion: SCHEMA_VERSION
      });
      
      // Limpar todas as chaves relacionadas ao cliente
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX) || 
            key.includes('cliente') || 
            key.includes('Client') ||
            key.includes('form_data')) {
          localStorage.removeItem(key);
        }
      });
      
      // Definir nova versão
      localStorage.setItem(`${CACHE_PREFIX}schemaVersion`, SCHEMA_VERSION);
      localStorage.setItem(`${CACHE_PREFIX}lastClearDate`, new Date().toISOString());
      
      console.log('✅ [Cache] Cache limpo e versão atualizada');
    }
  } catch (error) {
    console.warn('⚠️ [Cache] Erro ao verificar versão do cache:', error);
  }
}

// Função para purgar IndexedDB relacionado a clientes
export async function clearIndexedDBClientData(): Promise<void> {
  try {
    if ('indexedDB' in window) {
      // Tentar deletar DBs conhecidos que podem conter dados de cliente
      const dbsToDelete = ['lovable-client-cache', 'supabase-cache', 'app-cache'];
      
      for (const dbName of dbsToDelete) {
        try {
          await new Promise<void>((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase(dbName);
            deleteReq.onsuccess = () => resolve();
            deleteReq.onerror = () => resolve(); // Não falhar se DB não existir
            deleteReq.onblocked = () => resolve();
          });
        } catch (err) {
          // Silenciosamente continuar se não conseguir deletar
        }
      }
      
      console.log('✅ [Cache] IndexedDB relacionado a clientes limpo');
    }
  } catch (error) {
    console.warn('⚠️ [Cache] Erro ao limpar IndexedDB:', error);
  }
}

// Função para inicializar verificação de cache (chamar no app start)
export function initializeCacheVersioning(): void {
  checkAndClearOutdatedCache();
  clearIndexedDBClientData();
}