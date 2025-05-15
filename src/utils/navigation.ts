
import { useNavigate } from 'react-router-dom';

/**
 * Helper utility for navigation between pages
 */
export const navigateToPage = (navigate: ReturnType<typeof useNavigate>, page: string) => {
  navigate(`/${page}`);
};

/**
 * Special navigation to ensure data flows between pages
 */
export const navigateWithData = (navigate: ReturnType<typeof useNavigate>, page: string, data: any) => {
  // Store data in sessionStorage
  sessionStorage.setItem('pageNavigationData', JSON.stringify(data));
  
  // Navigate to page
  navigate(`/${page}`);
};

/**
 * Get data from previous navigation
 */
export const getNavigationData = () => {
  const data = sessionStorage.getItem('pageNavigationData');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Error parsing navigation data:", e);
      return null;
    }
  }
  return null;
};

/**
 * Clear navigation data
 */
export const clearNavigationData = () => {
  sessionStorage.removeItem('pageNavigationData');
};
