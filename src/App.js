import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Shield, Activity, TrendingUp, Database, Bell, RefreshCw, Check, X } from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalTx: 0,
    fraudDetected: 0,
    accuracy: 0,
    activeAlerts: 0
  });
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [fraudTrendData, setFraudTrendData] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [txsRes, alertsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/txs?limit=50`),
        fetch(`${API_URL}/api/alerts?limit=20`),
        fetch(`${API_URL}/api/stats`)
      ]);

      if (txsRes.ok) {
        const txsData = await txsRes.json();
        const txs = txsData.transactions || [];
        setTransactions(txs);
        calculateFraudTrend(txs);
        calculateRiskDistribution(txs);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // IMPROVED: Better fraud trend calculation
  const calculateFraudTrend = (txs) => {
    if (!txs || txs.length === 0) {
      setFraudTrendData([
        { name: 'No Data', normal: 0, fraud: 0 }
      ]);
      return;
    }

    // If less than 6 transactions, show each individually
    if (txs.length < 6) {
      const trendData = txs.reverse().map((tx, index) => ({
        name: `Tx ${index + 1}`,
        normal: (tx.label === 'normal' || !tx.isSuspicious) ? 1 : 0,
        fraud: (tx.label === 'suspicious' || tx.label === 'fraud' || tx.isSuspicious) ? 1 : 0
      }));
      setFraudTrendData(trendData);
      return;
    }

    // For 6+ transactions, group into 6 buckets
    const bucketSize = Math.ceil(txs.length / 6);
    const buckets = [];
    
    for (let i = 0; i < 6; i++) {
      const start = i * bucketSize;
      const end = Math.min(start + bucketSize, txs.length);
      const bucketTxs = txs.slice(start, end);
      
      let normalCount = 0;
      let fraudCount = 0;
      
      bucketTxs.forEach(tx => {
        if (tx.label === 'suspicious' || tx.label === 'fraud' || tx.isSuspicious === true) {
          fraudCount++;
        } else {
          normalCount++;
        }
      });
      
      buckets.push({
        name: i === 0 ? 'Latest' : i === 5 ? 'Oldest' : `Grp ${i + 1}`,
        normal: normalCount,
        fraud: fraudCount
      });
    }
    
    // Reverse to show oldest to newest (left to right)
    setFraudTrendData(buckets.reverse());
  };

  // IMPROVED: Risk distribution
  const calculateRiskDistribution = (txs) => {
    if (!txs || txs.length === 0) {
      setRiskDistribution([
        { name: 'Low Risk', value: 100, color: '#10b981' },
        { name: 'Medium Risk', value: 0, color: '#f59e0b' },
        { name: 'High Risk', value: 0, color: '#ef4444' }
      ]);
      return;
    }

    let lowRisk = 0, mediumRisk = 0, highRisk = 0;

    txs.forEach(tx => {
      const risk = parseFloat(tx.riskScore) || 0;
      if (risk < 0.4) {
        lowRisk++;
      } else if (risk < 0.7) {
        mediumRisk++;
      } else {
        highRisk++;
      }
    });

    const total = txs.length;
    setRiskDistribution([
      { name: 'Low Risk', value: Math.round((lowRisk / total) * 100), color: '#10b981' },
      { name: 'Medium Risk', value: Math.round((mediumRisk / total) * 100), color: '#f59e0b' },
      { name: 'High Risk', value: Math.round((highRisk / total) * 100), color: '#ef4444' }
    ]);
  };

  const connectWallet = async () => {
    setLoading(true);
    setTimeout(() => {
      setConnected(true);
      setAccount('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
      setLoading(false);
    }, 1000);
  };

  const getRiskBadge = (score) => {
    if (score < 0.3) return <span className="badge badge-success">Low Risk</span>;
    if (score < 0.7) return <span className="badge badge-warning">Medium Risk</span>;
    return <span className="badge badge-danger">High Risk</span>;
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <Shield className="logo-icon" size={32} />
            <div>
              <h1 className="header-title">ChainGuardian AI</h1>
              <p className="header-subtitle">Blockchain Fraud Detection System</p>
            </div>
          </div>
          <div className="header-right">
            {!connected ? (
              <button onClick={connectWallet} disabled={loading} className="btn btn-primary">
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="wallet-info">
                <div className="wallet-address">{formatAddress(account)}</div>
                <div className="status-dot"></div>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="nav-tabs">
        <div className="nav-content">
          {['dashboard', 'transactions', 'alerts'].map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`nav-tab ${selectedTab === tab ? 'active' : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      <main className="main-content">
        {selectedTab === 'dashboard' && (
          <div className="dashboard">
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card stat-primary">
                <div className="stat-content">
                  <div>
                    <p className="stat-label">Total Transactions</p>
                    <p className="stat-value">{stats.totalTx}</p>
                  </div>
                  <Activity className="stat-icon" size={40} />
                </div>
              </div>
              <div className="stat-card stat-danger">
                <div className="stat-content">
                  <div>
                    <p className="stat-label">Fraud Detected</p>
                    <p className="stat-value">{stats.fraudDetected}</p>
                  </div>
                  <AlertTriangle className="stat-icon" size={40} />
                </div>
              </div>
              <div className="stat-card stat-success">
                <div className="stat-content">
                  <div>
                    <p className="stat-label">Detection Rate</p>
                    <p className="stat-value">{stats.accuracy}%</p>
                  </div>
                  <TrendingUp className="stat-icon" size={40} />
                </div>
              </div>
              <div className="stat-card stat-warning">
                <div className="stat-content">
                  <div>
                    <p className="stat-label">Active Alerts</p>
                    <p className="stat-value">{stats.activeAlerts}</p>
                  </div>
                  <Bell className="stat-icon" size={40} />
                </div>
              </div>
            </div>

            {/* Charts - IMPROVED */}
            <div className="charts-grid">
              <div className="card">
                <div className="card-header">
                  <TrendingUp size={20} />
                  <h3>Fraud Detection Trends</h3>
                  <span className="chart-info">{transactions.length} transactions</span>
                </div>
                {fraudTrendData.length === 0 || fraudTrendData[0].name === 'No Data' ? (
                  <div className="empty-state">
                    <Activity size={48} style={{ opacity: 0.3 }} />
                    <p>No transaction data yet</p>
                    <p className="text-sm">Send some transactions to see trends</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={fraudTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#999" 
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#999" 
                        style={{ fontSize: '12px' }}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1a1a', 
                          border: '1px solid #666',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="normal" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        name="Normal Transactions"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="fraud" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        name="Fraud Detected"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="card">
                <div className="card-header">
                  <Database size={20} />
                  <h3>Risk Distribution</h3>
                </div>
                {riskDistribution.every(item => item.value === 0) ? (
                  <div className="empty-state">
                    <Database size={48} style={{ opacity: 0.3 }} />
                    <p>No risk data yet</p>
                    <p className="text-sm">System monitoring...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => value > 0 ? `${name}: ${value}%` : null}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1a1a', 
                          border: '1px solid #666',
                          borderRadius: '8px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="card">
              <div className="card-header">
                <Bell size={20} />
                <h3>Recent Alerts</h3>
                <button onClick={loadData} className="btn-icon">
                  <RefreshCw size={16} />
                </button>
              </div>
              <div className="alerts-list">
                {alerts.length === 0 ? (
                  <div className="empty-state">
                    <Bell size={48} style={{ opacity: 0.3 }} />
                    <p>No alerts yet</p>
                    <p className="text-sm">System monitoring...</p>
                  </div>
                ) : (
                  alerts.map(alert => (
                    <div key={alert._id} className="alert-item">
                      <AlertTriangle className="text-danger" size={20} />
                      <div className="alert-details">
                        <h4>Suspicious Transaction Detected</h4>
                        <p className="alert-address">Address: {formatAddress(alert.flaggedAddress)}</p>
                        <p className="alert-time">{formatTimestamp(alert.timestamp)}</p>
                      </div>
                      <div className="alert-score">
                        Risk: {(alert.riskScore * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'transactions' && (
          <div className="card">
            <div className="card-header">
              <Activity size={20} />
              <h3>Recent Transactions</h3>
              <button onClick={loadData} className="btn-icon">
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tx Hash</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Amount</th>
                    <th>Risk</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">No transactions yet</td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx._id}>
                        <td className="mono">{formatAddress(tx.txHash)}</td>
                        <td className="mono">{formatAddress(tx.from)}</td>
                        <td className="mono">{formatAddress(tx.to)}</td>
                        <td>{tx.amount} ETH</td>
                        <td>{getRiskBadge(tx.riskScore)}</td>
                        <td>
                          {tx.label === 'normal' ? (
                            <Check className="text-success" size={20} />
                          ) : (
                            <X className="text-danger" size={20} />
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'alerts' && (
          <div className="card">
            <div className="card-header">
              <Bell size={20} />
              <h3>All Alerts</h3>
              <button onClick={loadData} className="btn-icon">
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="alerts-list">
              {alerts.length === 0 ? (
                <div className="empty-state">No alerts. System is secure.</div>
              ) : (
                alerts.map(alert => (
                  <div key={alert._id} className="alert-item-full">
                    <div className="alert-header">
                      <AlertTriangle className="text-danger" size={20} />
                      <div>
                        <h4>Fraud Alert</h4>
                        <p className="alert-time">{formatTimestamp(alert.timestamp)}</p>
                      </div>
                      <div className="alert-score-large">
                        {(alert.riskScore * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="alert-body">
                      <p><strong>Transaction:</strong> {formatAddress(alert.txHash)}</p>
                      <p><strong>Flagged Address:</strong> {formatAddress(alert.flaggedAddress)}</p>
                      <p><strong>Severity:</strong> {alert.severity === 2 ? 'High' : alert.severity === 1 ? 'Medium' : 'Low'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;