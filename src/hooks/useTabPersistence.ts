
import { useEffect, useState, useCallback } from 'react';
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

  // Use useCallback to prevent function recreation on every render
  const changeTab = useCallback((newTab: string) => {
    console.log('📋 Mudando para aba:', newTab, 'em', location.pathname);
    setActiveTab(newTab);
    localStorage.setItem(tabKey, newTab);
  }, [tabKey, location.pathname]);

  const changeSubtab = useCallback((newSubtab: string) => {
    console.log('📋 Mudando para subaba:', newSubtab, 'em', location.pathname);
    setActiveSubtab(newSubtab);
    localStorage.setItem(subtabKey, newSubtab);
  }, [subtabKey, location.pathname]);

  const clearTabPersistence = useCallback(() => {
    localStorage.removeItem(tabKey);
    localStorage.removeItem(subtabKey);
    setActiveTab(defaultTab);
    setActiveSubtab(defaultSubtab || '');
  }, [tabKey, subtabKey, defaultTab, defaultSubtab]);

  // Remove the useEffect that was causing potential loops

  return {
    activeTab,
    activeSubtab,
    changeTab,
    changeSubtab,
    clearTabPersistence
  };
};
