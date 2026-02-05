import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './InvestorSeries.css';

const InvestorSeries = () => {
  const { user } = useAuth();
  const { series, investors, updateInvestor, updateSeries } = useData();
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState('');

  const investor = investors.find(inv => inv.investorId === user?.investorId);

  // EMERGENCY SECURITY CHECK - HARD BLOCK FOR DEACTIVATED/DELETED ACCOUNTS
  console.log('EMERGENCY SECURITY CHECK - Current investor:', investor);
  console.log('Investor status:', investor?.status);
  console.log('Investor active:', investor?.active);

  // IMMEDIATE RETURN - NO INVESTMENT PAGE FOR BLOCKED ACCOUNTS
  if (!investor || 
      investor.status === 'deleted' || 
      investor.status === 'deactivated' || 
      investor.active === false) {
    
    console.log('BLOCKING INVESTOR ACCESS - Account is not active');
    
    return (
      <Layout isInvestor={true}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          padding: '20px'
        }}>
          <div style={{
            background: '#fee2e2',
            border: '3px solid #dc2626',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <h1 style={{ color: '#dc2626', fontSize: '32px', marginBottom: '20px' }}>
              🚫 ACCESS DENIED
            </h1>
            <h2 style={{ color: '#991b1b', fontSize: '24px', marginBottom: '20px' }}>
              Investment Functionality Blocked
            </h2>
            <p style={{ color: '#991b1b', fontSize: '18px', marginBottom: '15px' }}>
              Your account status: <strong>{investor?.status || 'INACTIVE'}</strong>
            </p>
            <p style={{ color: '#991b1b', fontSize: '16px', marginBottom: '15px' }}>
              You cannot access investment features or make any investments.
            </p>
            <p style={{ color: '#991b1b', fontSize: '16px', marginBottom: '20px' }}>
              Contact support immediately if you believe this is an error.
            </p>
            <div style={{
              background: '#fff',
              border: '1px solid #dc2626',
              borderRadius: '8px',
              padding: '20px',
              marginTop: '20px'
            }}>
              <p style={{ color: '#dc2626', fontSize: '16px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                EMERGENCY SUPPORT:
              </p>
              <p style={{ color: '#374151', margin: '5px 0' }}>
                Email: support@loanfront.com
              </p>
              <p style={{ color: '#374151', margin: '5px 0' }}>
                Phone: +91 1800-XXX-XXXX
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  const getStatusInfo = (s) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return null;
    };
    
    const maturityDate = parseDate(s.maturityDate);
    const releaseDate = parseDate(s.releaseDate);

    if (maturityDate && maturityDate < today) {
      return { status: 'expired', label: 'Expired', color: 'red' };
    }
    if (releaseDate && releaseDate > today) {
      return { status: 'upcoming', label: `Upcoming (${s.releaseDate})`, color: 'orange' };
    }
    return { status: 'active', label: 'Active', color: 'green' };
  };

  const handleInvest = (series) => {
    // EMERGENCY SECURITY CHECK - HARD BLOCK
    console.log('🚫 EMERGENCY INVEST BUTTON CHECK');
    console.log('Current investor:', investor);
    console.log('Investor status:', investor?.status);
    console.log('Investor active:', investor?.active);
    
    // ABSOLUTE BLOCK - NO MODAL FOR BLOCKED ACCOUNTS
    if (!investor || 
        investor.status === 'deleted' || 
        investor.status === 'deactivated' || 
        investor.active === false) {
      
      console.log('🚫 BLOCKING INVESTMENT MODAL');
      alert('🚫 ACCESS DENIED: Your account is deactivated/deleted. You cannot make investments.');
      return;
    }

    setSelectedSeries(series);
    setInvestmentAmount('');
  };

  const handleSubmitInvestment = (e) => {
    e.preventDefault();
    
    // EMERGENCY SECURITY CHECK - ABSOLUTE BLOCK
    console.log('EMERGENCY INVESTMENT BLOCK CHECK');
    console.log('Current investor:', investor);
    console.log('Investor status:', investor?.status);
    console.log('Investor active:', investor?.active);
    
    // HARD STOP - NO INVESTMENTS FOR BLOCKED ACCOUNTS
    if (!investor || 
        investor.status === 'deleted' || 
        investor.status === 'deactivated' || 
        investor.active === false) {
      
      console.log('🚫 INVESTMENT BLOCKED - Account is not active');
      alert('🚫 INVESTMENT BLOCKED: Your account is deactivated/deleted. Contact support immediately.');
      setSelectedSeries(null);
      return;
    }

    // Additional check - if somehow they got here, double check
    const currentInvestors = JSON.parse(localStorage.getItem('investors') || '[]');
    const currentInvestor = currentInvestors.find(inv => inv.investorId === user?.investorId);
    
    if (!currentInvestor || 
        currentInvestor.status === 'deleted' || 
        currentInvestor.status === 'deactivated' || 
        currentInvestor.active === false) {
      
      console.log('🚫 DOUBLE CHECK FAILED - Investment blocked');
      alert('🚫 SECURITY ALERT: Investment blocked due to account status. Contact support.');
      setSelectedSeries(null);
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (amount < selectedSeries.minInvestment) {
      alert(`Minimum investment is ₹${selectedSeries.minInvestment.toLocaleString('en-IN')}`);
      return;
    }
    
    if (investor) {
      const isNewInvestment = !investor.series.includes(selectedSeries.name);
      const updatedSeries = isNewInvestment
        ? [...investor.series, selectedSeries.name]
        : investor.series;
      
      updateInvestor(investor.id, {
        series: updatedSeries,
        investment: investor.investment + amount
      });
      
      // Update series data
      if (isNewInvestment) {
        updateSeries(selectedSeries.id, {
          investors: selectedSeries.investors + 1,
          fundsRaised: selectedSeries.fundsRaised + amount
        });
      } else {
        updateSeries(selectedSeries.id, {
          fundsRaised: selectedSeries.fundsRaised + amount
        });
      }
    }
    
    setSelectedSeries(null);
    setInvestmentAmount('');
    alert('Investment successful!');
  };

  return (
    <Layout isInvestor={true}>
      <div className="investor-series-page">
        {/* Security Warning for Inactive Accounts */}
        {!isInvestorActive && (
          <div className="security-warning">
            <div className="warning-content">
              <h3>Account Status Notice</h3>
              {investor?.status === 'deleted' ? (
                <p>Your account has been deleted. You cannot make new investments. Please contact support if you believe this is an error.</p>
              ) : investor?.status === 'deactivated' || investor?.active === false ? (
                <p>Your account has been deactivated. You cannot make new investments. Please contact support to reactivate your account.</p>
              ) : (
                <p>Your account is not active. Please contact support for assistance.</p>
              )}
            </div>
          </div>
        )}

        <div className="series-header">
          <div>
            <h1 className="page-title">Available Series</h1>
            <p className="page-subtitle">Browse and invest in NCD series</p>
          </div>
        </div>

        <div className="series-grid">
          {series.map((s) => {
            const statusInfo = getStatusInfo(s);
            const progress = (s.fundsRaised / s.targetAmount) * 100;
            const isInvested = investor?.series?.includes(s.name);
            
            return (
              <div key={s.id} className="series-card">
                <div className="card-header">
                  <h3 className="series-name">{s.name}</h3>
                  <div className="status-tags">
                    <span className={`status-tag ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="frequency-tag">{s.interestFrequency}</span>
                  </div>
                </div>
                <div className="interest-rate">
                  {s.interestRate}%
                </div>
                <div className="series-stats">
                  <span className="investors-count">{s.investors} investors</span>
                </div>
                <div className="funds-progress">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${statusInfo.color}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                  </div>
                </div>
                <div className="series-details">
                  <div className="detail-item">
                    <span className="detail-label">Issue Date:</span>
                    <span className="detail-value">{s.issueDate}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Maturity Date:</span>
                    <span className="detail-value">{s.maturityDate}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Face Value:</span>
                    <span className="detail-value">₹{s.faceValue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Min Investment:</span>
                    <span className="detail-value">₹{s.minInvestment.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                {isInvested ? (
                  <button className="invested-button" disabled>
                    ✓ Already Invested
                  </button>
                ) : !isInvestorActive ? (
                  <button className="disabled-button" disabled>
                    {investor?.status === 'deleted' ? 'Account Deleted' : 
                     investor?.status === 'deactivated' || investor?.active === false ? 'Account Deactivated' : 
                     'Account Inactive'}
                  </button>
                ) : (
                  <button 
                    className="invest-button"
                    onClick={() => handleInvest(s)}
                    disabled={statusInfo.status !== 'active'}
                  >
                    Invest Now
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {selectedSeries && (
          <div className="modal-overlay" onClick={() => setSelectedSeries(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Invest in {selectedSeries.name}</h2>
                <button 
                  className="close-button"
                  onClick={() => setSelectedSeries(null)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmitInvestment} className="invest-form">
                <div className="form-group">
                  <label>Investment Amount (₹)</label>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    required
                    min={selectedSeries.minInvestment}
                    placeholder={`Minimum: ₹${selectedSeries.minInvestment.toLocaleString('en-IN')}`}
                  />
                  <p className="form-hint">
                    Minimum investment: ₹{selectedSeries.minInvestment.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="investment-summary">
                  <div className="summary-item">
                    <span>Interest Rate:</span>
                    <span>{selectedSeries.interestRate}%</span>
                  </div>
                  <div className="summary-item">
                    <span>Frequency:</span>
                    <span>{selectedSeries.interestFrequency}</span>
                  </div>
                  <div className="summary-item">
                    <span>Maturity Date:</span>
                    <span>{selectedSeries.maturityDate}</span>
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    type="button"
                    className="cancel-button"
                    onClick={() => setSelectedSeries(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    Confirm Investment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default InvestorSeries;

