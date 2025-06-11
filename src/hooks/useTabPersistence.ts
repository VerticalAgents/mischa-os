
import { useEffect, useState } from 'react';

const TAB_STORAGE_KEY = 'currentActiveTab';
const SUBTAB_STORAGE_KEY = 'currentActiveSubtab';

export const useTabPersistence = (defaultTab: string, defaultSubtab?: string) => {
  const [activeTab, setActiveTab] = useState(() => {
    // Tentar recuperar a aba salva do localStorage
    const savedTab = localStorage.getItem(TAB_STORAGE_KEY);
    return savedTab || defaultTab;
  });

  const [activeSubtab, setActiveSubtab] = useState(() => {
    // Tentar recuperar a subaba salva do localStorage
    const savedSubtab = localStorage.getItem(SUBTAB_STORAGE_KEY);
    return savedSubtab || defaultSubtab || '';
  });

  // Salvar aba ativa no localStorage sempre que mudar
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem(TAB_STORAGE_KEY, activeTab);
      console.log('🔄 Salvando aba ativa:', activeTab);
    }
  }, [activeTab]);

  // Salvar subaba ativa no localStorage sempre que mudar
  useEffect(() => {
    if (activeSubtab) {
      localStorage.setItem(SUBTAB_STORAGE_KEY, activeSubtab);
      console.log('🔄 Salvando subaba ativa:', activeSubtab);
    }
  }, [activeSubtab]);

  const changeTab = (newTab: string) => {
    console.log('📋 Mudando para aba:', newTab);
    setActiveTab(newTab);
  };

  const changeSubtab = (newSubtab: string) => {
    console.log('📋 Mudando para subaba:', newSubtab);
    setActiveSubtab(newSubtab);
  };

  const clearTabPersistence = () => {
    localStorage.removeItem(TAB_STORAGE_KEY);
    localStorage.removeItem(SUBTAB_STORAGE_KEY);
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
