import React, { useState, useRef, useMemo } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Layout from '../components/Layout';
import './Communication.css';
import { HiOutlineMail, HiOutlineDeviceMobile, HiOutlineDownload, HiOutlineUpload } from 'react-icons/hi';
import { MdSend, MdHistory, MdAdd, MdClose, MdSearch, MdFilterList, MdCheck, MdRemove, MdDragIndicator } from 'react-icons/md';
import { FiSearch, FiFilter, FiX, FiUsers, FiMail, FiPhone, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { sendSMS, sendEmail } from '../utils/communicationService';

const Communication = () => {
  const { showCreateButton, canEdit } = usePermissions();
  const { user } = useAuth();
  const { addAuditLog, investors, series } = useData();
  
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

  // Default templates
  const smsTemplates = [
    {
      id: 'default',
      name: 'Default SMS Template',
      content: 'Dear {InvestorName}, your interest for the month of {InterestMonth} totaling {Amount} regarding {SeriesName} {Status} been processed from our end to your bank account {BankAccountNumber}.'
    },
    {
      id: 'payment_notification',
      name: 'Payment Notification',
      content: 'Dear {InvestorName}, your interest payment of {Amount} for {SeriesName} has been processed successfully.'
    },
    {
      id: 'general_update',
      name: 'General Update',
      content: 'Dear {InvestorName}, we have an important update regarding your investment in {SeriesName}. Please contact us for more details.'
    }
  ];

  const emailTemplates = [
    {
      id: 'default',
      name: 'Default Email Template',
      content: 'Dear {InvestorName}, your interest for the month of {InterestMonth} totaling {Amount} regarding {SeriesName} {Status} been processed from our end to your bank account {BankAccountNumber}.'
    },
    {
      id: 'payment_notification',
      name: 'Payment Notification',
      content: 'Dear {InvestorName}, your interest payment of {Amount} for {SeriesName} has been processed successfully.'
    },
    {
      id: 'general_update',
      name: 'General Update',
      content: 'Dear {InvestorName}, we have an important update regarding your investment in {SeriesName}. Please contact us for more details.'
    }
  ];

  // Filter series based on search and status
  const filteredSeries = useMemo(() => {
    return series.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [series, searchTerm, statusFilter]);

  // Get investors for selected series
  const getInvestorsForSeries = (seriesName) => {
    return investors.filter(inv => 
      inv.series && 
      Array.isArray(inv.series) && 
      inv.series.includes(seriesName) &&
      inv.status !== 'deleted' // Exclude deleted investors
    );
  };

  // Get all selected investors across all series
  const getAllSelectedInvestors = () => {
    const allSelected = [];
    selectedInvestors.forEach((investorSet, seriesName) => {
      investorSet.forEach(investorId => {
        const investor = investors.find(inv => inv.investorId === investorId);
        if (investor) {
          allSelected.push({
            ...investor,
            selectedSeries: seriesName
          });
        }
      });
    });
    return allSelected;
  };

  // Handle series selection
  const handleSeriesSelect = (seriesName) => {
    if (selectedSeries.includes(seriesName)) {
      // Remove series
      setSelectedSeries(prev => prev.filter(s => s !== seriesName));
      setSelectedInvestors(prev => {
        const newMap = new Map(prev);
        newMap.delete(seriesName);
        return newMap;
      });
      setExpandedSeries(prev => {
        const newSet = new Set(prev);
        newSet.delete(seriesName);
        return newSet;
      });
      setInvestorListHeights(prev => {
        const newMap = new Map(prev);
        newMap.delete(seriesName);
        return newMap;
      });
    } else {
      // Add series and auto-select all investors
      setSelectedSeries(prev => [...prev, seriesName]);
      const seriesInvestors = getInvestorsForSeries(seriesName);
      setSelectedInvestors(prev => {
        const newMap = new Map(prev);
        newMap.set(seriesName, new Set(seriesInvestors.map(inv => inv.investorId)));
        return newMap;
      });
      setExpandedSeries(prev => new Set([...prev, seriesName]));
    }
  };

  // Toggle investor list expansion
  const toggleInvestorListExpansion = (seriesName) => {
    setExpandedSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seriesName)) {
        newSet.delete(seriesName);
        // Reset height when collapsing
        setInvestorListHeights(prevHeights => {
          const newMap = new Map(prevHeights);
          newMap.delete(seriesName);
          return newMap;
        });
      } else {
        newSet.add(seriesName);
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
  const handleInvestorToggle = (seriesName, investorId) => {
    console.log(`=== INVESTOR TOGGLE START ===`);
    console.log(`Series: ${seriesName}, Investor: ${investorId}`);
    
    // Get current state
    const currentSelectedInvestors = selectedInvestors.get(seriesName) || new Set();
    const wasSelected = currentSelectedInvestors.has(investorId);
    
    console.log(`Was selected: ${wasSelected}`);
    console.log(`Current investors in ${seriesName}:`, Array.from(currentSelectedInvestors));
    
    // Create new set for this series
    const newSeriesSet = new Set(currentSelectedInvestors);
    
    if (wasSelected) {
      // Deselect investor
      newSeriesSet.delete(investorId);
      console.log(`DESELECTING investor ${investorId}`);
    } else {
      // Select investor
      newSeriesSet.add(investorId);
      console.log(`SELECTING investor ${investorId}`);
    }
    
    console.log(`New investors in ${seriesName}:`, Array.from(newSeriesSet));
    
    // Update the selected investors map
    setSelectedInvestors(prevMap => {
      const newMap = new Map(prevMap);
      
      if (newSeriesSet.size === 0) {
        // No investors selected for this series, remove it
        newMap.delete(seriesName);
        console.log(`Removed series ${seriesName} from map - no investors`);
      } else {
        // Update the series with new investor set
        newMap.set(seriesName, newSeriesSet);
        console.log(`Updated series ${seriesName} in map`);
      }
      
      return newMap;
    });
    
    // Update selected series list
    if (newSeriesSet.size === 0) {
      // Remove series from selected list
      setSelectedSeries(prev => {
        const filtered = prev.filter(s => s !== seriesName);
        console.log(`Removed ${seriesName} from selected series list`);
        return filtered;
      });
      
      // Also collapse the series
      setExpandedSeries(prev => {
        const newExpanded = new Set(prev);
        newExpanded.delete(seriesName);
        return newExpanded;
      });
    } else {
      // Ensure series is in selected list
      setSelectedSeries(prev => {
        if (!prev.includes(seriesName)) {
          console.log(`Added ${seriesName} to selected series list`);
          return [...prev, seriesName];
        }
        return prev;
      });
    }
    
    console.log(`=== INVESTOR TOGGLE END ===`);
  };

  // Select all investors for a series
  const handleSelectAllInvestors = (seriesName) => {
    const seriesInvestors = getInvestorsForSeries(seriesName);
    setSelectedInvestors(prev => {
      const newMap = new Map(prev);
      newMap.set(seriesName, new Set(seriesInvestors.map(inv => inv.investorId)));
      return newMap;
    });
  };

  // Deselect all investors for a series
  const handleDeselectAllInvestors = (seriesName) => {
    setSelectedInvestors(prev => {
      const newMap = new Map(prev);
      newMap.delete(seriesName);
      return newMap;
    });
    setSelectedSeries(prev => prev.filter(s => s !== seriesName));
    setExpandedSeries(prev => {
      const newSet = new Set(prev);
      newSet.delete(seriesName);
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

  // Send messages to selected investors
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
      const results = [];
      const newHistoryEntries = [];
      const messageType = communicationType === 'sms' ? 'SMS' : 'Email';

      for (const investor of selectedInvestorsList) {
        // Replace template variables
        let personalizedMessage = messageContent;
        personalizedMessage = personalizedMessage.replace(/{InvestorName}/g, investor.name);
        personalizedMessage = personalizedMessage.replace(/{InvestorID}/g, investor.investorId);
        personalizedMessage = personalizedMessage.replace(/{SeriesName}/g, investor.selectedSeries);
        personalizedMessage = personalizedMessage.replace(/{Amount}/g, `₹${investor.investment.toLocaleString('en-IN')}`);
        personalizedMessage = personalizedMessage.replace(/{BankAccountNumber}/g, investor.bankAccountNumber || 'N/A');

        const contactInfo = communicationType === 'sms' ? investor.phone : investor.email;
        
        if (!contactInfo) {
          results.push({
            investor: investor.name,
            status: 'Failed',
            reason: `No ${communicationType === 'sms' ? 'phone number' : 'email address'} available`
          });
          
          newHistoryEntries.push({
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            type: messageType,
            recipient: investor.name,
            contact: contactInfo || 'N/A',
            investorId: investor.investorId,
            message: personalizedMessage,
            status: 'Failed',
            error: `No ${communicationType === 'sms' ? 'phone number' : 'email address'} available`,
            seriesName: investor.selectedSeries
          });
          continue;
        }

        // Send message
        let sendResult;
        if (communicationType === 'sms') {
          sendResult = await sendSMS(contactInfo, personalizedMessage);
        } else {
          const subject = `Important Update - ${investor.selectedSeries}`;
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #2563eb;">Investment Update</h2>
              <p>${personalizedMessage}</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #64748b;">
                This is an automated message from NCD System. Please do not reply to this email.
              </p>
            </div>
          `;
          sendResult = await sendEmail(contactInfo, subject, personalizedMessage, htmlContent);
        }

        if (sendResult.success) {
          results.push({
            investor: investor.name,
            status: 'Success'
          });

          newHistoryEntries.push({
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            type: messageType,
            recipient: investor.name,
            contact: contactInfo,
            investorId: investor.investorId,
            message: personalizedMessage,
            status: 'Success',
            messageId: sendResult.messageId,
            seriesName: investor.selectedSeries
          });
        } else {
          results.push({
            investor: investor.name,
            status: 'Failed',
            reason: sendResult.error || 'Unknown error'
          });

          newHistoryEntries.push({
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            type: messageType,
            recipient: investor.name,
            contact: contactInfo,
            investorId: investor.investorId,
            message: personalizedMessage,
            status: 'Failed',
            error: sendResult.error || 'Failed to send message',
            seriesName: investor.selectedSeries
          });
        }
      }

      // Add to history
      setCommunicationHistory(prev => [...newHistoryEntries.reverse(), ...prev]);
      
      const successCount = results.filter(r => r.status === 'Success').length;
      const failedCount = results.filter(r => r.status === 'Failed').length;
      
      // Add audit log
      addAuditLog({
        action: communicationType === 'sms' ? 'Sent SMS' : 'Sent Email',
        adminName: user ? user.name : 'User',
        adminRole: user ? user.displayRole : 'User',
        details: `Sent ${successCount} ${messageType} message(s) to investors across ${selectedSeries.length} series (${failedCount} failed)`,
        entityType: 'Communication',
        entityId: `Bulk ${messageType}`,
        changes: {
          messageType: messageType,
          totalRecipients: selectedInvestorsList.length,
          successCount: successCount,
          failedCount: failedCount,
          seriesCount: selectedSeries.length,
          selectedSeries: selectedSeries
        }
      });
      
      alert(`Successfully sent ${successCount} ${messageType} message(s)! ${failedCount > 0 ? `${failedCount} failed.` : ''}`);
      
      // Clear selections and message after successful send
      setMessageContent('');
      setSelectedTemplate('');
      handleClearAllSelections();
      
    } catch (error) {
      console.error('Error sending messages:', error);
      alert('Error sending messages. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    const templates = communicationType === 'sms' ? smsTemplates : emailTemplates;
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessageContent(template.content);
    }
  };

  return (
    <Layout>
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
                <div className="series-selection-panel">
                  <div className="panel-header">
                    <h3>Select Series & Investors</h3>
                    <div className="search-filter-controls">
                      <div className="search-container">
                        <FiSearch size={16} />
                        <input
                          type="text"
                          placeholder="Search series..."
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

                  {/* Series List */}
                  <div className="series-list">
                    {filteredSeries.length === 0 ? (
                      <div className="no-series">
                        <p>No series found matching your criteria.</p>
                      </div>
                    ) : (
                      filteredSeries.map(seriesItem => {
                        const seriesInvestors = getInvestorsForSeries(seriesItem.name);
                        const selectedInvestorSet = selectedInvestors.get(seriesItem.name) || new Set();
                        const isSeriesSelected = selectedSeries.includes(seriesItem.name);
                        
                        return (
                          <div key={seriesItem.id} className={`series-card ${isSeriesSelected ? 'selected' : ''}`}>
                            <div className="series-header" onClick={() => handleSeriesSelect(seriesItem.name)}>
                              <div className="series-info">
                                <h4>{seriesItem.name}</h4>
                                <div className="series-meta">
                                  <span className={`status-badge ${seriesItem.status}`}>
                                    {seriesItem.status}
                                  </span>
                                  <span className="investor-count">
                                    <FiUsers size={14} />
                                    {seriesInvestors.length} investors
                                  </span>
                                </div>
                              </div>
                              <div className="selection-controls">
                                {isSeriesSelected && seriesInvestors.length > 0 && (
                                  <button 
                                    className="expand-toggle-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleInvestorListExpansion(seriesItem.name);
                                    }}
                                    title={expandedSeries.has(seriesItem.name) ? "Collapse investor list" : "Expand investor list"}
                                  >
                                    {expandedSeries.has(seriesItem.name) ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
                                  </button>
                                )}
                                <div className="selection-indicator">
                                  {isSeriesSelected ? <MdCheck size={20} /> : <MdAdd size={20} />}
                                </div>
                              </div>
                            </div>

                            {/* Investor List (shown when series is selected and expanded) */}
                            {isSeriesSelected && expandedSeries.has(seriesItem.name) && (
                              <div className="investors-list-container">
                                <div className="investors-list-header">
                                  <div className="drag-handle" title="Drag to resize">
                                    <MdDragIndicator size={16} />
                                  </div>
                                  <span>Select Investors ({selectedInvestorSet.size}/{seriesInvestors.length})</span>
                                  <div className="bulk-actions">
                                    <button 
                                      className="bulk-action-btn select-all"
                                      onClick={() => handleSelectAllInvestors(seriesItem.name)}
                                      disabled={selectedInvestorSet.size === seriesInvestors.length}
                                    >
                                      Select All
                                    </button>
                                    <button 
                                      className="bulk-action-btn deselect-all"
                                      onClick={() => handleDeselectAllInvestors(seriesItem.name)}
                                      disabled={selectedInvestorSet.size === 0}
                                    >
                                      Deselect All
                                    </button>
                                  </div>
                                </div>
                                
                                <div 
                                  className="investors-grid resizable-investors-grid"
                                  style={{
                                    height: investorListHeights.get(seriesItem.name) || '320px',
                                    minHeight: '200px',
                                    maxHeight: '600px',
                                    resize: 'vertical',
                                    overflow: 'auto'
                                  }}
                                  ref={(el) => {
                                    if (el) {
                                      // Add resize event listener
                                      const handleResize = () => {
                                        const newHeight = el.offsetHeight;
                                        if (newHeight !== (investorListHeights.get(seriesItem.name) || 320)) {
                                          handleInvestorListResize(seriesItem.name, newHeight);
                                        }
                                      };
                                      
                                      // Use MutationObserver to detect style changes
                                      const observer = new MutationObserver(handleResize);
                                      observer.observe(el, { 
                                        attributes: true, 
                                        attributeFilter: ['style'] 
                                      });
                                      
                                      // Cleanup function
                                      return () => observer.disconnect();
                                    }
                                  }}
                                >
                                  {seriesInvestors.map(investor => {
                                    const isSelected = selectedInvestorSet.has(investor.investorId);
                                    const contactInfo = communicationType === 'sms' ? investor.phone : investor.email;
                                    
                                    return (
                                      <div 
                                        key={investor.investorId} 
                                        className={`investor-item ${isSelected ? 'selected' : ''} ${!contactInfo ? 'no-contact' : ''}`}
                                        onClick={() => {
                                          console.log(`🔥 CLICKED: ${investor.name} (${investor.investorId}) - Selected: ${isSelected}`);
                                          handleInvestorToggle(seriesItem.name, investor.investorId);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                        title={`Click to ${isSelected ? 'deselect' : 'select'} ${investor.name}`}
                                      >
                                        <div className="investor-info">
                                          <div className="investor-name">{investor.name}</div>
                                          <div className="investor-id">{investor.investorId}</div>
                                          <div className="contact-info">
                                            {communicationType === 'sms' ? (
                                              <span className="contact-item">
                                                <FiPhone size={12} />
                                                {investor.phone || 'No phone'}
                                              </span>
                                            ) : (
                                              <span className="contact-item">
                                                <FiMail size={12} />
                                                {investor.email || 'No email'}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="selection-checkbox">
                                          {isSelected ? (
                                            <div className="selected-indicator" title="Selected - Click to deselect">
                                              <MdCheck size={16} />
                                            </div>
                                          ) : (
                                            <div className="empty-checkbox" title="Not selected - Click to select"></div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                <div className="resize-hint">
                                  <span>Drag the bottom-right corner or bottom edge to resize this list</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Panel - Message Composition */}
                <div className="message-composition-panel">
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
                          const count = selectedInvestors.get(seriesName)?.size || 0;
                          return (
                            <div key={seriesName} className="series-tag">
                              <span className="series-tag-content">
                                <span className="series-name">{seriesName}</span>
                                <span className="investor-count">({count})</span>
                              </span>
                              <button 
                                className="remove-series-btn"
                                onClick={() => handleSeriesSelect(seriesName)}
                                title={`Remove ${seriesName} from selection`}
                                aria-label={`Remove ${seriesName}`}
                                type="button"
                              >
                                <span className="remove-icon">×</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Template Selection */}
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

                  {/* Variable Helper */}
                  <div className="variable-helper">
                    <h5>Available Variables:</h5>
                    <div className="variable-tags">
                      <span className="variable-tag" onClick={() => setMessageContent(prev => prev + '{InvestorName}')}>
                        {'{InvestorName}'}
                      </span>
                      <span className="variable-tag" onClick={() => setMessageContent(prev => prev + '{InvestorID}')}>
                        {'{InvestorID}'}
                      </span>
                      <span className="variable-tag" onClick={() => setMessageContent(prev => prev + '{SeriesName}')}>
                        {'{SeriesName}'}
                      </span>
                      <span className="variable-tag" onClick={() => setMessageContent(prev => prev + '{Amount}')}>
                        {'{Amount}'}
                      </span>
                      <span className="variable-tag" onClick={() => setMessageContent(prev => prev + '{BankAccountNumber}')}>
                        {'{BankAccountNumber}'}
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
                      All ({communicationHistory.length})
                    </button>
                    <button
                      className={`filter-btn ${historyFilter === 'SMS' ? 'active' : ''}`}
                      onClick={() => setHistoryFilter('SMS')}
                    >
                      SMS ({communicationHistory.filter(h => h.type === 'SMS').length})
                    </button>
                    <button
                      className={`filter-btn ${historyFilter === 'Email' ? 'active' : ''}`}
                      onClick={() => setHistoryFilter('Email')}
                    >
                      Email ({communicationHistory.filter(h => h.type === 'Email').length})
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
                          {communicationHistory
                            .filter(entry => historyFilter === 'all' || entry.type === historyFilter)
                            .map((entry) => (
                              <tr key={entry.id}>
                                <td className="timestamp-cell">
                                  {new Date(entry.timestamp).toLocaleString()}
                                </td>
                                <td>
                                  <span className={`type-badge ${entry.type.toLowerCase()}`}>
                                    {entry.type === 'SMS' ? <HiOutlineDeviceMobile size={16} /> : <HiOutlineMail size={16} />}
                                    {entry.type}
                                  </span>
                                </td>
                                <td className="recipient-cell">
                                  <div className="recipient-name">{entry.recipient}</div>
                                  {entry.investorId && (
                                    <div className="recipient-id">ID: {entry.investorId}</div>
                                  )}
                                </td>
                                <td className="contact-cell">{entry.contact}</td>
                                <td>{entry.seriesName || '-'}</td>
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
                                  {entry.error && (
                                    <div className="error-message">{entry.error}</div>
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
