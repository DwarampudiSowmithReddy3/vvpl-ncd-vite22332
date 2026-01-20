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
import './GrievanceManagement.css';

const GrievanceManagement = () => {
  const { complaints, updateComplaintStatus, editComplaint, addComplaint, addAuditLog, investors } = useData();
  const { user } = useAuth();
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
    priority: 'medium'
  });
  const [investorIdError, setInvestorIdError] = useState('');
  const [showInvestorSuggestions, setShowInvestorSuggestions] = useState(false);

  // Get investor suggestions based on input
  const getInvestorSuggestions = (input) => {
    if (!input || input.length < 2) return [];
    return investors.filter(inv => 
      inv.investorId.toLowerCase().includes(input.toLowerCase()) ||
      inv.name.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5); // Show max 5 suggestions
  };

  // Handle investor ID change with validation
  const handleInvestorIdChange = (value) => {
    setNewComplaint({...newComplaint, investorId: value});
    
    if (value.length === 0) {
      setInvestorIdError('');
      setShowInvestorSuggestions(false);
      return;
    }

    // Real-time validation
    const investor = investors.find(inv => inv.investorId === value);
    if (value.length > 0 && !investor) {
      setInvestorIdError('Investor ID not found');
      setShowInvestorSuggestions(value.length >= 2);
    } else if (investor) {
      setInvestorIdError('');
      setShowInvestorSuggestions(false);
    }
  };

  // Select investor from suggestions
  const selectInvestor = (investor) => {
    setNewComplaint({...newComplaint, investorId: investor.investorId});
    setInvestorIdError('');
    setShowInvestorSuggestions(false);
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
      alert('Please fill in all required fields (Investor ID and Issue)');
      return;
    }

    // Check if investor exists
    const investor = investors.find(inv => inv.investorId === newComplaint.investorId);
    if (!investor) {
      setInvestorIdError('Investor ID not found. Please enter a valid Investor ID.');
      return;
    }

    const complaint = {
      id: Math.max(...complaints.map(c => c.id), 0) + 1,
      investorId: newComplaint.investorId,
      issue: newComplaint.issue,
      remarks: newComplaint.remarks,
      category: newComplaint.category,
      priority: newComplaint.priority,
      timestamp: new Date().toLocaleString(),
      date: new Date().toLocaleDateString(),
      status: 'pending',
      isCompleted: false,
      createdBy: user ? user.name : 'Admin'
    };

    addComplaint(complaint);

    // Add audit log
    addAuditLog({
      action: 'Created Grievance',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `Created new grievance for investor "${newComplaint.investorId}" (${investor.name}): ${newComplaint.issue}`,
      entityType: 'Grievance',
      entityId: newComplaint.investorId,
      changes: {
        grievanceId: complaint.id,
        issue: newComplaint.issue,
        category: newComplaint.category,
        priority: newComplaint.priority
      }
    });

    // Reset form and close modal
    setNewComplaint({
      investorId: '',
      issue: '',
      remarks: '',
      category: 'General',
      priority: 'medium'
    });
    setInvestorIdError('');
    setShowInvestorSuggestions(false);
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

  const handleStatusChange = (id, isCompleted) => {
    const complaint = complaints.find(c => c.id === id);
    const resolution = resolutionComments[id] || '';
    
    if (isCompleted && !resolution.trim()) {
      alert('Please provide a resolution comment before marking as resolved.');
      return;
    }

    updateComplaintStatus(id, isCompleted, resolution);

    // Add audit log for complaint status change
    addAuditLog({
      action: isCompleted ? 'Resolved Grievance' : 'Reopened Grievance',
      adminName: user ? user.name : 'User',
      adminRole: user ? user.displayRole : 'User',
      details: `${isCompleted ? 'Resolved' : 'Reopened'} grievance for investor "${complaint?.investorId}": ${complaint?.issue}${isCompleted && resolution ? `. Resolution: ${resolution}` : ''}`,
      entityType: 'Grievance',
      entityId: complaint?.investorId || 'Unknown',
      changes: {
        grievanceId: id,
        oldStatus: isCompleted ? 'pending' : 'resolved',
        newStatus: isCompleted ? 'resolved' : 'pending',
        resolution: isCompleted ? resolution : null
      }
    });

    // Clear the resolution comment after saving
    if (isCompleted) {
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

  const pendingComplaints = filteredComplaints.filter(c => c.status === 'pending');
  const resolvedComplaints = filteredComplaints.filter(c => c.status === 'resolved');

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
            onClick={() => setShowAddModal(true)}
          >
            + Add New Issue
          </button>
        </div>

        {/* Summary Cards - matching Investors pattern */}
        <div className="grievance-summary-cards">
          <div className="summary-card red">
            <div className="card-label">Pending Complaints</div>
            <div className="card-value">{pendingComplaints.length}</div>
          </div>
          <div className="summary-card green">
            <div className="card-label">Resolved Complaints</div>
            <div className="card-value">{resolvedComplaints.length}</div>
          </div>
          <div className="summary-card">
            <div className="card-label">Total Complaints</div>
            <div className="card-value">{filteredComplaints.length}</div>
          </div>
        </div>

        {/* Table Section - matching Investors pattern */}
        <div className="grievance-table-section">
          <div className="table-header">
            <h2 className="section-title">All Complaints ({filteredComplaints.length})</h2>
            <div className="table-actions">
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
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Investor ID</th>
                  <th>Issue</th>
                  <th>Category</th>
                  <th>Series</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Resolution</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td>
                      <div className="investor-cell">
                        <span className="investor-id">{complaint.investorId}</span>
                        {complaint.createdBy && (
                          <span className="created-by">by {complaint.createdBy}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {editingComplaint && editingComplaint.id === complaint.id ? (
                        <textarea
                          value={editingComplaint.issue}
                          onChange={(e) => setEditingComplaint({...editingComplaint, issue: e.target.value})}
                          className="edit-textarea"
                          rows="2"
                        />
                      ) : (
                        <div className="issue-cell">
                          <div className="issue-text">{complaint.issue}</div>
                          {complaint.remarks && (
                            <div className="remarks-text">{complaint.remarks}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`category-badge ${complaint.category?.toLowerCase().replace(' ', '-')}`}>
                        {complaint.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <div className="series-cell">
                        {getInvestorSeries(complaint.investorId).map((series, index) => (
                          <span key={series} className="series-badge">
                            {series}
                          </span>
                        ))}
                        {getInvestorSeries(complaint.investorId).length === 0 && (
                          <span className="no-series">No series</span>
                        )}
                      </div>
                    </td>
                    <td>{complaint.date || new Date(complaint.timestamp).toLocaleDateString()}</td>
                    <td>
                      <div className="status-cell">
                        <span className={`status-badge ${complaint.status}`}>
                          {complaint.status}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="resolution-container">
                        {complaint.status === 'resolved' && complaint.resolution ? (
                          <div className="resolution-display">
                            <div className="resolution-text">{complaint.resolution}</div>
                            {complaint.resolvedAt && (
                              <div className="resolved-date">
                                {new Date(complaint.resolvedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : complaint.status === 'pending' ? (
                          <div className="resolution-input-container">
                            <textarea
                              placeholder="Enter resolution..."
                              value={resolutionComments[complaint.id] || ''}
                              onChange={(e) => handleResolutionChange(complaint.id, e.target.value)}
                              className="resolution-input"
                              rows="2"
                            />
                            {resolutionComments[complaint.id]?.trim() && (
                              <button
                                className="submit-resolution-btn"
                                onClick={() => handleStatusChange(complaint.id, true)}
                              >
                                Submit
                              </button>
                            )}
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

            {filteredComplaints.length === 0 && (
              <div className="no-data">
                <MdReportProblem size={48} />
                <h3>No Complaints Found</h3>
                <p>No complaints match your current filters.</p>
              </div>
            )}
          </div>
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
                    <label>Investor ID *</label>
                    <div className="investor-input-container">
                      <input
                        type="text"
                        value={newComplaint.investorId}
                        onChange={(e) => handleInvestorIdChange(e.target.value)}
                        placeholder="Enter investor ID"
                        required
                        className={investorIdError ? 'error' : ''}
                      />
                      {investorIdError && (
                        <div className="error-message">{investorIdError}</div>
                      )}
                      {!investorIdError && newComplaint.investorId && investors.find(inv => inv.investorId === newComplaint.investorId) && (
                        <div className="investor-info">
                          <div className="investor-found">
                            ✓ {investors.find(inv => inv.investorId === newComplaint.investorId)?.name}
                            <span className="investor-series-info">
                              ({investors.find(inv => inv.investorId === newComplaint.investorId)?.series?.join(', ') || 'No series'})
                            </span>
                          </div>
                        </div>
                      )}
                      {showInvestorSuggestions && (
                        <div className="investor-suggestions">
                          {getInvestorSuggestions(newComplaint.investorId).map(investor => (
                            <div 
                              key={investor.investorId}
                              className="suggestion-item"
                              onClick={() => selectInvestor(investor)}
                            >
                              <div className="suggestion-id">{investor.investorId}</div>
                              <div className="suggestion-name">{investor.name}</div>
                              <div className="suggestion-series">
                                {investor.series?.join(', ') || 'No series'}
                              </div>
                            </div>
                          ))}
                          {getInvestorSuggestions(newComplaint.investorId).length === 0 && (
                            <div className="no-suggestions">
                              No matching investors found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
                </div>
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