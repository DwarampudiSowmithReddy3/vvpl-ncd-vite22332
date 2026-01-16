import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ComplianceTracker from '../components/ComplianceTracker';
import './Dashboard.css';
import { MdCurrencyRupee } from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { HiTrendingUp, HiOutlineDocumentText } from "react-icons/hi";
import { MdOutlineWarningAmber, MdChevronLeft, MdChevronRight } from "react-icons/md";
import { FiArrowUpRight } from "react-icons/fi";
import UpcomingPayoutCalendar from '../components/UpcomingPayoutCalendar';



const Dashboard = () => {
  const navigate = useNavigate();
  const { canView } = usePermissions();
  const { user } = useAuth();
  const {
    investors,
    series,
    getTotalFundsRaised,
    getTotalInvestors,
    getCurrentMonthPayout,
    getPendingKYC,
    getUpcomingPayouts,
    getYetToBeSubmittedSeries,
    addAuditLog
  } = useData();

  const [totalFunds, setTotalFunds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showComplianceTracker, setShowComplianceTracker] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(null);

  // Get dynamic yet-to-be-submitted series from DataContext
  const yetToBeSubmittedSeries = getYetToBeSubmittedSeries();

  const totalInvestorsCount = getTotalInvestors();
  const currentMonthPayout = getCurrentMonthPayout();
  const pendingKYC = getPendingKYC();
  const upcomingPayouts = getUpcomingPayouts();
  const nearestPayout = upcomingPayouts
  .map(p => ({ ...p, dateObj: new Date(p.date) }))
  .filter(p => p.dateObj >= new Date())
  .sort((a, b) => a.dateObj - b.dateObj)[0];

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/posts/70')
      .then(res => res.json())
      .then(data => {
        setTotalFunds(Math.abs(parseInt(data.id)) * 10000000);  // Demo: JSONPlaceholder response → 12.5 Cr
      }).finally(() => setLoading(false))
      .catch(err => console.error('API Error:', err));
  }, []);

  // Get recent investments (not investors) - each investment per series shown separately
  const recentInvestments = [];
  investors.forEach(investor => {
    if (investor.investments && Array.isArray(investor.investments)) {
      investor.investments.forEach(investment => {
        recentInvestments.push({
          id: `${investor.id}-${investment.seriesName}-${investment.timestamp}`,
          name: investor.name,
          investorId: investor.investorId,
          seriesName: investment.seriesName,
          amount: investment.amount,
          date: investment.date,
          timestamp: investment.timestamp,
          kycStatus: investor.kycStatus
        });
      });
    }
  });

  // Sort by timestamp (newest first) and take top 4
  const recentInvestors = recentInvestments
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 4);

  const formatDate = (dateStr) => {
    return dateStr;
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  // Carousel handlers
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % yetToBeSubmittedSeries.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + yetToBeSubmittedSeries.length) % yetToBeSubmittedSeries.length);
  };

  const handleCarouselClick = (series) => {
    setSelectedSeries(series);
    setShowComplianceTracker(true);
  };
  // Dynamic calendar date (today)
  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">Overview of the NCD portfolio and investor activity.</p>
          </div>
          <div className="header-right">
            <UpcomingPayoutCalendar 
              date={series.find(s => s.status === 'active' || s.status === 'upcoming')?.maturityDate} 
              series={series.filter(s => s.status === 'active' || s.status === 'upcoming')} 
              type="maturity"
            />
          </div>
        </div>

        <div className="dashboard-cards">
          {/* Total Funds Raised */}
          <div className="summary-card">
            <div className="card-content">
              <p className="card-label">Total Funds Raised</p>
              <div className="card-value-row">
                <div className="card-value-inline">
                  <h2 className="card-value">{formatCurrency(totalFunds)}</h2>
                  <span className="card-change positive">+12.5%</span>
                </div>
  <div className="card-icon-wrapper">
    <div className="card-icon green">
      <MdCurrencyRupee size={22} />
    </div>
  </div>
</div>

    </div>
  </div>

  {/* Total Investors */}
  <div className="summary-card">
    <div className="card-content">
      <p className="card-label">Total Investors</p>
      <div className="card-value-row">
        <div className="card-value-inline">
          <div className="card-left">
  <h2 className="card-value">{totalInvestorsCount}</h2>
            <span className="card-change neutral">+8</span>
          </div>
        </div>
        <div className="card-icon-wrapper">
      <div className="card-icon blue">
            <FiUsers size={22} />
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Current Month Payout */}
  <div className="summary-card">
    <div className="card-content">
      <p className="card-label">Current Month Payout</p>
      <div className="card-value-row">
        <h2 className="card-value">{formatCurrency(currentMonthPayout)}</h2>
        <div className="card-icon-wrapper">
         <div className="card-icon blue-chart">
            <HiTrendingUp size={22} />
          </div>
        </div>
      </div>
      {/* If you want growth for this card, can add like: */}
      {/* <p className="card-change positive">+5%</p> */}
    </div>
  </div>

  {/* Pending KYC */}
  <div className="summary-card">
    <div className="card-content">
      <p className="card-label">Pending KYC</p>
      <div className="card-value-row">
        <h2 className="card-value">{pendingKYC}</h2>
        <div className="card-icon-wrapper">
          <div className="card-icon yellow">
            <MdOutlineWarningAmber size={22} />
          </div>
        </div>
      </div>
      {/* No change text needed for pending KYC */}
    </div>
  </div>
