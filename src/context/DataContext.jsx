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
    // Always start with empty array - no hardcoded data  
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

  useEffect(() => {
    localStorage.setItem('series', JSON.stringify(series));
  }, [series]);

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
          
          console.log('🔄 Loading audit logs from database...');
          const logs = await apiService.getAuditLogs({ limit: 100 }); // Get latest 100 logs
          
          // Transform API response to match frontend format
          const transformedLogs = logs.map(log => ({
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
          console.log('✅ Loaded', transformedLogs.length, 'audit logs from database');
        } else {
          console.log('⏳ No auth token found, skipping audit log loading');
        }
      } catch (error) {
        console.error('❌ Failed to load initial audit logs:', error);
        // Keep existing empty array if loading fails
      }
    };

    // FIXED: Use ref to prevent infinite loop - only load once
    const token = localStorage.getItem('authToken');
    if (token && !auditLogsLoadedRef.current) {
      loadInitialAuditLogs();
    } else {
      console.log('🔄 Audit logs already loaded or no token, skipping initial load');
    }
    
  }, []); // Empty dependency array - run only once on mount

  const addSeries = (newSeries) => {
    // Check for duplicate series name
    const duplicateName = series.find(s => s.name.toLowerCase() === newSeries.name.toLowerCase());
    if (duplicateName) {
      alert(`A series with the name "${newSeries.name}" already exists. Please use a different name.`);
      return false;
    }
    
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse dates
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return null;
    };
    
    const subscriptionStartDate = parseDate(approvedData.subscriptionStartDate);
    const subscriptionEndDate = parseDate(approvedData.subscriptionEndDate);
    
    // Determine status based on subscription window
    let status = 'upcoming'; // Default to upcoming
    
    if (subscriptionStartDate && subscriptionEndDate) {
      if (today < subscriptionStartDate) {
        status = 'upcoming'; // Before subscription starts
      } else if (today >= subscriptionStartDate && today <= subscriptionEndDate) {
        status = 'accepting'; // Within subscription window
      } else if (today > subscriptionEndDate) {
        status = 'active'; // After subscription ends
      }
    } else {
      // Fallback to old logic if no subscription dates
      const issueDate = parseDate(approvedData.issueDate);
      if (issueDate && issueDate <= today) {
        status = 'active';
      } else {
        status = 'upcoming';
      }
    }
    
    setSeries(series.map(s => 
      s.id === id 
        ? { 
            ...s, 
            ...approvedData, 
            status: status,
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

  // Force complete recalculation of all series metrics
  const forceRecalculateAllSeries = useCallback(() => {
    console.log('🔄 FORCING COMPLETE SERIES RECALCULATION');
    
    setSeries(currentSeries => {
      const recalculatedSeries = currentSeries.map(s => {
        // Find all ACTIVE investors in this series (exclude deleted investors)
        const investorsInSeries = investors.filter(inv => 
          inv.series && Array.isArray(inv.series) && inv.series.includes(s.name) &&
          inv.status !== 'deleted' // Exclude deleted investors
        );
        
        // Calculate total funds from investments array (only from active investors)
        const totalFundsFromInvestors = investorsInSeries.reduce((sum, inv) => {
          if (inv.investments && Array.isArray(inv.investments)) {
            const seriesInvestment = inv.investments.find(investment => investment.seriesName === s.name);
            return sum + (seriesInvestment ? seriesInvestment.amount : 0);
          }
          return sum;
        }, 0);
        
        // For initial series (1-5), add the new investments to the base amount
        const isInitialSeries = s.id <= 5;
        const baseFunds = isInitialSeries ? (initialSeries.find(init => init.id === s.id)?.fundsRaised || 0) : 0;
        
        const newInvestorCount = investorsInSeries.length;
        const newFundsRaised = baseFunds + Math.round(totalFundsFromInvestors);
        
        console.log(`📊 ${s.name}: ${newInvestorCount} investors (was ${s.investors}), ₹${newFundsRaised.toLocaleString()} funds (was ₹${s.fundsRaised.toLocaleString()})`);
        
        return {
          ...s,
          investors: newInvestorCount,
          fundsRaised: newFundsRaised
        };
      });
      
      // Save to localStorage
      localStorage.setItem('series', JSON.stringify(recalculatedSeries));
      console.log('✅ Series recalculation complete');
      
      return recalculatedSeries;
    });
  }, [investors]); // Only depend on investors, not series

  // Recalculate series metrics based on actual investor data (excluding deleted investors)
  const recalculateSeriesMetrics = (seriesName = null) => {
    console.log(`🔄 Recalculating series metrics${seriesName ? ` for ${seriesName}` : ' for all series'}`);
    
    setSeries(currentSeries => {
      const updatedSeries = currentSeries.map(s => {
        // If seriesName is provided, only recalculate that series
        if (seriesName && s.name !== seriesName) {
          return s;
        }
        
        // Get the most current investor data from localStorage to ensure we have the latest
        const currentInvestors = JSON.parse(localStorage.getItem('investors') || '[]');
        console.log(`🔍 Found ${currentInvestors.length} investors in localStorage for ${s.name}`);
        
        // Find all ACTIVE investors in this series (exclude deleted investors)
        const investorsInSeries = currentInvestors.filter(inv => 
          inv.series && Array.isArray(inv.series) && inv.series.includes(s.name) &&
          inv.status !== 'deleted' // Exclude deleted investors
        );
        
        console.log(`🔍 Found ${investorsInSeries.length} investors in ${s.name}:`, investorsInSeries.map(inv => inv.name));
        
        // Calculate total funds from investments array (only from active investors)
        const totalFundsFromInvestors = investorsInSeries.reduce((sum, inv) => {
          if (inv.investments && Array.isArray(inv.investments)) {
            const seriesInvestment = inv.investments.find(investment => investment.seriesName === s.name);
            const amount = seriesInvestment ? seriesInvestment.amount : 0;
            console.log(`🔍 ${inv.name} invested ₹${amount.toLocaleString()} in ${s.name}`);
            return sum + amount;
          }
          return sum;
        }, 0);
        
        console.log(`🔍 Total funds from investors in ${s.name}: ₹${totalFundsFromInvestors.toLocaleString()}`);
        
        // For initial series (1-5), add the new investments to the base amount
        const isInitialSeries = s.id <= 5;
        const baseFunds = isInitialSeries ? (initialSeries.find(init => init.id === s.id)?.fundsRaised || 0) : 0;
        
        const newInvestorCount = investorsInSeries.length;
        const newFundsRaised = baseFunds + Math.round(totalFundsFromInvestors);
        
        // Always log changes for debugging
        console.log(`📊 ${s.name}: ${newInvestorCount} investors (was ${s.investors}), ₹${newFundsRaised.toLocaleString()} funds (was ₹${s.fundsRaised.toLocaleString()})`);
        
        return {
          ...s,
          investors: newInvestorCount, // Only count active investors
          fundsRaised: newFundsRaised, // Only funds from active investors
          lastUpdated: new Date().toISOString() // Force React to detect change
        };
      });
      
      // Save updated series to localStorage immediately
      localStorage.setItem('series', JSON.stringify(updatedSeries));
      console.log('✅ Series metrics recalculated and saved');
      
      return updatedSeries;
    });
  };

  // Function to check and update series status based on issue date
  const checkAndUpdateSeriesStatus = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    setSeries(currentSeries => 
      currentSeries.map(s => {
        if (s.status === 'upcoming' && s.issueDate) {
          const parseDate = (dateStr) => {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              return new Date(parts[2], parts[1] - 1, parts[0]);
            }
            return null;
          };
          
          const issueDate = parseDate(s.issueDate);
          if (issueDate && issueDate <= today) {
            return { ...s, status: 'active' };
          }
        }
        return s;
      })
    );
  };

  // Check series status on component mount and set up daily check
  useEffect(() => {
    checkAndUpdateSeriesStatus();
    
    // Set up interval to check daily at midnight
    const checkInterval = setInterval(() => {
      checkAndUpdateSeriesStatus();
    }, 24 * 60 * 60 * 1000); // Check every 24 hours
    
    return () => clearInterval(checkInterval);
  }, []);

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
    console.log('🔄 updateInvestor called with:', { id, updates });
    
    // Find the investor being updated
    const targetInvestor = investors.find(inv => inv.id === id);
    if (!targetInvestor) {
      console.error('❌ Investor not found with id:', id);
      return;
    }
    
    console.log('📋 Current investor data:', targetInvestor);
    
    // Find and update investor
    const updatedInvestors = investors.map(inv => 
      inv.id === id ? { ...inv, ...updates } : inv
    );
    
    const updatedInvestor = updatedInvestors.find(inv => inv.id === id);
    console.log('📋 Updated investor data:', updatedInvestor);
    
    // Update state and localStorage immediately
    setInvestors(updatedInvestors);
    localStorage.setItem('investors', JSON.stringify(updatedInvestors));
    console.log('✅ Investors state and localStorage updated');
    
    // Update series immediately with detailed logging
    const updatedSeries = series.map(s => {
      // Find investors in this series from the updated data
      const investorsInSeries = updatedInvestors.filter(inv => 
        inv.series && inv.series.includes(s.name)
      );
      
      console.log(`📊 ${s.name}: Found ${investorsInSeries.length} investors`);
      
      // Calculate total funds
      let totalFunds = 0;
      investorsInSeries.forEach(inv => {
        if (inv.investments) {
          inv.investments.forEach(investment => {
            if (investment.seriesName === s.name) {
              totalFunds += investment.amount;
              console.log(`💰 ${inv.name} invested ₹${investment.amount.toLocaleString()} in ${s.name}`);
            }
          });
        }
      });
      
      // Add base funds for initial series
      if (s.id <= 5) {
        const baseFunds = initialSeries.find(init => init.id === s.id)?.fundsRaised || 0;
        totalFunds += baseFunds;
        console.log(`💰 ${s.name}: Added base funds ₹${baseFunds.toLocaleString()}, total now ₹${totalFunds.toLocaleString()}`);
      }
      
      const oldFunds = s.fundsRaised;
      const oldInvestors = s.investors;
      
      console.log(`📊 ${s.name}: ${investorsInSeries.length} investors (was ${oldInvestors}), ₹${totalFunds.toLocaleString()} funds (was ₹${oldFunds.toLocaleString()})`);
      
      return {
        ...s,
        investors: investorsInSeries.length,
        fundsRaised: totalFunds,
        lastUpdated: new Date().toISOString() // Force React to detect change
      };
    });
    
    // Update series state and localStorage
    setSeries(updatedSeries);
    localStorage.setItem('series', JSON.stringify(updatedSeries));
    console.log('✅ Series state and localStorage updated');
    
    // Force a series refresh trigger to ensure all components re-render
    setSeriesRefreshTrigger(prev => prev + 1);
    console.log('✅ Series refresh trigger updated');
    
    // Dispatch custom event to refresh Dashboard metrics
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
      console.log('📊 Dashboard refresh event dispatched');
    }, 100);
  };

  // Audit Log Functions
  
  // Load audit logs from database
  const loadAuditLogs = async () => {
    try {
      console.log('🔄 Loading audit logs from database...');
      const logs = await apiService.getAuditLogs({ limit: 100 }); // Get latest 100 logs
      
      // Transform API response to match frontend format
      const transformedLogs = logs.map(log => ({
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
      console.log('✅ Loaded', transformedLogs.length, 'audit logs from database');
    } catch (error) {
      console.error('❌ Failed to load audit logs from database:', error);
      // Keep existing logs if loading fails
    }
  };

  // Save to database
  const addAuditLog = async (logEntry) => {
    // DEBUGGING: Log when this function is called
    console.log('🔍 addAuditLog called with:', logEntry.action);
    
    const newLog = {
      id: auditLogs.length + 1,
      timestamp: new Date().toISOString(),
      ...logEntry
    };
    
    // Add to local state immediately for UI responsiveness
    setAuditLogs([newLog, ...auditLogs]);
    console.log('🔍 Added audit log to state, total logs:', auditLogs.length + 1);
    
    // FIXED: Save to database via API with proper error handling
    try {
      const auditData = {
        action: logEntry.action,
        admin_name: logEntry.adminName,
        admin_role: logEntry.adminRole,
        details: logEntry.details,
        entity_type: logEntry.entityType,
        entity_id: logEntry.entityId,
        changes: JSON.stringify(logEntry.changes || {})
      };
      
      console.log('🔄 Saving audit log to database:', auditData.action);
      await apiService.createAuditLog(auditData);
      console.log('✅ Audit log saved to database successfully');
      
    } catch (error) {
      console.error('❌ Failed to save audit log to database:', error);
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
  const getInterestPayoutStats = () => {
    // Load payout status updates from localStorage (same as Interest Payout page)
    const payoutStatusUpdates = JSON.parse(localStorage.getItem('payoutStatusUpdates') || '{}');
    const payoutMetadata = JSON.parse(localStorage.getItem('payoutMetadata') || '{}');
    
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const upcomingMonth = nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    let totalInterestPaid = 0;
    let upcomingMonthPayout = 0;
    let totalPayouts = 0;
    let upcomingPayouts = 0;
    
    // Only calculate for active series
    const activeSeries = series.filter(s => s.status === 'active');
    
    activeSeries.forEach(s => {
      // Get investors for this series
      const seriesInvestors = investors.filter(inv => inv.series && inv.series.includes(s.name));
      
      seriesInvestors.forEach(investor => {
        // Calculate investment amount for this series
        const investmentPerSeries = investor.investment / investor.series.length;
        
        // Calculate monthly interest
        const interestAmount = (investmentPerSeries * s.interestRate) / 100 / 12;
        
        // Check for current month payout
        const currentPayoutKey = `${investor.investorId}-${s.name}-${currentMonth}`;
        const currentPayoutStatus = payoutStatusUpdates[currentPayoutKey] || 'Paid';
        
        if (currentPayoutStatus === 'Paid') {
          totalInterestPaid += Math.round(interestAmount);
        }
        totalPayouts++;
        
        // Check for upcoming month payout
        const upcomingPayoutKey = `${investor.investorId}-${s.name}-${upcomingMonth}`;
        const upcomingPayoutStatus = payoutStatusUpdates[upcomingPayoutKey] || 'Pending';
        
        upcomingMonthPayout += Math.round(interestAmount);
        upcomingPayouts++;
      });
    });
    
    return {
      totalInterestPaid,
      upcomingMonthPayout,
      totalPayouts,
      upcomingPayouts,
      currentMonth,
      upcomingMonth
    };
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
  const getSeriesStatus = (series) => {
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
    
    // Handle DRAFT status
    if (series.status === 'DRAFT') {
      return 'DRAFT';
    }
    
    const subscriptionStartDate = parseDate(series.subscriptionStartDate);
    const subscriptionEndDate = parseDate(series.subscriptionEndDate);
    const maturityDate = parseDate(series.maturityDate);
    
    // Check if matured
    if (maturityDate && maturityDate < today) {
      return 'matured';
    }
    
    // If no subscription dates, use old logic
    if (!subscriptionStartDate || !subscriptionEndDate) {
      return series.status;
    }
    
    // Subscription window logic
    if (today < subscriptionStartDate) {
      return 'upcoming'; // Before subscription starts
    } else if (today >= subscriptionStartDate && today <= subscriptionEndDate) {
      return 'accepting'; // Within subscription window - accepting investments
    } else if (today > subscriptionEndDate) {
      return 'active'; // After subscription ends - active but no new investments
    }
    
    return series.status;
  };

  // Auto-update series statuses based on subscription dates
  const updateSeriesStatuses = useCallback(() => {
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
    
    let hasUpdates = false;
    const updatedSeries = series.map(s => {
      const currentStatus = getSeriesStatus(s);
      
      // Only update if status has changed
      if (s.status !== currentStatus) {
        hasUpdates = true;
        console.log(`Auto-updating series ${s.name} status from ${s.status} to ${currentStatus}`);
        return { ...s, status: currentStatus };
      }
      
      return s;
    });
    
    if (hasUpdates) {
      setSeries(updatedSeries);
      localStorage.setItem('series', JSON.stringify(updatedSeries));
    }
  }, [series, getSeriesStatus]);

  // Run status updates on component mount and periodically
  useEffect(() => {
    updateSeriesStatuses();
    
    // Update statuses every hour
    const interval = setInterval(updateSeriesStatuses, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [updateSeriesStatuses]);

  // Add transaction to investor's transaction history
  const addTransactionToInvestor = (investorId, transaction) => {
    console.log('Adding transaction to investor:', investorId, transaction);
    
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
    console.log('Transaction added successfully');
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
    console.log('Adding document to investor:', investorId, document);
    
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
    console.log('Document added successfully');
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