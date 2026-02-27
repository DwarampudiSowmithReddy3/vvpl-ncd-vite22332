import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './InvestorAccount.css';

const InvestorAccount = () => {
  const { user } = useAuth();
  const { investors, series } = useData();

  const investor = investors.find(inv => inv.investorId === user?.investorId) || {
    name: user?.name || 'Investor',
    investorId: user?.investorId || '',
    email: 'investor@email.com',
    phone: '+91 00000 00000',
    investment: 0,
    series: [],
    kycStatus: 'Pending',
    dateJoined: new Date().toLocaleDateString('en-GB')
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  const participatingSeries = series.filter(s => investor.series?.includes(s.name));

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'completed';
      case 'Pending':
        return 'pending';
      case 'Rejected':
        return 'rejected';
      default:
        return '';
    }
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

  return (
    <Layout isInvestor={true}>
      <div className="investor-account-page">
        <div className="account-header">
          <h1 className="page-title">My Account</h1>
          <p className="page-subtitle">View your account details and investment portfolio</p>
        </div>

        <div className="account-sections">
          <div className="account-section">
            <h3 className="section-title">Profile Information</h3>
            <div className="profile-card">
              <div className="profile-item">
                <span className="profile-label">Name:</span>
                <span className="profile-value">{investor.name}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Investor ID:</span>
                <span className="profile-value">{investor.investorId}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Email:</span>
                <span className="profile-value">{investor.email}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Phone:</span>
                <span className="profile-value">{investor.phone}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Date Joined:</span>
                <span className="profile-value">{investor.dateJoined}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">KYC Status:</span>
                <span className={`status-badge ${getStatusColor(investor.kycStatus)}`}>
                  {getStatusText(investor.kycStatus)}
                </span>
              </div>
            </div>
          </div>

          <div className="account-section">
            <h3 className="section-title">Investment Summary</h3>
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label">Total Investment</span>
                <span className="summary-value">{formatCurrency(investor.investment || 0)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Active Series</span>
                <span className="summary-value">{participatingSeries.length}</span>
              </div>
            </div>
          </div>

          <div className="account-section">
            <h3 className="section-title">My Series</h3>
            {participatingSeries.length > 0 ? (
              <div className="series-list">
                {participatingSeries.map((s) => {
                  const progress = (s.fundsRaised / s.targetAmount) * 100;
                  return (
                    <div key={s.id} className="series-card">
                      <div className="series-header">
                        <h4 className="series-name">{s.name}</h4>
                        <span className="interest-rate">{s.interestRate}%</span>
                      </div>
                      <div className="series-info">
                        <div className="info-item">
                          <span>Interest Frequency:</span>
                          <span>{s.interestFrequency}</span>
                        </div>
                        <div className="info-item">
                          <span>Maturity Date:</span>
                          <span>{s.maturityDate}</span>
                        </div>
                        <div className="info-item">
                          <span>My Investment:</span>
                          <span>{formatCurrency(investor.investment / (investor.series?.length || 1))}</span>
                        </div>
                      </div>
                      <div className="series-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="progress-text">
                          {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-data">You haven't invested in any series yet.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InvestorAccount;

