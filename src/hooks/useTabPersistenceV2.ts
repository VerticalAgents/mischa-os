
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const getTabStorageKey = (pathname: string) => `tab_${pathname.replace(/\//g, '_')}`;

export const useTabPersistenceV2 = (defaultTab: string, urlParamName = 'tab') => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pathname = window.location.pathname;
  const tabKey = getTabStorageKey(pathname);

  const [activeTab, setActiveTab] = useState(() => {
    // Prioridade: URL > localStorage > default
    const tabFromUrl = searchParams.get(urlParamName);
    if (tabFromUrl) return tabFromUrl;
    
    const savedTab = localStorage.getItem(tabKey);
    return savedTab || defaultTab;
  });

  // Sincronizar com URL ao montar
  useEffect(() => {
    const tabFromUrl = searchParams.get(urlParamName);
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
      localStorage.setItem(tabKey, tabFromUrl);
    } else if (!tabFromUrl && activeTab !== defaultTab) {
      // Se não há tab na URL mas temos uma salva, atualizar URL
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set(urlParamName, activeTab);
        return newParams;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeTab = useCallback((newTab: string) => {
    console.log('📋 Mudando para aba:', newTab, 'em', pathname);
    setActiveTab(newTab);
    localStorage.setItem(tabKey, newTab);
    
    // Atualizar URL sem reload preservando outros parâmetros
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set(urlParamName, newTab);
      return newParams;
    }, { replace: true });
  }, [tabKey, pathname, setSearchParams, urlParamName]);

  const clearTabPersistence = useCallback(() => {
    localStorage.removeItem(tabKey);
    setActiveTab(defaultTab);
    
    // Remover da URL também preservando outros parâmetros
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.delete(urlParamName);
      return newParams;
    }, { replace: true });
  }, [tabKey, defaultTab, setSearchParams, urlParamName]);

  return {
    activeTab,
    changeTab,
    clearTabPersistence
  };
};
