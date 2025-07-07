import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Frame {
  frame_id: string;
  frame_name: string;
  frame_type: string;
  price: string;
  color: string;
  material: string;
  brand: string;
}

interface FilterChoices {
  frame_types: { value: string; label: string }[];
  colors: { value: string; label: string }[];
  materials: { value: string; label: string }[];
  brands: string[];
}

interface UploadResult {
  success: boolean;
  created: number;
  updated: number;
  total_processed: number;
  errors?: string[];
  error_count?: number;
  error?: string;
}

const ProductCatalog: React.FC = () => {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [filteredFrames, setFilteredFrames] = useState<Frame[]>([]);
  const [filterChoices, setFilterChoices] = useState<FilterChoices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    frame_type: '',
    color: '',
    material: '',
    brand: ''
  });

  // CSV Upload states
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFrames();
    fetchFilterChoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [frames, searchTerm, filters]);

  const fetchFrames = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://127.0.0.1:8001/api/frames/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFrames(response.data);
    } catch (err) {
      console.error('Error fetching frames:', err);
      setError('Failed to load product catalog');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterChoices = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://127.0.0.1:8001/api/frames/choices/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFilterChoices(response.data);
    } catch (err) {
      console.error('Error fetching filter choices:', err);
    }
  };

  const applyFilters = () => {
    let filtered = frames;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(frame =>
        frame.frame_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        frame.frame_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        frame.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filters
    if (filters.frame_type) {
      filtered = filtered.filter(frame => frame.frame_type === filters.frame_type);
    }
    if (filters.color) {
      filtered = filtered.filter(frame => frame.color === filters.color);
    }
    if (filters.material) {
      filtered = filtered.filter(frame => frame.material === filters.material);
    }
    if (filters.brand) {
      filtered = filtered.filter(frame => frame.brand === filters.brand);
    }

    setFilteredFrames(filtered);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      frame_type: '',
      color: '',
      material: '',
      brand: ''
    });
    setSearchTerm('');
  };

  // CSV Upload functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCsvFile(file);
        setUploadResult(null);
        setError('');
      } else {
        setError('Please select a valid CSV file');
        setCsvFile(null);
      }
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setError('Please select a CSV file first');
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        'http://127.0.0.1:8001/api/frames/upload_csv/',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setUploadResult(response.data);
      
      // Refresh the frames list if upload was successful
      if (response.data.success && response.data.total_processed > 0) {
        await fetchFrames();
      }

      // Clear the file input
      setCsvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err: any) {
      console.error('Error uploading CSV:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to upload CSV file');
      }
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        'http://127.0.0.1:8001/api/frames/csv_template/',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'frames_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading template:', err);
      setError('Failed to download template');
    }
  };

  if (loading) {
    return <div className="loading">Loading product catalog...</div>;
  }

  if (error && !uploadResult) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="product-catalog">
      <div className="catalog-header">
        <h2>Product Catalog</h2>
        <div className="catalog-actions">
          <button 
            onClick={() => setShowUploadSection(!showUploadSection)}
            className="upload-toggle-btn"
          >
            {showUploadSection ? 'Hide' : 'Show'} CSV Upload
          </button>
          <p>Total Products: {filteredFrames.length}</p>
        </div>
      </div>

      {/* CSV Upload Section */}
      {showUploadSection && (
        <div className="csv-upload-section">
          <h3>Bulk Upload Products</h3>
          <div className="upload-controls">
            <div className="file-input-section">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileSelect}
                className="file-input"
              />
              {csvFile && (
                <span className="file-selected">
                  Selected: {csvFile.name}
                </span>
              )}
            </div>
            
            <div className="upload-actions">
              <button
                onClick={handleCsvUpload}
                disabled={!csvFile || uploading}
                className="upload-btn"
              >
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
              
              <button
                onClick={downloadTemplate}
                className="template-btn"
              >
                Download Template
              </button>
            </div>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className={`upload-result ${uploadResult.success ? 'success' : 'error'}`}>
              <h4>Upload Results:</h4>
              {uploadResult.success ? (
                <div>
                  <p>✅ Upload completed successfully!</p>
                  <ul>
                    <li>Created: {uploadResult.created} products</li>
                    <li>Updated: {uploadResult.updated} products</li>
                    <li>Total Processed: {uploadResult.total_processed} products</li>
                  </ul>
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="upload-errors">
                      <p>⚠️ Some rows had errors ({uploadResult.error_count} errors):</p>
                      <ul className="error-list">
                        {uploadResult.errors.slice(0, 10).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {uploadResult.errors.length > 10 && (
                          <li>... and {uploadResult.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p>❌ Upload failed: {uploadResult.error}</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="catalog-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by name, ID, or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-section">
          <select
            value={filters.frame_type}
            onChange={(e) => handleFilterChange('frame_type', e.target.value)}
          >
            <option value="">All Frame Types</option>
            {filterChoices?.frame_types.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <select
            value={filters.color}
            onChange={(e) => handleFilterChange('color', e.target.value)}
          >
            <option value="">All Colors</option>
            {filterChoices?.colors.map(color => (
              <option key={color.value} value={color.value}>{color.label}</option>
            ))}
          </select>

          <select
            value={filters.material}
            onChange={(e) => handleFilterChange('material', e.target.value)}
          >
            <option value="">All Materials</option>
            {filterChoices?.materials.map(material => (
              <option key={material.value} value={material.value}>{material.label}</option>
            ))}
          </select>

          <select
            value={filters.brand}
            onChange={(e) => handleFilterChange('brand', e.target.value)}
          >
            <option value="">All Brands</option>
            {filterChoices?.brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          <button onClick={clearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="products-grid">
        {filteredFrames.map(frame => (
          <div key={frame.frame_id} className="product-card">
            <div className="product-header">
              <h3>{frame.frame_name}</h3>
              <span className="product-id">ID: {frame.frame_id}</span>
            </div>
            <div className="product-details">
              <div className="detail-row">
                <span className="label">Type:</span>
                <span className="value">{frame.frame_type}</span>
              </div>
              <div className="detail-row">
                <span className="label">Brand:</span>
                <span className="value">{frame.brand}</span>
              </div>
              <div className="detail-row">
                <span className="label">Color:</span>
                <span className="value">{frame.color}</span>
              </div>
              <div className="detail-row">
                <span className="label">Material:</span>
                <span className="value">{frame.material}</span>
              </div>
              <div className="price">
                ${parseFloat(frame.price).toFixed(2)}
              </div>
            </div>
            <div className="product-actions">
              <button className="edit-btn">Edit</button>
              <button className="delete-btn">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {filteredFrames.length === 0 && (
        <div className="no-products">
          <p>No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog; 