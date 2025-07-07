import React, { useState } from 'react';
import axios from 'axios';

interface Shop {
  id: number;
  name: string;
  address: string;
  owner_name: string;
  phone: string;
  email: string;
}

interface EditShopFormData {
  name: string;
  address: string;
  owner_name: string;
  phone: string;
  email: string;
}

interface EditShopFormProps {
  shop: Shop;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditShopForm: React.FC<EditShopFormProps> = ({ shop, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<EditShopFormData>({
    name: shop.name || '',
    address: shop.address || '',
    owner_name: shop.owner_name || '',
    phone: shop.phone || '',
    email: shop.email || '',
  });

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev: any) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) newErrors.name = 'Shop name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';

    // Email validation (only if provided)
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Phone validation (only if provided)
    if (formData.phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.put(
        `http://127.0.0.1:8001/api/shops/${shop.id}/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setSuccessMessage('Shop updated successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error('Error updating shop:', err);
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ general: 'Failed to update shop. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setErrors({});

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(
        `http://127.0.0.1:8001/api/shops/${shop.id}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage('Shop deleted successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error('Error deleting shop:', err);
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ general: 'Failed to delete shop. Please try again.' });
      }
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (successMessage) {
    return (
      <div className="edit-shop-success">
        <div className="success-icon">✅</div>
        <h3>{successMessage.includes('deleted') ? 'Shop Deleted Successfully!' : 'Shop Updated Successfully!'}</h3>
        <p>{successMessage}</p>
      </div>
    );
  }

  return (
    <div className="edit-shop-form">
      <div className="form-header">
        <h2>Edit Shop</h2>
        <p>Update shop information</p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <div className="delete-icon">⚠️</div>
            <h3>Delete Shop</h3>
            <p>
              Are you sure you want to delete <strong>"{shop.name}"</strong>?
              <br />
              <br />
              This action cannot be undone. All associated data will be permanently removed.
            </p>
            <div className="delete-actions">
              <button 
                onClick={handleCancelDelete}
                className="cancel-delete-button"
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="confirm-delete-button"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Shop'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="shop-form">
        {errors.general && (
          <div className="error-message">{errors.general}</div>
        )}

        <div className="form-section">
          <h3>Shop Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Shop Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                placeholder="Enter shop name"
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={errors.address ? 'error' : ''}
                placeholder="Enter complete shop address"
                rows={3}
              />
              {errors.address && <span className="field-error">{errors.address}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Contact Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="owner_name">Owner Name</label>
              <input
                type="text"
                id="owner_name"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                className={errors.owner_name ? 'error' : ''}
                placeholder="Enter owner's full name"
              />
              {errors.owner_name && <span className="field-error">{errors.owner_name}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? 'error' : ''}
                placeholder="Enter phone number"
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="Enter email address"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <div className="left-actions">
            <button
              type="button"
              onClick={handleDeleteClick}
              className="delete-shop-button"
              disabled={loading || deleting}
            >
              🗑️ Delete Shop
            </button>
          </div>
          <div className="right-actions">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-button"
              disabled={loading || deleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading || deleting}
            >
              {loading ? 'Updating Shop...' : 'Update Shop'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditShopForm; 