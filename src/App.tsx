import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import DistributorPage from './pages/DistributorPage';
import ShopOwnerDashboard from './pages/ShopOwnerDashboard';
import ShopOwnerInventory from './pages/ShopOwnerInventory';
import ShopOwnerSales from './pages/ShopOwnerSales';
import ShopOwnerAnalyticsPage from './pages/ShopOwnerAnalyticsPage';
import ProductCatalogPage from './pages/ProductCatalogPage';
import ShopManagementPage from './pages/ShopManagementPage';
import InventoryDistributionPage from './pages/InventoryDistributionPage';
import ShopInventoryDetailPage from './pages/ShopInventoryDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  // Check if user is already logged in and redirect appropriately
  const token = localStorage.getItem('access_token');
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  
  const getInitialRoute = () => {
    if (userInfo.role === 'DISTRIBUTOR') {
        return '/distributor';
    } else if (userInfo.role === 'SHOP_OWNER') {
        return '/shop-owner';
    }
    return '/';
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Login Route */}
          <Route 
            path="/" 
            element={
              token && userInfo ? (
                <Navigate to={getInitialRoute()} replace />
              ) : (
                <LoginPage />
              )
            } 
          />
          
          {/* Distributor Dashboard */}
          <Route 
            path="/distributor" 
            element={
              <ProtectedRoute requiredRole="DISTRIBUTOR">
                <DistributorPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Product Catalog Page */}
          <Route 
            path="/distributor/products" 
            element={
              <ProtectedRoute requiredRole="DISTRIBUTOR">
                <ProductCatalogPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Shop Management Page */}
          <Route 
            path="/distributor/shops" 
            element={
              <ProtectedRoute requiredRole="DISTRIBUTOR">
                <ShopManagementPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Inventory Distribution Page */}
          <Route 
            path="/distributor/inventory-distribution" 
            element={
              <ProtectedRoute requiredRole="DISTRIBUTOR">
                <InventoryDistributionPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Analytics Page */}
          <Route 
            path="/distributor/analytics" 
            element={
              <ProtectedRoute requiredRole="DISTRIBUTOR">
                <AnalyticsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Shop Inventory Detail Page */}
          <Route 
            path="/distributor/shop-inventory/:shopId" 
            element={
              <ProtectedRoute requiredRole="DISTRIBUTOR">
                <ShopInventoryDetailPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Shop Owner Dashboard */}
          <Route 
            path="/shop-owner" 
            element={
              <ProtectedRoute requiredRole="SHOP_OWNER">
                <ShopOwnerDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Shop Owner Inventory */}
          <Route 
            path="/shop-owner/inventory" 
            element={
              <ProtectedRoute requiredRole="SHOP_OWNER">
                <ShopOwnerInventory />
              </ProtectedRoute>
            } 
          />
          
          {/* Shop Owner Sales */}
          <Route 
            path="/shop-owner/sales" 
            element={
              <ProtectedRoute requiredRole="SHOP_OWNER">
                <ShopOwnerSales />
              </ProtectedRoute>
            } 
          />

          {/* Shop Owner Analytics */}
          <Route 
            path="/shop-owner/analytics" 
            element={
              <ProtectedRoute requiredRole="SHOP_OWNER">
                <ShopOwnerAnalyticsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
