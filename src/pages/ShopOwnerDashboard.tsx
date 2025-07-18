import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { logout } from '../utils/auth';
import { Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8001/api';

interface DashboardSummary {
  total_sales_current_month: number;
  total_revenue_current_month: string;
  items_in_stock: number;
  shop_name: string;
}

interface TopProduct {
  frame_name: string;
  product_id: string;
  sales_count: number;
}

const ShopOwnerDashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch dashboard summary
      const [summaryResponse, topProductsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard/shop/summary/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/dashboard/shop/top-products/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      setSummary(summaryResponse.data);
      setTopProducts(topProductsResponse.data.top_products || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout(navigate);
  };

  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

  if (loading) {
    return (
      <div className="shop-owner-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="shop-owner-container">
      <header className="dashboard-header">
        <h1>Shop Owner Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {userInfo.username}</span>
          {summary?.shop_name && (
            <span className="shop-name"> - {summary.shop_name}</span>
          )}
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <main className="dashboard-main">
        {/* Key Metrics */}
        {summary && (
          <div className="metrics-section">
            <h2>This Month's Performance</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{summary.total_sales_current_month}</div>
                <div className="metric-label">Total Sales</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">${parseFloat(summary.total_revenue_current_month).toFixed(2)}</div>
                <div className="metric-label">Revenue</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{summary.items_in_stock}</div>
                <div className="metric-label">Items in Stock</div>
              </div>
            </div>
          </div>
        )}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <div className="top-products-section">
            <h2>Top Selling Products</h2>
            <div className="products-list">
              {topProducts.map((product, index) => (
                <div key={index} className="product-item">
                  <div className="product-info">
                    <strong>{product.frame_name}</strong>
                    <span className="product-id">({product.product_id})</span>
                  </div>
                  <div className="sales-count">{product.sales_count} sales</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="actions-section">
          <h2>Quick Actions</h2>
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>View Inventory</h3>
              <p>Check current stock levels and search for products</p>
              <button 
                className="action-button"
                onClick={() => navigate('/shop-owner/inventory')}
              >
                View Inventory
              </button>
            </div>
            
            <div className="dashboard-card">
              <h3>Record Sale</h3>
              <p>Process new sales and select lens types</p>
              <button 
                className="action-button"
                onClick={() => navigate('/shop-owner/sales')}
              >
                Record Sale
              </button>
            </div>
            
            <div className="dashboard-card">
              <h3>Analytics & Reports</h3>
              <p>View your shop's performance and sales data</p>
              <button 
                className="action-button"
                onClick={() => navigate('/shop-owner/analytics')}
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShopOwnerDashboard; 