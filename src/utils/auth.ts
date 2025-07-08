import { NavigateFunction } from 'react-router-dom';

/**
 * Handles user logout by clearing authentication tokens and user info from
 * local storage, then navigates the user to the homepage.
 *
 * @param navigate - The navigate function from react-router-dom.
 */
export const logout = (navigate: NavigateFunction) => {
  // Clear all authentication-related items from local storage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
  
  // Navigate to the homepage (login page)
  navigate('/');
}; 