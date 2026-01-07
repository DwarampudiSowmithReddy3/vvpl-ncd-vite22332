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
    setSelectedSeries(series);
    setInvestmentAmount('');
  };

  const handleSubmitInvestment = (e) => {
    e.preventDefault();
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

