import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import auditService from '../services/auditService';
import apiService from '../services/api';
import Layout from '../components/Layout';
import LoadingOverlay from '../components/LoadingOverlay';
import Lottie from 'lottie-react';
import loadingDotsAnimation from '../assets/animations/loading-dots-blue.json';
import './Dashboard.css';
import { MdCurrencyRupee, MdOutlineWarningAmber, MdTrendingUp } from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { HiOutlineDocumentText, HiTrendingUp } from "react-icons/hi";
import { BsGraphUp, BsPercent } from "react-icons/bs";
import { AiOutlineFileText } from "react-icons/ai";
import { RiStackLine, RiSecurePaymentLine } from "react-icons/ri";
import { TfiWallet } from "react-icons/tfi";
import { IoCalendarOutline } from "react-icons/io5";
import { TbCalendarTime } from "react-icons/tb";
import { LuCrown, LuMessageSquare, LuBuilding2, LuSmile } from "react-icons/lu";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { IoWarningOutline, IoPeopleOutline } from "react-icons/io5";
import { MdTrendingDown } from "react-icons/md";
import UpcomingPayoutCalendar from '../components/UpcomingPayoutCalendar';

const Dashboard = () => {
  const navigate = useNavigate();
  const { canView } = usePermissions();
  const { user, justLoggedIn, clearJustLoggedIn } = useAuth();
  const {
    investors,
    series,
    seriesLoading,
    seriesRefreshTrigger,
    getTotalInvestors,
    getCurrentMonthPayout,
    getInterestPayoutStats,
    getUpcomingPayouts,
    addAuditLog
  } = useData();

  const [totalInvestments, setTotalInvestments] = useState(0); // Total investments from backend
  const [activeSeriesCount, setActiveSeriesCount] = useState(0); // Active series count from backend
  const [pendingKYC, setPendingKYC] = useState(0); // Pending KYC count from backend
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data is loaded
  const [animationComplete, setAnimationComplete] = useState(false); // Track if animation is complete
  const [loading, setLoading] = useState(!justLoggedIn); // Skip loading if just logged in
  const [minLoadTimeComplete, setMinLoadTimeComplete] = useState(false); // Track minimum load time
  const [showUpcomingPayouts, setShowUpcomingPayouts] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger
  const [complianceData, setComplianceData] = useState({}); // Store compliance data from backend
  const [dashboardSeries, setDashboardSeries] = useState([]); // Series for performance section, fetched independently
  const [maturityBuckets, setMaturityBuckets] = useState([]); // Store maturity distribution from backend
  const [lockinBuckets, setLockinBuckets] = useState([]); // Store lock-in distribution from backend
  const [calendarData, setCalendarData] = useState(null); // Store calendar data from backend
  const [topInvestors, setTopInvestors] = useState([]); // Store top investors from backend
  const [grievanceStats, setGrievanceStats] = useState({
    investor: { total: 0, pending: 0, in_progress: 0, resolved: 0 },
    trustee: { total: 0, pending: 0, in_progress: 0, resolved: 0 },
    all: { total: 0, pending: 0, in_progress: 0, resolved: 0 }
  }); // Store grievance stats from backend
  const [satisfactionMetrics, setSatisfactionMetrics] = useState({
    retention_rate: 100,
    churn_requests: 0,
    churn_amount: 0,
    early_redemption_requests: 0,
    early_redemption_amount: 0
  }); // Store satisfaction metrics from backend
  const [interestPayoutStats, setInterestPayoutStats] = useState({
    totalInterestPaid: 0,
    upcomingMonthPayout: 0,
    totalPayouts: 0,
    upcomingPayouts: 0,
    currentMonth: '',
    upcomingMonth: '',
    upcomingDetails: []
  }); // Store payout stats from backend
  
  // Loading states for each section
  const [loadingStates, setLoadingStates] = useState({
    metrics: true,
    distribution: true,
    compliance: true,
    calendar: true,
    topInvestors: true,
    grievances: true,
    satisfaction: true,
    payouts: true
  });
  
  // Listen for localStorage changes to refresh metrics
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'investors' || e.key === 'series') {
        setRefreshTrigger(prev => prev + 1);
      }
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events from same tab
    const handleCustomRefresh = () => {
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

  // Minimum loading time of 1401ms (only on initial mount)
  useEffect(() => {
    if (justLoggedIn) {
      // User just logged in, skip loading animation
      setMinLoadTimeComplete(true);
      clearJustLoggedIn();
    } else {
      // Normal page navigation, show loading for minimum 1401ms
      const timer = setTimeout(() => {
        setMinLoadTimeComplete(true);
      }, 1401);
      return () => clearTimeout(timer);
    }
  }, [justLoggedIn, clearJustLoggedIn]);

  // Hide loader only when BOTH conditions are met:
  // 1. Minimum 1401ms has passed
  // 2. Series data has been fetched
  useEffect(() => {
    if (minLoadTimeComplete && !seriesLoading) {
      setLoading(false);
    }
  }, [minLoadTimeComplete, seriesLoading]);

  // Remove all scrollbar-related useEffect - let dashboard work normally
  // const [refreshTrigger, setRefreshTrigger] = useState(0); // Remove if not needed elsewhere
  
  const totalInvestorsCount = getTotalInvestors();
  const currentMonthPayout = getCurrentMonthPayout();
  // REMOVED: const upcomingPayouts = getUpcomingPayouts(); - Now comes from backend in interestPayoutStats
  // REMOVED: Frontend calculation of active series
  // Active series count now comes from backend getDashboardMetrics() in activeSeriesCount state
  
  // Debug: Log when series changes
  useEffect(() => {
    
    // If series just loaded (went from 0 to > 0), trigger a refresh of dependent data
    if (series.length > 0) {
    }
  }, [series, seriesRefreshTrigger]);
  
  // Average interest rate from backend (NOT calculated in frontend)
  const [averageInterestRate, setAverageInterestRate] = useState('0.0');

  // Fetch payout stats from backend
  useEffect(() => {
    const fetchPayoutStats = async () => {
      setLoadingStates(prev => ({ ...prev, payouts: true }));
      
      try {
        const stats = await getInterestPayoutStats();
        
        setInterestPayoutStats(stats);
        setLoadingStates(prev => ({ ...prev, payouts: false }));
        
      } catch (error) {
        // Keep default values on error
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        const upcomingMonth = nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        setInterestPayoutStats({
          totalInterestPaid: 0,
          upcomingMonthPayout: 0,
          totalPayouts: 0,
          upcomingPayouts: 0,
          currentMonth: currentMonth,
          upcomingMonth: upcomingMonth,
          upcomingDetails: []
        });
        setLoadingStates(prev => ({ ...prev, payouts: false }));
      }
    };

    fetchPayoutStats();
  }, [refreshTrigger, seriesRefreshTrigger]); // Re-fetch when refresh triggered

  // Fetch total investments from backend (sum of all confirmed investments across all series)
  useEffect(() => {
    const fetchTotalInvestments = async () => {
      setLoadingStates(prev => ({ ...prev, metrics: true }));
      
      try {
        const metrics = await apiService.getDashboardMetrics();
        
        // Set total investments (sum of all confirmed investments)
        setTotalInvestments(metrics.total_funds_raised || 0);
        
        // Set active series count from backend
        setActiveSeriesCount(metrics.active_series_count || 0);
        
        // Set average interest rate from backend
        setAverageInterestRate(metrics.average_interest_rate ? metrics.average_interest_rate.toFixed(1) : '0.0');
        
        setDataLoaded(true);
        setLoadingStates(prev => ({ ...prev, metrics: false }));
        
      } catch (error) {
        setTotalInvestments(0);
        setActiveSeriesCount(0);
        setAverageInterestRate('0.0');
        setDataLoaded(true);
        setLoadingStates(prev => ({ ...prev, metrics: false }));
      }
    };

    fetchTotalInvestments();

    // Log dashboard metrics viewing for audit trail
    if (user) {
      const metricsViewed = [
        'Total Investments',
        'Total Investors',
        'Current Month Payout',
        'Average Interest Rate',
        'KYC Statistics',
        'Interest Payout Statistics',
        'Investor Satisfaction Metrics'
      ];
      
      // TEMPORARILY DISABLED - audit logging was causing infinite loop
      // auditService.logDashboardMetricsView(user).catch(error => {
      //   if (import.meta.env.DEV) {
      //
      //   }
      // });
    }
  }, [refreshTrigger, user, seriesRefreshTrigger]); // Re-fetch when refresh triggered

  // Fetch Pending KYC count from backend (from Investors page)
  useEffect(() => {
    const fetchPendingKYC = async () => {
      
      try {
        const investorStats = await apiService.getInvestorStatistics();
        
        // Set pending KYC count
        setPendingKYC(investorStats.kyc_pending || 0);
        
      } catch (error) {
        setPendingKYC(0);
      }
    };

    fetchPendingKYC();
  }, [refreshTrigger, seriesRefreshTrigger]); // Re-fetch when refresh triggered

  // Fetch compliance data from backend for ACTIVE and MATURED series only
  useEffect(() => {
    const fetchComplianceData = async () => {
      setLoadingStates(prev => ({ ...prev, compliance: true }));
      
      try {
        // Fetch series directly from backend - no dependency on DataContext series
        const seriesData = await apiService.getSeries();

        // Transform to camelCase for rendering (same as DataContext does)
        const transformed = seriesData.map(s => ({
          id: s.id,
          name: s.name,
          status: s.status,
          investors: s.investor_count || 0,
          fundsRaised: s.funds_raised || 0,
          targetAmount: s.target_amount || 0,
          progressPercentage: s.progress_percentage || 0,
        }));
        setDashboardSeries(transformed);

        const activeAndMaturedSeries = seriesData.filter(s =>
          s.status === 'active' || s.status === 'matured'
        );

        if (!activeAndMaturedSeries || activeAndMaturedSeries.length === 0) {
          setComplianceData({});
          setLoadingStates(prev => ({ ...prev, compliance: false }));
          return;
        }

        // Fetch each series compliance data and update UI incrementally
        for (const s of activeAndMaturedSeries) {
          try {
            const summary = await apiService.getSeriesComplianceSummary(s.id);
            setComplianceData(prev => ({
              ...prev,
              [s.name]: {
                pre: summary.pre_percentage || 0,
                post: summary.post_percentage || 0,
                recurring: summary.recurring_percentage || 0
              }
            }));
          } catch (error) {
            setComplianceData(prev => ({
              ...prev,
              [s.name]: { pre: 0, post: 0, recurring: 0 }
            }));
          }
        }

        setLoadingStates(prev => ({ ...prev, compliance: false }));

      } catch (error) {
        setComplianceData({});
        setLoadingStates(prev => ({ ...prev, compliance: false }));
      }
    };

    fetchComplianceData();
  }, [refreshTrigger]); // Only re-fetch on manual refresh, not on series changes

  // Fetch maturity and lock-in distribution from backend
  useEffect(() => {
    const fetchDistributionData = async () => {
      // Set loading state immediately
      setLoadingStates(prev => ({ ...prev, distribution: true }));
      
      try {
        const distribution = await apiService.getMaturityLockinDistribution();
        
        // If backend returns empty arrays, use default structure with zeros
        const defaultMaturityBuckets = [
          { label: '< 3 months', amount: 0, series_count: 0, percentage: 0, color: 'blue' },
          { label: '3 to 6 months', amount: 0, series_count: 0, percentage: 0, color: 'teal' },
          { label: '6 to 12 months', amount: 0, series_count: 0, percentage: 0, color: 'orange' },
          { label: '12 months above', amount: 0, series_count: 0, percentage: 0, color: 'purple' }
        ];
        
        const defaultLockinBuckets = [
          { label: 'Lock-in completed', amount: 0, series_count: 0, percentage: 0, color: 'green' },
          { label: 'Lock-in ending in <3 months', amount: 0, series_count: 0, percentage: 0, color: 'blue' },
          { label: 'Lock-in ending in 3 to 6 months', amount: 0, series_count: 0, percentage: 0, color: 'teal' },
          { label: 'Lock-in ending in 6 to 12 months', amount: 0, series_count: 0, percentage: 0, color: 'orange' }
        ];
        
        setMaturityBuckets(distribution.maturity_buckets && distribution.maturity_buckets.length > 0 
          ? distribution.maturity_buckets 
          : defaultMaturityBuckets);
        setLockinBuckets(distribution.lockin_buckets && distribution.lockin_buckets.length > 0 
          ? distribution.lockin_buckets 
          : defaultLockinBuckets);
        
        setLoadingStates(prev => ({ ...prev, distribution: false }));
        
      } catch (error) {
        // Set default empty buckets on error
        setMaturityBuckets([
          { label: '< 3 months', amount: 0, series_count: 0, percentage: 0, color: 'blue' },
          { label: '3 to 6 months', amount: 0, series_count: 0, percentage: 0, color: 'teal' },
          { label: '6 to 12 months', amount: 0, series_count: 0, percentage: 0, color: 'orange' },
          { label: '12 months above', amount: 0, series_count: 0, percentage: 0, color: 'purple' }
        ]);
        setLockinBuckets([
          { label: 'Lock-in completed', amount: 0, series_count: 0, percentage: 0, color: 'green' },
          { label: 'Lock-in ending in <3 months', amount: 0, series_count: 0, percentage: 0, color: 'blue' },
          { label: 'Lock-in ending in 3 to 6 months', amount: 0, series_count: 0, percentage: 0, color: 'teal' },
          { label: 'Lock-in ending in 6 to 12 months', amount: 0, series_count: 0, percentage: 0, color: 'orange' }
        ]);
        setLoadingStates(prev => ({ ...prev, distribution: false }));
      }
    };

    fetchDistributionData();
  }, [refreshTrigger, series, seriesRefreshTrigger]); // Re-fetch when refresh triggered OR series changes

  // Fetch upcoming maturity calendar data from backend
  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoadingStates(prev => ({ ...prev, calendar: true }));
      
      try {
        const calendar = await apiService.getUpcomingMaturityCalendar();
        
        setCalendarData(calendar);
        setLoadingStates(prev => ({ ...prev, calendar: false }));
        
      } catch (error) {
        setCalendarData(null);
        setLoadingStates(prev => ({ ...prev, calendar: false }));
      }
    };

    fetchCalendarData();
  }, [refreshTrigger, seriesRefreshTrigger]); // Re-fetch when refresh triggered

  // Fetch top investors from backend
  useEffect(() => {
    const fetchTopInvestors = async () => {
      setLoadingStates(prev => ({ ...prev, topInvestors: true }));
      
      try {
        const response = await apiService.getTopInvestors(10);
        setTopInvestors(response.topInvestors || []);
        setLoadingStates(prev => ({ ...prev, topInvestors: false }));
      } catch (error) {
        setTopInvestors([]);
        setLoadingStates(prev => ({ ...prev, topInvestors: false }));
      }
    };

    fetchTopInvestors();
  }, [refreshTrigger, seriesRefreshTrigger]); // Re-fetch when refresh triggered

  // Fetch grievance stats from backend (same as Grievance Management page)
  useEffect(() => {
    const fetchGrievanceStats = async () => {
      setLoadingStates(prev => ({ ...prev, grievances: true }));
      
      try {
        // Fetch stats for investor grievances
        const investorStats = await apiService.getGrievanceStats('investor');
        
        // Fetch stats for trustee grievances
        const trusteeStats = await apiService.getGrievanceStats('trustee');
        
        // Fetch overall stats (all grievances)
        const allStats = await apiService.getGrievanceStats();
        
        setGrievanceStats({
          investor: investorStats,
          trustee: trusteeStats,
          all: allStats
        });
        setLoadingStates(prev => ({ ...prev, grievances: false }));
        
      } catch (error) {
        // Keep default values on error
        setGrievanceStats({
          investor: { total: 0, pending: 0, in_progress: 0, resolved: 0 },
          trustee: { total: 0, pending: 0, in_progress: 0, resolved: 0 },
          all: { total: 0, pending: 0, in_progress: 0, resolved: 0 }
        });
        setLoadingStates(prev => ({ ...prev, grievances: false }));
      }
    };

    fetchGrievanceStats();
  }, [refreshTrigger, seriesRefreshTrigger]); // Re-fetch when refresh triggered

  // Fetch satisfaction metrics from backend (Investor Satisfaction Index)
  useEffect(() => {
    const fetchSatisfactionMetrics = async () => {
      setLoadingStates(prev => ({ ...prev, satisfaction: true }));
      
      try {
        const metrics = await apiService.getSatisfactionMetrics();
        
        setSatisfactionMetrics({
          retention_rate: metrics.retention_rate || 100,
          churn_requests: metrics.churn_requests || 0,
          churn_amount: metrics.churn_amount || 0,
          early_redemption_requests: metrics.early_redemption_requests || 0,
          early_redemption_amount: metrics.early_redemption_amount || 0
        });
        setLoadingStates(prev => ({ ...prev, satisfaction: false }));
        
      } catch (error) {
        // Keep default values on error
        setSatisfactionMetrics({
          retention_rate: 100,
          churn_requests: 0,
          churn_amount: 0,
          early_redemption_requests: 0,
          early_redemption_amount: 0
        });
        setLoadingStates(prev => ({ ...prev, satisfaction: false }));
      }
    };

    fetchSatisfactionMetrics();
  }, [refreshTrigger, seriesRefreshTrigger]); // Re-fetch when refresh triggered

  // REMOVE ALL FRONTEND LOGIC - getTopInvestorsByInvestment function deleted
  // Top investors now come from backend only

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Get grievance management stats from backend (NOT from DataContext)
  const pendingComplaints = grievanceStats.all.pending || 0;
  const inProgressComplaints = grievanceStats.all.in_progress || 0;
  const closedComplaints = grievanceStats.all.resolved || 0;
  const totalComplaints = grievanceStats.all.total || 0;
  const resolutionRate = grievanceStats.all.resolution_rate || 0; // From backend, not calculated

  // Separate by grievance type for dashboard display (from backend stats)
  const investorStatsDisplay = {
    open: grievanceStats.investor.pending || 0,
    inProgress: grievanceStats.investor.in_progress || 0,
    closed: grievanceStats.investor.resolved || 0
  };

  const trusteeStatsDisplay = {
    open: grievanceStats.trustee.pending || 0,
    inProgress: grievanceStats.trustee.in_progress || 0,
    closed: grievanceStats.trustee.resolved || 0
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

  // Get satisfaction metrics from backend (NOT from DataContext)
  const retentionRate = satisfactionMetrics.retention_rate || 100;
  const churnRequests = satisfactionMetrics.churn_requests || 0;
  const earlyRedemptionRequests = satisfactionMetrics.early_redemption_requests || 0;
  const churnAmount = satisfactionMetrics.churn_amount || 0;
  const earlyRedemptionAmount = satisfactionMetrics.early_redemption_amount || 0;
  
  // Debug retention rate
  
  // Debug calendar data
  
  // Dynamic calendar date (today)
  return (
    <Layout>
      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ width: '200px', height: '200px' }}>
            <Lottie animationData={loadingDotsAnimation} loop={true} />
          </div>
        </div>
      )}
      
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">Overview of the NCD portfolio and investor activity.</p>
          </div>
          <div className="header-right">
            {/* Calendar display area */}
            <UpcomingPayoutCalendar 
              calendarData={calendarData}
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
            {/* Total Investments */}
            <div className="portfolio-card portfolio-card-blue">
              <div className="portfolio-card-content">
                <div className="portfolio-card-header">
                  <span className="portfolio-card-label">Total Investments</span>
                  <div className="portfolio-card-icon blue-dark">
                    <MdTrendingUp size={20} />
                  </div>
                </div>
                <div className="portfolio-card-value">{formatCurrency(totalInvestments)}</div>
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
                <div className="portfolio-card-value">{activeSeriesCount}</div>
                <div className="portfolio-card-currency">Nos</div>
              </div>
            </div>

            {/* Average Interest Rate */}
            <div className="portfolio-card portfolio-card-green">
              <div className="portfolio-card-content">
                <div className="portfolio-card-header">
                  <span className="portfolio-card-label">Average Interest Rate</span>
                  <div className="portfolio-card-icon green-dark">
                    <BsPercent size={20} />
                  </div>
                </div>
                <div className="portfolio-card-value">{averageInterestRate}%</div>
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
            
            {loadingStates.distribution ? (
              <div className="loading-container" style={{ padding: '40px', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ 
                  border: '3px solid #f3f4f6', 
                  borderTop: '3px solid #3b82f6', 
                  borderRadius: '50%', 
                  width: '40px', 
                  height: '40px', 
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }}></div>
                <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading distribution data...</p>
              </div>
            ) : (
              <div className="maturity-lockin-container">
                {/* Maturity Distribution */}
                <div className="distribution-section">
                  <h4 className="distribution-title">MATURITY BUCKET</h4>
                  <div className="compact-maturity-table">
                    {maturityBuckets.map((bucket, index) => (
                      <div key={index} className="compact-table-row">
                        <div className="compact-bucket-cell">
                          <div className="compact-bucket-info">
                            <div className="compact-bucket-label">{bucket.label}</div>
                            <div className="compact-amount-inline">{formatCurrency(bucket.amount)} ({bucket.series_count} series)</div>
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
                    ))}
                  </div>
                </div>

                {/* Lock-In Distribution */}
                <div className="distribution-section">
                  <h4 className="distribution-title">LOCK-IN BUCKET</h4>
                  <div className="compact-maturity-table">
                    {lockinBuckets.map((bucket, index) => (
                      <div key={index} className="compact-table-row">
                        <div className="compact-bucket-cell">
                          <div className="compact-bucket-info">
                            <div className="compact-bucket-label">{bucket.label}</div>
                            <div className="compact-amount-inline">{formatCurrency(bucket.amount)} ({bucket.series_count} series)</div>
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
                    ))}
                  </div>
                </div>
              </div>
            )}
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
                  {interestPayoutStats.upcomingDetails && interestPayoutStats.upcomingDetails.length > 0 ? (
                    interestPayoutStats.upcomingDetails.slice(0, 3).map((payout, index) => (
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
                            {payout.date}
                          </div>
                          <div className="payout-days-left">
                            {payout.days_left > 0 ? `${payout.days_left} days left` : 'Due today'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-upcoming-payouts">
                      <p>No upcoming payouts scheduled for {interestPayoutStats.upcomingMonth}</p>
                    </div>
                  )}
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
            {loadingStates.compliance ? (
              <div className="loading-container" style={{ padding: '40px', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ 
                  border: '3px solid #f3f4f6', 
                  borderTop: '3px solid #3b82f6', 
                  borderRadius: '50%', 
                  width: '40px', 
                  height: '40px', 
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }}></div>
                <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading compliance data...</p>
              </div>
            ) : dashboardSeries.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <p>No series data available</p>
              </div>
            ) : (
              dashboardSeries
                .map((s) => {
                // Get progress from backend (NOT calculated in frontend)
                // FIXED: Use progressPercentage (camelCase) not progress_percentage
                const progress = s.progressPercentage || 0;
                
                // Debug logging
                
                // Get compliance data from backend (not DataContext)
                const compliance = complianceData[s.name] || { pre: 0, post: 0, recurring: 0 };
                
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
              })
            )}
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
                        {investor.series && investor.series.length > 0 ? (
                          <div className="all-series-list">
                            {(() => {
                              const seriesArray = investor.series;
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
                        {formatCurrency(investor.totalInvested)}
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
                    <span className="fresh-stat-value">{investorStatsDisplay.open}</span>
                  </div>
                  <div className="fresh-stat fresh-stat-orange">
                    <span className="fresh-stat-label">In Progress</span>
                    <span className="fresh-stat-value">{investorStatsDisplay.inProgress}</span>
                  </div>
                  <div className="fresh-stat fresh-stat-green">
                    <span className="fresh-stat-label">Closed</span>
                    <span className="fresh-stat-value">{investorStatsDisplay.closed}</span>
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
                    <span className="fresh-stat-value">{trusteeStatsDisplay.open}</span>
                  </div>
                  <div className="fresh-stat fresh-stat-orange">
                    <span className="fresh-stat-label">In Progress</span>
                    <span className="fresh-stat-value">{trusteeStatsDisplay.inProgress}</span>
                  </div>
                  <div className="fresh-stat fresh-stat-green">
                    <span className="fresh-stat-label">Closed</span>
                    <span className="fresh-stat-value">{trusteeStatsDisplay.closed}</span>
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
                  <IoMdCheckmarkCircleOutline size={32} />
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
                <div className="retention-percentage">
                  <span className="retention-value">{retentionRate}%</span>
                  <span className="retention-label">Retention</span>
                </div>
              </div>
            </div>

            {/* Churn and Early Redemption Stats */}
            <div className="satisfaction-metrics">
              <div className="satisfaction-metric">
                <div className="metric-label">
                  <IoWarningOutline className="metric-icon" />
                  <span>Churn Requests</span>
                </div>
                <div className="metric-value">{churnRequests}</div>
                <div className="metric-amount">₹{(churnAmount / 100000).toFixed(2)} L</div>
              </div>

              <div className="satisfaction-metric">
                <div className="metric-label">
                  <MdTrendingDown className="metric-icon" />
                  <span>Early Redemption</span>
                </div>
                <div className="metric-value">{earlyRedemptionRequests}</div>
                <div className="metric-amount">₹{(earlyRedemptionAmount / 100000).toFixed(2)} L</div>
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

