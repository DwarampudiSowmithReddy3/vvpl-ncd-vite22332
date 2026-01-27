import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './Dashboard.css';
import './GrievanceFresh.css';
import { MdCurrencyRupee, MdOutlineWarningAmber, MdTrendingUp } from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { HiOutlineDocumentText, HiTrendingUp } from "react-icons/hi";
import { BsGraphUp, BsPercent } from "react-icons/bs";
import { AiOutlineFileText } from "react-icons/ai";
import { RiStackLine, RiSecurePaymentLine } from "react-icons/ri";
import { TfiWallet } from "react-icons/tfi";
import { IoCalendarOutline } from "react-icons/io5";
import { TbCalendarTime } from "react-icons/tb";
import { LuCrown, LuMessageSquare, LuCircleCheckBig, LuBuilding2, LuSmile } from "react-icons/lu";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { IoWarningOutline, IoPeopleOutline } from "react-icons/io5";
import { MdTrendingDown } from "react-icons/md";
import UpcomingPayoutCalendar from '../components/UpcomingPayoutCalendar';



const Dashboard = () => {
  const navigate = useNavigate();
  const { canView } = usePermissions();
  const { user } = useAuth();
  const {
    investors,
    series,
    complaints,
    complianceStatus,
    getTotalFundsRaised,
    getTotalInvestors,
    getCurrentMonthPayout,
    getInterestPayoutStats,
    getPendingKYC,
    getUpcomingPayouts,
    addAuditLog,
    getComplianceStatus,
    updateComplianceStatus,
    getSatisfactionMetrics
  } = useData();

  const [totalFunds, setTotalFunds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUpcomingPayouts, setShowUpcomingPayouts] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger
  
  // Listen for localStorage changes to refresh metrics
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'investors' || e.key === 'series') {
        console.log('📊 Dashboard: localStorage changed, refreshing metrics');
        setRefreshTrigger(prev => prev + 1);
      }
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events from same tab
    const handleCustomRefresh = () => {
      console.log('📊 Dashboard: Custom refresh event received');
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('dashboardRefresh', handleCustomRefresh);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dashboardRefresh', handleCustomRefresh);
    };
  }, []);
  
  // Debug refresh trigger changes
  useEffect(() => {
    // Refresh trigger changed
  }, [refreshTrigger]);

  // Remove all scrollbar-related useEffect - let dashboard work normally
  // const [refreshTrigger, setRefreshTrigger] = useState(0); // Remove if not needed elsewhere
  
  const totalInvestorsCount = getTotalInvestors();
  const currentMonthPayout = getCurrentMonthPayout();
  const interestPayoutStats = getInterestPayoutStats();
  const pendingKYC = getPendingKYC();
  const upcomingPayouts = getUpcomingPayouts();

  // Calculate average coupon rate from active series
  const activeSeries = series.filter(s => s.status === 'active');
  const averageCouponRate = activeSeries.length > 0 
    ? (activeSeries.reduce((sum, s) => sum + (s.interestRate || 0), 0) / activeSeries.length).toFixed(1)
    : '0.0';

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/posts/70')
      .then(res => res.json())
      .then(data => {
        setTotalFunds(Math.abs(parseInt(data.id)) * 10000000);  // Demo: JSONPlaceholder response → 12.5 Cr
      }).finally(() => setLoading(false))
      .catch(err => console.error('API Error:', err));
  }, []);

  // Get top 10 investors by total investment amount across all series
  const getTopInvestorsByInvestment = () => {
    const investorTotals = [];
    
    try {
      investors.forEach(investor => {
        if (investor.investments && Array.isArray(investor.investments)) {
          // Calculate total investment across all series
          const totalInvestment = investor.investments.reduce((sum, investment) => sum + (investment.amount || 0), 0);
          
          // Get unique series names (remove duplicates)
          const allSeries = [...new Set(investor.investments.map(inv => inv.seriesName).filter(Boolean))];
          
          // Calculate maturity and lock-in amounts based on series data
          let atMaturityAmount = 0;
          let afterLockInAmount = 0;
          
          investor.investments.forEach(investment => {
            if (investment.amount && investment.seriesName) {
              const seriesDetails = series.find(s => s.name === investment.seriesName);
              if (seriesDetails && seriesDetails.interestRate) {
                // Calculate maturity amount (principal + interest at maturity)
                const yearsToMaturity = 3; // Average maturity period
                const maturityValue = investment.amount * (1 + (seriesDetails.interestRate / 100) * yearsToMaturity);
                atMaturityAmount += maturityValue;
                
                // Calculate lock-in completion amount (available after lock-in period)
                const lockInCompletionValue = investment.amount * (1 + (seriesDetails.interestRate / 100) * 1.5); // 1.5 years average lock-in
                afterLockInAmount += lockInCompletionValue;
              } else {
                // Fallback if series details not found
                atMaturityAmount += investment.amount * 1.3; // 30% growth estimate
                afterLockInAmount += investment.amount * 1.15; // 15% growth estimate
              }
            }
          });
          
          // Create entry for this investor showing all their unique series
          if (totalInvestment > 0) {
            investorTotals.push({
              rank: 0, // Will be set after sorting
              investorName: investor.name || 'Unknown Investor',
              investorId: investor.investorId || 'N/A',
              allSeries: allSeries, // Unique series the investor is invested in
              invested: totalInvestment,
              atMaturity: Math.round(atMaturityAmount),
              afterLockIn: Math.round(afterLockInAmount),
              totalInvestment: totalInvestment,
              timestamp: Math.max(...investor.investments.map(inv => new Date(inv.timestamp || Date.now()).getTime()))
            });
          }
        }
      });

      // Sort by total investment amount (descending) and take top 10
      const sortedInvestments = investorTotals
        .sort((a, b) => b.invested - a.invested)
        .slice(0, 10);

      // Add rank numbers
      return sortedInvestments.map((investment, index) => ({
        ...investment,
        rank: index + 1
      }));
    } catch (error) {
      console.error('Error calculating top investors:', error);
      return []; // Return empty array on error
    }
  };

  const topInvestors = getTopInvestorsByInvestment() || [];

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Get grievance management stats
  const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
  const inProgressComplaints = complaints.filter(c => c.status === 'in-progress').length;
  const closedComplaints = complaints.filter(c => c.status === 'resolved').length;
  const totalComplaints = complaints.length;
  const resolutionRate = totalComplaints > 0 ? Math.round((closedComplaints / totalComplaints) * 100) : 0;

  // Separate by grievance type for dashboard display
  const investorComplaints = complaints.filter(c => c.grievanceType === 'investor');
  const trusteeComplaints = complaints.filter(c => c.grievanceType === 'trustee');

  const investorStats = {
    open: investorComplaints.filter(c => c.status === 'pending').length,
    inProgress: investorComplaints.filter(c => c.status === 'in-progress').length,
    closed: investorComplaints.filter(c => c.status === 'resolved').length
  };

  const trusteeStats = {
    open: trusteeComplaints.filter(c => c.status === 'pending').length,
    inProgress: trusteeComplaints.filter(c => c.status === 'in-progress').length,
    closed: trusteeComplaints.filter(c => c.status === 'resolved').length
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  const formatCurrencyShort = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(0)} L`;
  };

  // Calculate dynamic retention rate and metrics using real tracking data
  const satisfactionMetrics = useMemo(() => {
    try {
      return getSatisfactionMetrics();
    } catch (error) {
      console.error('Error in satisfactionMetrics:', error);
      return {
        retentionRate: 90,
        churnRequests: 0,
        earlyRedemptionRequests: 0,
        churnAmount: 0,
        earlyRedemptionAmount: 0
      };
    }
  }, [getSatisfactionMetrics, refreshTrigger]);
  
  // Extract values from memoized calculation
  const { retentionRate, churnRequests, earlyRedemptionRequests, churnAmount, earlyRedemptionAmount } = satisfactionMetrics;
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

        {/* Portfolio Overview Section */}
        <div className="portfolio-overview-section">
          <div className="portfolio-header">
            <div className="portfolio-title-wrapper">
              <div className="portfolio-icon">
                <MdTrendingUp size={20} />
              </div>
              <div className="portfolio-title-content">
                <h3 className="portfolio-title">Portfolio Overview</h3>
                <p className="portfolio-subtitle">Key NCD metrics at a glance</p>
              </div>
            </div>
          </div>
          
          <div className="portfolio-cards-container">
            {/* Total Outstanding NCD */}
            <div className="portfolio-card portfolio-card-blue">
              <div className="portfolio-card-content">
                <div className="portfolio-card-header">
                  <span className="portfolio-card-label">Total Outstanding NCD</span>
                  <div className="portfolio-card-icon blue-dark">
                    <MdTrendingUp size={20} />
                  </div>
                </div>
                <div className="portfolio-card-value">₹{(totalFunds / 10000000).toFixed(2)} Cr</div>
                <div className="portfolio-card-currency">INR</div>
              </div>
            </div>

            {/* Active Series */}
            <div className="portfolio-card portfolio-card-yellow">
              <div className="portfolio-card-content">
                <div className="portfolio-card-header">
                  <span className="portfolio-card-label">Active Series</span>
                  <div className="portfolio-card-icon yellow-dark">
                    <RiStackLine size={20} />
                  </div>
                </div>
                <div className="portfolio-card-value">{activeSeries.length}</div>
                <div className="portfolio-card-currency">Nos</div>
              </div>
            </div>

            {/* Average Coupon Rate */}
            <div className="portfolio-card portfolio-card-green">
              <div className="portfolio-card-content">
                <div className="portfolio-card-header">
                  <span className="portfolio-card-label">Average Coupon Rate</span>
                  <div className="portfolio-card-icon green-dark">
                    <BsPercent size={20} />
                  </div>
                </div>
                <div className="portfolio-card-value">{averageCouponRate}%</div>
                <div className="portfolio-card-currency"></div>
              </div>
            </div>

            {/* Pending KYC */}
            <div className="portfolio-card portfolio-card-orange">
              <div className="portfolio-card-content">
                <div className="portfolio-card-header">
                  <span className="portfolio-card-label">Pending KYC</span>
                  <div className="portfolio-card-icon orange-dark">
                    <MdOutlineWarningAmber size={20} />
                  </div>
                </div>
                <div className="portfolio-card-value">{pendingKYC}</div>
                <div className="portfolio-card-currency">Cases</div>
              </div>
            </div>
          </div>
        </div>


        {/* Dashboard Sections - Maturity Left, Payouts Right */}
        <div className="dashboard-sections" style={{ gridTemplateColumns: '2fr 1.2fr' }}>
          {/* Maturity & Lock-In Distribution - Left Side with More Width */}
          <div className="dashboard-section maturity-section">
            <div className="section-header">
              <div className="section-header-with-icon">
                <div className="maturity-section-icon">
                  <TbCalendarTime size={20} />
                </div>
                <h3 className="section-title">Maturity & Lock-In Distribution</h3>
              </div>
            </div>
            
            <div className="maturity-lockin-container">
              {/* Maturity Distribution */}
              <div className="distribution-section">
                <h4 className="distribution-title">MATURITY BUCKET</h4>
                <div className="compact-maturity-table">
                  {(() => {
                    // REALISTIC LINKED DATA - Maturity and Lock-in should be logically connected
                    // Series A: Maturing soon (< 3 months) → Lock-in already completed
                    // Series B: Maturing in 6-12 months → Lock-in completed  
                    // Series C: Maturing in 12+ months → Lock-in coming up in <3 months
                    // Series D: Maturing in 12+ months → Lock-in coming up in 3-6 months
                    // Series E: Maturing in 12+ months → Lock-in coming up in 6-12 months
                    
                    const maturityBuckets = [
                      {
                        label: '< 3 months',
                        amount: 35000000, // ₹3.5 Cr (Series A - about to mature)
                        color: 'blue',
                        percentage: 15,
                        seriesCount: 1
                      },
                      {
                        label: '3 to 6 months',
                        amount: 0, // ₹0.00 Cr (No series in this range)
                        color: 'teal',
                        percentage: 0,
                        seriesCount: 0
                      },
                      {
                        label: '6 to 12 months',
                        amount: 62000000, // ₹6.2 Cr (Series B - maturing this year)
                        color: 'orange',
                        percentage: 27,
                        seriesCount: 1
                      },
                      {
                        label: '12 months above',
                        amount: 130000000, // ₹13.0 Cr (Series C+D+E - long term)
                        color: 'purple',
                        percentage: 58,
                        seriesCount: 4
                      }
                    ];

                    return maturityBuckets.map((bucket, index) => (
                      <div key={index} className="compact-table-row">
                        <div className="compact-bucket-cell">
                          <div className="compact-bucket-info">
                            <div className="compact-bucket-label">{bucket.label}</div>
                            <div className="compact-amount-inline">₹{(bucket.amount / 10000000).toFixed(2)} Cr ({bucket.seriesCount} series)</div>
                          </div>
                          <div className="compact-progress-bar-container">
                            <div className="compact-progress-track">
                              <div 
                                className={`compact-progress-fill ${bucket.color}`}
                                style={{ width: `${bucket.percentage}%` }}
                              >
                                <span className="compact-progress-text">{bucket.percentage}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Lock-In Distribution */}
              <div className="distribution-section">
                <h4 className="distribution-title">LOCK-IN BUCKET</h4>
                <div className="compact-maturity-table">
                  {(() => {
                    // REALISTIC LINKED LOCK-IN DATA - Connected to maturity buckets
                    // Series A (₹3.5 Cr): Maturing <3 months → Lock-in completed
                    // Series B (₹6.2 Cr): Maturing 6-12 months → Lock-in completed  
                    // Series C (₹2.8 Cr): Maturing 12+ months → Lock-in <3 months
                    // Series D (₹4.5 Cr): Maturing 12+ months → Lock-in 3-6 months
                    // Series E (₹3.2 Cr): Maturing 12+ months → Lock-in 6-12 months
                    // Series AB (₹2.5 Cr): Maturing 12+ months → Lock-in 6-12 months
                    
                    const lockInBuckets = [
                      {
                        label: 'Lock-in completed',
                        amount: 97000000, // ₹9.7 Cr (Series A + B: already free to exit)
                        color: 'green',
                        percentage: 43,
                        seriesCount: 2
                      },
                      {
                        label: 'Lock-in coming up in <3 months',
                        amount: 28000000, // ₹2.8 Cr (Series C: will be free soon)
                        color: 'blue',
                        percentage: 12,
                        seriesCount: 1
                      },
                      {
                        label: 'Lock-in coming up in 3 to 6 months',
                        amount: 45000000, // ₹4.5 Cr (Series D: medium term)
                        color: 'teal',
                        percentage: 20,
                        seriesCount: 1
                      },
                      {
                        label: 'Lock-in coming up in 6 to 12 months',
                        amount: 57000000, // ₹5.7 Cr (Series E + AB: longer term)
                        color: 'orange',
                        percentage: 25,
                        seriesCount: 2
                      }
                    ];
                    
                    return lockInBuckets.map((bucket, index) => (
                      <div key={index} className="compact-table-row">
                        <div className="compact-bucket-cell">
                          <div className="compact-bucket-info">
                            <div className="compact-bucket-label">{bucket.label}</div>
                            <div className="compact-amount-inline">₹{(bucket.amount / 10000000).toFixed(2)} Cr ({bucket.seriesCount} series)</div>
                          </div>
                          <div className="compact-progress-bar-container">
                            <div className="compact-progress-track">
                              <div 
                                className={`compact-progress-fill ${bucket.color}`}
                                style={{ width: `${bucket.percentage}%` }}
                              >
                                <span className="compact-progress-text">{bucket.percentage}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Interest Payouts - Right Side */}
          <div className="dashboard-section payouts-section">
            <div className="interest-payouts-header">
              <div className="interest-payouts-icon">
                <TfiWallet size={24} />
              </div>
              <div className="interest-payouts-title-content">
                <h3 className="interest-payouts-title">Interest Payouts</h3>
                <p className="interest-payouts-subtitle">Total & upcoming disbursements</p>
              </div>
            </div>

            <div className="interest-payouts-cards">
              {/* Total Interest Pay-out Card */}
              <div className="interest-payout-card total-payout-card" onClick={() => navigate('/interest-payout')}>
                <div className="payout-card-header">
                  <div className="payout-card-title-section">
                    <h4 className="payout-card-title">Total Interest Pay-out</h4>
                    <p className="payout-card-date">As of {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="payout-card-icon">
                    <IoCalendarOutline size={20} />
                  </div>
                </div>
                <div className="payout-card-amount">
                  <span className="payout-amount-value">{formatCurrency(interestPayoutStats.totalInterestPaid)}</span>
                  <span className="payout-amount-currency">INR</span>
                </div>
              </div>

              {/* Upcoming Month Payout Card - Clickable */}
              <div className="interest-payout-card upcoming-payout-card" onClick={() => setShowUpcomingPayouts(!showUpcomingPayouts)}>
                <div className="payout-card-header">
                  <div className="payout-card-title-section">
                    <h4 className="payout-card-title">Upcoming Month Payout</h4>
                    <p className="payout-card-date">{interestPayoutStats.upcomingMonth}</p>
                  </div>
                  <div className="payout-card-percentage">
                    <MdTrendingUp size={12} />
                    {interestPayoutStats.upcomingMonthPayout > interestPayoutStats.totalInterestPaid ? '+' : ''}
                    {interestPayoutStats.totalInterestPaid > 0 ? 
                      ((interestPayoutStats.upcomingMonthPayout - interestPayoutStats.totalInterestPaid) / interestPayoutStats.totalInterestPaid * 100).toFixed(1) : 
                      '0.0'
                    }%
                  </div>
                </div>
                <div className="payout-card-amount">
                  <span className="payout-amount-value">{formatCurrency(interestPayoutStats.upcomingMonthPayout)}</span>
                  <span className="payout-amount-currency">INR</span>
                </div>
              </div>
            </div>

            {/* Detailed Upcoming Payouts - Show/Hide on click */}
            {showUpcomingPayouts && (
              <div className="detailed-payouts-section">
                <div className="detailed-payouts-header">
                  <h4 className="detailed-payouts-title">Upcoming Payouts Details</h4>
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
            )}
          </div>
        </div>

        {/* NCD Series Performance and Compliance Management */}
        <div className="series-performance">
          <div className="section-header-with-icon">
            <div className="performance-section-icon">
              <RiSecurePaymentLine size={20} />
            </div>
            <h3 className="section-title">NCD Series Performance and Compliance Management</h3>
          </div>
          <div className="performance-list">
            {series.map((s) => {
              const progress = (s.fundsRaised / s.targetAmount) * 100;
              const compliance = complianceStatus[`${s.name} NCD`] || { pre: 0, post: 0, recurring: 0 };
              
              return (
                <div key={s.id} className="performance-item">
                  <div className="performance-header">
                    <h4 className="performance-series">{s.name}</h4>
                    <span className="performance-investors">{s.investors} investors</span>
                  </div>
                  <div className="performance-progress">
                    <div className="compliance-indicators">
                      <span className="compliance-indicator pre-indicator">
                        <span className="compliance-dot pre-dot"></span>Pre {compliance.pre}%
                      </span>
                      <span className="compliance-indicator post-indicator">
                        <span className="compliance-dot post-dot"></span>Post {compliance.post}%
                      </span>
                      <span className="compliance-indicator recurring-indicator">
                        <span className="compliance-dot recurring-dot"></span>Recurring {compliance.recurring}%
                      </span>
                    </div>
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

        {/* Investor Exposure - Simple Clean Design */}
        <div className="investor-exposure">
          <div className="investor-exposure-header">
            <div className="exposure-icon">
              <LuCrown size={20} />
            </div>
            <div className="exposure-title-content">
              <h3 className="exposure-title">Investor Exposure</h3>
              <p className="exposure-subtitle">Top 10 investors by investment</p>
            </div>
            <div className="exposure-count">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span className="count-text">10 investors</span>
            </div>
          </div>

          <div className="investor-exposure-table-container">
            <table className="exposure-table">
              <thead>
                <tr>
                  <th>RANK</th>
                  <th>INVESTOR NAME</th>
                  <th>SERIES</th>
                  <th>INVESTED</th>
                  <th className="at-maturity-header">AT MATURITY</th>
                  <th>AFTER LOCK-IN</th>
                </tr>
              </thead>
              <tbody>
                {topInvestors.map((investor, index) => (
                  <tr key={index}>
                    <td>
                      <div className="rank-cell-centered">
                        {index === 0 && <LuCrown className="rank-crown gold-crown" size={20} />}
                        {index === 1 && <LuCrown className="rank-crown silver-crown" size={20} />}
                        {index === 2 && <LuCrown className="rank-crown bronze-crown" size={20} />}
                        {index > 2 && <span className="rank-number">{investor.rank}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="investor-name-cell">
                        {investor.investorName}
                      </div>
                    </td>
                    <td className="all-series-cell">
                      <div className="all-series-container">
                        {investor.allSeries && investor.allSeries.length > 0 ? (
                          <div className="all-series-list">
                            {(() => {
                              const seriesArray = investor.allSeries;
                              const rows = [];
                              for (let i = 0; i < seriesArray.length; i += 2) {
                                const pair = seriesArray.slice(i, i + 2);
                                rows.push(
                                  <div key={i} className="all-series-row">
                                    {pair.map((series, idx) => (
                                      <div key={idx} className="all-series-item">
                                        {series}
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return rows;
                            })()}
                          </div>
                        ) : (
                          <span className="no-series">No series</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="invested-amount-cell">
                        {formatCurrency(investor.invested)}
                      </div>
                    </td>
                    <td className="at-maturity-cell">
                      <span className="maturity-amount">{formatCurrency(investor.atMaturity)}</span>
                    </td>
                    <td className="after-lockin-cell">
                      <span className="lockin-amount">{formatCurrency(investor.afterLockIn)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dashboard Bottom Row - Grievance Management and Investor Satisfaction */}
        <div className="dashboard-bottom-row">
          {/* Grievance Management - Fresh Start From Reference Image */}
          <div className="grievance-fresh">
            <div className="grievance-fresh-header">
              <div className="grievance-fresh-icon">
                <LuMessageSquare size={20} />
              </div>
              <div className="grievance-fresh-title-content">
                <h3 className="grievance-fresh-title">Grievance Management</h3>
                <p className="grievance-fresh-subtitle">Query & issue resolution tracker</p>
              </div>
            </div>

            {/* Three Summary Cards - Exact Reference */}
            <div className="grievance-fresh-summary">
              <div className="fresh-card fresh-red">
                <IoWarningOutline size={24} className="fresh-icon" />
                <div className="fresh-number">{pendingComplaints}</div>
                <div className="fresh-label">Open</div>
              </div>

              <div className="fresh-card fresh-orange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="fresh-icon">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="fresh-number">{inProgressComplaints}</div>
                <div className="fresh-label">In Progress</div>
              </div>

              <div className="fresh-card fresh-green">
                <IoMdCheckmarkCircleOutline size={24} className="fresh-icon" />
                <div className="fresh-number">{closedComplaints}</div>
                <div className="fresh-label">Closed</div>
              </div>
            </div>

            {/* Category Rows - Exact Reference */}
            <div className="grievance-fresh-categories">
              <div className="fresh-category">
                <div className="fresh-category-header">
                  <div className="fresh-category-icon investor-fresh">
                    <IoPeopleOutline size={16} />
                  </div>
                  <span className="fresh-category-title">Investor Queries</span>
                </div>
                <div className="fresh-stats">
                  <div className="fresh-stat fresh-stat-red">
                    <span className="fresh-stat-label">Open</span>
                    <span className="fresh-stat-value">{investorStats.open}</span>
                  </div>
                  <div className="fresh-stat fresh-stat-orange">
                    <span className="fresh-stat-label">In Progress</span>
                    <span className="fresh-stat-value">{investorStats.inProgress}</span>
                  </div>
                  <div className="fresh-stat fresh-stat-green">
                    <span className="fresh-stat-label">Closed</span>
                    <span className="fresh-stat-value">{investorStats.closed}</span>
                  </div>
                </div>
              </div>

              <div className="fresh-category">
                <div className="fresh-category-header">
                  <div className="fresh-category-icon trustee-fresh">
                    <LuBuilding2 size={16} />
                  </div>
                  <span className="fresh-category-title">Trustee / Regulator</span>
                </div>
                <div className="fresh-stats">
                  <div className="fresh-stat fresh-stat-red">
                    <span className="fresh-stat-label">Open</span>
                    <span className="fresh-stat-value">{trusteeStats.open}</span>
                  </div>
                  <div className="fresh-stat fresh-stat-orange">
                    <span className="fresh-stat-label">In Progress</span>
                    <span className="fresh-stat-value">{trusteeStats.inProgress}</span>
                  </div>
                  <div className="fresh-stat fresh-stat-green">
                    <span className="fresh-stat-label">Closed</span>
                    <span className="fresh-stat-value">{trusteeStats.closed}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Rate - Exact Reference */}
            <div className="grievance-fresh-resolution">
              <div className="fresh-resolution-content">
                <div className="fresh-resolution-text">
                  <span className="fresh-resolution-label">Overall Resolution Rate</span>
                  <span className="fresh-resolution-percentage">{resolutionRate}%</span>
                </div>
                <div className="fresh-resolution-icon">
                  <LuCircleCheckBig size={32} />
                </div>
              </div>
            </div>
          </div>

          {/* Investor Satisfaction Index Card */}
          <div className="investor-satisfaction-card">
            <div className="satisfaction-header">
              <div className="satisfaction-icon">
                <LuSmile size={20} />
              </div>
              <div className="satisfaction-title-content">
                <h3 className="satisfaction-title">Investor Satisfaction Index</h3>
                <p className="satisfaction-subtitle">Churn & early redemption metrics</p>
              </div>
            </div>

            {/* Retention Circle - Dynamic */}
            <div className="retention-circle-container">
              <div className="retention-circle">
                <svg width="120" height="120" viewBox="0 0 120 120" className="circle-svg">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(retentionRate / 100) * 314} 314`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="retention-text">
                  <div className="retention-percentage">{retentionRate}%</div>
                  <div className="retention-label">Retention</div>
                </div>
              </div>
            </div>

            {/* Churn and Early Redemption Stats */}
            <div className="satisfaction-stats">
              <div className="satisfaction-stat churn-stat">
                <div className="stat-header">
                  <IoWarningOutline size={16} className="stat-icon churn-icon" />
                  <span className="stat-title">Churn Requests</span>
                </div>
                <div className="stat-number churn-number">{churnRequests}</div>
                <div className="stat-amount churn-amount">₹{(churnAmount / 100000).toFixed(2)} L</div>
              </div>

              <div className="satisfaction-stat redemption-stat">
                <div className="stat-header">
                  <MdTrendingDown size={16} className="stat-icon redemption-icon" />
                  <span className="stat-title">Early Redemption</span>
                </div>
                <div className="stat-number redemption-number">{earlyRedemptionRequests}</div>
                <div className="stat-amount redemption-amount">₹{(earlyRedemptionAmount / 100000).toFixed(2)} L</div>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Tracker Modal */}
        {/* Removed - no longer needed */}
      </div>
    </Layout>
  );
};

export default Dashboard;
