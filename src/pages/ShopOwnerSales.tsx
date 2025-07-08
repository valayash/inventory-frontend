import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8001/api';

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

interface LensType {
  id: number;
  name: string;
  description: string;
  price_modifier: string;
}

interface SaleItem {
  inventory_item_id: number;
  inventory_item?: ShopInventory;
  lens_type_id: number;
  lens_type?: LensType;
  quantity: number;
  sale_price: number;
  total_price: number;
}

const ShopOwnerSales: React.FC = () => {
  const [inventory, setInventory] = useState<ShopInventory[]>([]);
  const [lensTypes, setLensTypes] = useState<LensType[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<ShopInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<ShopInventory | null>(null);
  const [selectedLensType, setSelectedLensType] = useState<LensType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customSalePrice, setCustomSalePrice] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showLensSelection, setShowLensSelection] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm]);

  useEffect(() => {
    // Pre-select item if specified in URL
    const itemId = searchParams.get('item');
    if (itemId && inventory.length > 0) {
      const item = inventory.find(i => i.id === parseInt(itemId));
      if (item) {
        setSelectedInventoryItem(item);
        setShowLensSelection(true);
      }
    }
  }, [searchParams, inventory]);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [inventoryRes, lensRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/shop-inventory/`, { headers }),
        axios.get(`${API_BASE_URL}/lens-types/`, { headers })
      ]);

      setInventory(inventoryRes.data.results || inventoryRes.data);
      setLensTypes(lensRes.data);
      setFilteredInventory(inventoryRes.data.results || inventoryRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const filterInventory = () => {
    if (!searchTerm) {
      setFilteredInventory(inventory);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = inventory.filter(item =>
      (item.frame_name && item.frame_name.toLowerCase().includes(searchLower)) ||
      (item.frame_product_id && item.frame_product_id.toLowerCase().includes(searchLower)) ||
      (item.frame_brand && item.frame_brand.toLowerCase().includes(searchLower)) ||
      (item.frame_type && item.frame_type.toLowerCase().includes(searchLower)) ||
      (item.frame_color && item.frame_color.toLowerCase().includes(searchLower))
    );
    setFilteredInventory(filtered);
  };

  const handleInventoryItemSelect = (item: ShopInventory) => {
    setSelectedInventoryItem(item);
    setShowLensSelection(true);
    setQuantity(1);
    setCustomSalePrice('');
    setSelectedLensType(null);
  };

  const handleLensTypeSelect = (lens: LensType) => {
    setSelectedLensType(lens);
  };

  const calculateTotalPrice = () => {
    if (!selectedInventoryItem || !selectedLensType) return 0;
    
    const framePrice = selectedInventoryItem.frame_price ? parseFloat(selectedInventoryItem.frame_price) : 0;
    const lensPrice = selectedLensType.price_modifier ? parseFloat(selectedLensType.price_modifier) : 0;
    const unitPrice = customSalePrice ? parseFloat(customSalePrice) : framePrice + lensPrice;
    
    return unitPrice * quantity;
  };

  const handleProcessSale = async () => {
    if (!selectedInventoryItem || !selectedLensType) {
      setError('Please select both an inventory item and lens type');
      return;
    }

    if (quantity > selectedInventoryItem.quantity_remaining) {
      setError(`Not enough stock. Available: ${selectedInventoryItem.quantity_remaining}`);
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const framePrice = selectedInventoryItem.frame_price ? parseFloat(selectedInventoryItem.frame_price) : 0;
      const lensPrice = selectedLensType.price_modifier ? parseFloat(selectedLensType.price_modifier) : 0;
      const salePrice = customSalePrice ? parseFloat(customSalePrice) : framePrice + lensPrice;

      const saleData = {
        shop_inventory_id: selectedInventoryItem.id,
        quantity: quantity,
        sale_price: salePrice,
        notes: 'Sale notes'
      };

      await axios.post(`${API_BASE_URL}/process-sale/`, saleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Show success message
      alert(`Sale processed successfully!\n\nItem: ${selectedInventoryItem.frame_name || 'Unknown Frame'}\nLens: ${selectedLensType.name}\nQuantity: ${quantity}\nTotal: $${calculateTotalPrice().toFixed(2)}`);

      // Reset form
      setSelectedInventoryItem(null);
      setSelectedLensType(null);
      setQuantity(1);
      setCustomSalePrice('');
      setShowLensSelection(false);
      
      // Refresh inventory
      fetchInitialData();
    } catch (err: any) {
      console.error('Error processing sale:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to process sale. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedInventoryItem(null);
    setSelectedLensType(null);
    setQuantity(1);
    setCustomSalePrice('');
    setShowLensSelection(false);
    setError('');
  };

  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

  if (loading) {
    return (
      <div className="shop-owner-container">
        <div className="loading">Loading sales page...</div>
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
        <h1>Record Sale</h1>
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

      <div className="sales-container">
        {/* Step 1: Select Inventory Item */}
        {!showLensSelection && (
          <div className="step-section">
            <h2>Step 1: Select Product to Sell</h2>
            
            <div className="search-section">
              <input
                type="text"
                placeholder="Search by name, product ID, brand, type, or color..."
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

            <div className="results-count">
              Showing {filteredInventory.length} available items
            </div>

            <div className="inventory-grid">
              {filteredInventory.length === 0 ? (
                <div className="no-items">
                  <div className="no-items-icon">📦</div>
                  <h3>No items available for sale</h3>
                  <p>All inventory items are either out of stock or don't match your search.</p>
                </div>
              ) : (
                filteredInventory.map(item => (
                  <div key={item.id} className="inventory-card" onClick={() => handleInventoryItemSelect(item)}>
                    <div className="item-header">
                      <h3>{item.frame_name || 'Unknown Frame'}</h3>
                      <span className="product-id">{item.frame_product_id || 'N/A'}</span>
                    </div>
                    <div className="item-details">
                      <p><strong>Brand:</strong> {item.frame_brand || 'N/A'}</p>
                      <p><strong>Type:</strong> {item.frame_type || 'N/A'}</p>
                      <p><strong>Color:</strong> {item.frame_color || 'N/A'}</p>
                      <p><strong>Price:</strong> ${item.frame_price ? parseFloat(item.frame_price).toFixed(2) : '0.00'}</p>
                      <p><strong>Available Stock:</strong> {item.quantity_remaining}</p>
                    </div>
                    <button className="select-button">Select This Item</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Lens Type and Quantity */}
        {showLensSelection && selectedInventoryItem && (
          <div className="step-section">
            <h2>Step 2: Complete Sale Details</h2>
            
            <div className="selected-item-summary">
              <h3>Selected Item</h3>
                             <div className="item-summary">
                 <span className="item-name">{selectedInventoryItem.frame_name || 'Unknown Frame'}</span>
                 <span className="item-id">({selectedInventoryItem.frame_product_id || 'N/A'})</span>
                 <span className="item-price">${selectedInventoryItem.frame_price ? parseFloat(selectedInventoryItem.frame_price).toFixed(2) : '0.00'}</span>
                <button 
                  onClick={() => setShowLensSelection(false)}
                  className="change-item-btn"
                >
                  Change Item
                </button>
              </div>
            </div>

            <div className="sale-details">
              <div className="lens-selection">
                <h3>Select Lens Type</h3>
                <div className="lens-grid">
                  {lensTypes.map(lens => (
                    <div 
                      key={lens.id} 
                      className={`lens-card ${selectedLensType?.id === lens.id ? 'selected' : ''}`}
                      onClick={() => handleLensTypeSelect(lens)}
                    >
                      <div className="lens-header">
                        <h4>{lens.name}</h4>
                        <span className="lens-price">+${parseFloat(lens.price_modifier).toFixed(2)}</span>
                      </div>
                      {lens.description && (
                        <p className="lens-description">{lens.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="quantity-and-price">
                <div className="quantity-section">
                  <label htmlFor="quantity">Quantity:</label>
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={selectedInventoryItem.quantity_remaining}
                    className="quantity-input"
                  />
                  <span className="stock-info">
                    (Max: {selectedInventoryItem.quantity_remaining})
                  </span>
                </div>

                <div className="price-section">
                  <label htmlFor="custom-price">Custom Sale Price (Optional):</label>
                  <input
                    type="number"
                    id="custom-price"
                    value={customSalePrice}
                    onChange={(e) => setCustomSalePrice(e.target.value)}
                    min="0"
                    step="0.01"
                    className="price-input"
                    placeholder={selectedLensType ? `Default: $${(parseFloat(selectedInventoryItem.frame_price) + parseFloat(selectedLensType.price_modifier)).toFixed(2)}` : 'Select lens first'}
                  />
                </div>
              </div>

              {selectedLensType && (
                <div className="sale-summary">
                  <h3>Sale Summary</h3>
                  <div className="summary-details">
                    <div className="summary-row">
                      <span>Frame Price:</span>
                      <span>${parseFloat(selectedInventoryItem.frame_price).toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Lens Price:</span>
                      <span>${parseFloat(selectedLensType.price_modifier).toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Unit Price:</span>
                      <span>${customSalePrice ? parseFloat(customSalePrice).toFixed(2) : (parseFloat(selectedInventoryItem.frame_price) + parseFloat(selectedLensType.price_modifier)).toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Quantity:</span>
                      <span>{quantity}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total Price:</span>
                      <span>${calculateTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="action-buttons">
                <button 
                  onClick={resetForm}
                  className="cancel-button"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleProcessSale}
                  className="process-sale-button"
                  disabled={processing || !selectedLensType || quantity > selectedInventoryItem.quantity_remaining}
                >
                  {processing ? 'Processing...' : 'Process Sale'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopOwnerSales; 