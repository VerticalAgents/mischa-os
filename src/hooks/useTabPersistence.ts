
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const getTabStorageKey = (pathname: string) => `tab_${pathname.replace(/\//g, '_')}`;
const getSubtabStorageKey = (pathname: string) => `subtab_${pathname.replace(/\//g, '_')}`;

export const useTabPersistence = (defaultTab: string, defaultSubtab?: string) => {
  const location = useLocation();
  const tabKey = getTabStorageKey(location.pathname);
  const subtabKey = getSubtabStorageKey(location.pathname);

  const [activeTab, setActiveTab] = useState(() => {
    // Recuperar a aba salva específica para esta rota
    const savedTab = localStorage.getItem(tabKey);
    return savedTab || defaultTab;
  });

  const [activeSubtab, setActiveSubtab] = useState(() => {
    // Recuperar a subaba salva específica para esta rota
    const savedSubtab = localStorage.getItem(subtabKey);
    return savedSubtab || defaultSubtab || '';
  });

  // Salvar aba ativa no localStorage sempre que mudar
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem(tabKey, activeTab);
      console.log('🔄 Salvando aba ativa para', location.pathname, ':', activeTab);
    }
  }, [activeTab, tabKey, location.pathname]);

  // Salvar subaba ativa no localStorage sempre que mudar
  useEffect(() => {
    if (activeSubtab) {
      localStorage.setItem(subtabKey, activeSubtab);
      console.log('🔄 Salvando subaba ativa para', location.pathname, ':', activeSubtab);
    }
  }, [activeSubtab, subtabKey, location.pathname]);

  const changeTab = (newTab: string) => {
    console.log('📋 Mudando para aba:', newTab, 'em', location.pathname);
    setActiveTab(newTab);
  };

  const changeSubtab = (newSubtab: string) => {
    console.log('📋 Mudando para subaba:', newSubtab, 'em', location.pathname);
    setActiveSubtab(newSubtab);
  };

  const clearTabPersistence = () => {
    localStorage.removeItem(tabKey);
    localStorage.removeItem(subtabKey);
    setActiveTab(defaultTab);
    setActiveSubtab(defaultSubtab || '');
  };

  return {
    activeTab,
    activeSubtab,
    changeTab,
    changeSubtab,
    clearTabPersistence
  };
};
