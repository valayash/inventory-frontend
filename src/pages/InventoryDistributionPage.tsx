import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Shop {
  id: number;
  name: string;
  address: string;
  owner_name: string;
  total_items: number;
  total_value: number;
  low_stock_count: number;
  last_distribution: string | null;
}

interface Frame {
  id: number;
  product_id: string;
  name: string;
  price: number;
  brand: string;
  frame_type: string;
  color: string;
  material: string;
}

interface RecentDistribution {
  id: number;
  shop_name: string;
  frame_name: string;
  product_id: string;
  quantity: number;
  unit_cost: number | null;
  created_at: string;
  created_by: string;
}

interface DistributionItem {
  frame_id: string;
  quantity: number;
  frame_details?: Frame | null;
  loading?: boolean;
  error?: string;
  showDropdown?: boolean;
  searchResults?: Frame[];
}

interface ShopDistribution {
  shop_id: number;
  items: DistributionItem[];
}

const InventoryDistributionPage: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [recentDistributions, setRecentDistributions] = useState<RecentDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDistributionForm, setShowDistributionForm] = useState(false);
  const [selectedShops, setSelectedShops] = useState<number[]>([]);
  const [distributions, setDistributions] = useState<ShopDistribution[]>([]);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDistributionData();
  }, []);

  const fetchDistributionData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://127.0.0.1:8001/api/distribution/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setShops(response.data.shop_inventory_summary);
      setFrames(response.data.frames);
      setRecentDistributions(response.data.recent_distributions);
    } catch (err) {
      console.error('Error fetching distribution data:', err);
      setError('Failed to load distribution data');
    } finally {
      setLoading(false);
    }
  };

  const searchFrames = (query: string): Frame[] => {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    return frames.filter(frame => 
      frame.product_id.toLowerCase().includes(lowerQuery) ||
      frame.name.toLowerCase().includes(lowerQuery) ||
      frame.brand.toLowerCase().includes(lowerQuery) ||
      frame.frame_type.toLowerCase().includes(lowerQuery)
    ).slice(0, 10); // Limit to 10 results
  };

  const updateDistributionItemDetails = (shopId: number, itemIndex: number, updates: Partial<DistributionItem>) => {
    setDistributions(distributions.map(dist => {
      if (dist.shop_id === shopId) {
        const updatedItems = [...dist.items];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], ...updates };
        return { ...dist, items: updatedItems };
      }
      return dist;
    }));
  };

  const handleShopSelect = (shopId: number) => {
    if (selectedShops.includes(shopId)) {
      setSelectedShops(selectedShops.filter(id => id !== shopId));
      setDistributions(distributions.filter(dist => dist.shop_id !== shopId));
    } else {
      setSelectedShops([...selectedShops, shopId]);
      setDistributions([...distributions, { shop_id: shopId, items: [] }]);
    }
  };

  const addItemToDistribution = (shopId: number) => {
    setDistributions(distributions.map(dist => {
      if (dist.shop_id === shopId) {
                return {
          ...dist,
          items: [...dist.items, { 
            frame_id: '', 
            quantity: 0,
            frame_details: null,
            loading: false,
            error: '',
            showDropdown: false,
            searchResults: []
          }]
        };
      }
      return dist;
    }));
  };

  const updateDistributionItem = (shopId: number, itemIndex: number, field: keyof DistributionItem, value: string | number) => {
    setDistributions(distributions.map(dist => {
      if (dist.shop_id === shopId) {
        const updatedItems = [...dist.items];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };
        
        // If frame_id is being updated, search for matching frames
        if (field === 'frame_id' && typeof value === 'string') {
          console.log('Searching for frames with query:', value);
          const searchResults = searchFrames(value);
          console.log('Search results:', searchResults);
          
          updatedItems[itemIndex].searchResults = searchResults;
          updatedItems[itemIndex].showDropdown = value.length >= 1 && searchResults.length > 0;
          updatedItems[itemIndex].frame_details = null;
          updatedItems[itemIndex].error = '';
          
          console.log('Updated item:', updatedItems[itemIndex]);
        }
        
        return { ...dist, items: updatedItems };
      }
      return dist;
    }));
  };

  const selectFrame = (shopId: number, itemIndex: number, frame: Frame) => {
    console.log('Selecting frame:', frame);
    updateDistributionItemDetails(shopId, itemIndex, {
      frame_id: frame.product_id,
      frame_details: frame,
      showDropdown: false,
      searchResults: [],
      error: ''
    });
  };

  const removeDistributionItem = (shopId: number, itemIndex: number) => {
    setDistributions(distributions.map(dist => {
      if (dist.shop_id === shopId) {
        return { ...dist, items: dist.items.filter((_, index) => index !== itemIndex) };
      }
      return dist;
    }));
  };

  const handleBulkDistribution = async () => {
    console.log('Starting distribution validation...', distributions);
    
    // Validate distributions
    const validDistributions = distributions.filter(dist => 
      dist.items.length > 0 && 
      dist.items.every(item => {
        const isValid = item.frame_details !== null && item.quantity > 0;
        console.log('Item validation:', { item, isValid });
        return isValid;
      })
    );

    console.log('Valid distributions:', validDistributions);

    if (validDistributions.length === 0) {
      setError('Please add at least one valid item to distribute (with selected frame and quantity)');
      return;
    }

    // Check for any items with errors or incomplete data
    const hasErrors = distributions.some(dist => 
      dist.items.some(item => {
        const hasError = item.error || !item.frame_details || item.quantity <= 0;
        console.log('Item error check:', { item, hasError });
        return hasError;
      })
    );

    console.log('Has errors:', hasErrors);

    if (hasErrors) {
      setError('Please fix all errors and ensure all fields are properly filled');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      
      // Clean up the data for API (remove frontend-specific fields)
      const cleanDistributions = validDistributions.map(dist => ({
        shop_id: dist.shop_id,
        items: dist.items.map(item => ({
          frame_id: item.frame_details?.id || 0, // Use the database ID for the API
          quantity: item.quantity,
          cost_per_unit: item.frame_details?.price || 0 // Use frame price as cost
        }))
      }));

      console.log('Sending to API:', cleanDistributions);

      const response = await axios.post(
        'http://127.0.0.1:8001/api/distribution/bulk/',
        { distributions: cleanDistributions },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('API response:', response.data);

      // Reset form and refresh data
      setShowDistributionForm(false);
      setSelectedShops([]);
      setDistributions([]);
      fetchDistributionData();

      // Show success message
      alert(`Successfully distributed ${response.data.total_items_distributed} items to ${response.data.shops_updated} shops`);

    } catch (err: any) {
      console.error('Error processing distribution:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to process distribution. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const viewShopInventory = (shopId: number) => {
    // Navigate to detailed shop inventory view
    navigate(`/distributor/shop-inventory/${shopId}`);
  };

  if (loading) {
    return (
      <div className="inventory-distribution-container">
        <div className="loading">Loading distribution data...</div>
      </div>
    );
  }

  return (
    <div className="inventory-distribution-container">
      <div className="page-header">
        <button 
          onClick={() => navigate('/distributor')}
          className="back-button"
        >
          ← Back to Dashboard
        </button>
        <h1>Inventory Distribution</h1>
        <button 
          onClick={() => setShowDistributionForm(true)}
          className="distribute-button"
          disabled={showDistributionForm}
        >
          + Distribute Inventory
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Distribution Form */}
      {showDistributionForm && (
        <div className="distribution-form">
          <div className="form-header">
            <h2>Distribute Inventory to Shops</h2>
            <button 
              onClick={() => {
                setShowDistributionForm(false);
                setSelectedShops([]);
                setDistributions([]);
              }}
              className="close-button"
            >
              ✕
            </button>
          </div>

          {/* Shop Selection */}
          <div className="shop-selection">
            <h3>Select Shops</h3>
            <div className="shop-grid">
              {shops.map(shop => (
                <div 
                  key={shop.id}
                  className={`shop-card ${selectedShops.includes(shop.id) ? 'selected' : ''}`}
                  onClick={() => handleShopSelect(shop.id)}
                >
                  <h4>{shop.name}</h4>
                  <p>{shop.owner_name}</p>
                  <div className="shop-stats">
                    <span>Items: {shop.total_items}</span>
                    <span>Value: ${shop.total_value.toFixed(2)}</span>
                    {shop.low_stock_count > 0 && (
                      <span className="low-stock">Low Stock: {shop.low_stock_count}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution Items */}
          {selectedShops.length > 0 && (
            <div className="distribution-items">
              <h3>Configure Distribution</h3>
              <div className="distribution-help">
                <p>💡 Start typing to search for frames by ID, name, or brand. Select from the dropdown to add items.</p>
              </div>
              
              {distributions.map(dist => {
                const shop = shops.find(s => s.id === dist.shop_id);
                return (
                  <div key={dist.shop_id} className="shop-distribution">
                    <div className="shop-distribution-header">
                      <h4>{shop?.name}</h4>
                      <button 
                        onClick={() => addItemToDistribution(dist.shop_id)}
                        className="add-item-button"
                      >
                        + Add Item
                      </button>
                    </div>

                    {dist.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="distribution-item-two-column">
                        <div className="frame-input-section">
                          <input
                            type="text"
                            placeholder="Search frames by ID, name, or brand..."
                            value={item.frame_id}
                            onChange={(e) => updateDistributionItem(dist.shop_id, itemIndex, 'frame_id', e.target.value)}
                            onFocus={() => {
                              console.log('Input focused, item:', item);
                              if (item.searchResults && item.searchResults.length > 0) {
                                updateDistributionItemDetails(dist.shop_id, itemIndex, { showDropdown: true });
                              }
                            }}
                            onBlur={() => setTimeout(() => updateDistributionItemDetails(dist.shop_id, itemIndex, { showDropdown: false }), 200)}
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
                                    selectFrame(dist.shop_id, itemIndex, frame);
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
                          onChange={(e) => updateDistributionItem(dist.shop_id, itemIndex, 'quantity', parseInt(e.target.value) || 0)}
                          className="quantity-input"
                          min="1"
                        />

                        <button
                          onClick={() => removeDistributionItem(dist.shop_id, itemIndex)}
                          className="remove-item-button"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}

              <div className="form-actions">
                <button
                  onClick={() => {
                    setShowDistributionForm(false);
                    setSelectedShops([]);
                    setDistributions([]);
                  }}
                  className="cancel-button"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDistribution}
                  className="distribute-button"
                  disabled={processing || distributions.every(dist => dist.items.length === 0)}
                >
                  {processing ? 'Processing...' : 'Distribute Inventory'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shops Overview */}
      {!showDistributionForm && (
        <>
          <div className="shops-overview">
            <h2>Shops Overview</h2>
            <div className="shops-grid">
              {shops.map(shop => (
                <div key={shop.id} className="shop-overview-card">
                  <div className="shop-header">
                    <h3>{shop.name}</h3>
                    <button 
                      onClick={() => viewShopInventory(shop.id)}
                      className="view-button"
                    >
                      View Details
                    </button>
                  </div>
                  
                  <div className="shop-info">
                    <p><strong>Owner:</strong> {shop.owner_name}</p>
                    <p><strong>Address:</strong> {shop.address}</p>
                  </div>

                  <div className="shop-stats">
                    <div className="stat">
                      <span className="label">Total Items</span>
                      <span className="value">{shop.total_items}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Total Value</span>
                      <span className="value">${shop.total_value.toFixed(2)}</span>
                    </div>
                    {shop.low_stock_count > 0 && (
                      <div className="stat warning">
                        <span className="label">Low Stock</span>
                        <span className="value">{shop.low_stock_count} items</span>
                      </div>
                    )}
                    {shop.last_distribution && (
                      <div className="stat full-width">
                        <span className="label">Last Distribution</span>
                        <span className="value">
                          {new Date(shop.last_distribution).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Distributions */}
          <div className="recent-distributions">
            <h2>Recent Distributions</h2>
            {recentDistributions.length === 0 ? (
              <p>No recent distributions found.</p>
            ) : (
              <div className="distributions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Shop</th>
                      <th>Frame</th>
                      <th>Product ID</th>
                      <th>Quantity</th>
                      <th>Unit Cost</th>
                      <th>Distributed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDistributions.map(dist => (
                      <tr key={dist.id}>
                        <td>{new Date(dist.created_at).toLocaleDateString()}</td>
                        <td>{dist.shop_name}</td>
                        <td>{dist.frame_name}</td>
                        <td>{dist.product_id}</td>
                        <td>{dist.quantity}</td>
                        <td>{dist.unit_cost ? `$${dist.unit_cost.toFixed(2)}` : 'N/A'}</td>
                        <td>{dist.created_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryDistributionPage; 