import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './InvestorDashboard.css';
import { MdCurrencyRupee } from "react-icons/md";
import { HiTrendingUp } from "react-icons/hi";
import { HiUsers } from "react-icons/hi";


const InvestorDashboard = () => {
  const { user } = useAuth();
  const { investors, series } = useData();

  const investor = investors.find(inv => inv.investorId === user?.investorId) || {
    name: user?.name || 'Investor',
    investorId: user?.investorId || '',
    investment: 0,
    series: [],
    kycStatus: 'Pending'
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Completed':
        return 'Completed';
      case 'Pending':
        return 'Pending ';  // Add space to match length
      case 'Rejected':
        return 'Rejected ';  // Add space to match length
      default:
        return status;
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  const totalInvestment = investor.investment || 0;
  const participatingSeries = series.filter(s => investor.series?.includes(s.name));

  return (
    <Layout isInvestor={true}>
      <div className="investor-dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, {investor.name}</p>
        </div>

        <div className="dashboard-cards">
          <div className="summary-card">
            <div className="card-icon blue">
              <MdCurrencyRupee size={22} />
            </div>
            <div className="card-content">
              <p className="card-label">Total Investment</p>
              <h2 className="card-value">{formatCurrency(totalInvestment)}</h2>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon green">
              <HiTrendingUp size={22} />
            </div>
            <div className="card-content">
              <p className="card-label">Active Series</p>
              <h2 className="card-value">{participatingSeries.length}</h2>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon yellow">
               <HiUsers size={22} />
            </div>
            <div className="card-content">
              <p className="card-label">KYC Status</p>
              <h2 className="card-value">{getStatusText(investor.kycStatus)}</h2>
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="dashboard-section">
            <h3 className="section-title">My Investments</h3>
            <div className="investments-list">
              {participatingSeries.length > 0 ? (
                participatingSeries.map((s) => (
                  <div key={s.id} className="investment-item">
                    <div className="investment-info">
                      <h4 className="investment-series">{s.name}</h4>
                      <div className="investment-details">
                        <span>Interest Rate: {s.interestRate}%</span>
                        <span>Frequency: {s.interestFrequency}</span>
                      </div>
                    </div>
                    <div className="investment-amount">
                      {formatCurrency(investor.investment / (investor.series?.length || 1))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No investments yet</p>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <h3 className="section-title">Upcoming Payouts</h3>
            <div className="payouts-list">
              {participatingSeries.length > 0 ? (
                participatingSeries.map((s) => {
                  const monthlyPayout = (investor.investment / (investor.series?.length || 1)) * (s.interestRate / 100) / (s.interestFrequency === 'Monthly Interest' ? 12 : 4);
                  return (
                    <div key={s.id} className="payout-item">
                      <div className="payout-info">
                        <h4 className="payout-series">{s.name}</h4>
                        <span className="payout-amount">{formatCurrency(monthlyPayout)}</span>
                      </div>
                      <div className="payout-date">Next Month</div>
                    </div>
                  );
                })
              ) : (
                <p className="no-data">No upcoming payouts</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InvestorDashboard;

