import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';

const DistributorPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout(navigate);
  };

  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

  return (
    <div className="distributor-container">
      <div className="dashboard-header">
        <h1>Distributor Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {userInfo.username}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Product Catalog</h3>
            <p>Manage your product inventory, add new frames, and update product information.</p>
            <button 
              className="action-button"
              onClick={() => navigate('/distributor/products')}
            >
              Manage Products
            </button>
          </div>

          <div className="dashboard-card">
            <h3>Shop Management</h3>
            <p>Create new shops, manage shop information, and set up user accounts for shop owners.</p>
            <button 
              className="action-button"
              onClick={() => navigate('/distributor/shops')}
            >
              Manage Shops
            </button>
          </div>

          <div className="dashboard-card">
            <h3>Inventory Distribution</h3>
            <p>Distribute products to shops and track inventory levels across your network.</p>
            <button 
              className="action-button"
              onClick={() => navigate('/distributor/inventory-distribution')}
            >
              Manage Distribution
            </button>
          </div>

          <div className="dashboard-card">
            <h3>Sales Analytics</h3>
            <p>View sales reports, track performance, and analyze trends across all shops.</p>
            <button 
              className="action-button"
              onClick={() => navigate('/distributor/analytics')}
            >
              View Analytics
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DistributorPage; 