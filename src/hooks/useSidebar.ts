
import { useState } from 'react';

export const useSidebar = () => {
  const [showFullContent, setShowFullContent] = useState(false);

  const toggleSidebar = () => {
    setShowFullContent(!showFullContent);
  };

  return {
    showFullContent,
    toggleSidebar,
  };
};
