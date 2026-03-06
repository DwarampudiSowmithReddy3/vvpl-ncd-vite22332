/**
 * SIMPLIFIED COMMUNICATION PAGE
 * ALL LOGIC IN BACKEND - Frontend is just UI
 * Simple, secure, attack-proof
 */
import React, { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import auditService from '../services/auditService';
import Layout from '../components/Layout';
import './Communication.css';
import '../styles/loading.css';
import { HiOutlineMail, HiOutlineDeviceMobile } from 'react-icons/hi';
import { MdSend, MdHistory } from 'react-icons/md';

const CommunicationSimple = () => {
  const { user } = useAuth();
  
  // Simple state - no complex logic
  const [activeTab, setActiveTab] = useState('compose');
  const [communicationType, setCommunicationType] = useState('SMS');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Backend data - just display it
  const [templates, setTemplates] = useState([]);
  const [variables, setVariables] = useState([]);
  const [series, setSeries] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total_count: 0, sms_count: 0, email_count: 0 });
  
  // User selections - simple
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch templates from backend
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await apiService.getCommunicationTemplates(communicationType);
        setTemplates(data || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setTemplates([]);
      }
    };
    fetchTemplates();
  }, [communicationType]);

  // Fetch variables from backend
  useEffect(() => {
    const fetchVariables = async () => {
      try {
        const data = await apiService.getCommunicationVariables();
        setVariables(data || []);
      } catch (error) {
        console.error('Error fetching variables:', error);
        setVariables([]);
      }
    };
    fetchVariables();
  }, []);

  // Fetch series from backend
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true);
        const data = await apiService.getSeriesForCommunication(searchTerm, statusFilter);
        setSeries(data || []);
      } catch (error) {
        console.error('Error fetching series:', error);
        setSeries([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchSeries();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  // Fetch history from backend
  useEffect(() => {
    const fetchHistory = async () => {
      if (activeTab !== 'history') return;
      
      try {
        const data = await apiService.getCommunicationHistory({
          type: historyFilter === 'all' ? null : historyFilter,
          limit: 100
        });
        setHistory(data || []);
        
        const statsData = await apiService.getCommunicationHistoryStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching history:', error);
        setHistory([]);
      }
    };
    fetchHistory();
  }, [activeTab, historyFilter]);

  // Handle template selection
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      setCustomMessage(template.content);
    }
  };

  // Handle series selection
  const handleSeriesToggle = (seriesId) => {
    setSelectedSeries(prev => {
      if (prev.includes(seriesId)) {
        return prev.filter(id => id !== seriesId);
      } else {
        return [...prev, seriesId];
      }
    });
  };

  // Handle send messages - ALL LOGIC IN BACKEND
  const handleSendMessages = async () => {
    if (!customMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    if (selectedSeries.length === 0) {
      alert('Please select at least one series');
      return;
    }

    setSending(true);

    try {
      // Simple request - backend does everything
      const response = await apiService.sendCommunicationMessages({
        type: communicationType,
        template_id: selectedTemplate ? parseInt(selectedTemplate) : null,
        custom_message: customMessage,
        series_ids: selectedSeries
      });

      // Log audit
      await auditService.logDataOperation(
        user,
        'Communication Sent',
        'Communication',
        `${communicationType}-${new Date().toISOString().split('T')[0]}`,
        `Sent ${response.successful} ${communicationType} messages (${response.failed} failed)`,
        {
          communicationType,
          successfulCount: response.successful,
          failedCount: response.failed,
          seriesCount: selectedSeries.length
        }
      ).catch(err => console.error('Audit log failed:', err));

      alert(`Successfully sent ${response.successful} messages! ${response.failed > 0 ? `${response.failed} failed.` : ''}`);

      // Clear form
      setCustomMessage('');
      setSelectedTemplate('');
      setSelectedSeries([]);

    } catch (error) {
      console.error('Error sending messages:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  // Insert variable into message
  const insertVariable = (variable) => {
    setCustomMessage(prev => prev + variable);
  };

  return (
    <Layout>
      {loading && (
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
            Send messages to investors - Simple and secure
          </p>
        </div>

        {/* Tabs */}
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
            History
          </button>
        </div>

        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <div className="compose-section">
            {/* Communication Type */}
            <div className="communication-type-selector">
              <div className="type-buttons">
                <button 
                  className={`type-button ${communicationType === 'SMS' ? 'active' : ''}`}
                  onClick={() => setCommunicationType('SMS')}
                >
                  <HiOutlineDeviceMobile size={20} />
                  SMS
                </button>
                <button 
                  className={`type-button ${communicationType === 'Email' ? 'active' : ''}`}
                  onClick={() => setCommunicationType('Email')}
                >
                  <HiOutlineMail size={20} />
                  Email
                </button>
              </div>
            </div>

            <div className="compose-layout">
              {/* Left: Series Selection */}
              <div className="series-selection-panel">
                <div className="panel-header">
                  <h3>Select Series</h3>
                </div>

                {/* Search and Filter */}
                <div className="search-filter-controls">
                  <input
                    type="text"
                    placeholder="Search series..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="accepting">Accepting</option>
                  </select>
                </div>

                {/* Series List */}
                <div className="series-list">
                  {series.map(s => (
                    <div 
                      key={s.id} 
                      className={`series-card ${selectedSeries.includes(s.id) ? 'selected' : ''}`}
                      onClick={() => handleSeriesToggle(s.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="series-header">
                        <div className="series-info">
                          <h4>{s.name}</h4>
                          <div className="series-meta">
                            <span className="status-badge">{s.status}</span>
                            <span className="investor-count">{s.investor_count} investors</span>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={selectedSeries.includes(s.id)}
                          onChange={() => {}}
                          style={{ width: '20px', height: '20px' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {selectedSeries.length > 0 && (
                  <div className="selection-summary">
                    <p><strong>{selectedSeries.length}</strong> series selected</p>
                  </div>
                )}
              </div>

              {/* Right: Message Composition */}
              <div className="message-composition-panel">
                <div className="panel-header">
                  <h3>Compose {communicationType}</h3>
                </div>

                {/* Template Selection */}
                <div className="template-section">
                  <label>Template:</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="template-select"
                  >
                    <option value="">-- Select Template --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Message Input */}
                <div className="message-input-section">
                  <label>Message:</label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={`Enter your ${communicationType} message...`}
                    className="message-textarea"
                    rows={8}
                  />
                  <div className="char-count">
                    {customMessage.length} characters
                  </div>
                </div>

                {/* Variables */}
                <div className="variable-helper">
                  <h5>Variables:</h5>
                  <div className="variable-tags">
                    {variables.map(v => (
                      <span 
                        key={v.variable_name}
                        className="variable-tag"
                        onClick={() => insertVariable(v.variable_name)}
                        title={v.description}
                      >
                        {v.variable_name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Send Button */}
                <button
                  className="send-button"
                  onClick={handleSendMessages}
                  disabled={!customMessage.trim() || selectedSeries.length === 0 || sending}
                  style={{
                    background: sending ? '#9ca3af' : '#f59e0b',
                    cursor: sending ? 'not-allowed' : 'pointer'
                  }}
                >
                  <MdSend size={20} />
                  {sending ? 'Sending...' : `Send ${communicationType}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="communication-section">
            <div className="section-card">
              <div className="card-header">
                <MdHistory size={24} />
                <h3>Communication History</h3>
              </div>
              <div className="card-content">
                {/* Filters */}
                <div className="history-filters">
                  <button
                    className={`filter-btn ${historyFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setHistoryFilter('all')}
                  >
                    All ({stats.total_count})
                  </button>
                  <button
                    className={`filter-btn ${historyFilter === 'SMS' ? 'active' : ''}`}
                    onClick={() => setHistoryFilter('SMS')}
                  >
                    SMS ({stats.sms_count})
                  </button>
                  <button
                    className={`filter-btn ${historyFilter === 'Email' ? 'active' : ''}`}
                    onClick={() => setHistoryFilter('Email')}
                  >
                    Email ({stats.email_count})
                  </button>
                </div>

                {/* History Table */}
                {history.length === 0 ? (
                  <div className="empty-history">
                    <p>No communication history yet</p>
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
                        {history.map(entry => (
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
    </Layout>
  );
};

export default CommunicationSimple;
