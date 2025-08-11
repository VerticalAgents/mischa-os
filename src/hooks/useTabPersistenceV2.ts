
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
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set(urlParamName, activeTab);
      setSearchParams(newSearchParams, { replace: true });
    }
  }, []);

  const changeTab = useCallback((newTab: string) => {
    console.log('📋 Mudando para aba:', newTab, 'em', pathname);
    setActiveTab(newTab);
    localStorage.setItem(tabKey, newTab);
    
    // Atualizar URL sem reload
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set(urlParamName, newTab);
    setSearchParams(newSearchParams, { replace: true });
  }, [tabKey, pathname, searchParams, setSearchParams, urlParamName]);

  const clearTabPersistence = useCallback(() => {
    localStorage.removeItem(tabKey);
    setActiveTab(defaultTab);
    
    // Remover da URL também
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete(urlParamName);
    setSearchParams(newSearchParams, { replace: true });
  }, [tabKey, defaultTab, searchParams, setSearchParams, urlParamName]);

  return {
    activeTab,
    changeTab,
    clearTabPersistence
  };
};
