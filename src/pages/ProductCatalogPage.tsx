import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCatalog from '../components/ProductCatalog';
import { logout } from '../utils/auth';

const ProductCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    logout(navigate);
  };

  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

  return (
    <div className="distributor-container">
      <header className="dashboard-header">
        <h1>Product Catalog Management</h1>
        <div className="user-info">
          <span>Welcome, {userInfo.username}</span>
          <button onClick={() => window.history.back()} className="back-button">
            Back to Dashboard
          </button>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>
      
      <main className="dashboard-main">
        <ProductCatalog />
      </main>
    </div>
  );
};

export default ProductCatalogPage; 