
import { useEffect } from 'react';

export const useTabPersistenceV2 = (
  key: string,
  activeTab: string,
  setActiveTab: (tab: string) => void
) => {
  // Save tab when it changes
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem(`${key}-active-tab`, activeTab);
    }
  }, [key, activeTab]);

  // Restore tab on mount
  useEffect(() => {
    const savedTab = localStorage.getItem(`${key}-active-tab`);
    if (savedTab && savedTab !== activeTab) {
      setActiveTab(savedTab);
    }
  }, [key, setActiveTab]);
};
