import React, { useState, useRef, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import apiService from '../services/api';
import auditService from '../services/auditService';
import Layout from '../components/Layout';
import './Communication.css';
import '../styles/loading.css';
import { HiOutlineMail, HiOutlineDeviceMobile, HiOutlineDownload, HiOutlineUpload } from 'react-icons/hi';
import { MdSend, MdHistory, MdClose, MdSearch, MdFilterList, MdCheck, MdRemove, MdDragIndicator } from 'react-icons/md';
import { FaPlus } from 'react-icons/fa';
import { FiSearch, FiFilter, FiX, FiUsers, FiMail, FiPhone, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import * as XLSX from 'xlsx';

const Communication = () => {
  const { showCreateButton, canEdit } = usePermissions();
  const { user } = useAuth();
  const { addAuditLog } = useData();
  
  // Backend data state
  const [series, setSeries] = useState([]);
  const [seriesInvestorsMap, setSeriesInvestorsMap] = useState(new Map()); // Map<seriesId, investors[]>
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [searchedInvestors, setSearchedInvestors] = useState([]); // For investor search results
  const [historyStats, setHistoryStats] = useState({ total_count: 0, sms_count: 0, email_count: 0 });
  const [smsTemplates, setSmsTemplates] = useState([]); // Templates from backend
  const [emailTemplates, setEmailTemplates] = useState([]); // Templates from backend
  
  // Main state
  const [activeTab, setActiveTab] = useState('compose');
  const [communicationType, setCommunicationType] = useState('sms'); // 'sms' or 'email'
  const [isSending, setIsSending] = useState(false);
  const [communicationHistory, setCommunicationHistory] = useState([]);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'upcoming'
  
  // Series selection state
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [selectedInvestors, setSelectedInvestors] = useState(new Map()); // Map<seriesName, Set<investorId>>
  const [expandedSeries, setExpandedSeries] = useState(new Set()); // Track which series investor lists are expanded
  const [investorListHeights, setInvestorListHeights] = useState(new Map()); // Track custom heights for investor lists
  
  // Message composition state
  const [messageContent, setMessageContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Legacy state for backward compatibility
  const [historyFilter, setHistoryFilter] = useState('all');
  const fileInputRef = useRef(null);
  
  // Refs for height matching
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);

  // Fetch templates from backend on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        if (import.meta.env.DEV) { console.log('📊 Fetching templates from backend...'); }
        
        // Fetch SMS templates
        const smsResponse = await apiService.getCommunicationTemplates('SMS');
        if (import.meta.env.DEV) { console.log('✅ SMS templates fetched:', smsResponse.templates); }
        setSmsTemplates(smsResponse.templates || []);
        
        // Fetch Email templates
        const emailResponse = await apiService.getCommunicationTemplates('Email');
        if (import.meta.env.DEV) { console.log('✅ Email templates fetched:', emailResponse.templates); }
        setEmailTemplates(emailResponse.templates || []);
        
      } catch (error) {
        if (import.meta.env.DEV) { console.error('❌ Error fetching templates:', error); }
      }
    };

    fetchTemplates();
  }, []);

  // Fetch series from backend with search and filter
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoadingSeries(true);
        if (import.meta.env.DEV) { console.log('📊 Fetching series from backend with filters...'); }
        const response = await apiService.getSeriesWithInvestors(searchTerm, statusFilter);
        if (import.meta.env.DEV) { console.log('✅ Series fetched:', response.series); }
        setSeries(response.series || []);
      } catch (error) {
        if (import.meta.env.DEV) { console.error('❌ Error fetching series:', error); }
        setSeries([]);
      } finally {
        setLoadingSeries(false);
      }
    };

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchSeries();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  // Fetch communication history from backend with type filter
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (import.meta.env.DEV) { console.log('📊 Fetching communication history from backend...'); }
        const history = await apiService.getCommunicationHistory({ 
          type: historyFilter === 'all' ? null : historyFilter,
          limit: 100 
        });
        if (import.meta.env.DEV) { console.log('✅ Communication history fetched:', history); }
        setCommunicationHistory(history || []);
        
        // Fetch stats
        const stats = await apiService.getCommunicationHistoryStats();
        if (import.meta.env.DEV) { console.log('✅ Communication history stats fetched:', stats); }
        setHistoryStats(stats);
      } catch (error) {
        if (import.meta.env.DEV) { console.error('❌ Error fetching communication history:', error); }
        setCommunicationHistory([]);
      }
    };

    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, historyFilter]);

  // Search investors when search term changes (debounced)
  useEffect(() => {
    const searchInvestors = async () => {
      if (!searchTerm || !searchTerm.trim()) {
        setSearchedInvestors([]);
        return;
      }

      try {
        if (import.meta.env.DEV) { console.log('🔍 Searching investors from backend...'); }
        const response = await apiService.searchInvestorsForCommunication(searchTerm);
        if (import.meta.env.DEV) { console.log('✅ Investors search results:', response.investors); }
        setSearchedInvestors(response.investors || []);
      } catch (error) {
        if (import.meta.env.DEV) { console.error('❌ Error searching investors:', error); }
        setSearchedInvestors([]);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchInvestors();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch investors for a series when expanded
  const fetchInvestorsForSeries = async (seriesId) => {
    if (seriesInvestorsMap.has(seriesId)) {
      // Already fetched
      return seriesInvestorsMap.get(seriesId);
    }

    try {
      if (import.meta.env.DEV) { console.log(`📊 Fetching investors for series ${seriesId}...`); }
      const response = await apiService.getInvestorsForCommunication(seriesId);
      if (import.meta.env.DEV) { console.log(`✅ Investors fetched:`, response.investors); }
      
      setSeriesInvestorsMap(prev => {
        const newMap = new Map(prev);
        newMap.set(seriesId, response.investors || []);
        return newMap;
      });
      
      return response.investors || [];
    } catch (error) {
      if (import.meta.env.DEV) { console.error(`❌ Error fetching investors for series ${seriesId}:`, error); }
      return [];
    }
  };
  
  // Effect to match panel heights
  useEffect(() => {
    const matchPanelHeights = () => {
      if (leftPanelRef.current && rightPanelRef.current) {
        const rightPanelHeight = rightPanelRef.current.offsetHeight;
        leftPanelRef.current.style.height = `${rightPanelHeight}px`;
      }
    };
    
    // Match heights after component mounts and updates
    matchPanelHeights();
    
    // Also match heights when window resizes
    window.addEventListener('resize', matchPanelHeights);
    
    // Use ResizeObserver to watch for content changes in right panel
    const resizeObserver = new ResizeObserver(matchPanelHeights);
    if (rightPanelRef.current) {
      resizeObserver.observe(rightPanelRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', matchPanelHeights);
      resizeObserver.disconnect();
    };
  }, [selectedSeries, messageContent, selectedTemplate, communicationType]); // Re-run when content changes

  // Determine what to show: series list or investor search results
  const showInvestorSearchResults = searchTerm.trim() && searchedInvestors.length > 0;
  const showSeriesList = !showInvestorSearchResults;

  // Get investors for selected series from backend data
  const getInvestorsForSeries = (seriesId) => {
    if (import.meta.env.DEV) { console.log(`🔍 Getting investors for series ID: ${seriesId}`); }
    
    // Get investors from the map (already fetched from backend)
    const investors = seriesInvestorsMap.get(seriesId) || [];
    
    if (import.meta.env.DEV) { console.log(`✅ Found ${investors.length} investors for series ${seriesId}`); }
    return investors;
  };

  // Get all selected investors across all series from backend data
  const getAllSelectedInvestors = () => {
    const allSelected = [];
    selectedInvestors.forEach((investorSet, seriesId) => {
      const seriesInvestors = seriesInvestorsMap.get(seriesId) || [];
      investorSet.forEach(investorId => {
        const investor = seriesInvestors.find(inv => inv.investorId === investorId);
        if (investor) {
          // Find series name from series array
          const seriesInfo = series.find(s => s.id === seriesId);
          allSelected.push({
            ...investor,
            selectedSeries: seriesInfo ? seriesInfo.name : 'Unknown'
          });
        }
      });
    });
    return allSelected;
  };

  // Handle individual investor selection from search results
  const handleIndividualInvestorSelect = async (investor, seriesId) => {
    // Fetch investors for this series if not already fetched
    await fetchInvestorsForSeries(seriesId);
    
    // Add the series to selected series if not already selected
    if (!selectedSeries.includes(seriesId)) {
      setSelectedSeries(prev => [...prev, seriesId]);
    }
    
    // Add this specific investor to the selected investors for this series
    setSelectedInvestors(prev => {
      const newMap = new Map(prev);
      const currentSet = newMap.get(seriesId) || new Set();
      currentSet.add(investor.investorId);
      newMap.set(seriesId, currentSet);
      return newMap;
    });
    
    // Expand the series to show the investor is selected
    setExpandedSeries(prev => new Set([...prev, seriesId]));
    
    // Clear search to show the selected series
    setSearchTerm('');
  };

  // Handle series selection
  const handleSeriesSelect = async (seriesId) => {
    const seriesInfo = series.find(s => s.id === seriesId);
    if (!seriesInfo) return;
    
    if (selectedSeries.includes(seriesId)) {
      // Remove series
      setSelectedSeries(prev => prev.filter(s => s !== seriesId));
      setSelectedInvestors(prev => {
        const newMap = new Map(prev);
        newMap.delete(seriesId);
        return newMap;
      });
      setExpandedSeries(prev => {
        const newSet = new Set(prev);
        newSet.delete(seriesId);
        return newSet;
      });
      setInvestorListHeights(prev => {
        const newMap = new Map(prev);
        newMap.delete(seriesId);
        return newMap;
      });
    } else {
      // Add series and fetch investors from backend
      setSelectedSeries(prev => [...prev, seriesId]);
      
      // Fetch investors for this series
      const seriesInvestors = await fetchInvestorsForSeries(seriesId);
      
      // Auto-select all investors
      setSelectedInvestors(prev => {
        const newMap = new Map(prev);
        newMap.set(seriesId, new Set(seriesInvestors.map(inv => inv.investorId)));
        return newMap;
      });
      setExpandedSeries(prev => new Set([...prev, seriesId]));
    }
  };

  // Toggle investor list expansion
  const toggleInvestorListExpansion = async (seriesId) => {
    const isCurrentlyExpanded = expandedSeries.has(seriesId);
    
    if (!isCurrentlyExpanded) {
      // Expanding - fetch investors if not already fetched
      await fetchInvestorsForSeries(seriesId);
    }
    
    setExpandedSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seriesId)) {
        newSet.delete(seriesId);
        // Reset height when collapsing
        setInvestorListHeights(prevHeights => {
          const newMap = new Map(prevHeights);
          newMap.delete(seriesId);
          return newMap;
        });
      } else {
        newSet.add(seriesId);
      }
      return newSet;
    });
  };

  // Handle investor list resize
  const handleInvestorListResize = (seriesName, newHeight) => {
    setInvestorListHeights(prev => {
      const newMap = new Map(prev);
      newMap.set(seriesName, Math.max(200, Math.min(600, newHeight))); // Min 200px, Max 600px
      return newMap;
    });
  };

  // Handle resize observer for investor lists
  const handleResizeObserver = (seriesName, element) => {
    if (!element) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const newHeight = entry.contentRect.height;
        if (newHeight > 0) {
          handleInvestorListResize(seriesName, newHeight);
        }
      }
    });
    
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  };

  // Handle individual investor selection/deselection
  const handleInvestorToggle = (seriesId, investorId) => {
    if (import.meta.env.DEV) { console.log(`=== INVESTOR TOGGLE START ===`); }
    if (import.meta.env.DEV) { console.log(`Series ID: ${seriesId}, Investor: ${investorId}`); }
    
    // Get current state
    const currentSelectedInvestors = selectedInvestors.get(seriesId) || new Set();
    const wasSelected = currentSelectedInvestors.has(investorId);
    
    if (import.meta.env.DEV) { console.log(`Was selected: ${wasSelected}`); }
    if (import.meta.env.DEV) {

      if (import.meta.env.DEV) { console.log(`Current investors in series ${seriesId}:`, Array.from(currentSelectedInvestors)); }

    }
    
    // Create new set for this series
    const newSeriesSet = new Set(currentSelectedInvestors);
    
    if (wasSelected) {
      // Deselect investor
      newSeriesSet.delete(investorId);
      if (import.meta.env.DEV) { console.log(`DESELECTING investor ${investorId}`); }
    } else {
      // Select investor
      newSeriesSet.add(investorId);
      if (import.meta.env.DEV) { console.log(`SELECTING investor ${investorId}`); }
    }
    
    if (import.meta.env.DEV) {

    
      if (import.meta.env.DEV) { console.log(`New investors in series ${seriesId}:`, Array.from(newSeriesSet)); }

    
    }
    
    // Update the selected investors map
    setSelectedInvestors(prevMap => {
      const newMap = new Map(prevMap);
      
      if (newSeriesSet.size === 0) {
        // No investors selected for this series, remove it
        newMap.delete(seriesId);
        if (import.meta.env.DEV) { console.log(`Removed series ${seriesId} from map - no investors`); }
      } else {
        // Update the series with new investor set
        newMap.set(seriesId, newSeriesSet);
        if (import.meta.env.DEV) { console.log(`Updated series ${seriesId} in map`); }
      }
      
      return newMap;
    });
    
    // Update selected series list
    if (newSeriesSet.size === 0) {
      // Remove series from selected list
      setSelectedSeries(prev => {
        const filtered = prev.filter(s => s !== seriesId);
        if (import.meta.env.DEV) { console.log(`Removed series ${seriesId} from selected series list`); }
        return filtered;
      });
      
      // Also collapse the series
      setExpandedSeries(prev => {
        const newExpanded = new Set(prev);
        newExpanded.delete(seriesId);
        return newExpanded;
      });
    } else {
      // Ensure series is in selected list
      setSelectedSeries(prev => {
        if (!prev.includes(seriesId)) {
          if (import.meta.env.DEV) { console.log(`Added series ${seriesId} to selected series list`); }
          return [...prev, seriesId];
        }
        return prev;
      });
    }
    
    if (import.meta.env.DEV) { console.log(`=== INVESTOR TOGGLE END ===`); }
  };

  // Select all investors for a series
  const handleSelectAllInvestors = (seriesId) => {
    const seriesInvestors = getInvestorsForSeries(seriesId);
    setSelectedInvestors(prev => {
      const newMap = new Map(prev);
      newMap.set(seriesId, new Set(seriesInvestors.map(inv => inv.investorId)));
      return newMap;
    });
  };

  // Deselect all investors for a series
  const handleDeselectAllInvestors = (seriesId) => {
    setSelectedInvestors(prev => {
      const newMap = new Map(prev);
      newMap.delete(seriesId);
      return newMap;
    });
    setSelectedSeries(prev => prev.filter(s => s !== seriesId));
    setExpandedSeries(prev => {
      const newSet = new Set(prev);
      newSet.delete(seriesId);
      return newSet;
    });
  };

  // Clear all selections
  const handleClearAllSelections = () => {
    setSelectedSeries([]);
    setSelectedInvestors(new Map());
    setExpandedSeries(new Set());
    setInvestorListHeights(new Map());
  };

  // Send messages to selected investors - ALL LOGIC IN BACKEND
  const handleSendMessages = async () => {
    if (!messageContent.trim()) {
      alert('Please enter a message to send.');
      return;
    }

    const selectedInvestorsList = getAllSelectedInvestors();
    if (selectedInvestorsList.length === 0) {
      alert('Please select at least one investor to send messages to.');
      return;
    }

    setIsSending(true);

    try {
      if (import.meta.env.DEV) { console.log('📤 Sending messages via backend API...'); }
      
      // Prepare data for backend
      const messageData = {
        type: communicationType, // 'sms' or 'email'
        subject: `Important Update - NCD Investment`,
        message: messageContent,
        investor_ids: selectedInvestorsList.map(inv => inv.investorId),
        series_ids: [...new Set(selectedSeries)] // Unique series IDs
      };
      
      if (import.meta.env.DEV) { console.log('📦 Message data:', messageData); }
      
      // Call backend API to send messages
      const response = await apiService.sendBulkMessages(messageData);
      
      if (import.meta.env.DEV) { console.log('✅ Backend response:', response); }
      
      // Add audit log for communication sent
      await auditService.logDataOperation(
        user,
        'Communication Sent',
        'Communication',
        `${communicationType.toUpperCase()}-${new Date().toISOString().split('T')[0]}`,
        `Sent ${response.successful} ${communicationType.toUpperCase()} message(s) to ${selectedInvestorsList.length} investor(s)${response.failed > 0 ? ` (${response.failed} failed)` : ''}`,
        {
          communicationType: communicationType,
          recipientCount: selectedInvestorsList.length,
          successfulCount: response.successful,
          failedCount: response.failed,
          seriesCount: selectedSeries.length,
          messagePreview: messageContent.substring(0, 100),
          action: 'communication_send'
        }
      ).catch(error => {
        if (import.meta.env.DEV) { console.error('Failed to log communication:', error); }
      });
      
      // Show success message
      alert(`Successfully sent ${response.successful} ${communicationType.toUpperCase()} message(s)! ${response.failed > 0 ? `${response.failed} failed.` : ''}`);
      
      // Refresh communication history
      if (activeTab === 'history') {
        const history = await apiService.getCommunicationHistory({ limit: 100 });
        setCommunicationHistory(history || []);
      }
      
      // Clear selections and message after successful send
      setMessageContent('');
      setSelectedTemplate('');
      handleClearAllSelections();
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error sending messages:', error); }
      alert(`Error sending messages: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    const templates = communicationType === 'sms' ? smsTemplates : emailTemplates;
    // Convert templateId to number for comparison with database ID
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      setMessageContent(template.content);
      if (import.meta.env.DEV) { console.log('✅ Template selected:', template.name, 'Content:', template.content); }
    } else {
      if (import.meta.env.DEV) { console.log('❌ Template not found for ID:', templateId); }
    }
  };

  return (
    <Layout>
      {/* Loading Overlay */}
      {loadingSeries && (
        <div className="loading-overlay">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading...</p>
          </div>
        </div>
      )}
      
      <div className="communication">
        <div className="communication-header">
          <h1 className="communication-title">Communication Center</h1>
          <p className="communication-subtitle">
            Send targeted messages to investors by series with advanced selection and filtering.
          </p>
        </div>

        {/* Main Navigation Tabs */}
        <div className="communication-tabs">
          <button 
            className={`tab-button ${activeTab === 'compose' ? 'active' : ''}`}
            onClick={() => setActiveTab('compose')}
          >
            <MdSend size={20} />
            Compose Message
          </button>
          <button 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <MdHistory size={20} />
            Communication History
          </button>
        </div>

        {/* Tab Content */}
        <div className="communication-content">
          {activeTab === 'compose' && (
            <div className="compose-section">
              {/* Communication Type Selection */}
              <div className="communication-type-selector">
                <div className="type-buttons">
                  <button 
                    className={`type-button ${communicationType === 'sms' ? 'active' : ''}`}
                    onClick={() => setCommunicationType('sms')}
                  >
                    <HiOutlineDeviceMobile size={20} />
                    SMS Messages
                  </button>
                  <button 
                    className={`type-button ${communicationType === 'email' ? 'active' : ''}`}
                    onClick={() => setCommunicationType('email')}
                  >
                    <HiOutlineMail size={20} />
                    Email Messages
                  </button>
                </div>
              </div>

              <div className="compose-layout">
                {/* Left Panel - Series Selection */}
                <div className="series-selection-panel" ref={leftPanelRef}>
                  <div className="panel-header">
                    <h3>Select Series & Investors</h3>
                    <div className="search-filter-controls">
                      <div className="search-container">
                        <FiSearch size={16} />
                        <input
                          type="text"
                          placeholder="Search series or investors..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input"
                        />
                      </div>
                      <button 
                        className={`filter-button ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <FiFilter size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Filter Options */}
                  {showFilters && (
                    <div className="filter-options">
                      <div className="filter-group">
                        <label>Status Filter:</label>
                        <select 
                          value={statusFilter} 
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="filter-select"
                        >
                          <option value="all">All Series</option>
                          <option value="active">Active</option>
                          <option value="upcoming">Upcoming</option>
                          <option value="accepting">Accepting Investments</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="series-list">
                    {showSeriesList && series.map(seriesItem => {
                      const seriesInvestors = getInvestorsForSeries(seriesItem.id);
                      const selectedInvestorSet = selectedInvestors.get(seriesItem.id) || new Set();
                      const isExpanded = expandedSeries.has(seriesItem.id);
                      
                      return (
                        <div key={seriesItem.id} className="series-card">
                          <div className="series-header">
                            <div className="series-info">
                              <h4>{seriesItem.name}</h4>
                              <div className="series-meta">
                                <span className="status-badge">{seriesItem.status.toUpperCase()}</span>
                                <span className="investor-count">
                                  <FiUsers size={14} />
                                  {seriesItem.investorCount} investors
                                </span>
                              </div>
                            </div>
                            <button 
                              className="expand-toggle-btn"
                              onClick={async () => {
                                // First select the series
                                if (!selectedSeries.includes(seriesItem.id)) {
                                  await handleSeriesSelect(seriesItem.id);
                                }
                                // Then toggle expansion
                                await toggleInvestorListExpansion(seriesItem.id);
                              }}
                              title="Expand to select investors"
                            >
                              <FaPlus size={24} style={{color: 'white', fontWeight: 'bold'}} />
                            </button>
                          </div>

                          {/* Investor List (shown when expanded) */}
                          {isExpanded && (
                            <div className="investor-list-section">
                              <div className="investor-list-header">
                                <span className="investor-list-title">
                                  Select Investors ({seriesInvestors.length - selectedInvestorSet.size}/{seriesInvestors.length})
                                </span>
                                <div className="bulk-actions">
                                  <button 
                                    className="bulk-btn"
                                    onClick={() => handleDeselectAllInvestors(seriesItem.id)}
                                    disabled={selectedInvestorSet.size === 0}
                                  >
                                    Deselect All
                                  </button>
                                  <button 
                                    className="bulk-btn"
                                    onClick={() => handleSelectAllInvestors(seriesItem.id)}
                                    disabled={selectedInvestorSet.size === seriesInvestors.length}
                                  >
                                    Select All
                                  </button>
                                </div>
                              </div>
                              
                              <div className="investor-cards-container">
                                {seriesInvestors.map(investor => {
                                  const isSelected = selectedInvestorSet.has(investor.investorId);
                                  const contactInfo = communicationType === 'sms' ? investor.phone : investor.email;
                                  
                                  return (
                                    <div 
                                      key={investor.investorId} 
                                      className={`investor-card ${!isSelected ? 'excluded' : ''}`}
                                      onClick={() => handleInvestorToggle(seriesItem.id, investor.investorId)}
                                    >
                                      <div className="investor-card-header">
                                        <h4 className="investor-name">{investor.name}</h4>
                                        <div className={`investor-checkbox ${isSelected ? 'checked' : ''}`}>
                                          {isSelected && <MdCheck size={12} />}
                                        </div>
                                      </div>
                                      
                                      <div className="investor-id-section">
                                        <p className="investor-id">{investor.investorId}</p>
                                      </div>
                                      
                                      <div className="investor-contact">
                                        <span className="contact-icon">
                                          {communicationType === 'sms' ? <FiPhone size={14} /> : <FiMail size={14} />}
                                        </span>
                                        <span className="contact-text">
                                          {contactInfo || `No ${communicationType === 'sms' ? 'phone' : 'email'}`}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Individual Investor Search Results */}
                    {showInvestorSearchResults && (
                      <div className="search-results-section">
                        <div className="search-results-header">
                          <h4>Found {searchedInvestors.length} investor(s)</h4>
                          <p className="search-hint">Click on an investor to select them</p>
                        </div>
                        <div className="investor-search-results">
                          {searchedInvestors.map(investor => {
                            const contactInfo = communicationType === 'sms' ? investor.phone : investor.email;
                            const investorSeries = investor.series || [];
                            
                            return (
                              <div 
                                key={investor.investorId} 
                                className="investor-search-card"
                                onClick={() => handleIndividualInvestorSelect(investor)}
                              >
                                <div className="investor-search-header">
                                  <h4 className="investor-name">{investor.name}</h4>
                                  <div className="investor-id-badge">{investor.investorId}</div>
                                </div>
                                
                                <div className="investor-search-details">
                                  <div className="investor-contact">
                                    <span className="contact-icon">
                                      {communicationType === 'sms' ? <FiPhone size={14} /> : <FiMail size={14} />}
                                    </span>
                                    <span className="contact-text">
                                      {contactInfo || `No ${communicationType === 'sms' ? 'phone' : 'email'}`}
                                    </span>
                                  </div>
                                  
                                  {investorSeries.length > 0 && (
                                    <div className="investor-series-info">
                                      <span className="series-label">Series:</span>
                                      <div className="series-tags-small">
                                        {investorSeries.slice(0, 2).map((seriesName, idx) => (
                                          <span key={idx} className="series-tag-small">{seriesName}</span>
                                        ))}
                                        {investorSeries.length > 2 && (
                                          <span className="series-tag-small more">+{investorSeries.length - 2} more</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="select-investor-hint">
                                  <span>Click to select</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* No Results */}
                    {searchTerm.trim() && !showInvestorSearchResults && series.length === 0 && (
                      <div className="no-results">
                        <div className="no-results-icon">🔍</div>
                        <h4>No results found</h4>
                        <p>No series or investors match your search term "{searchTerm}"</p>
                        <button 
                          className="clear-search-btn"
                          onClick={() => setSearchTerm('')}
                        >
                          Clear Search
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Message Composition */}
                <div className="message-composition-panel" ref={rightPanelRef}>
                  <div className="panel-header">
                    <h3>Compose {communicationType === 'sms' ? 'SMS' : 'Email'}</h3>
                    {selectedSeries.length > 0 && (
                      <button className="clear-selections-btn" onClick={handleClearAllSelections}>
                        <FiX size={16} />
                        Clear All
                      </button>
                    )}
                  </div>
                  {/* Selection Summary */}
                  {selectedSeries.length > 0 && (
                    <div className="selection-summary">
                      <h4>Selected for Communication:</h4>
                      <div className="summary-stats">
                        <span className="stat">
                          <strong>{selectedSeries.length}</strong> Series
                        </span>
                        <span className="stat">
                          <strong>{getAllSelectedInvestors().length}</strong> Investors
                        </span>
                      </div>
                      <div className="selected-series-tags">
                        {selectedSeries.map(seriesName => {
                          const seriesInvestors = getInvestorsForSeries(seriesName);
                          const excludedSet = selectedInvestors.get(seriesName) || new Set();
                          const includedCount = seriesInvestors.length - excludedSet.size;
                          
                          return (
                            <div key={seriesName} className="series-tag">
                              <div className="series-tag-content">
                                <span className="series-name">{seriesName}</span>
                                <span className="investor-count">({includedCount})</span>
                              </div>
                              <button 
                                className="remove-series-btn"
                                onClick={() => handleSeriesSelect(seriesName)}
                                title={`Remove ${seriesName} from selection`}
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="template-section">
                    <label htmlFor="template-select">Quick Templates:</label>
                    <select
                      id="template-select"
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                      className="template-select"
                    >
                      <option value="">-- Select a template --</option>
                      {(communicationType === 'sms' ? smsTemplates : emailTemplates).map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message Input */}
                  <div className="message-input-section">
                    <label htmlFor="message-content">Message Content:</label>
                    <textarea
                      id="message-content"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder={`Enter your ${communicationType === 'sms' ? 'SMS' : 'email'} message here...`}
                      className="message-textarea"
                      rows={communicationType === 'sms' ? 4 : 8}
                    />
                    <div className="message-info">
                      <span className="char-count">
                        {messageContent.length} characters
                        {communicationType === 'sms' && messageContent.length > 160 && (
                          <span className="warning"> (Multiple SMS)</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Send Button */}
                  <div className="send-section">
                    <button
                      className="send-button"
                      onClick={handleSendMessages}
                      disabled={!messageContent.trim() || getAllSelectedInvestors().length === 0 || isSending}
                    >
                      <MdSend size={20} />
                      {isSending ? 'Sending...' : `Send ${communicationType === 'sms' ? 'SMS' : 'Email'} (${getAllSelectedInvestors().length})`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="communication-section">
              <div className="section-card">
                <div className="card-header">
                  <MdHistory size={24} />
                  <h3>Communication History</h3>
                </div>
                <div className="card-content">
                  {/* Filter Buttons */}
                  <div className="history-filters">
                    <button
                      className={`filter-btn ${historyFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setHistoryFilter('all')}
                    >
                      All ({historyStats.total_count})
                    </button>
                    <button
                      className={`filter-btn ${historyFilter === 'SMS' ? 'active' : ''}`}
                      onClick={() => setHistoryFilter('SMS')}
                    >
                      SMS ({historyStats.sms_count})
                    </button>
                    <button
                      className={`filter-btn ${historyFilter === 'Email' ? 'active' : ''}`}
                      onClick={() => setHistoryFilter('Email')}
                    >
                      Email ({historyStats.email_count})
                    </button>
                  </div>

                  {/* History Table */}
                  {communicationHistory.length === 0 ? (
                    <div className="empty-history">
                      <p>No communication history yet. Messages sent will appear here.</p>
                    </div>
                  ) : (
                    <div className="history-table-container">
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>Type</th>
                            <th>Recipient</th>
                            <th>Contact</th>
                            <th>Series</th>
                            <th>Status</th>
                            <th>Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {communicationHistory.map((entry) => (
                              <tr key={entry.id}>
                                <td className="timestamp-cell">
                                  {new Date(entry.sent_at).toLocaleString()}
                                </td>
                                <td>
                                  <span className={`type-badge ${entry.type.toLowerCase()}`}>
                                    {entry.type === 'SMS' ? <HiOutlineDeviceMobile size={16} /> : <HiOutlineMail size={16} />}
                                    {entry.type}
                                  </span>
                                </td>
                                <td className="recipient-cell">
                                  <div className="recipient-name">{entry.recipient_name}</div>
                                  {entry.investor_id && (
                                    <div className="recipient-id">ID: {entry.investor_id}</div>
                                  )}
                                </td>
                                <td className="contact-cell">{entry.recipient_contact}</td>
                                <td>{entry.series_name || '-'}</td>
                                <td>
                                  <span className={`status-badge ${entry.status.toLowerCase()}`}>
                                    {entry.status}
                                  </span>
                                </td>
                                <td className="message-cell">
                                  <div className="message-preview" title={entry.message}>
                                    {entry.message.length > 50 
                                      ? `${entry.message.substring(0, 50)}...` 
                                      : entry.message}
                                  </div>
                                  {entry.error_message && (
                                    <div className="error-message">{entry.error_message}</div>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Communication;
