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
  RadialLinearScale,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar } from 'react-chartjs-2';
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
  ArcElement,
  RadialLinearScale,
  Filler
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
  shop_name: string;
  shop_id: number;
  date_stocked: string;
  days_in_stock: number;
}

interface ShopPerformance {
  shop_id: number;
  shop_name: string;
  owner_name: string;
  total_sales: number;
  total_revenue: number;
  avg_sale_value: number;
  total_inventory_value: number;
  total_items_in_stock: number;
  low_stock_items: number;
  total_profit: number;
  total_cost: number;
}

interface RevenueSummary {
  period: string;
  overall_summary: {
    total_sales: number;
    total_revenue: number;
    avg_sale_value: number;
  };
  shop_revenue: Array<{
    shop_id: number;
    shop_name: string;
    total_sales: number;
    total_revenue: number;
    avg_sale_value: number;
  }>;
  revenue_trends: Array<{
    month: string;
    total_sales: number;
    total_revenue: number;
  }>;
}

interface LowStockAlert {
  shop_id: number;
  shop_name: string;
  items: Array<{
    frame_name: string;
    product_id: string;
    quantity_remaining: number;
    quantity_sold: number;
    quantity_received: number;
    frame_price: number;
    last_restocked: string;
  }>;
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

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCombinations, setTopCombinations] = useState<TopCombination[]>([]);
  const [slowMovingItems, setSlowMovingItems] = useState<SlowMovingItem[]>([]);
  const [shopPerformance, setShopPerformance] = useState<ShopPerformance[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  
  // Filter states
  const [trendsFilter, setTrendsFilter] = useState<'day' | 'week' | 'month'>('month');
  const [performanceFilter, setPerformanceFilter] = useState<'month' | 'quarter' | 'year'>('month');
  const [revenueFilter, setRevenueFilter] = useState<'month' | 'quarter' | 'year'>('month');
  const [reportType, setReportType] = useState<'monthly' | 'quarterly'>('monthly');
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchAllAnalytics();
  }, [trendsFilter, performanceFilter, revenueFilter, reportType, reportYear]);

  const fetchAllAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const requests = [
        axios.get(`${API_BASE_URL}/dashboard/sales-trends/?period=${trendsFilter}`, { headers }),
        axios.get(`${API_BASE_URL}/dashboard/top-products/?limit=10`, { headers }),
        axios.get(`${API_BASE_URL}/dashboard/top-products-with-lens/?limit=10`, { headers }),
        axios.get(`${API_BASE_URL}/dashboard/slow-moving-inventory/?days=90`, { headers }),
        axios.get(`${API_BASE_URL}/dashboard/shop-performance/?period=${performanceFilter}`, { headers }),
        axios.get(`${API_BASE_URL}/dashboard/revenue-summary/?period=${revenueFilter}`, { headers }),
        axios.get(`${API_BASE_URL}/dashboard/low-stock-alerts/?threshold=5`, { headers }),
        axios.get(`${API_BASE_URL}/dashboard/sales-report/?type=${reportType}&year=${reportYear}`, { headers }),
      ];
      
      const responses = await Promise.all(requests);
      
      setSalesTrends(responses[0].data.trends || []);
      setTopProducts(responses[1].data.top_products || []);
      setTopCombinations(responses[2].data.top_combinations || []);
      setSlowMovingItems(responses[3].data.slow_moving_items || []);
      setShopPerformance(responses[4].data.shop_performance || []);
      setRevenueSummary(responses[5].data);
      setLowStockAlerts(responses[6].data.shop_alerts || []);
      setSalesReport(responses[7].data);
      
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [trendsFilter, performanceFilter, revenueFilter, reportType, reportYear]);

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
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)',
          'rgba(255, 99, 255, 0.8)',
          'rgba(99, 255, 132, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(255, 99, 255, 1)',
          'rgba(99, 255, 132, 1)',
        ],
        borderWidth: 1,
      }
    ]
  };

  const shopPerformanceChartData = {
    labels: shopPerformance.map(shop => shop.shop_name),
    datasets: [
      {
        label: 'Total Revenue ($)',
        data: shopPerformance.map(shop => shop.total_revenue),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }
    ]
  };

  const revenueTrendsChartData = {
    labels: revenueSummary?.revenue_trends.map(trend => trend.month) || [],
    datasets: [
      {
        label: 'Monthly Revenue ($)',
        data: revenueSummary?.revenue_trends.map(trend => trend.total_revenue) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true,
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
        display: true,
        text: 'Analytics Dashboard',
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
            onClick={() => navigate('/distributor')}
            className="back-button"
          >
            ← Back to Dashboard
          </button>
          <h1>Analytics Dashboard</h1>
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
          className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Sales Analytics
        </button>
        <button 
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Product Analytics
        </button>
        <button 
          className={`tab-button ${activeTab === 'shops' ? 'active' : ''}`}
          onClick={() => setActiveTab('shops')}
        >
          Shop Performance
        </button>
        <button 
          className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Alerts & Reports
        </button>
      </div>

      <div className="analytics-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="summary-cards">
              <div className="summary-card">
                <h3>Total Sales</h3>
                <div className="summary-value">{revenueSummary?.overall_summary.total_sales || 0}</div>
                <div className="summary-label">This {revenueFilter}</div>
              </div>
              <div className="summary-card">
                <h3>Total Revenue</h3>
                <div className="summary-value">${revenueSummary?.overall_summary.total_revenue.toFixed(2) || '0.00'}</div>
                <div className="summary-label">This {revenueFilter}</div>
              </div>
              <div className="summary-card">
                <h3>Average Sale Value</h3>
                <div className="summary-value">${revenueSummary?.overall_summary.avg_sale_value.toFixed(2) || '0.00'}</div>
                <div className="summary-label">This {revenueFilter}</div>
              </div>
              <div className="summary-card alert">
                <h3>Low Stock Alerts</h3>
                <div className="summary-value">{lowStockAlerts.reduce((acc, alert) => acc + alert.items.length, 0)}</div>
                <div className="summary-label">Items need restocking</div>
              </div>
            </div>

            <div className="overview-charts">
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
                <h3>Top Products</h3>
                <Bar data={topProductsChartData} options={{ responsive: true }} />
              </div>
            </div>
          </div>
        )}

        {/* Sales Analytics Tab */}
        {activeTab === 'sales' && (
          <div className="sales-section">
            <div className="section-header">
              <h2>Sales Analytics</h2>
              <div className="section-filters">
                <select 
                  value={trendsFilter} 
                  onChange={(e) => setTrendsFilter(e.target.value as 'day' | 'week' | 'month')}
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-container">
                <h3>Sales Trends Over Time</h3>
                <Line data={salesTrendsChartData} options={chartOptions} />
              </div>

              <div className="chart-container">
                <h3>Revenue Trends</h3>
                <Line data={revenueTrendsChartData} options={{ responsive: true }} />
              </div>
            </div>

            <div className="sales-report-section">
              <h3>Sales Reports</h3>
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
          </div>
        )}

        {/* Products Analytics Tab */}
        {activeTab === 'products' && (
          <div className="products-section">
            <div className="section-header">
              <h2>Product Analytics</h2>
            </div>

            <div className="charts-grid">
              <div className="chart-container">
                <h3>Top Selling Products</h3>
                <Bar data={topProductsChartData} options={{ responsive: true }} />
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

            <div className="slow-moving-section">
              <h3>Slow Moving Inventory (90+ days)</h3>
              <div className="slow-moving-table">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Shop</th>
                      <th>Days in Stock</th>
                      <th>Price</th>
                      <th>Date Stocked</th>
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
                        <td>{item.shop_name}</td>
                        <td className="days-in-stock">{item.days_in_stock}</td>
                        <td>${item.frame_price.toFixed(2)}</td>
                        <td>{item.date_stocked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Shop Performance Tab */}
        {activeTab === 'shops' && (
          <div className="shops-section">
            <div className="section-header">
              <h2>Shop Performance Comparison</h2>
              <div className="section-filters">
                <select 
                  value={performanceFilter} 
                  onChange={(e) => setPerformanceFilter(e.target.value as 'month' | 'quarter' | 'year')}
                >
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>

            <div className="chart-container">
              <h3>Revenue by Shop</h3>
              <Bar data={shopPerformanceChartData} options={{ responsive: true }} />
            </div>

            <div className="performance-table">
              <table>
                <thead>
                  <tr>
                    <th>Shop Name</th>
                    <th>Owner</th>
                    <th>Sales Count</th>
                    <th>Revenue</th>
                    <th>Avg Sale Value</th>
                    <th>Inventory Value</th>
                    <th>Items in Stock</th>
                    <th>Low Stock Items</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {shopPerformance.map(shop => (
                    <tr key={shop.shop_id}>
                      <td><strong>{shop.shop_name}</strong></td>
                      <td>{shop.owner_name}</td>
                      <td>{shop.total_sales}</td>
                      <td>${shop.total_revenue.toFixed(2)}</td>
                      <td>${shop.avg_sale_value.toFixed(2)}</td>
                      <td>${shop.total_inventory_value.toFixed(2)}</td>
                      <td>{shop.total_items_in_stock}</td>
                      <td className={shop.low_stock_items > 0 ? 'warning' : ''}>
                        {shop.low_stock_items}
                      </td>
                      <td className={shop.total_profit > 0 ? 'profit' : 'loss'}>
                        ${shop.total_profit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Alerts & Reports Tab */}
        {activeTab === 'alerts' && (
          <div className="alerts-section">
            <div className="section-header">
              <h2>Alerts & Reports</h2>
            </div>

            <div className="low-stock-alerts">
              <h3>Low Stock Alerts</h3>
              <div className="alert-summary">
                <div className="alert-stat">
                  <span className="stat-value">{lowStockAlerts.reduce((acc, alert) => acc + alert.items.length, 0)}</span>
                  <span className="stat-label">Items need restocking</span>
                </div>
                <div className="alert-stat">
                  <span className="stat-value">{lowStockAlerts.length}</span>
                  <span className="stat-label">Shops affected</span>
                </div>
              </div>
              
              <div className="alerts-grid">
                {lowStockAlerts.map(alert => (
                  <div key={alert.shop_id} className="alert-card">
                    <div className="alert-header">
                      <h4>{alert.shop_name}</h4>
                      <span className="alert-count">{alert.items.length} items</span>
                    </div>
                    <div className="alert-items">
                      {alert.items.map((item, index) => (
                        <div key={index} className="alert-item">
                          <div className="item-info">
                            <strong>{item.frame_name}</strong>
                            <span className="item-id">({item.product_id})</span>
                          </div>
                          <div className="item-stock">
                            <span className="stock-remaining">{item.quantity_remaining} left</span>
                            <span className="stock-price">${item.frame_price.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="revenue-summary-section">
              <h3>Revenue Summary</h3>
              <div className="revenue-filter">
                <select 
                  value={revenueFilter} 
                  onChange={(e) => setRevenueFilter(e.target.value as 'month' | 'quarter' | 'year')}
                >
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              
              <div className="revenue-shops-grid">
                {revenueSummary?.shop_revenue.map(shop => (
                  <div key={shop.shop_id} className="revenue-shop-card">
                    <h4>{shop.shop_name}</h4>
                    <div className="revenue-stats">
                      <div className="revenue-stat">
                        <span className="stat-value">{shop.total_sales}</span>
                        <span className="stat-label">Sales</span>
                      </div>
                      <div className="revenue-stat">
                        <span className="stat-value">${shop.total_revenue.toFixed(2)}</span>
                        <span className="stat-label">Revenue</span>
                      </div>
                      <div className="revenue-stat">
                        <span className="stat-value">${shop.avg_sale_value.toFixed(2)}</span>
                        <span className="stat-label">Avg Sale</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage; 