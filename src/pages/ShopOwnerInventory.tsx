import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ShopInventory {
  id: number;
  frame: number;
  quantity_received: number;
  quantity_sold: number;
  quantity_remaining: number;
  cost_per_unit: string;
  last_restocked: string;
  total_cost: string;
  total_revenue: string;
  total_profit: string;
  frame_name: string;
  frame_product_id: string;
  frame_price: string;
  frame_brand: string;
  frame_type: string;
  frame_color: string;
  frame_material: string;
}

const ShopOwnerInventory: React.FC = () => {
  const [inventory, setInventory] = useState<ShopInventory[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<ShopInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('frame_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    filterAndSortInventory();
  }, [inventory, searchTerm, sortBy, sortOrder, stockFilter]);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://127.0.0.1:8001/api/shop-inventory/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setInventory(response.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortInventory = () => {
    let filtered = [...inventory];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.frame_name.toLowerCase().includes(searchLower) ||
        item.frame_product_id.toLowerCase().includes(searchLower) ||
        item.frame_brand.toLowerCase().includes(searchLower) ||
        item.frame_type.toLowerCase().includes(searchLower) ||
        item.frame_color.toLowerCase().includes(searchLower) ||
        item.frame_material.toLowerCase().includes(searchLower)
      );
    }

    // Apply stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (stockFilter === 'in-stock') return item.quantity_remaining > 5;
        if (stockFilter === 'low-stock') return item.quantity_remaining > 0 && item.quantity_remaining <= 5;
        if (stockFilter === 'out-of-stock') return item.quantity_remaining === 0;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof ShopInventory];
      let bValue: any = b[sortBy as keyof ShopInventory];

      if (sortBy === 'frame_price' || sortBy === 'cost_per_unit' || sortBy === 'total_cost' || sortBy === 'total_revenue' || sortBy === 'total_profit') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (sortBy === 'last_restocked') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredInventory(filtered);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= 5) return 'low-stock';
    return 'in-stock';
  };

  const getStockStatusText = (quantity: number) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= 5) return 'Low Stock';
    return 'In Stock';
  };

  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

  if (loading) {
    return (
      <div className="shop-owner-container">
        <div className="loading">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="shop-owner-container">
      <header className="page-header">
        <button 
          onClick={() => navigate('/shop-owner')}
          className="back-button"
        >
          ← Back to Dashboard
        </button>
        <h1>Shop Inventory</h1>
        <div className="user-info">
          <span>{userInfo.username}</span>
          {userInfo.shop_name && (
            <span className="shop-name"> - {userInfo.shop_name}</span>
          )}
        </div>
      </header>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Filters and Search */}
      <div className="inventory-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by name, product ID, brand, type, color, or material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="clear-search-btn"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-section">
          <label htmlFor="stock-filter">Filter by Stock:</label>
          <select 
            id="stock-filter"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Items</option>
            <option value="in-stock">In Stock (&gt;5)</option>
            <option value="low-stock">Low Stock (1-5)</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>

        <div className="results-count">
          Showing {filteredInventory.length} of {inventory.length} items
        </div>
      </div>

      {/* Inventory Table */}
      <div className="inventory-table-container">
        {filteredInventory.length === 0 ? (
          <div className="no-items">
            {inventory.length === 0 ? (
              <>
                <div className="no-items-icon">📦</div>
                <h3>No inventory items found</h3>
                <p>Your shop doesn't have any inventory items yet.</p>
              </>
            ) : (
              <>
                <div className="no-items-icon">🔍</div>
                <h3>No items match your search</h3>
                <p>Try adjusting your search terms or filters.</p>
              </>
            )}
          </div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('frame_product_id')} className="sortable">
                  Product ID {getSortIcon('frame_product_id')}
                </th>
                <th onClick={() => handleSort('frame_name')} className="sortable">
                  Frame Name {getSortIcon('frame_name')}
                </th>
                <th onClick={() => handleSort('frame_brand')} className="sortable">
                  Brand {getSortIcon('frame_brand')}
                </th>
                <th onClick={() => handleSort('frame_type')} className="sortable">
                  Type {getSortIcon('frame_type')}
                </th>
                <th onClick={() => handleSort('frame_color')} className="sortable">
                  Color {getSortIcon('frame_color')}
                </th>
                <th onClick={() => handleSort('frame_price')} className="sortable">
                  Price {getSortIcon('frame_price')}
                </th>
                <th onClick={() => handleSort('quantity_remaining')} className="sortable">
                  Stock {getSortIcon('quantity_remaining')}
                </th>
                <th onClick={() => handleSort('quantity_sold')} className="sortable">
                  Sold {getSortIcon('quantity_sold')}
                </th>
                <th onClick={() => handleSort('total_revenue')} className="sortable">
                  Revenue {getSortIcon('total_revenue')}
                </th>
                <th onClick={() => handleSort('total_profit')} className="sortable">
                  Profit {getSortIcon('total_profit')}
                </th>
                <th onClick={() => handleSort('last_restocked')} className="sortable">
                  Last Restocked {getSortIcon('last_restocked')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => (
                <tr key={item.id} className={getStockStatus(item.quantity_remaining)}>
                  <td className="product-id">{item.frame_product_id}</td>
                  <td className="frame-name">{item.frame_name}</td>
                  <td>{item.frame_brand}</td>
                  <td>{item.frame_type}</td>
                  <td>{item.frame_color}</td>
                  <td className="price">${parseFloat(item.frame_price).toFixed(2)}</td>
                  <td className="stock-cell">
                    <span className={`stock-badge ${getStockStatus(item.quantity_remaining)}`}>
                      {item.quantity_remaining}
                    </span>
                    <span className="stock-status">{getStockStatusText(item.quantity_remaining)}</span>
                  </td>
                  <td>{item.quantity_sold}</td>
                  <td className="currency">${parseFloat(item.total_revenue).toFixed(2)}</td>
                  <td className={`currency ${parseFloat(item.total_profit) >= 0 ? 'profit' : 'loss'}`}>
                    ${parseFloat(item.total_profit).toFixed(2)}
                  </td>
                  <td>{new Date(item.last_restocked).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => navigate(`/shop-owner/sales?item=${item.id}`)}
                      className="sell-button"
                      disabled={item.quantity_remaining === 0}
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ShopOwnerInventory; 