import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
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
  const {
    investors,
    series,
    getTotalFundsRaised,
    getTotalInvestors,
    getCurrentMonthPayout,
    getPendingKYC,
    getUpcomingPayouts
  } = useData();

  const [totalFunds, setTotalFunds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showComplianceTracker, setShowComplianceTracker] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(null);

  // Yet to be submitted series data (from compliance page)
  const yetToBeSubmittedSeries = [
    { id: 'comp-1', name: 'Series A NCD', interestRate: 8.5, interestFrequency: 'Quarterly', investors: 45, fundsRaised: 25000000, targetAmount: 100000000, issueDate: '2024-01-15', maturityDate: '2027-01-15', status: 'yet-to-be-submitted' },
    { id: 'comp-2', name: 'Series B NCD', interestRate: 9.0, interestFrequency: 'Half-Yearly', investors: 32, fundsRaised: 18000000, targetAmount: 75000000, issueDate: '2024-02-01', maturityDate: '2027-02-01', status: 'yet-to-be-submitted' },
    { id: 'comp-3', name: 'Series D NCD', interestRate: 8.75, interestFrequency: 'Annually', investors: 28, fundsRaised: 15000000, targetAmount: 60000000, issueDate: '2024-03-10', maturityDate: '2027-03-10', status: 'yet-to-be-submitted' },
    { id: 'comp-4', name: 'Series E NCD', interestRate: 9.25, interestFrequency: 'Quarterly', investors: 38, fundsRaised: 22000000, targetAmount: 80000000, issueDate: '2024-04-05', maturityDate: '2027-04-05', status: 'yet-to-be-submitted' }
  ];

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

  const recentInvestors = investors
    .sort((a, b) => new Date(b.dateJoined.split('/').reverse().join('-')) - new Date(a.dateJoined.split('/').reverse().join('-')))
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
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Overview of your NCD portfolio and investor activity.</p>
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
              {recentInvestors.map((investor) => (
                <div key={investor.id} className="investor-item">
                  <div className="investor-info">
                    <h6 className="investor-name">{investor.name}</h6>
                    <div className="investor-details">
                      <span className="investor-series">{investor.series[0]}</span>
                      <span className="investor-date">{formatDate(investor.dateJoined)}</span>
                      <span className="investor-amount">₹{investor.investment.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="investor-status">
                    <span className={`kyc-badge ${investor.kycStatus.toLowerCase()}`}>
                    {investor.kycStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h3 className="section-title">Upcoming Payouts</h3>
              <UpcomingPayoutCalendar date={nearestPayout?.date} payouts={upcomingPayouts} />
            </div>
            <div className="payouts-list">
              {upcomingPayouts.slice(0, 2).map((payout, index) => (
                <div key={index} className="payout-item">
                  <div className="payout-info">
                    <h4 className="payout-series">{payout.series}</h4>
                    <div className="payout-details">
                      <span>{payout.investors} investors</span>
                      <span>{formatCurrency(payout.amount)}</span>
                    </div>
                  </div>
                  <div className="payout-date">
                    {new Date(payout.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
