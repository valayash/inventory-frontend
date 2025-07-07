import React from 'react';
import ProductCatalog from '../components/ProductCatalog';

const ProductCatalogPage: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    window.location.href = '/';
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