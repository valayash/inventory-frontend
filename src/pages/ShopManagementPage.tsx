import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreateShopForm from '../components/CreateShopForm';
import EditShopForm from '../components/EditShopForm';
import { Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8001/api';

interface Shop {
  id: number;
  name: string;
  address: string;
  owner_name: string;
  phone: string;
  email: string;
  created_at: string;
  user_count: number;
}

const ShopManagementPage: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    // Filter shops based on search term
    if (searchTerm.trim() === '') {
      setFilteredShops(shops);
    } else {
      const filtered = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shop.owner_name && shop.owner_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (shop.phone && shop.phone.includes(searchTerm)) ||
        (shop.email && shop.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        shop.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredShops(filtered);
    }
  }, [shops, searchTerm]);

  const fetchShops = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/shops/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setShops(response.data);
    } catch (err) {
      console.error('Error fetching shops:', err);
      setError('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchShops();
  };

  const handleEditSuccess = () => {
    setEditingShop(null);
    fetchShops();
  };

  const handleEditClick = (shop: Shop) => {
    setEditingShop(shop);
  };

  const handleEditCancel = () => {
    setEditingShop(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Show create form
  if (showCreateForm) {
    return (
      <div className="shop-management-container">
        <div className="page-header">
          <button 
            onClick={() => navigate('/distributor')}
            className="back-button"
          >
            ← Back to Dashboard
          </button>
          <h1>Shop Management</h1>
        </div>
        <CreateShopForm 
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  // Show edit form
  if (editingShop) {
    return (
      <div className="shop-management-container">
        <div className="page-header">
          <button 
            onClick={() => navigate('/distributor')}
            className="back-button"
          >
            ← Back to Dashboard
          </button>
          <h1>Shop Management</h1>
        </div>
        <EditShopForm 
          shop={editingShop}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shop-management-container">
        <div className="loading">Loading shops...</div>
      </div>
    );
  }

  return (
    <div className="shop-management-container">
      <div className="page-header">
        <button 
          onClick={() => navigate('/distributor')}
          className="back-button"
        >
          ← Back to Dashboard
        </button>
        <h1>Shop Management</h1>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="create-shop-button"
        >
          + Create New Shop
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Search Section */}
      <div className="search-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search shops by name, owner, phone, email, or address..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={clearSearch} className="clear-search-btn">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Shops List */}
      <div className="shops-section">
        <div className="section-header">
          <h2>All Shops</h2>
          <p>
            {searchTerm 
              ? `${filteredShops.length} of ${shops.length} shops found`
              : `${shops.length} shops found`
            }
          </p>
        </div>

        {filteredShops.length === 0 ? (
          <div className="no-shops">
            {shops.length === 0 ? (
              <>
                <div className="no-shops-icon">🏪</div>
                <h3>No shops created yet</h3>
                <p>Start by creating your first shop to begin managing your distribution network.</p>
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="create-shop-button"
                >
                  Create First Shop
                </button>
              </>
            ) : (
              <>
                <div className="no-shops-icon">🔍</div>
                <h3>No shops found</h3>
                <p>No shops match your search criteria. Try a different search term.</p>
                <button onClick={clearSearch} className="clear-search-btn">
                  Clear Search
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="shops-grid">
            {filteredShops.map(shop => (
              <div key={shop.id} className="shop-card">
                <div className="shop-header">
                  <h3>{shop.name}</h3>
                </div>
                
                <div className="shop-details">
                  <div className="detail-row">
                    <span className="label">Owner:</span>
                    <span className="value">{shop.owner_name || 'Not specified'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Phone:</span>
                    <span className="value">{shop.phone || 'Not specified'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    <span className="value">{shop.email || 'Not specified'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Address:</span>
                    <span className="value">{shop.address}</span>
                  </div>
                </div>

                <div className="shop-actions">
                  <button className="view-button">View Details</button>
                  <button 
                    onClick={() => handleEditClick(shop)}
                    className="edit-button"
                  >
                    Edit Shop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopManagementPage; 