
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const VALID_TABS = ['representantes', 'funil-leads', 'distribuidores', 'parceiros'] as const;
type ValidTab = typeof VALID_TABS[number];

interface TabState {
  activeTab: ValidTab;
  loadedTabs: Set<ValidTab>;
  isTabActive: (tab: ValidTab) => boolean;
  isTabLoaded: (tab: ValidTab) => boolean;
  setActiveTab: (tab: ValidTab) => void;
  markTabAsLoaded: (tab: ValidTab) => void;
}

export const useGestaoComercialTabs = (): TabState => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState<ValidTab>('representantes');
  const [loadedTabs, setLoadedTabs] = useState<Set<ValidTab>>(new Set(['representantes']));

  // Sync with URL on mount (apenas reagir a mudanças na URL)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as ValidTab;
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) {
      setActiveTabState(tabFromUrl);
      setLoadedTabs(prev => new Set([...prev, tabFromUrl]));
    } else if (!searchParams.get('tab')) {
      // Set default tab in URL preservando outros parâmetros
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('tab', 'representantes');
        return newParams;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('tab')]);

  const setActiveTab = useCallback((tab: ValidTab) => {
    setActiveTabState(tab);
    setLoadedTabs(prev => new Set([...prev, tab]));
    
    // Update URL preservando outros parâmetros
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  const markTabAsLoaded = useCallback((tab: ValidTab) => {
    setLoadedTabs(prev => new Set([...prev, tab]));
  }, []);

  const isTabActive = useCallback((tab: ValidTab) => {
    return activeTab === tab;
  }, [activeTab]);

  const isTabLoaded = useCallback((tab: ValidTab) => {
    return loadedTabs.has(tab);
  }, [loadedTabs]);

  return {
    activeTab,
    loadedTabs,
    isTabActive,
    isTabLoaded,
    setActiveTab,
    markTabAsLoaded
  };
};
