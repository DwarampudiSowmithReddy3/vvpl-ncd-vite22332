import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import apiService from '../services/api';
import auditService from '../services/auditService';
import '../styles/loading.css';
import { 
  MdReportProblem
} from 'react-icons/md';
import { 
  FiSearch, 
  FiFilter
} from 'react-icons/fi';
import { FaUser, FaUserTie } from 'react-icons/fa';
import './GrievanceManagement.css';

const GrievanceManagement = () => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Backend data state
  const [grievances, setGrievances] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);
  const [investors, setInvestors] = useState([]);
  const [availableSeries, setAvailableSeries] = useState([]);
  
  // Investor validation state
  const [investorValidation, setInvestorValidation] = useState({
    isValidating: false,
    isValid: false,
    investorName: '',
    investorSeries: [],
    errorMessage: ''
  });
  
  // Helper function to format dates safely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return dateString;
    }
  };
  
  const [activeTab, setActiveTab] = useState('investor');
  const [resolutionComments, setResolutionComments] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    investorId: '',
    issue: '',
    remarks: '',
    category: 'General',
    priority: 'medium',
    grievanceType: 'investor',
    seriesId: null
  });

  const complaintCategories = [
    'General', 'Payment Issue', 'Account Access', 'Documentation', 
    'Interest Calculation', 'KYC Related', 'Technical Issue', 'Other'
  ];

  const priorityLevels = ['low', 'medium', 'high', 'critical'];

  // Fetch grievances from backend
  const fetchGrievances = async () => {
    try {
      setLoading(true);
      if (import.meta.env.DEV) { console.log('📊 Fetching grievances from backend...'); }
      
      // Build filter params
      const params = {
        grievance_type: activeTab
      };
      
      if (selectedStatusFilter !== 'all') {
        params.status_filter = selectedStatusFilter;
      }
      
      if (selectedCategoryFilter !== 'all') {
        params.category = selectedCategoryFilter;
      }
      
      if (selectedSeriesFilter !== 'all') {
        // Find series ID from name
        const series = availableSeries.find(s => s.name === selectedSeriesFilter);
        if (series) {
          params.series_id = series.id;
        }
      }
      
      if (dateFrom) {
        params.from_date = dateFrom;
      }
      
      if (dateTo) {
        params.to_date = dateTo;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const data = await apiService.getGrievances(params);
      if (import.meta.env.DEV) { console.log('✅ Grievances fetched:', data); }
      setGrievances(data || []);
      
      // Fetch stats
      const statsData = await apiService.getGrievanceStats(activeTab);
      if (import.meta.env.DEV) { console.log('✅ Stats fetched:', statsData); }
      setStats(statsData);
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error fetching grievances:', error); }
      toast.error(error.message, 'Failed to Load Grievances');
      setGrievances([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch investors for validation
  const fetchInvestors = async () => {
    try {
      if (import.meta.env.DEV) { console.log('📊 Fetching investors from backend...'); }
      const data = await apiService.getInvestors();
      if (import.meta.env.DEV) { console.log('✅ Investors fetched:', data); }
      setInvestors(data || []);
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error fetching investors:', error); }
      setInvestors([]);
    }
  };

  // Fetch series for filters
  const fetchSeries = async () => {
    try {
      if (import.meta.env.DEV) { console.log('📊 Fetching series from backend...'); }
      const data = await apiService.getSeries();
      if (import.meta.env.DEV) { console.log('✅ Series fetched:', data); }
      setAvailableSeries(data || []);
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error fetching series:', error); }
      setAvailableSeries([]);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchInvestors();
    fetchSeries();
  }, []);

  // Fetch grievances when filters change
  useEffect(() => {
    fetchGrievances();
  }, [activeTab, selectedStatusFilter, selectedCategoryFilter, selectedSeriesFilter, dateFrom, dateTo, searchTerm]);

  // Handle investor ID change and validate
  const handleInvestorIdChange = async (value) => {
    setNewComplaint({...newComplaint, investorId: value, seriesId: null});
    
    // Reset validation state
    setInvestorValidation({
      isValidating: false,
      isValid: false,
      investorName: '',
      investorSeries: [],
      errorMessage: ''
    });
    
    // Only validate if value is not empty and we're in investor tab
    if (value.trim() && activeTab === 'investor') {
      setInvestorValidation(prev => ({ ...prev, isValidating: true }));
      
      try {
        if (import.meta.env.DEV) { console.log('🔍 Validating investor ID:', value); }
        
        // Fetch investor details from backend
        const investor = await apiService.getInvestor(value.trim());
        
        if (investor) {
          if (import.meta.env.DEV) { console.log('✅ Investor found:', investor); }
          
          // Check if investor is deleted
          if (investor.status === 'deleted') {
            setInvestorValidation({
              isValidating: false,
              isValid: false,
              investorName: '',
              investorSeries: [],
              errorMessage: `Investor ${investor.full_name} has been deleted and cannot be used.`
            });
            return;
          }
          
          // Extract series from investments, holdings, or transactions
          const investorSeries = [];
          
          // Try to get series from investments first
          if (investor.investments && investor.investments.length > 0) {
            const seriesMap = new Map();
            investor.investments.forEach(inv => {
              if (inv.series_id && inv.series_name) {
                seriesMap.set(inv.series_id, inv.series_name);
              }
            });
            seriesMap.forEach((name, id) => {
              investorSeries.push({ id, name });
            });
          }
          
          // If no investments, try holdings
          if (investorSeries.length === 0 && investor.holdings && investor.holdings.length > 0) {
            const seriesSet = new Set();
            investor.holdings.forEach(holding => {
              if (holding.series) {
                seriesSet.add(holding.series);
              }
            });
            // We don't have series IDs from holdings, so we need to fetch them
            seriesSet.forEach(seriesName => {
              const series = availableSeries.find(s => s.name === seriesName);
              if (series) {
                investorSeries.push({ id: series.id, name: series.name });
              }
            });
          }
          
          // If still no series, try the series array (just names)
          if (investorSeries.length === 0 && investor.series && investor.series.length > 0) {
            investor.series.forEach(seriesName => {
              const series = availableSeries.find(s => s.name === seriesName);
              if (series) {
                investorSeries.push({ id: series.id, name: series.name });
              }
            });
          }
          
          if (import.meta.env.DEV) { console.log('📊 Investor series:', investorSeries); }
          if (import.meta.env.DEV) { console.log('📊 Available series:', availableSeries); }
          if (import.meta.env.DEV) { console.log('📊 Investor data:', investor); }
          
          setInvestorValidation({
            isValidating: false,
            isValid: true,
            investorName: investor.full_name,
            investorSeries: investorSeries,
            errorMessage: ''
          });
        }
      } catch (error) {
        if (import.meta.env.DEV) { console.error('❌ Investor validation failed:', error); }
        setInvestorValidation({
          isValidating: false,
          isValid: false,
          investorName: '',
          investorSeries: [],
          errorMessage: error.message.includes('404') || error.message.includes('not found') 
            ? 'Investor not found. Please check the ID.' 
            : 'Error validating investor. Please try again.'
        });
      }
    }
  };

  // Filter change handler
  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'status':
        setSelectedStatusFilter(value);
        break;
      case 'category':
        setSelectedCategoryFilter(value);
        break;
      case 'series':
        setSelectedSeriesFilter(value);
        break;
      case 'dateFrom':
        setDateFrom(value);
        break;
      case 'dateTo':
        setDateTo(value);
        break;
      default:
        break;
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedStatusFilter('all');
    setSelectedCategoryFilter('all');
    setSelectedSeriesFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
  };
  
  // Close modal and reset validation
  const closeAddModal = () => {
    setShowAddModal(false);
    setInvestorValidation({
      isValidating: false,
      isValid: false,
      investorName: '',
      investorSeries: [],
      errorMessage: ''
    });
  };

  // Handle add new complaint - BACKEND INTEGRATION
  const handleAddComplaint = async () => {
    if (!newComplaint.investorId || !newComplaint.issue) {
      const fieldName = activeTab === 'investor' ? 'Investor ID' : 'Trustee Name';
      toast.warning(`Please fill in all required fields (${fieldName} and Issue)`, 'Missing Information');
      return;
    }
    
    // Validate investor exists before creating grievance
    if (activeTab === 'investor' && !investorValidation.isValid) {
      toast.error('Please enter a valid Investor ID. The investor must exist in the system.', 'Invalid Investor');
      return;
    }

    try {
      if (import.meta.env.DEV) { console.log('📝 Creating new grievance...'); }
      
      // Prepare data for backend
      const grievanceData = {
        grievance_type: activeTab,
        subject: newComplaint.issue,
        description: newComplaint.remarks,
        category: newComplaint.category,
        priority: newComplaint.priority
      };
      
      if (activeTab === 'investor') {
        grievanceData.investor_id = newComplaint.investorId;
        if (newComplaint.seriesId) {
          grievanceData.series_id = newComplaint.seriesId;
        }
      } else {
        grievanceData.trustee_name = newComplaint.investorId;
      }
      
      if (import.meta.env.DEV) { console.log('📦 Grievance data:', grievanceData); }
      
      // Call backend API
      const response = await apiService.createGrievance(grievanceData);
      if (import.meta.env.DEV) { console.log('✅ Grievance created:', response); }
      
      // Add audit log for grievance creation
      await auditService.logDataOperation(
        user,
        'Grievance Created',
        'Grievance',
        response.grievance_id || 'New Grievance',
        `Created new ${activeTab} grievance "${newComplaint.issue}" ${activeTab === 'investor' ? `for investor ${newComplaint.investorId}` : `for trustee ${newComplaint.investorId}`}`,
        {
          grievanceType: activeTab,
          investorId: activeTab === 'investor' ? newComplaint.investorId : null,
          trusteeName: activeTab === 'trustee' ? newComplaint.investorId : null,
          subject: newComplaint.issue,
          category: newComplaint.category,
          priority: newComplaint.priority,
          seriesId: newComplaint.seriesId,
          action: 'grievance_create'
        }
      ).catch(error => {
        if (import.meta.env.DEV) { console.error('Failed to log grievance creation:', error); }
      });
      
      toast.success('Grievance has been created successfully!', 'Success');
      
      // Reset form and close modal
      setNewComplaint({
        investorId: '',
        issue: '',
        remarks: '',
        category: 'General',
        priority: 'medium',
        grievanceType: activeTab,
        seriesId: null
      });
      setShowAddModal(false);
      setInvestorValidation({
        isValidating: false,
        isValid: false,
        investorName: '',
        investorSeries: [],
        errorMessage: ''
      });
      
      // Refresh grievances list
      fetchGrievances();
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error creating grievance:', error); }
      toast.error(error.message, 'Failed to Create Grievance');
    }
  };

  // Handle status change - BACKEND INTEGRATION
  const handleStatusChange = async (grievanceId, newStatus) => {
    const resolution = resolutionComments[grievanceId] || '';
    
    if (newStatus === 'resolved' && !resolution.trim()) {
      toast.warning('Please provide a resolution comment before marking as resolved.', 'Resolution Required');
      return;
    }

    try {
      if (import.meta.env.DEV) { console.log(`📝 Updating grievance ${grievanceId} status to ${newStatus}...`); }
      
      // Prepare status update data
      const statusData = {
        status: newStatus,
        resolution_comment: resolution || null
      };
      
      if (import.meta.env.DEV) { console.log('📦 Status data:', statusData); }
      
      // Call backend API
      const response = await apiService.updateGrievanceStatus(grievanceId, statusData);
      if (import.meta.env.DEV) { console.log('✅ Status updated:', response); }
      
      // Find the grievance to get details for audit log
      const grievance = grievances.find(g => g.id === grievanceId);
      
      // Add audit log for status change
      await auditService.logDataOperation(
        user,
        'Grievance Status Updated',
        'Grievance',
        grievance?.grievance_id || grievanceId,
        `Updated grievance status to "${newStatus}" for "${grievance?.subject || 'Unknown'}"${resolution ? ` with resolution: ${resolution.substring(0, 50)}...` : ''}`,
        {
          grievanceId: grievanceId,
          grievanceCode: grievance?.grievance_id,
          subject: grievance?.subject,
          newStatus: newStatus,
          resolutionComment: resolution || null,
          investorId: grievance?.investor_id,
          trusteeName: grievance?.trustee_name,
          action: 'grievance_status_update'
        }
      ).catch(error => {
        if (import.meta.env.DEV) { console.error('Failed to log grievance status update:', error); }
      });
      
      toast.success(`Grievance status has been updated to ${newStatus}!`, 'Status Updated');
      
      // Clear the resolution comment after resolving
      if (newStatus === 'resolved') {
        setResolutionComments(prev => ({ ...prev, [grievanceId]: '' }));
      }
      
      // Refresh grievances list
      fetchGrievances();
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error updating status:', error); }
      toast.error(error.message, 'Failed to Update Status');
    }
  };

  const handleResolutionChange = (id, value) => {
    setResolutionComments(prev => ({ ...prev, [id]: value }));
  };

  // Calculate stats from current grievances
  const pendingComplaints = grievances.filter(c => c.status === 'pending');
  const resolvedComplaints = grievances.filter(c => c.status === 'resolved');
  const inProgressComplaints = grievances.filter(c => c.status === 'in-progress');

  // Function to render complaint table
  const renderComplaintTable = (complaints, title) => (
    <div className="grievance-table-section">
      <div className="table-header">
        <h3 className="section-title">{title}</h3>
        <div className="section-stats">
          <span className="stat-item pending">
            Pending: {complaints.filter(c => c.status === 'pending').length}
          </span>
          <span className="stat-item in-progress">
            In Progress: {complaints.filter(c => c.status === 'in-progress').length}
          </span>
          <span className="stat-item resolved">
            Resolved: {complaints.filter(c => c.status === 'resolved').length}
          </span>
        </div>
      </div>

      <div className="table-container">
        <table className="complaints-table">
          <thead>
            <tr>
              <th>Grievance ID</th>
              <th>{activeTab === 'investor' ? 'Investor ID' : 'Trustee Name'}</th>
              <th>Issue</th>
              <th>Category</th>
              <th>Series</th>
              <th>Date</th>
              <th>Status</th>
              <th>Resolution</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => (
              <tr key={complaint.id}>
                <td>{complaint.grievance_id}</td>
                <td>
                  {activeTab === 'investor' 
                    ? complaint.investor_id 
                    : complaint.trustee_name}
                </td>
                <td>
                  <div className="issue-cell">
                    <div className="issue-title">{complaint.subject}</div>
                    <div className="issue-remarks">{complaint.description}</div>
                  </div>
                </td>
                <td>
                  <span className={`category-badge ${complaint.category?.toLowerCase().replace(/\s+/g, '-')}`}>
                    {complaint.category || 'General'}
                  </span>
                </td>
                <td>
                  <div className="series-list">
                    {complaint.grievance_type === 'trustee' ? (
                      <span className="series-badge na">N/A</span>
                    ) : complaint.series_name ? (
                      <span className="series-badge">{complaint.series_name}</span>
                    ) : (
                      <span className="series-badge na">N/A</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="date-cell">
                    {formatDate(complaint.created_at)}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${complaint.status}`}>
                    {complaint.status === 'in-progress' ? 'In Progress' : 
                     complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="resolution-container">
                    {complaint.status === 'resolved' && complaint.resolution_comment ? (
                      <div className="resolution-display">
                        <div className="resolution-text">{complaint.resolution_comment}</div>
                        {complaint.resolved_at && (
                          <div className="resolved-date">
                            {formatDate(complaint.resolved_at)}
                          </div>
                        )}
                      </div>
                    ) : complaint.status === 'pending' || complaint.status === 'in-progress' ? (
                      <div className="resolution-input-container">
                        <textarea
                          placeholder="Enter resolution..."
                          value={resolutionComments[complaint.id] || ''}
                          onChange={(e) => handleResolutionChange(complaint.id, e.target.value)}
                          className="resolution-input"
                          rows="2"
                        />
                        <div className="resolution-buttons">
                          {complaint.status === 'pending' && resolutionComments[complaint.id]?.trim() && (
                            <button
                              className="in-progress-btn"
                              onClick={() => handleStatusChange(complaint.id, 'in-progress')}
                            >
                              In Progress
                            </button>
                          )}
                          {resolutionComments[complaint.id]?.trim() && (
                            <button
                              className="submit-resolution-btn"
                              onClick={() => handleStatusChange(complaint.id, 'resolved')}
                            >
                              Submit
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="no-resolution">No resolution</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {complaints.length === 0 && (
          <div className="no-data">
            <MdReportProblem size={48} />
            <h3>No {title} Found</h3>
            <p>No {title.toLowerCase()} match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="loading-overlay">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grievance-page">
        {/* Header Section */}
        <div className="grievance-header">
          <div className="header-left">
            <h1 className="page-title">Grievance Management</h1>
            <p className="page-subtitle">Manage and resolve investor complaints efficiently</p>
          </div>
          <button 
            className="add-button"
            onClick={() => {
              setNewComplaint({
                investorId: '',
                issue: '',
                remarks: '',
                category: 'General',
                priority: 'medium',
                grievanceType: activeTab,
                seriesId: null
              });
              setInvestorValidation({
                isValidating: false,
                isValid: false,
                investorName: '',
                investorSeries: [],
                errorMessage: ''
              });
              setShowAddModal(true);
            }}
          >
            + Add New Issue
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'investor' ? 'active' : ''}`}
            onClick={() => setActiveTab('investor')}
          >
            <FaUser size={18} />
            Investor Grievances
          </button>
          <button 
            className={`tab-button ${activeTab === 'trustee' ? 'active' : ''}`}
            onClick={() => setActiveTab('trustee')}
          >
            <FaUserTie size={18} />
            Trustee / Regulator Grievances
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Summary Cards */}
          <div className="grievance-summary-cards">
            <div className="summary-card red">
              <div className="card-label">Pending Complaints</div>
              <div className="card-value">{stats.pending || 0}</div>
            </div>
            <div className="summary-card orange">
              <div className="card-label">In Progress</div>
              <div className="card-value">{stats.in_progress || 0}</div>
            </div>
            <div className="summary-card green">
              <div className="card-label">Resolved Complaints</div>
              <div className="card-value">{stats.resolved || 0}</div>
            </div>
            <div className="summary-card blue">
              <div className="card-label">Total Complaints</div>
              <div className="card-value">{stats.total || 0}</div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="filters-section">
            <div className="search-filter-row">
              <div className="search-container">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-dropdown-container">
                <button 
                  className="filter-button"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  <FiFilter />
                  Filters
                </button>
                
                {showFilterDropdown && (
                  <div className="filter-dropdown">
                    <div className="filter-section">
                      <label>Status</label>
                      <select 
                        value={selectedStatusFilter} 
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                    
                    <div className="filter-section">
                      <label>Category</label>
                      <select 
                        value={selectedCategoryFilter} 
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                      >
                        <option value="all">All Categories</option>
                        {complaintCategories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="filter-section">
                      <label>Series</label>
                      <select 
                        value={selectedSeriesFilter} 
                        onChange={(e) => handleFilterChange('series', e.target.value)}
                      >
                        <option value="all">All Series</option>
                        {availableSeries.map(series => (
                          <option key={series.id} value={series.name}>{series.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="filter-section">
                      <label>From Date</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      />
                    </div>
                    
                    <div className="filter-section">
                      <label>To Date</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      />
                    </div>
                    
                    <button className="clear-filters-btn" onClick={clearFilters}>
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Complaints Table */}
          {renderComplaintTable(
            grievances, 
            activeTab === 'investor' ? 'Investor Grievances' : 'Trustee / Regulator Grievances'
          )}
        </div>

        {/* Add New Issue Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={closeAddModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Issue</h3>
                <button 
                  className="modal-close"
                  onClick={closeAddModal}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>{activeTab === 'investor' ? 'Investor ID *' : 'Trustee Name *'}</label>
                    <input
                      type="text"
                      value={newComplaint.investorId}
                      onChange={(e) => handleInvestorIdChange(e.target.value)}
                      placeholder={activeTab === 'investor' ? 'Enter investor ID' : 'Enter trustee name'}
                      required
                      style={{
                        borderColor: activeTab === 'investor' && newComplaint.investorId 
                          ? (investorValidation.isValidating ? '#ffa500' : investorValidation.isValid ? '#4caf50' : investorValidation.errorMessage ? '#f44336' : '')
                          : ''
                      }}
                    />
                    {activeTab === 'investor' && newComplaint.investorId && (
                      <div style={{ marginTop: '5px', fontSize: '12px' }}>
                        {investorValidation.isValidating && (
                          <span style={{ color: '#ffa500' }}>🔍 Validating investor...</span>
                        )}
                        {investorValidation.isValid && (
                          <span style={{ color: '#4caf50' }}>✅ Investor found: {investorValidation.investorName}</span>
                        )}
                        {investorValidation.errorMessage && (
                          <span style={{ color: '#f44336' }}>❌ {investorValidation.errorMessage}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newComplaint.category}
                      onChange={(e) => setNewComplaint({...newComplaint, category: e.target.value})}
                    >
                      {complaintCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Grievance Type</label>
                    <input
                      type="text"
                      value={activeTab === 'investor' ? 'Investor Grievance' : 'Trustee / Regulator Grievance'}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                </div>
                
                {/* Series Selection - Show only for investor complaints with validated investor */}
                {activeTab === 'investor' && investorValidation.isValid && investorValidation.investorSeries.length > 0 && (
                  <div className="form-group series-selection">
                    <label>Series (Optional)</label>
                    <select
                      value={newComplaint.seriesId || ''}
                      onChange={(e) => setNewComplaint({...newComplaint, seriesId: e.target.value ? parseInt(e.target.value) : null})}
                    >
                      <option value="">General (Not specific to any series)</option>
                      {investorValidation.investorSeries.map(series => (
                        <option key={series.id} value={series.id}>{series.name}</option>
                      ))}
                    </select>
                    <small className="field-help" style={{ color: '#666', fontSize: '11px' }}>
                      Select a series if this grievance is specific to one of the investor's series. Leave as "General" if it applies to all or is not series-specific.
                    </small>
                  </div>
                )}
                
                {/* Show message if investor has no series */}
                {activeTab === 'investor' && investorValidation.isValid && investorValidation.investorSeries.length === 0 && (
                  <div className="form-group series-selection">
                    <small className="field-help" style={{ color: '#ff9800', fontSize: '11px' }}>
                      ℹ️ This investor has not invested in any series yet. Grievance will be general.
                    </small>
                  </div>
                )}
                
                <div className="form-group">
                  <label>Issue *</label>
                  <textarea
                    value={newComplaint.issue}
                    onChange={(e) => setNewComplaint({...newComplaint, issue: e.target.value})}
                    placeholder="Describe the issue..."
                    required
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label>Remarks</label>
                  <textarea
                    value={newComplaint.remarks}
                    onChange={(e) => setNewComplaint({...newComplaint, remarks: e.target.value})}
                    placeholder="Additional details or remarks..."
                    rows="2"
                  />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newComplaint.priority}
                    onChange={(e) => setNewComplaint({...newComplaint, priority: e.target.value})}
                  >
                    {priorityLevels.map(priority => (
                      <option key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="cancel-button"
                  onClick={closeAddModal}
                >
                  Cancel
                </button>
                <button 
                  className="submit-button"
                  onClick={handleAddComplaint}
                >
                  Add Issue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GrievanceManagement;