</div>


        {/* Compliance Alert Carousel - Only show if there are yet-to-be-submitted series */}
        {yetToBeSubmittedSeries.length > 0 && (
          <div className="compliance-carousel-section">
            <div className="carousel-header">
              <h3 className="carousel-title">Compliance Alerts</h3>
              <p className="carousel-subtitle">Series requiring immediate compliance attention</p>
            </div>
            
            <div className="compliance-carousel">
              <button className="carousel-btn prev" onClick={prevSlide}>
                <MdChevronLeft size={24} />
              </button>
              
              <div className="carousel-content" onClick={() => handleCarouselClick(yetToBeSubmittedSeries[currentSlide])}>
                <div key={currentSlide} className="simple-red-card">
                  <div className="stats-row">
                    <div className="stat-box">
                      <div className="stat-icon-wrapper">
                        <div className="stat-icon red">
                          <HiOutlineDocumentText size={16} />
                        </div>
                      </div>
                      <span className="stat-label">Series</span>
                      <span className="stat-value">{yetToBeSubmittedSeries[currentSlide]?.name.replace(' NCD', '')}</span>
                    </div>
                    <div className="stat-box">
                      <div className="stat-icon-wrapper">
                        <div className="stat-icon blue">
                          <FiUsers size={16} />
                        </div>
                      </div>
                      <span className="stat-label">Investors</span>
                      <span className="stat-value">{yetToBeSubmittedSeries[currentSlide]?.investors}</span>
                    </div>
                    <div className="stat-box">
                      <div className="stat-icon-wrapper">
                        <div className="stat-icon purple">
                          <HiTrendingUp size={16} />
                        </div>
                      </div>
                      <span className="stat-label">Frequency</span>
                      <span className="stat-value">{yetToBeSubmittedSeries[currentSlide]?.interestFrequency}</span>
                    </div>
                    <div className="stat-box">
                      <div className="stat-icon-wrapper">
                        <div className="stat-icon orange">
                          <MdOutlineWarningAmber size={16} />
                        </div>
                      </div>
                      <span className="stat-label">Maturity</span>
                      <span className="stat-value">{yetToBeSubmittedSeries[currentSlide]?.maturityDate}</span>
                    </div>
                  </div>
                  
                  <div className="card-footer">
                    <MdOutlineWarningAmber size={16} />
                    <span>Yet to be Submitted</span>
                  </div>
                </div>
              </div>
              
              <button className="carousel-btn next" onClick={nextSlide}>
                <MdChevronRight size={24} />
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Sections */}
        <div className="dashboard-sections">
          <div className="dashboard-section">
            <div className="section-header">
              <h3 className="section-title">Recent Investors</h3>
              <button 
                className="view-all-button"
                onClick={() => navigate('/investors')}
              >
                View All <FiArrowUpRight size={16} />
              </button>
            </div>
            <div className="investors-list">
              {recentInvestors.map((investment) => (
                <div key={investment.id} className="investor-item">
                  <div className="investor-info">
                    <h6 className="investor-name">{investment.name}</h6>
                    <div className="investor-details">
                      <span className="investor-series">{investment.seriesName}</span>
                      <span className="investor-date">{formatDate(investment.date)}</span>
                      <span className="investor-amount">₹{investment.amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="investor-status">
                    <span className={`kyc-badge ${investment.kycStatus.toLowerCase()}`}>
                    {investment.kycStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h3 className="section-title">Upcoming Payouts</h3>
            </div>
            <div className="payouts-list">
              {upcomingPayouts.slice(0, 3).map((payout, index) => (
                <div key={index} className="payout-item">
                  <div className="payout-info">
                    <h4 className="payout-series">{payout.series}</h4>
                    <div className="payout-details">
                      <span>{payout.investors} investors</span>
                      <span>{formatCurrency(payout.amount)}</span>
                    </div>
                  </div>
                  <div className="payout-date-container">
                    <div className="payout-date">
                      {new Date(payout.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                    <div className="payout-days-left">
                      {(() => {
                        const today = new Date();
                        const payoutDate = new Date(payout.date);
                        const diffTime = payoutDate - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays > 0 ? `${diffDays} days left` : 'Due today';
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NCD Series Performance */}
        <div className="series-performance">
          <h3 className="section-title">NCD Series Performance</h3>
          <div className="performance-list">
            {series.map((s) => {
              const progress = (s.fundsRaised / s.targetAmount) * 100;
              return (
                <div key={s.id} className="performance-item">
                  <div className="performance-header">
                    <h4 className="performance-series">{s.name}</h4>
                    <span className="performance-investors">{s.investors} investors</span>
                  </div>
                  <div className="performance-progress">
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
        </div>

        {/* Compliance Tracker Modal */}
        {showComplianceTracker && selectedSeries && (
          <ComplianceTracker 
            onClose={() => setShowComplianceTracker(false)} 
            seriesData={{
              seriesName: selectedSeries.name,
              trusteeCompany: 'SBICAP Trustee Co. Ltd.',
              stats: {
                totalRequirements: 42,
                receivedCompleted: 12,
                pendingActions: 25,
                notApplicable: 5
              }
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
