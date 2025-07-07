import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Shop {
  id: number;
  name: string;
  address: string;
  owner_name: string;
  phone: string;
  email: string;
}

interface Frame {
  id: number;
  product_id: string;
  name: string;
  price: string;
  brand: string;
  frame_type: string;
  color: string;
  material: string;
}

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
}

interface Summary {
  total_items: number;
  total_value: number;
  total_cost: number;
  low_stock_count: number;
  low_stock_items: ShopInventory[];
}

interface FinancialSummary {
  month: string;
  total_revenue: string;
  total_cost: string;
  total_profit: string;
  amount_to_pay_distributor: string;
  units_sold: number;
}

interface ManualInventoryItem {
  frame_id: string;
  quantity: number;
  frame_details?: Frame | null;
  loading?: boolean;
  error?: string;
  showDropdown?: boolean;
  searchResults?: Frame[];
}

const ShopInventoryDetailPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [inventory, setInventory] = useState<ShopInventory[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [frames, setFrames] = useState<Frame[]>([]);
  
  // Manual inventory addition state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualItems, setManualItems] = useState<ManualInventoryItem[]>([]);
  const [processing, setProcessing] = useState(false);
  
  // CSV upload state
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);

  useEffect(() => {
    if (shopId) {
      fetchShopInventoryDetails();
      fetchFrames();
    }
  }, [shopId]);

  const fetchShopInventoryDetails = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://127.0.0.1:8001/api/shops/${shopId}/inventory/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setShop(response.data.shop);
      setInventory(response.data.inventory);
      setSummary(response.data.summary);
      setFinancialSummary(response.data.financial_summary);
    } catch (err) {
      console.error('Error fetching shop inventory:', err);
      setError('Failed to load shop inventory details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFrames = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://127.0.0.1:8001/api/frames/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFrames(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching frames:', err);
    }
  };

  const searchFrames = (query: string): Frame[] => {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    return frames.filter(frame => 
      (frame.product_id && frame.product_id.toLowerCase().includes(lowerQuery)) ||
      (frame.name && frame.name.toLowerCase().includes(lowerQuery)) ||
      (frame.brand && frame.brand.toLowerCase().includes(lowerQuery))
    ).slice(0, 10);
  };

  const addManualInventoryItem = () => {
    setManualItems([...manualItems, {
      frame_id: '',
      quantity: 0,
      frame_details: null,
      loading: false,
      error: '',
      showDropdown: false,
      searchResults: []
    }]);
  };

  const updateManualItem = (index: number, field: keyof ManualInventoryItem, value: string | number) => {
    const updatedItems = [...manualItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // If frame_id is being updated, search for matching frames
    if (field === 'frame_id' && typeof value === 'string') {
      console.log('Searching for frames with query:', value);
      const searchResults = searchFrames(value);
      console.log('Search results:', searchResults);
      
      updatedItems[index].searchResults = searchResults;
      updatedItems[index].showDropdown = value.length >= 1 && searchResults.length > 0;
      updatedItems[index].frame_details = null;
      updatedItems[index].error = '';
      
      console.log('Updated item:', updatedItems[index]);
    }
    
    setManualItems(updatedItems);
  };

  const updateManualItemDetails = (index: number, updates: Partial<ManualInventoryItem>) => {
    setManualItems(manualItems.map((item, i) => {
      if (i === index) {
        return { ...item, ...updates };
      }
      return item;
    }));
  };

  const selectFrame = (index: number, frame: Frame) => {
    console.log('Selecting frame:', frame);
    updateManualItemDetails(index, {
      frame_id: frame.product_id,
      frame_details: frame,
      showDropdown: false,
      searchResults: [],
      error: ''
    });
  };

  const removeManualItem = (index: number) => {
    setManualItems(manualItems.filter((_, i) => i !== index));
  };

  const handleManualSubmit = async () => {
    const validItems = manualItems.filter(item => 
      item.frame_details && item.quantity > 0
    );

    if (validItems.length === 0) {
      setError('Please add at least one valid item');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        shop_id: parseInt(shopId!),
        items: validItems.map(item => ({
          frame_id: item.frame_details!.id,
          quantity: item.quantity,
          cost_per_unit: parseFloat(item.frame_details!.price)
        }))
      };

      await axios.post('http://127.0.0.1:8001/api/stock-in/', payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Reset form and refresh data
      setManualItems([]);
      setShowManualForm(false);
      fetchShopInventoryDetails();
      alert('Inventory added successfully!');
    } catch (err: any) {
      console.error('Error adding inventory:', err);
      setError('Failed to add inventory. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    setCsvUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('shop_id', shopId!);

      await axios.post('http://127.0.0.1:8001/api/inventory-csv-upload/', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset form and refresh data
      setCsvFile(null);
      setShowCSVUpload(false);
      fetchShopInventoryDetails();
      alert('CSV uploaded successfully!');
    } catch (err: any) {
      console.error('Error uploading CSV:', err);
      setError('Failed to upload CSV. Please check the file format.');
    } finally {
      setCsvUploading(false);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = `frame_id,quantity
F001,10
F002,5
F003,15`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="shop-inventory-detail-container">
        <div className="loading">Loading shop inventory...</div>
      </div>
    );
  }

  if (error && !shop) {
    return (
      <div className="shop-inventory-detail-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="shop-inventory-detail-container">
      <div className="page-header">
        <button 
          onClick={() => navigate('/distributor/inventory-distribution')}
          className="back-button"
        >
          ← Back to Distribution
        </button>
        <h1>Shop Inventory Details</h1>
        <div className="header-actions">
          <button 
            onClick={() => setShowManualForm(true)}
            className="add-inventory-button"
          >
            + Add Inventory
          </button>
          <button 
            onClick={() => setShowCSVUpload(true)}
            className="upload-csv-button"
          >
            📄 Upload CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Shop Information */}
      {shop && (
        <div className="shop-info-card">
          <h2>{shop.name}</h2>
          <div className="shop-details">
            <p><strong>Owner:</strong> {shop.owner_name}</p>
            <p><strong>Phone:</strong> {shop.phone}</p>
            <p><strong>Email:</strong> {shop.email}</p>
            <p><strong>Address:</strong> {shop.address}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Items</h3>
            <p className="summary-value">{summary.total_items}</p>
          </div>
          <div className="summary-card">
            <h3>Total Value</h3>
            <p className="summary-value">${summary.total_value.toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <h3>Total Cost</h3>
            <p className="summary-value">${summary.total_cost.toFixed(2)}</p>
          </div>
          <div className="summary-card warning">
            <h3>Low Stock Items</h3>
            <p className="summary-value">{summary.low_stock_count}</p>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      {financialSummary && (
        <div className="financial-summary">
          <h3>Monthly Financial Summary ({financialSummary.month})</h3>
          <div className="financial-grid">
            <div className="financial-item">
              <span className="label">Revenue:</span>
              <span className="value">${financialSummary.total_revenue}</span>
            </div>
            <div className="financial-item">
              <span className="label">Cost:</span>
              <span className="value">${financialSummary.total_cost}</span>
            </div>
            <div className="financial-item">
              <span className="label">Profit:</span>
              <span className="value">${financialSummary.total_profit}</span>
            </div>
            <div className="financial-item">
              <span className="label">Units Sold:</span>
              <span className="value">{financialSummary.units_sold}</span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Inventory Form */}
      {showManualForm && (
        <div className="manual-inventory-form">
          <div className="form-header">
            <h3>Add Inventory Manually</h3>
            <button 
              onClick={() => {
                setShowManualForm(false);
                setManualItems([]);
                setError('');
              }}
              className="close-button"
            >
              ✕
            </button>
          </div>

          <div className="manual-items">
            {manualItems.map((item, index) => (
              <div key={index} className="distribution-item-two-column">
                <div className="frame-input-section">
                  <input
                    type="text"
                    placeholder="Search frames by ID, name, or brand..."
                    value={item.frame_id}
                    onChange={(e) => updateManualItem(index, 'frame_id', e.target.value)}
                    onFocus={() => {
                      console.log('Input focused, item:', item);
                      if (item.searchResults && item.searchResults.length > 0) {
                        updateManualItemDetails(index, { showDropdown: true });
                      }
                    }}
                    onBlur={() => setTimeout(() => updateManualItemDetails(index, { showDropdown: false }), 200)}
                    className={`frame-id-input ${item.error ? 'error' : ''}`}
                  />
                  
                  {item.showDropdown && item.searchResults && item.searchResults.length > 0 && (
                    <div className="frame-dropdown">
                      {item.searchResults.map(frame => (
                        <div
                          key={frame.id}
                          className="frame-dropdown-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            console.log('Frame clicked:', frame);
                            selectFrame(index, frame);
                          }}
                        >
                          <div className="frame-dropdown-info">
                            <strong>{frame.product_id}</strong> - {frame.name}
                          </div>
                          <div className="frame-dropdown-meta">
                            {frame.brand} • {frame.frame_type} • {frame.color} • <span className="price">${frame.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {item.error && (
                    <div className="frame-error">{item.error}</div>
                  )}
                  
                  {item.frame_details && (
                    <div className="frame-details">
                      <div className="frame-info">
                        <strong>{item.frame_details.name}</strong>
                        <span className="product-id">({item.frame_details.product_id})</span>
                      </div>
                      <div className="frame-meta">
                        <span>{item.frame_details.brand}</span> • 
                        <span>{item.frame_details.frame_type}</span> • 
                        <span>{item.frame_details.color}</span> • 
                        <span className="price">${item.frame_details.price}</span>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity === 0 ? '' : item.quantity}
                  onChange={(e) => updateManualItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  className="quantity-input"
                  min="1"
                />

                <button
                  onClick={() => removeManualItem(index)}
                  className="remove-item-button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button onClick={addManualInventoryItem} className="add-item-button">
              + Add Item
            </button>
            <button 
              onClick={handleManualSubmit}
              disabled={processing || manualItems.length === 0}
              className="submit-button"
            >
              {processing ? 'Processing...' : 'Add Inventory'}
            </button>
          </div>
        </div>
      )}

      {/* CSV Upload Form */}
      {showCSVUpload && (
        <div className="csv-upload-form">
          <div className="form-header">
            <h3>Upload Inventory CSV</h3>
            <button 
              onClick={() => {
                setShowCSVUpload(false);
                setCsvFile(null);
                setError('');
              }}
              className="close-button"
            >
              ✕
            </button>
          </div>

          <div className="csv-instructions">
            <p>Upload a CSV file with frame_id and quantity columns.</p>
            <button onClick={downloadCSVTemplate} className="download-template-button">
              📥 Download Template
            </button>
          </div>

          <div className="file-upload">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="file-input"
            />
            {csvFile && (
              <div className="file-info">
                Selected: {csvFile.name}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              onClick={handleCSVUpload}
              disabled={csvUploading || !csvFile}
              className="upload-button"
            >
              {csvUploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </div>
        </div>
      )}

      {/* Current Inventory Table */}
      <div className="inventory-table-section">
        <h3>Current Inventory</h3>
        {inventory.length === 0 ? (
          <p>No inventory items found.</p>
        ) : (
          <div className="inventory-table">
            <table>
              <thead>
                <tr>
                  <th>Frame ID</th>
                  <th>Frame Name</th>
                  <th>Brand</th>
                  <th>Received</th>
                  <th>Sold</th>
                  <th>Remaining</th>
                  <th>Cost/Unit</th>
                  <th>Total Cost</th>
                  <th>Total Revenue</th>
                  <th>Profit</th>
                  <th>Last Restocked</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <tr key={item.id} className={item.quantity_remaining < 5 ? 'low-stock' : ''}>
                    <td>{item.frame_product_id}</td>
                    <td>{item.frame_name}</td>
                    <td>{item.frame_brand}</td>
                    <td>{item.quantity_received}</td>
                    <td>{item.quantity_sold}</td>
                    <td className={item.quantity_remaining < 5 ? 'low-stock-cell' : ''}>
                      {item.quantity_remaining}
                    </td>
                    <td>${parseFloat(item.cost_per_unit).toFixed(2)}</td>
                    <td>${parseFloat(item.total_cost).toFixed(2)}</td>
                    <td>${parseFloat(item.total_revenue).toFixed(2)}</td>
                    <td className={parseFloat(item.total_profit) >= 0 ? 'profit' : 'loss'}>
                      ${parseFloat(item.total_profit).toFixed(2)}
                    </td>
                    <td>{new Date(item.last_restocked).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopInventoryDetailPage; 