import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  MdReportProblem, 
  MdCheckCircle, 
  MdOutlineFileDownload,
  MdTrendingUp
} from 'react-icons/md';
import { 
  FiSearch, 
  FiFilter
} from 'react-icons/fi';
import { 
  HiOutlineDocumentText, 
  HiOutlineCalendar 
} from 'react-icons/hi';
import { FaUser, FaUserTie } from 'react-icons/fa';
import './GrievanceManagement.css';

const GrievanceManagement = () => {
  const { complaints, updateComplaintStatus, editComplaint, addComplaint, addAuditLog, investors } = useData();
  const { user } = useAuth();
  
  // Helper function to format dates safely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If date is invalid, return the original string
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
  
  const [activeTab, setActiveTab] = useState('investor'); // New tab state
  const [editingComplaint, setEditingComplaint] = useState(null);
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
    grievanceType: 'investor', // Default to investor
    seriesName: '' // Add series field
  });

  // Handle investor ID change and reset series selection
  const handleInvestorIdChange = (value) => {
    setNewComplaint({...newComplaint, investorId: value, seriesName: ''});
  };

  const complaintCategories = [
    'General', 'Payment Issue', 'Account Access', 'Documentation', 
    'Interest Calculation', 'KYC Related', 'Technical Issue', 'Other'
  ];

  const priorityLevels = ['low', 'medium', 'high', 'critical'];

  // Get unique series from investors
  const availableSeries = [...new Set(investors.flatMap(inv => inv.series || []))].sort();

  // Helper function to get investor's series
  const getInvestorSeries = (investorId) => {
    const investor = investors.find(inv => inv.investorId === investorId);
    return investor ? investor.series || [] : [];
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

  // Handle add new complaint
  const handleAddComplaint = () => {
    if (!newComplaint.investorId || !newComplaint.issue) {
      const fieldName = activeTab === 'investor' ? 'Investor ID' : 'Trustee Name';
      alert(`Please fill in all required fields (${fieldName} and Issue)`);
      return;
    }

    let investor = null;
    let selectedSeries = '';
    let investorName = newComplaint.investorId; // Default to the entered value

    if (activeTab === 'investor') {
      // Check if investor exists (only for investor complaints)
      investor = investors.find(inv => inv.investorId === newComplaint.investorId);
      if (!investor) {
        alert('Investor ID not found. Please enter a valid Investor ID.');
        return;
      }

      // If investor has multiple series, require series selection
      if (investor.series && investor.series.length > 1 && !newComplaint.seriesName) {
        alert('This investor has multiple series. Please select a specific series for this complaint.');
        return;
      }

      // If investor has only one series, auto-select it
      selectedSeries = newComplaint.seriesName || (investor.series && investor.series.length === 1 ? investor.series[0] : '');
      investorName = investor.name;
    } else {
      // For trustee complaints, use the entered name directly
      investorName = newComplaint.investorId; // This will be the trustee name
      selectedSeries = ''; // Trustees don't have series
    }

    const complaint = {
      id: Math.max(...complaints.map(c => c.id), 0) + 1,
      investorId: newComplaint.investorId, // For trustee, this will be the trustee name
      investorName: investorName,
      issue: newComplaint.issue,
      subject: newComplaint.issue, // Add subject field for consistency
      remarks: newComplaint.remarks,
      description: newComplaint.remarks, // Add description field for consistency
      category: newComplaint.category,
      priority: newComplaint.priority,
      seriesName: selectedSeries, // Store the specific series (empty for trustee)
      timestamp: new Date().toLocaleString(),
      date: new Date().toLocaleDateString(),
      status: 'pending',
      isCompleted: false,
      createdBy: user ? user.name : 'Admin',
      grievanceType: newComplaint.grievanceType
    };

    addComplaint(complaint);

    // Add audit log
    const entityType = activeTab === 'investor' ? 'investor' : 'trustee';
    const entityDescription = activeTab === 'investor' ? 
      `investor "${newComplaint.investorId}" (${investorName}) for series "${selectedSeries}"` :
      `trustee "${newComplaint.investorId}"`;

    addAuditLog({
      action: 'Created Grievance',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `Created new grievance for ${entityDescription}: ${newComplaint.issue}`,
      entityType: 'Grievance',
      entityId: newComplaint.investorId,
      changes: {
        grievanceId: complaint.id,
        issue: newComplaint.issue,
        category: newComplaint.category,
        priority: newComplaint.priority,
        seriesName: selectedSeries,
        grievanceType: newComplaint.grievanceType
      }
    });

    // Reset form and close modal
    setNewComplaint({
      investorId: '',
      issue: '',
      remarks: '',
      category: 'General',
      priority: 'medium',
      grievanceType: activeTab === 'investor' ? 'investor' : 'trustee',
      seriesName: ''
    });
    setShowAddModal(false);
  };

  const handleEditComplaint = (complaint) => {
    setEditingComplaint({ ...complaint });
  };

  const handleSaveComplaint = () => {
    if (!editingComplaint) return;

    const oldComplaint = complaints.find(c => c.id === editingComplaint.id);
    editComplaint(editingComplaint);

    // Add audit log for complaint edit
    addAuditLog({
      action: 'Edited Grievance',
      adminName: user ? user.name : 'User',
      adminRole: user ? user.displayRole : 'User',
      details: `Updated grievance for investor "${editingComplaint.investorId}"`,
      entityType: 'Grievance',
      entityId: editingComplaint.investorId,
      changes: {
        grievanceId: editingComplaint.id,
        oldIssue: oldComplaint?.issue,
        newIssue: editingComplaint.issue,
        oldRemarks: oldComplaint?.remarks,
        newRemarks: editingComplaint.remarks
      }
    });

    setEditingComplaint(null);
  };

  const handleCancelEdit = () => {
    setEditingComplaint(null);
  };

  const handleStatusChange = (id, newStatus) => {
    const complaint = complaints.find(c => c.id === id);
    const resolution = resolutionComments[id] || '';
    
    if (newStatus === 'resolved' && !resolution.trim()) {
      alert('Please provide a resolution comment before marking as resolved.');
      return;
    }

    updateComplaintStatus(id, newStatus, resolution);

    // Add audit log for complaint status change
    addAuditLog({
      action: `${newStatus === 'resolved' ? 'Resolved' : newStatus === 'in-progress' ? 'Started Progress on' : 'Reopened'} Grievance`,
      adminName: user ? user.name : 'User',
      adminRole: user ? user.displayRole : 'User',
      details: `${newStatus === 'resolved' ? 'Resolved' : newStatus === 'in-progress' ? 'Started working on' : 'Reopened'} grievance for investor "${complaint?.investorId}": ${complaint?.issue}${newStatus === 'resolved' && resolution ? `. Resolution: ${resolution}` : ''}`,
      entityType: 'Grievance',
      entityId: complaint?.investorId || 'Unknown',
      changes: {
        grievanceId: id,
        oldStatus: complaint?.status,
        newStatus: newStatus,
        resolution: newStatus === 'resolved' ? resolution : null
      }
    });

    // Clear the resolution comment after resolving
    if (newStatus === 'resolved') {
      setResolutionComments(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleResolutionChange = (id, value) => {
    setResolutionComments(prev => ({ ...prev, [id]: value }));
  };

  // Filter complaints based on current filters
  const filteredComplaints = useMemo(() => {
    return complaints.filter(complaint => {
      // Search filter
      if (searchTerm && !complaint.investorId.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !complaint.issue.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !complaint.remarks.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all' && complaint.status !== selectedStatusFilter) {
        return false;
      }

      // Category filter
      if (selectedCategoryFilter !== 'all' && complaint.category !== selectedCategoryFilter) {
        return false;
      }

      // Series filter - check if investor belongs to selected series
      if (selectedSeriesFilter !== 'all') {
        const investorSeries = getInvestorSeries(complaint.investorId);
        if (!investorSeries.includes(selectedSeriesFilter)) {
          return false;
        }
      }

      // Date filters
      if (dateFrom) {
        const complaintDate = new Date(complaint.date || complaint.timestamp);
        const fromDate = new Date(dateFrom);
        if (complaintDate < fromDate) return false;
      }

      if (dateTo) {
        const complaintDate = new Date(complaint.date || complaint.timestamp);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (complaintDate > toDate) return false;
      }

      return true;
    });
  }, [complaints, searchTerm, selectedStatusFilter, selectedCategoryFilter, selectedSeriesFilter, dateFrom, dateTo]);

  // Separate by grievance type based on active tab
  const currentTabComplaints = filteredComplaints.filter(c => 
    activeTab === 'investor' ? c.grievanceType === 'investor' : c.grievanceType === 'trustee'
  );

  const pendingComplaints = currentTabComplaints.filter(c => c.status === 'pending');
  const resolvedComplaints = currentTabComplaints.filter(c => c.status === 'resolved');
  const inProgressComplaints = currentTabComplaints.filter(c => c.status === 'in-progress');

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
              <th>ID</th>
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
                <td>{complaint.id}</td>
                <td>{complaint.investorId}</td>
                <td>
                  <div className="issue-cell">
                    <div className="issue-title">{complaint.issue}</div>
                    <div className="issue-remarks">{complaint.remarks}</div>
                  </div>
                </td>
                <td>
                  <span className={`category-badge ${complaint.category?.toLowerCase().replace(/\s+/g, '-')}`}>
                    {complaint.category || 'General'}
                  </span>
                </td>
                <td>
                  <div className="series-list">
                    {complaint.grievanceType === 'trustee' ? (
                      <span className="series-badge na">N/A</span>
                    ) : complaint.seriesName ? (
                      <span className="series-badge">{complaint.seriesName}</span>
                    ) : (
                      <div className="all-series">
                        {getInvestorSeries(complaint.investorId).map(series => (
                          <span key={series} className="series-badge secondary">{series}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="date-cell">
                    <div className="date-main">{complaint.timestamp.split(' ')[0]}</div>
                    <div className="date-time">{complaint.timestamp.split(' ')[1]} {complaint.timestamp.split(' ')[2]}</div>
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
                    {complaint.status === 'resolved' && complaint.resolutionComment ? (
                      <div className="resolution-display">
                        <div className="resolution-text">{complaint.resolutionComment}</div>
                        {complaint.resolvedAt && (
                          <div className="resolved-date">
                            {formatDate(complaint.resolvedAt)}
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

  return (
    <Layout>
      <div className="grievance-page">
        {/* Header Section - matching Dashboard pattern */}
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
                grievanceType: activeTab === 'investor' ? 'investor' : 'trustee',
                seriesName: ''
              });
              setShowAddModal(true);
            }}
          >
            + Add New Issue
          </button>
        </div>

        {/* Tab Navigation - Following Administrator pattern */}
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
          {/* Summary Cards - Updated for current tab */}
          <div className="grievance-summary-cards">
            <div className="summary-card red">
              <div className="card-label">Pending Complaints</div>
              <div className="card-value">{pendingComplaints.length}</div>
            </div>
            <div className="summary-card orange">
              <div className="card-label">In Progress</div>
              <div className="card-value">{inProgressComplaints.length}</div>
            </div>
            <div className="summary-card green">
              <div className="card-label">Resolved Complaints</div>
              <div className="card-value">{resolvedComplaints.length}</div>
            </div>
            <div className="summary-card blue">
              <div className="card-label">Total Complaints</div>
              <div className="card-value">{currentTabComplaints.length}</div>
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
                          <option key={series} value={series}>{series}</option>
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

          {/* Complaints Table for Current Tab */}
          {renderComplaintTable(
            currentTabComplaints, 
            activeTab === 'investor' ? 'Investor Grievances' : 'Trustee / Regulator Grievances'
          )}
        </div>

        {/* Add New Issue Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Issue</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowAddModal(false)}
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
                    />
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
                
                {/* Series Selection - Show only for investor complaints and if investor has multiple series */}
                {activeTab === 'investor' && newComplaint.investorId && (() => {
                  const investor = investors.find(inv => inv.investorId === newComplaint.investorId);
                  const investorSeries = investor ? investor.series || [] : [];
                  
                  if (investorSeries.length > 1) {
                    return (
                      <div className="form-group series-selection">
                        <label>Series *</label>
                        <select
                          value={newComplaint.seriesName}
                          onChange={(e) => setNewComplaint({...newComplaint, seriesName: e.target.value})}
                          required
                        >
                          <option value="">Select series for this complaint</option>
                          {investorSeries.map(series => (
                            <option key={series} value={series}>{series}</option>
                          ))}
                        </select>
                        <small className="field-help">This investor has multiple series. Please select which series this complaint is about.</small>
                      </div>
                    );
                  } else if (investorSeries.length === 1) {
                    return (
                      <div className="form-group series-selection">
                        <label>Series</label>
                        <input
                          type="text"
                          value={investorSeries[0]}
                          disabled
                          className="disabled-input"
                        />
                        <small className="field-help">Auto-selected (investor has only one series)</small>
                      </div>
                    );
                  }
                  return null;
                })()}
                
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
                  onClick={() => setShowAddModal(false)}
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