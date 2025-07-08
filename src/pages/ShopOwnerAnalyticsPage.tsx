import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { logout } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8001/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface SalesTrend {
  period: string;
  sales_count: number;
  total_revenue: number;
}

interface TopProduct {
  frame_name: string;
  product_id: string;
  sales_count: number;
  total_revenue: number;
}

interface TopCombination {
  frame_name: string;
  product_id: string;
  lens_type: string;
  sales_count: number;
  total_revenue: number;
}

interface SlowMovingItem {
  inventory_item_id: number;
  frame_name: string;
  product_id: string;
  frame_price: number;
  date_stocked: string;
  days_in_stock: number;
}

interface LowStockItem {
  frame_name: string;
  product_id: string;
  quantity_remaining: number;
  quantity_sold: number;
  quantity_received: number;
  frame_price: number;
  last_restocked: string;
}

interface SalesReport {
  report_type: string;
  year: number;
  months?: Array<{
    month: number;
    period: string;
    total_sales: number;
    total_revenue: number;
    avg_sale_value: number;
  }>;
  quarters?: Array<{
    quarter: number;
    period: string;
    total_sales: number;
    total_revenue: number;
    avg_sale_value: number;
  }>;
}

const ShopOwnerAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [shopName, setShopName] = useState('');
  
  // Data states
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCombinations, setTopCombinations] = useState<TopCombination[]>([]);
  const [slowMovingItems, setSlowMovingItems] = useState<SlowMovingItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  
  // Filter states
  const [trendsFilter, setTrendsFilter] = useState<'day' | 'week' | 'month'>('month');
  const [reportType, setReportType] = useState<'monthly' | 'quarterly'>('monthly');
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchAllAnalytics();
  }, [trendsFilter, reportType, reportYear]);

  const fetchAllAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [
        trends,
        topProducts,
        topLens,
        slowMoving,
        lowStock,
        salesReport,
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard/shop/sales-trends/?period=${trendsFilter}`, { headers }),
        axios.get(`${API_BASE_URL}/dashboard/shop/top-products/?limit=10`, { headers }),
        axios.get(`${API_BASE_URL}/dashboard/shop/top-products-with-lens/?limit=10`, { headers }),
        axios.get(`${API_BASE_URL}/dashboard/shop/slow-moving-inventory/?days=90`, { headers }),
        axios.get(`${API_BASE_URL}/dashboard/shop/low-stock-alerts/?threshold=5`, { headers }),
        axios.get(`${API_BASE_URL}/dashboard/shop/sales-report/?type=${reportType}&year=${reportYear}`, { headers }),
      ]);

      setSalesTrends(trends.data.trends || []);
      setTopProducts(topProducts.data.top_products || []);
      setShopName(topProducts.data.shop_name || '');
      setTopCombinations(topLens.data.top_combinations || []);
      setSlowMovingItems(slowMoving.data.slow_moving_items || []);
      setLowStockItems(lowStock.data.low_stock_items || []);
      setSalesReport(salesReport.data);
      
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [trendsFilter, reportType, reportYear]);

  const handleLogout = () => {
    logout(navigate);
  };

  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

  // Chart configurations
  const salesTrendsChartData = {
    labels: salesTrends.map(trend => trend.period),
    datasets: [
      {
        label: 'Sales Count',
        data: salesTrends.map(trend => trend.sales_count),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        yAxisID: 'y',
      },
      {
        label: 'Revenue ($)',
        data: salesTrends.map(trend => trend.total_revenue),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        yAxisID: 'y1',
      }
    ]
  };

  const topProductsChartData = {
    labels: topProducts.map(product => product.frame_name),
    datasets: [
      {
        label: 'Sales Count',
        data: topProducts.map(product => product.sales_count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: 'rgba(255, 255, 255, 0.7)',
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <div className="header-left">
          <button 
            onClick={() => navigate('/shop-owner')}
            className="back-button"
          >
            ← Back to Dashboard
          </button>
          <h1>{shopName} Analytics</h1>
        </div>
        <div className="user-info">
          <span>Welcome, {userInfo.username}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Tab Navigation */}
      <div className="analytics-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Product Analytics
        </button>
        <button 
          className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory & Alerts
        </button>
        <button 
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Sales Reports
        </button>
      </div>

      <div className="analytics-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="charts-grid">
              <div className="chart-container">
                <h3>Sales Trends</h3>
                <div className="chart-filters">
                  <select 
                    value={trendsFilter} 
                    onChange={(e) => setTrendsFilter(e.target.value as 'day' | 'week' | 'month')}
                  >
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                  </select>
                </div>
                <Line data={salesTrendsChartData} options={chartOptions} />
              </div>

              <div className="chart-container">
                <h3>Top 5 Products by Sales</h3>
                <Pie data={topProductsChartData} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />
              </div>
            </div>
          </div>
        )}

        {/* Product Analytics Tab */}
        {activeTab === 'products' && (
          <div className="products-section">
            <div className="section-header">
              <h2>Product Analytics</h2>
            </div>

            <div className="charts-grid">
              <div className="chart-container">
                <h3>Top Selling Products (by Revenue)</h3>
                <Bar 
                  data={{
                    labels: topProducts.map(p => p.frame_name),
                    datasets: [{
                      label: 'Total Revenue ($)',
                      data: topProducts.map(p => p.total_revenue),
                      backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    }]
                  }} 
                  options={{ responsive: true, indexAxis: 'y' }} 
                />
              </div>

              <div className="chart-container">
                <h3>Top Product & Lens Combinations</h3>
                <div className="combinations-list">
                  {topCombinations.map((combo, index) => (
                    <div key={index} className="combination-item">
                      <div className="combination-info">
                        <strong>{combo.frame_name}</strong>
                        <span className="lens-type">with {combo.lens_type}</span>
                      </div>
                      <div className="combination-stats">
                        <div className="stat">
                          <span className="stat-value">{combo.sales_count}</span>
                          <span className="stat-label">Sales</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">${combo.total_revenue.toFixed(2)}</span>
                          <span className="stat-label">Revenue</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory & Alerts Tab */}
        {activeTab === 'inventory' && (
          <div className="inventory-alerts-section">
            <div className="section-header">
              <h2>Inventory & Alerts</h2>
            </div>
            
            <div className="inventory-tables-grid">
              <div className="table-container">
                <h3>Slow Moving Inventory (90+ days)</h3>
                <div className="slow-moving-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Days in Stock</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slowMovingItems.map(item => (
                        <tr key={item.inventory_item_id}>
                          <td>
                            <div className="product-info">
                              <strong>{item.frame_name}</strong>
                              <span className="product-id">({item.product_id})</span>
                            </div>
                          </td>
                          <td className="days-in-stock">{item.days_in_stock}</td>
                          <td>${item.frame_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="table-container">
                <h3>Low Stock Alerts</h3>
                <div className="low-stock-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Remaining</th>
                        <th>Last Restocked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="product-info">
                              <strong>{item.frame_name}</strong>
                              <span className="product-id">({item.product_id})</span>
                            </div>
                          </td>
                          <td className="stock-remaining">{item.quantity_remaining}</td>
                          <td>{item.last_restocked}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Reports Tab */}
        {activeTab === 'reports' && (
          <div className="sales-report-section">
            <div className="section-header">
              <h2>Sales Reports</h2>
              <div className="report-controls">
                <select 
                  value={reportType} 
                  onChange={(e) => setReportType(e.target.value as 'monthly' | 'quarterly')}
                >
                  <option value="monthly">Monthly Report</option>
                  <option value="quarterly">Quarterly Report</option>
                </select>
                <select 
                  value={reportYear} 
                  onChange={(e) => setReportYear(parseInt(e.target.value))}
                >
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                  <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
                </select>
              </div>
            </div>
            
            <div className="report-table">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Sales Count</th>
                    <th>Revenue</th>
                    <th>Avg Sale Value</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReport?.months?.map(month => (
                    <tr key={month.month}>
                      <td>{month.period}</td>
                      <td>{month.total_sales}</td>
                      <td>${month.total_revenue.toFixed(2)}</td>
                      <td>${month.avg_sale_value.toFixed(2)}</td>
                    </tr>
                  ))}
                  {salesReport?.quarters?.map(quarter => (
                    <tr key={quarter.quarter}>
                      <td>{quarter.period}</td>
                      <td>{quarter.total_sales}</td>
                      <td>${quarter.total_revenue.toFixed(2)}</td>
                      <td>${quarter.avg_sale_value.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopOwnerAnalyticsPage; 