import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8001/api';

interface CreateShopFormData {
  name: string;
  address: string;
  owner_name: string;
  phone: string;
  email: string;
  username: string;
  password: string;
  confirm_password: string;
}

interface CreateShopFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateShopForm: React.FC<CreateShopFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<CreateShopFormData>({
    name: '',
    address: '',
    owner_name: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState('');

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
    if (!formData.owner_name.trim()) newErrors.owner_name = 'Owner name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (basic)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
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
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/shops/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setSuccessMessage(response.data.message || 'Shop created successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error('Error creating shop:', err);
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ general: 'Failed to create shop. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className="create-shop-success">
        <div className="success-icon">✅</div>
        <h3>Shop Created Successfully!</h3>
        <p>{successMessage}</p>
      </div>
    );
  }

  return (
    <div className="create-shop-form">
      <div className="form-header">
        <h2>Create New Shop</h2>
        <p>Enter shop details and create a user account for the shop owner</p>
      </div>

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
          <h3>Owner Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="owner_name">Owner Name *</label>
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
              <label htmlFor="phone">Phone Number *</label>
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
              <label htmlFor="email">Email Address *</label>
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

        <div className="form-section">
          <h3>User Account</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={errors.username ? 'error' : ''}
                placeholder="Enter username for login"
              />
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                placeholder="Enter password (min 6 characters)"
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">Confirm Password *</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className={errors.confirm_password ? 'error' : ''}
                placeholder="Confirm password"
              />
              {errors.confirm_password && <span className="field-error">{errors.confirm_password}</span>}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Creating Shop...' : 'Create Shop & User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateShopForm; 