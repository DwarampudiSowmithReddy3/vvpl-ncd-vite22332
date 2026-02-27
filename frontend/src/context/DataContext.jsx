import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/api';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Initial data - Empty arrays for clean start
const initialComplaints = [];

const initialInvestors = [];

const initialSeries = [];

export const DataProvider = ({ children }) => {
  // Track if audit logs have been loaded to prevent infinite loop
  const auditLogsLoadedRef = useRef(false);
  
  // Data validation and consistency check
  const clearAllData = () => {
    // Clear all localStorage data silently
    localStorage.removeItem('investors');
    localStorage.removeItem('series');
    localStorage.removeItem('complaints');
    localStorage.removeItem('auditLogs');
    localStorage.removeItem('satisfactionEvents');
    localStorage.setItem('dataVersion', '3.0.0'); // New version for clean state
  };

  // Clear all data only once on component mount
  useEffect(() => {
    const dataVersion = localStorage.getItem('dataVersion');
    if (dataVersion !== '3.0.0') {
      clearAllData();
    }
  }, []);

  const [investors, setInvestors] = useState(() => {
    // Always start with empty array - no hardcoded data
    return [];
  });

  const [series, setSeries] = useState(() => {
    // Always start with empty array - data comes from backend only
    return [];
  });

  // Add a series refresh trigger
  const [seriesRefreshTrigger, setSeriesRefreshTrigger] = useState(0);

  const [complaints, setComplaints] = useState(() => {
    // Always start with empty array - no hardcoded data
    return [];
  });

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState(() => {
    // Always start with empty array - no hardcoded data
    return [];
  });

  // Investor Satisfaction Tracking State
  const [satisfactionEvents, setSatisfactionEvents] = useState(() => {
    // Always start with empty object - no hardcoded data
    return {
      churnEvents: [],
      earlyRedemptionEvents: []
    };
  });

  useEffect(() => {
    localStorage.setItem('investors', JSON.stringify(investors));
  }, [investors]);

  // REMOVED: No longer saving series to localStorage
  // All series data comes from backend only
  // useEffect(() => {
  //   localStorage.setItem('series', JSON.stringify(series));
  // }, [series]);

  // TEMPORARILY DISABLED - localStorage saving for auditLogs to prevent infinite loop
  // useEffect(() => {
  //   localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
  // }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('satisfactionEvents', JSON.stringify(satisfactionEvents));
  }, [satisfactionEvents]);

  useEffect(() => {
    localStorage.setItem('complaints', JSON.stringify(complaints));
  }, [complaints]);

  // Load audit logs from database on component mount
  useEffect(() => {
    const loadInitialAuditLogs = async () => {
      try {
        // Only load if we have an auth token (user is logged in)
        const token = localStorage.getItem('authToken');
        if (token) {
          // Import apiService here to avoid circular dependency issues
          const { default: apiService } = await import('../services/api');
          
          if (import.meta.env.DEV) { console.log('🔄 Loading initial audit logs from database...'); }
          const response = await apiService.getAuditLogs({ limit: 100 }); // Get latest 100 logs
          
          // Backend returns array directly, not wrapped in { logs: [...] }
          if (!response || !Array.isArray(response)) {
            if (import.meta.env.DEV) { console.error('❌ Invalid response format:', response); }
            return;
          }
          
          // Transform API response to match frontend format
          const transformedLogs = response.map(log => ({
            id: log.id,
            timestamp: log.timestamp,
            action: log.action,
            adminName: log.admin_name,
            adminRole: log.admin_role,
            details: log.details,
            entityType: log.entity_type,
            entityId: log.entity_id,
            changes: log.changes || {}
          }));
          
          setAuditLogs(transformedLogs);
          auditLogsLoadedRef.current = true; // Mark as loaded
          if (import.meta.env.DEV) { console.log('✅ Loaded', transformedLogs.length, 'initial audit logs from database'); }
        } else {
          if (import.meta.env.DEV) { console.log('⏳ No auth token found, skipping audit log loading'); }
        }
      } catch (error) {
        if (import.meta.env.DEV) { console.error('❌ Failed to load initial audit logs:', error); }
        // Keep existing empty array if loading fails
      }
    };

    // FIXED: Use ref to prevent infinite loop - only load once
    const token = localStorage.getItem('authToken');
    if (token && !auditLogsLoadedRef.current) {
      loadInitialAuditLogs();
    } else {
      if (import.meta.env.DEV) { console.log('🔄 Audit logs already loaded or no token, skipping initial load'); }
    }
    
  }, []); // Empty dependency array - run only once on mount

  // Load NCD Series from backend
  useEffect(() => {
    const loadSeriesFromBackend = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (import.meta.env.DEV) { console.log('🔍 Token exists:', !!token); }
        if (token) {
          const { default: apiService } = await import('../services/api');
          
          if (import.meta.env.DEV) { console.log('🔄 Loading NCD Series from database...'); }
          const seriesData = await apiService.getSeries();
          if (import.meta.env.DEV) { console.log('🔍 Raw series data from API:', seriesData); }
          if (import.meta.env.DEV) { console.log('🔍 Series data type:', typeof seriesData); }
          if (import.meta.env.DEV) { console.log('🔍 Series data length:', seriesData?.length); }
          
          // Transform backend format (snake_case) to frontend format (camelCase)
          const transformedSeries = seriesData.map(s => ({
            id: s.id,
            name: s.name,
            seriesCode: s.series_code,
            securityType: s.security_type,
            status: s.status,
            debentureTrustee: s.debenture_trustee_name,
            investorsSize: s.investors_size,
            issueDate: s.issue_date,
            tenure: s.tenure,
            maturityDate: s.maturity_date,
            lockInDate: s.lock_in_date,
            lockInPeriod: s.lock_in_period, // NEW: Calculated in backend
            subscriptionStartDate: s.subscription_start_date,
            subscriptionEndDate: s.subscription_end_date,
            releaseDate: s.release_date,
            seriesStartDate: s.series_start_date, // NEW: When interest calculation begins
            minSubscriptionPercentage: s.min_subscription_percentage,
            faceValue: s.face_value,
            minInvestment: s.min_investment,
            targetAmount: s.target_amount,
            totalIssueSize: s.total_issue_size,
            interestRate: s.interest_rate,
            creditRating: s.credit_rating,
            interestFrequency: s.interest_frequency,
            description: s.description,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            createdBy: s.created_by,
            isActive: s.is_active,
            fundsRaised: s.funds_raised || 0,
            progressPercentage: s.progress_percentage || 0,
            investors: s.investor_count || 0  // FIXED: Use investor_count from backend
          }));
          
          if (import.meta.env.DEV) { console.log('✅ Loaded', transformedSeries.length, 'NCD series from database'); }
          setSeries(transformedSeries);
        } else {
          if (import.meta.env.DEV) { console.log('⏳ No auth token found, skipping series loading'); }
        }
      } catch (error) {
        if (import.meta.env.DEV) { console.error('❌ Failed to load NCD series:', error); }
      }
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      loadSeriesFromBackend();
    }
  }, [seriesRefreshTrigger]); // Reload when seriesRefreshTrigger changes

  const addSeries = (newSeries) => {
    // Backend will handle duplicate checking - no need to check in frontend
    
    const seriesToAdd = {
      ...newSeries,
      id: series.length + 1,
      investors: 0,
      fundsRaised: 0,
      status: 'DRAFT', // Always start in DRAFT state
      approvalStatus: 'pending' // New field for approval tracking
    };
    setSeries([...series, seriesToAdd]);
    
    // Initialize compliance status for the new series (all zeros)
    const newSeriesName = `${seriesToAdd.name} NCD`;
    setComplianceStatus(prev => ({
      ...prev,
      [newSeriesName]: { pre: 0, post: 0, recurring: 0 }
    }));
    
    return true;
  };

  const updateSeries = (id, updates) => {
    const oldSeries = series.find(s => s.id === id);
    const newSeries = { ...oldSeries, ...updates };
    
    // If series name is changing, update all investor records
    if (oldSeries && updates.name && oldSeries.name !== updates.name) {
      const updatedInvestors = investors.map(inv => {
        if (inv.series && inv.series.includes(oldSeries.name)) {
          return {
            ...inv,
            series: inv.series.map(s => s === oldSeries.name ? updates.name : s),
            investments: inv.investments ? inv.investments.map(investment => 
              investment.seriesName === oldSeries.name 
                ? { ...investment, seriesName: updates.name }
                : investment
            ) : []
          };
        }
        return inv;
      });
      setInvestors(updatedInvestors);
    }
    
    setSeries(series.map(s => s.id === id ? newSeries : s));
  };

  const approveSeries = (id, approvedData) => {
    // Backend handles status calculation - just update the series data
    setSeries(series.map(s => 
      s.id === id 
        ? { 
            ...s, 
            ...approvedData, 
            // Don't override status - backend calculates it
            approvalStatus: 'approved',
            approvedAt: new Date().toISOString(),
            releaseDate: approvedData.issueDate // Use issue date as release date
          } 
        : s
    ));
  };

  const deleteSeries = (seriesId) => {
    // Allow deletion of DRAFT and UPCOMING series, but not ACTIVE series
    const seriesToDelete = series.find(s => s.id === seriesId);
    if (seriesToDelete && (seriesToDelete.status === 'DRAFT' || seriesToDelete.status === 'upcoming')) {
      // Remove series from all investor records
      const updatedInvestors = investors.map(inv => {
        if (inv.series && inv.series.includes(seriesToDelete.name)) {
          const newSeries = inv.series.filter(s => s !== seriesToDelete.name);
          const newInvestments = inv.investments ? inv.investments.filter(i => i.seriesName !== seriesToDelete.name) : [];
          const newInvestment = newInvestments.reduce((sum, i) => sum + i.amount, 0);
          
          return {
            ...inv,
            series: newSeries,
            investments: newInvestments,
            investment: newInvestment
          };
        }
        return inv;
      });
      setInvestors(updatedInvestors);
      setSeries(series.filter(s => s.id !== seriesId));
      return true;
    }
    return false;
  };

  const rejectSeries = (id, rejectionReason) => {
    setSeries(series.map(s => 
      s.id === id 
        ? { 
            ...s, 
            status: 'REJECTED',
            approvalStatus: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectionReason: rejectionReason || 'No reason provided'
          } 
        : s
    ));
    return true;
  };

  // REMOVED: forceRecalculateAllSeries - ALL calculations done in backend
  const forceRecalculateAllSeries = useCallback(() => {
    if (import.meta.env.DEV) { console.log('⚠️ forceRecalculateAllSeries called but DISABLED - all data from backend'); }
    // Do nothing - all calculations in backend
  }, []);

  // REMOVED: recalculateSeriesMetrics - ALL calculations done in backend
  // Series data including funds_raised and investor counts come from backend
  // Frontend should NEVER calculate these values
  const recalculateSeriesMetrics = (seriesName = null) => {
    if (import.meta.env.DEV) { console.log('⚠️ recalculateSeriesMetrics called but DISABLED - all data from backend'); }
    // Do nothing - all calculations in backend
  };

  // REMOVED: checkAndUpdateSeriesStatus - status calculated in backend
  const checkAndUpdateSeriesStatus = () => {
    if (import.meta.env.DEV) { console.log('⚠️ checkAndUpdateSeriesStatus called but DISABLED - status from backend'); }
    // Do nothing - status comes from backend
  };

  // REMOVED: Check series status on component mount - status from backend
  // useEffect(() => {
  //   checkAndUpdateSeriesStatus();
  //   const checkInterval = setInterval(() => {
  //     checkAndUpdateSeriesStatus();
  //   }, 24 * 60 * 60 * 1000);
  //   return () => clearInterval(checkInterval);
  // }, []);

  // Series recalculation is now handled directly in updateInvestor for immediate updates

  const addInvestor = (newInvestor) => {
    // Check for duplicate investor ID
    const duplicateId = investors.find(inv => inv.investorId.toLowerCase() === newInvestor.investorId.toLowerCase());
    if (duplicateId) {
      alert(`An investor with ID "${newInvestor.investorId}" already exists. Please use a different ID.`);
      return false;
    }
    
    setInvestors([...investors, { ...newInvestor, id: investors.length + 1 }]);
    
    // Recalculate metrics for affected series
    if (newInvestor.series && Array.isArray(newInvestor.series)) {
      newInvestor.series.forEach(seriesName => {
        setTimeout(() => recalculateSeriesMetrics(seriesName), 100);
      });
    }
    
    return true;
  };

  const updateInvestor = (id, updates) => {
    if (import.meta.env.DEV) { console.log('🔄 updateInvestor called with:', { id, updates }); }
    
    // Find the investor being updated
    const targetInvestor = investors.find(inv => inv.id === id);
    if (!targetInvestor) {
      if (import.meta.env.DEV) { console.error('❌ Investor not found with id:', id); }
      return;
    }
    
    if (import.meta.env.DEV) { console.log('📋 Current investor data:', targetInvestor); }
    
    // Find and update investor
    const updatedInvestors = investors.map(inv => 
      inv.id === id ? { ...inv, ...updates } : inv
    );
    
    const updatedInvestor = updatedInvestors.find(inv => inv.id === id);
    if (import.meta.env.DEV) { console.log('📋 Updated investor data:', updatedInvestor); }
    
    // Update state and localStorage immediately
    setInvestors(updatedInvestors);
    localStorage.setItem('investors', JSON.stringify(updatedInvestors));
    if (import.meta.env.DEV) { console.log('✅ Investors state and localStorage updated'); }
    
    // REMOVED: No longer recalculating series on frontend
    // Series data including funds_raised and investor counts come from backend
    if (import.meta.env.DEV) { console.log('⚠️ Series recalculation DISABLED - all data from backend'); }
    
    // Force a series refresh trigger to reload from backend
    setSeriesRefreshTrigger(prev => prev + 1);
    if (import.meta.env.DEV) { console.log('✅ Series refresh trigger updated - will reload from backend'); }
    
    // Dispatch custom event to refresh Dashboard metrics
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
      if (import.meta.env.DEV) { console.log('📊 Dashboard refresh event dispatched'); }
    }, 100);
  };

  // Audit Log Functions
  
  // Load audit logs from database
  const loadAuditLogs = async () => {
    try {
      if (import.meta.env.DEV) { console.log('🔄 Loading audit logs from database...'); }
      const response = await apiService.getAuditLogs({ limit: 100 }); // Get latest 100 logs
      
      // Backend returns array directly, not wrapped in { logs: [...] }
      if (!response || !Array.isArray(response)) {
        if (import.meta.env.DEV) { console.error('❌ Invalid response format:', response); }
        return;
      }
      
      // Transform API response to match frontend format
      const transformedLogs = response.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        action: log.action,
        adminName: log.admin_name,
        adminRole: log.admin_role,
        details: log.details,
        entityType: log.entity_type,
        entityId: log.entity_id,
        changes: log.changes || {}
      }));
      
      setAuditLogs(transformedLogs);
      if (import.meta.env.DEV) { console.log('✅ Loaded', transformedLogs.length, 'audit logs from database'); }
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Failed to load audit logs from database:', error); }
      // Keep existing logs if loading fails
    }
  };

  // Save to database
  const addAuditLog = async (logEntry) => {
    // DEBUGGING: Log when this function is called
    if (import.meta.env.DEV) { console.log('🔍 addAuditLog called with:', logEntry.action); }
    
    const newLog = {
      id: auditLogs.length + 1,
      timestamp: new Date().toISOString(),
      ...logEntry
    };
    
    // Add to local state immediately for UI responsiveness
    setAuditLogs([newLog, ...auditLogs]);
    if (import.meta.env.DEV) { console.log('🔍 Added audit log to state, total logs:', auditLogs.length + 1); }
    
    // FIXED: Save to database via API with proper error handling
    try {
      const auditData = {
        action: logEntry.action,
        admin_name: logEntry.adminName,
        admin_role: logEntry.adminRole,
        details: logEntry.details,
        entity_type: logEntry.entityType,
        entity_id: logEntry.entityId,
        changes: logEntry.changes || {}
      };
      
      if (import.meta.env.DEV) { console.log('🔄 Saving audit log to database:', auditData.action); }
      await apiService.createAuditLog(auditData);
      if (import.meta.env.DEV) { console.log('✅ Audit log saved to database successfully'); }
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Failed to save audit log to database:', error); }
      // Don't remove from local state - keep it for UI even if DB save fails
    }
  };

  // Investor Satisfaction Tracking Functions
  const trackChurnEvent = (investorData) => {
    const churnEvent = {
      id: Date.now(),
      investorId: investorData.investorId,
      investorName: investorData.name,
      timestamp: new Date().toISOString(),
      totalInvestment: investorData.investment || 0,
      seriesInvolved: investorData.series || [],
      reason: 'account_deletion'
    };
    
    setSatisfactionEvents(prev => ({
      ...prev,
      churnEvents: [...prev.churnEvents, churnEvent]
    }));
  };

  const trackEarlyRedemptionEvent = (investorData, seriesName, amount, penaltyAmount = 0) => {
    const redemptionEvent = {
      id: Date.now(),
      investorId: investorData.investorId,
      investorName: investorData.name,
      seriesName: seriesName,
      timestamp: new Date().toISOString(),
      amount: amount,
      penaltyAmount: penaltyAmount,
      reason: 'early_series_exit'
    };
    
    setSatisfactionEvents(prev => ({
      ...prev,
      earlyRedemptionEvents: [...prev.earlyRedemptionEvents, redemptionEvent]
    }));
  };

  const getSatisfactionMetrics = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    // Count recent events (last 30 days)
    const recentChurnEvents = satisfactionEvents.churnEvents.filter(
      event => new Date(event.timestamp) >= thirtyDaysAgo
    );
    
    const recentEarlyRedemptionEvents = satisfactionEvents.earlyRedemptionEvents.filter(
      event => new Date(event.timestamp) >= thirtyDaysAgo
    );
    
    const totalInvestors = investors.length;
    const churnRequests = recentChurnEvents.length;
    const earlyRedemptionRequests = recentEarlyRedemptionEvents.length;
    
    // Calculate amounts
    const churnAmount = recentChurnEvents.reduce((sum, event) => sum + (event.totalInvestment || 0), 0);
    const earlyRedemptionAmount = recentEarlyRedemptionEvents.reduce((sum, event) => sum + (event.amount || 0), 0);
    
    // Calculate retention rate
    const totalNegativeEvents = churnRequests + earlyRedemptionRequests;
    const retentionRate = totalInvestors > 0 
      ? Math.max(0, Math.min(100, Math.round(((totalInvestors - totalNegativeEvents) / totalInvestors) * 100)))
      : 100;
    
    return {
      retentionRate,
      churnRequests,
      earlyRedemptionRequests,
      churnAmount,
      earlyRedemptionAmount
    };
  };

  // Complaint management functions
  const addComplaint = (newComplaint) => {
    const complaint = {
      ...newComplaint,
      id: complaints.length + 1,
      timestamp: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      status: 'pending',
      grievanceType: newComplaint.grievanceType || 'investor', // Default to investor
      isCompleted: false
    };
    setComplaints([complaint, ...complaints]);
    return complaint;
  };

  const updateComplaint = (id, updates) => {
    setComplaints(complaints.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const updateComplaintStatus = (id, status, resolutionComment = null) => {
    setComplaints(complaints.map(c => 
      c.id === id ? { 
        ...c, 
        status: status,
        isCompleted: status === 'resolved',
        resolutionComment: resolutionComment, // Save resolution comment for all statuses
        resolvedAt: status === 'resolved' ? new Date().toISOString() : null
      } : c
    ));
  };

  // Get complaints for specific investor
  const getInvestorComplaints = (investorId) => {
    return complaints.filter(complaint => complaint.investorId === investorId);
  };

  // Get all pending complaints
  const getPendingComplaints = () => {
    return complaints.filter(complaint => complaint.status === 'pending');
  };

  // Get complaints within date range
  const getComplaintsByDateRange = (fromDate, toDate) => {
    if (!fromDate && !toDate) return complaints;
    
    return complaints.filter(complaint => {
      const complaintDate = new Date(complaint.timestamp);
      const from = fromDate ? new Date(fromDate) : new Date('1900-01-01');
      const to = toDate ? new Date(toDate) : new Date();
      
      return complaintDate >= from && complaintDate <= to;
    });
  };

  // Calculate dashboard metrics
  const getTotalFundsRaised = () => {
    return series.reduce((sum, s) => sum + s.fundsRaised, 0);
  };

  const getTotalInvestors = () => {
    // Only count active investors (exclude deleted ones)
    return investors.filter(inv => inv.status !== 'deleted').length;
  };

  const getCurrentMonthPayout = () => {
    // Calculate based on active series and their interest rates
    let totalPayout = 0;
    series.filter(s => s.status === 'active').forEach(s => {
      const monthlyRate = s.interestRate / 100 / 12; // Always monthly
      totalPayout += s.fundsRaised * monthlyRate;
    });
    return totalPayout;
  };

  // Get Interest Payout Management data for Dashboard
  // UPDATED: Fetch from backend API instead of localStorage
  const getInterestPayoutStats = async () => {
    try {
      if (import.meta.env.DEV) { console.log('🔄 Fetching payout stats from backend...'); }
      const stats = await apiService.getPayoutStats();
      if (import.meta.env.DEV) { console.log('✅ Payout stats loaded from backend:', stats); }
      
      return {
        totalInterestPaid: stats.total_interest_paid || 0,
        upcomingMonthPayout: stats.upcoming_month_payout || 0,
        totalPayouts: stats.total_payouts || 0,
        upcomingPayouts: stats.upcoming_payouts || 0,
        currentMonth: stats.current_month || '',
        upcomingMonth: stats.upcoming_month || '',
        upcomingDetails: stats.upcoming_details || []
      };
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error fetching payout stats from backend:', error); }
      // Return default values on error
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      const upcomingMonth = nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      return {
        totalInterestPaid: 0,
        upcomingMonthPayout: 0,
        totalPayouts: 0,
        upcomingPayouts: 0,
        currentMonth: currentMonth,
        upcomingMonth: upcomingMonth,
        upcomingDetails: []
      };
    }
  };

  const getPendingKYC = () => {
    return investors.filter(inv => inv.kycStatus === 'Pending').length;
  };

  const getKYCCompleted = () => {
    return investors.filter(inv => inv.kycStatus === 'Completed').length;
  };

  const getKYCRejected = () => {
    return investors.filter(inv => inv.kycStatus === 'Rejected').length;
  };

  const getUpcomingPayouts = () => {
    // Calculate upcoming payouts based on series
    const payouts = [];
    series.filter(s => s.status === 'active').forEach(s => {
      const nextPayoutDate = new Date();
      nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1); // Always monthly
      const investorsInSeries = investors.filter(inv => inv.series.includes(s.name));
      const totalAmount = investorsInSeries.reduce((sum, inv) => {
        const seriesInvestment = inv.series.includes(s.name) ? inv.investment / inv.series.length : 0;
        return sum + seriesInvestment;
      }, 0);
      
      payouts.push({
        series: s.name,
        investors: investorsInSeries.length,
        amount: totalAmount * (s.interestRate / 100) / 12, // Always monthly
        date: nextPayoutDate.toISOString().split('T')[0]
      });
    });
    return payouts.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Calculate real compliance percentages for each series individually
  const getSeriesComplianceData = (seriesName) => {
    // Find the actual series data
    const actualSeries = series.find(s => `${s.name} NCD` === seriesName || s.name === seriesName.replace(' NCD', ''));
    
    // For new series or series without established compliance, return all zeros
    if (!actualSeries) {
      return { pre: 0, post: 0, recurring: 0 };
    }
    
    // Only established series with significant activity should have any compliance progress
    const isEstablishedSeries = actualSeries.status === 'active' && 
                               actualSeries.fundsRaised > 10000000 && // At least 1 Cr raised
                               actualSeries.investors > 10; // At least 10 investors
    
    if (!isEstablishedSeries) {
      // New or small series start with zero compliance
      return { pre: 0, post: 0, recurring: 0 };
    }
    
    // Only for well-established series, assign some compliance progress
    const seriesComplianceData = {
      'Series A NCD': {
        pre: { completed: 0, total: 26 },
        post: { completed: 3, total: 11 }, // Only 3 basic documents
        recurring: { completed: 0, total: 5 }
      },
      'Series B NCD': {
        pre: { completed: 2, total: 26 },
        post: { completed: 4, total: 11 },
        recurring: { completed: 1, total: 5 }
      },
      'Series C NCD': {
        pre: { completed: 26, total: 26 }, // Only Series C is fully compliant
        post: { completed: 11, total: 11 },
        recurring: { completed: 5, total: 5 }
      },
      'Series D NCD': {
        pre: { completed: 12, total: 26 },
        post: { completed: 4, total: 11 },
        recurring: { completed: 1, total: 5 }
      },
      'Series E NCD': {
        pre: { completed: 10, total: 26 },
        post: { completed: 3, total: 11 },
        recurring: { completed: 1, total: 5 }
      }
    };

    const data = seriesComplianceData[seriesName];
    if (!data) {
      // Any new series not in the hardcoded list starts with zero compliance
      return { pre: 0, post: 0, recurring: 0 };
    }

    // Calculate percentages exactly like ComplianceTracker does
    const prePercentage = Math.round((data.pre.completed / data.pre.total) * 100);
    const postPercentage = Math.round((data.post.completed / data.post.total) * 100);
    const recurringPercentage = Math.round((data.recurring.completed / data.recurring.total) * 100);

    return {
      pre: prePercentage,
      post: postPercentage,
      recurring: recurringPercentage
    };
  };

  // State for tracking compliance status per series - dynamically generated
  const [complianceStatus, setComplianceStatus] = useState(() => {
    const initialStatus = {};
    
    // Initialize compliance status for all existing series
    series.forEach(s => {
      const seriesName = `${s.name} NCD`;
      initialStatus[seriesName] = getSeriesComplianceData(seriesName);
    });
    
    return initialStatus;
  });

  // Update compliance status for a series
  const updateComplianceStatus = (seriesName, statusData) => {
    setComplianceStatus(prev => ({
      ...prev,
      [seriesName]: statusData
    }));
  };

  // Get compliance status for series (for dashboard alerts)
  const getComplianceStatus = (seriesName) => {
    const compliance = complianceStatus[seriesName] || { pre: 0, post: 0, recurring: 0 };
    const averagePercentage = Math.round((compliance.pre + compliance.post + compliance.recurring) / 3);
    
    if (averagePercentage === 100) return 'submitted';
    if (averagePercentage >= 50) return 'pending';
    return 'yet-to-be-submitted';
  };

  // Get series that need compliance attention (for dashboard alerts)
  const getYetToBeSubmittedSeries = () => {
    // Use actual series data instead of hardcoded data
    const complianceSeries = series.filter(s => s.status === 'active').map(s => ({
      id: `comp-${s.id}`,
      name: `${s.name} NCD`,
      interestRate: s.interestRate,
      interestFrequency: s.interestFrequency,
      investors: s.investors, // Use real investor count
      fundsRaised: s.fundsRaised, // Use real funds raised
      targetAmount: s.targetAmount,
      issueDate: s.issueDate,
      maturityDate: s.maturityDate
    }));

    return complianceSeries.filter(s => getComplianceStatus(s.name) === 'yet-to-be-submitted');
  };

  // Check if series is within subscription window
  const isWithinSubscriptionWindow = (series) => {
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
    
    const subscriptionStartDate = parseDate(series.subscriptionStartDate);
    const subscriptionEndDate = parseDate(series.subscriptionEndDate);
    
    if (!subscriptionStartDate || !subscriptionEndDate) {
      return false; // No subscription window defined
    }
    
    return today >= subscriptionStartDate && today <= subscriptionEndDate;
  };

  // Get series status based on subscription window and dates
  // REMOVED: Frontend status calculation - use backend status directly
  // Backend automatically updates status based on dates
  const getSeriesStatus = (series) => {
    // Simply return the status from backend - it's already calculated correctly
    return series.status;
  };

  // REMOVED: updateSeriesStatuses - status calculated in backend
  const updateSeriesStatuses = useCallback(() => {
    if (import.meta.env.DEV) { console.log('⚠️ updateSeriesStatuses called but DISABLED - status from backend'); }
    // Do nothing - status comes from backend
  }, []);

  // REMOVED: Run status updates - status from backend
  // useEffect(() => {
  //   updateSeriesStatuses();
  //   const interval = setInterval(updateSeriesStatuses, 60 * 60 * 1000);
  //   return () => clearInterval(interval);
  // }, [updateSeriesStatuses]);

  // Add transaction to investor's transaction history
  const addTransactionToInvestor = (investorId, transaction) => {
    if (import.meta.env.DEV) { console.log('Adding transaction to investor:', investorId, transaction); }
    
    const updatedInvestors = investors.map(inv => {
      if (inv.investorId === investorId || inv.id === investorId) {
        const currentTransactions = inv.transactions || [];
        const newTransaction = {
          ...transaction,
          date: transaction.date || new Date().toLocaleDateString('en-GB'),
          timestamp: transaction.timestamp || new Date().toISOString()
        };
        
        // Add new transaction and sort by date (newest first)
        const updatedTransactions = [newTransaction, ...currentTransactions]
          .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
        
        return {
          ...inv,
          transactions: updatedTransactions
        };
      }
      return inv;
    });
    
    setInvestors(updatedInvestors);
    localStorage.setItem('investors', JSON.stringify(updatedInvestors));
    if (import.meta.env.DEV) { console.log('Transaction added successfully'); }
  };

  // Add investment transaction (called when new investment is made)
  const addInvestmentTransaction = (investorId, seriesName, amount, date) => {
    const transaction = {
      type: 'Investment',
      series: seriesName,
      amount: amount,
      description: `Investment in ${seriesName}`,
      date: date || new Date().toLocaleDateString('en-GB'),
      timestamp: new Date().toISOString()
    };
    
    addTransactionToInvestor(investorId, transaction);
  };

  // Add interest payout transaction (called when interest is paid)
  const addInterestPayoutTransaction = (investorId, seriesName, amount, date, month) => {
    const transaction = {
      type: 'Interest Credit',
      series: seriesName,
      amount: amount,
      description: `Monthly interest for ${seriesName}${month ? ` - ${month}` : ''}`,
      date: date || new Date().toLocaleDateString('en-GB'),
      timestamp: new Date().toISOString()
    };
    
    addTransactionToInvestor(investorId, transaction);
  };

  // Document management functions
  const addInvestorDocument = (investorId, document) => {
    if (import.meta.env.DEV) { console.log('Adding document to investor:', investorId, document); }
    
    const updatedInvestors = investors.map(inv => {
      if (inv.investorId === investorId || inv.id === investorId) {
        const currentDocuments = inv.seriesDocuments || [];
        const newDocument = {
          ...document,
          id: Date.now() + Math.random(), // Unique ID
          uploadDate: document.uploadDate || new Date().toLocaleDateString('en-GB'),
          timestamp: document.timestamp || new Date().toISOString()
        };
        
        return {
          ...inv,
          seriesDocuments: [...currentDocuments, newDocument]
        };
      }
      return inv;
    });
    
    setInvestors(updatedInvestors);
    localStorage.setItem('investors', JSON.stringify(updatedInvestors));
    if (import.meta.env.DEV) { console.log('Document added successfully'); }
  };

  // Get documents for specific investor
  const getInvestorDocuments = (investorId, seriesName = null) => {
    const investor = investors.find(inv => inv.investorId === investorId || inv.id === investorId);
    if (!investor || !investor.seriesDocuments) {
      return [];
    }
    
    if (seriesName) {
      return investor.seriesDocuments.filter(doc => doc.seriesName === seriesName);
    }
    
    return investor.seriesDocuments;
  };

  // END OF ALL FUNCTIONS - NOW RETURN THE PROVIDER
  return (
    <DataContext.Provider value={{
      investors,
      series,
      complaints,
      auditLogs,
      complianceStatus,
      seriesRefreshTrigger,
      addSeries,
      updateSeries,
      approveSeries,
      rejectSeries,
      deleteSeries,
      addInvestor,
      updateInvestor,
      addAuditLog,
      loadAuditLogs,
      addComplaint,
      updateComplaint,
      updateComplaintStatus,
      getInvestorComplaints,
      getPendingComplaints,
      getComplaintsByDateRange,
      setInvestors,
      setSeries,
      setComplaints,
      getTotalFundsRaised,
      getTotalInvestors,
      getCurrentMonthPayout,
      getInterestPayoutStats,
      getPendingKYC,
      getKYCCompleted,
      getKYCRejected,
      getUpcomingPayouts,
      getComplianceStatus,
      getYetToBeSubmittedSeries,
      updateComplianceStatus,
      recalculateSeriesMetrics,
      forceRecalculateAllSeries,
      forceSeriesRefresh: () => setSeriesRefreshTrigger(prev => prev + 1),
      addTransactionToInvestor,
      addInvestmentTransaction,
      addInterestPayoutTransaction,
      isWithinSubscriptionWindow,
      getSeriesStatus,
      addInvestorDocument,
      getInvestorDocuments,
      trackChurnEvent,
      trackEarlyRedemptionEvent,
      getSatisfactionMetrics
    }}>
      {children}
    </DataContext.Provider>
  );
};