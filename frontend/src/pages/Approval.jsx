import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import Layout from '../components/Layout';
import { getUserFriendlyError, SUCCESS_MESSAGES } from '../utils/errorHandler';
import './Approval.css';
import '../styles/loading.css';
import { HiOutlineEye, HiOutlineCheck, HiOutlineX, HiOutlineTrash, HiOutlineLockClosed, HiOutlineDocumentText } from "react-icons/hi";

const Approval = () => {
  const { series, deleteSeries } = useData();  // Removed updateSeries and addAuditLog - using backend API now
  const { canEdit, canDelete } = usePermissions();
  const { user } = useAuth();
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [seriesToDelete, setSeriesToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [seriesDocuments, setSeriesDocuments] = useState({});  // Store documents by series_id

  // Only show DRAFT series in approval page
  const draftSeries = series.filter(s => s.status === 'DRAFT');

  // Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (day) => {
    if (!day) return '';
    const j = day % 10;
    const k = day % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  // Load documents for a series
  const loadSeriesDocuments = async (seriesId) => {
    try {
      if (import.meta.env.DEV) { console.log('🔄 Loading documents for series:', seriesId); }
      const response = await apiService.getSeriesDocuments(seriesId);
      setSeriesDocuments(prev => ({
        ...prev,
        [seriesId]: response.documents || []
      }));
      if (import.meta.env.DEV) { console.log('✅ Documents loaded:', response.documents); }
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Error loading documents:', error); }
    }
  };

  // View document in new tab
  const handleViewDocument = (viewUrl) => {
    window.open(viewUrl, '_blank');
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const showError = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 5000);
  };

  const handleViewDetails = async (seriesItem) => {
    setSelectedSeries(seriesItem);
    setEditData({ ...seriesItem });
    setShowDetailsModal(true);
    setIsEditing(false);
    
    // Load documents for this series
    if (seriesItem.id) {
      await loadSeriesDocuments(seriesItem.id);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSeries) return;
    
    try {
      setLoading(true);
      if (import.meta.env.DEV) { console.log('🔄 Saving edits via backend API:', selectedSeries.id); }
      if (import.meta.env.DEV) {

        if (import.meta.env.DEV) { console.log('📝 Edit data (camelCase):', editData); }

      }
      
      // Convert camelCase to snake_case for backend
      const backendData = {
        name: editData.name,
        security_type: editData.securityType,
        status: editData.status,
        debenture_trustee_name: editData.debentureTrusteeName || editData.debenture_trustee_name,
        investors_size: editData.investorsSize || editData.investors_size,
        issue_date: editData.issueDate || editData.issue_date,
        tenure: editData.tenure,
        maturity_date: editData.maturityDate || editData.maturity_date,
        lock_in_date: editData.lockInDate || editData.lock_in_date,
        subscription_start_date: editData.subscriptionStartDate || editData.subscription_start_date,
        subscription_end_date: editData.subscriptionEndDate || editData.subscription_end_date,
        series_start_date: editData.seriesStartDate || editData.series_start_date,
        release_date: editData.releaseDate || editData.release_date,
        min_subscription_percentage: editData.minSubscriptionPercentage || editData.min_subscription_percentage,
        face_value: editData.faceValue || editData.face_value,
        min_investment: editData.minInvestment || editData.min_investment,
        target_amount: editData.targetAmount || editData.target_amount,
        total_issue_size: editData.totalIssueSize || editData.total_issue_size,
        interest_rate: editData.interestRate || editData.interest_rate,
        interest_payment_day: editData.interestPaymentDay || editData.interest_payment_day,
        credit_rating: editData.creditRating || editData.credit_rating,
        interest_frequency: editData.interestFrequency || editData.interest_frequency,
        description: editData.description
      };
      
      if (import.meta.env.DEV) {

      
        if (import.meta.env.DEV) { console.log('📤 Sending to backend (snake_case):', backendData); }

      
      }
      
      // Call backend API - ALL LOGIC IN BACKEND
      const response = await apiService.updateSeries(selectedSeries.id, backendData);
      
      if (import.meta.env.DEV) { console.log('✅ Series updated successfully:', response); }
      
      // Backend handles:
      // - Change tracking (old → new values)
      // - Insert EDITED record into series_approvals table
      // - Update last_modified_by and last_modified_at
      // - Audit log creation
      // - Database updates
      
      showSuccess(`Series "${selectedSeries.name}" updated successfully!`);
      
      // Update local state with new data
      setSelectedSeries({ ...selectedSeries, ...editData });
      setIsEditing(false);
      
      // Reload series from backend to get updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      if (import.meta.env.DEV) { console.error('❌ Failed to update series:', error); }
      const friendlyError = getUserFriendlyError(error, 'Failed to update series. Please try again.');
      showError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (selectedSeries) {
      try {
        setLoading(true);
        if (import.meta.env.DEV) { console.log('🔄 Approving series via backend API:', selectedSeries.id); }
        
        // Call backend API - ALL LOGIC IN BACKEND
        const response = await apiService.approveSeries(selectedSeries.id, editData);
        
        if (import.meta.env.DEV) { console.log('✅ Series approved successfully:', response); }
        
        // Backend handles:
        // - Status calculation
        // - Audit log creation
        // - Approval history tracking
        // - Database updates
        
        showSuccess(`Series "${selectedSeries.name}" approved successfully!`);
        
        setShowDetailsModal(false);
        setSelectedSeries(null);
        
        // Reload series from backend to get updated data
        window.location.reload(); // Simple reload to refresh data
        
      } catch (error) {
        if (import.meta.env.DEV) { console.error('❌ Failed to approve series:', error); }
        const friendlyError = getUserFriendlyError(error, 'Failed to approve series. Please try again.');
        showError(friendlyError);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (selectedSeries && rejectionReason.trim()) {
      try {
        setLoading(true);
        if (import.meta.env.DEV) { console.log('🔄 Rejecting series via backend API:', selectedSeries.id); }
        
        // Call backend API - ALL LOGIC IN BACKEND
        const response = await apiService.rejectSeries(selectedSeries.id, {
          reason: rejectionReason.trim()
        });
        
        if (import.meta.env.DEV) { console.log('✅ Series rejected successfully:', response); }
        
        // Backend handles:
        // - Status update to REJECTED
        // - Audit log creation
        // - Rejection history tracking
        // - Database updates
        
        showSuccess(`Series "${selectedSeries.name}" rejected successfully!`);
        
        setShowDetailsModal(false);
        setShowRejectModal(false);
        setSelectedSeries(null);
        setRejectionReason('');
        
        // Reload series from backend to get updated data
        window.location.reload(); // Simple reload to refresh data
        
      } catch (error) {
        if (import.meta.env.DEV) { console.error('❌ Failed to reject series:', error); }
        const friendlyError = getUserFriendlyError(error, 'Failed to reject series. Please try again.');
        showError(friendlyError);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setRejectionReason('');
  };

  const handleDeleteClick = (seriesItem) => {
    setSeriesToDelete(seriesItem);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (seriesToDelete) {
      const success = deleteSeries(seriesToDelete.id);
      if (success) {
        // Add audit log for series deletion
        addAuditLog({
          action: 'Deleted Series',
          adminName: user ? user.name : 'Admin',
          adminRole: user ? user.displayRole : 'Admin',
          details: `Deleted NCD series "${seriesToDelete.name}" (${seriesToDelete.status} status)`,
          entityType: 'Series',
          entityId: seriesToDelete.name,
          changes: {
            status: { old: seriesToDelete.status, new: 'DELETED' }
          }
        });
        
        setShowDeleteConfirm(false);
        setSeriesToDelete(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setSeriesToDelete(null);
  };

  return (
    <Layout>
      <div className="approval-page">
        <div className="approval-header">
          <div>
            <h1 className="page-title">NCD Series Approval</h1>
            <p className="page-subtitle">Review and approve NCD series for public offering</p>
          </div>
        </div>

        {draftSeries.length === 0 ? (
          <div className="no-series-message">
            <h3>No series pending approval</h3>
          </div>
        ) : (
          <div className="approval-grid">
            {draftSeries.map((s) => {
              const progress = (s.fundsRaised / s.targetAmount) * 100;
              return (
                <div key={s.id} className="approval-card">
                  <div className="card-banner draft-banner">
                    <div className="banner-content">
                      <h3 className="series-name">{s.name}</h3>
                      <div className="banner-status">
                        <span className="status-pill gray">
                          YET TO BE APPROVED
                        </span>
                        <span className="frequency-pill">{s.interestFrequency}</span>
                      </div>
                    </div>
                  </div>
                  <div className="rate-row">
                    <div className="interest-rate">
                      {s.interestRate}%
                      {s.interestPaymentDay && (
                        <span style={{ fontSize: '11px', color: '#666', marginLeft: '6px', fontWeight: 'normal' }}>
                          (on {s.interestPaymentDay}{getOrdinalSuffix(s.interestPaymentDay)})
                        </span>
                      )}
                    </div>
                    <div className="investors-count">{s.investors} investors</div>
                  </div>
                  <div className="funds-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill gray"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                    </div>
                  </div>
                  <div className="series-details">
                    <div className="detail-item">
                      <span className="detail-label">Issue Date:</span>
                      <span className="detail-value">{s.issueDate}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Maturity Date:</span>
                      <span className="detail-value">{s.maturityDate}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Face Value:</span>
                      <span className="detail-value">₹{s.faceValue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Min Investment:</span>
                      <span className="detail-value">₹{s.minInvestment.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="approval-actions">
                    <button 
                      className="view-details-button"
                      onClick={() => handleViewDetails(s)}
                    >
                      <HiOutlineEye size={18} />
                      <span>Review & Approve</span>
                    </button>
                    {canDelete('approval') && (
                      <button 
                        className="delete-series-button"
                        onClick={() => handleDeleteClick(s)}
                        title="Delete Draft Series"
                      >
                        <HiOutlineTrash size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedSeries && (
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="modal-content approval-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedSeries.name} - Review & Approval</h2>
                <button 
                  className="close-button"
                  onClick={() => setShowDetailsModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="details-grid">
                  {/* Basic Information */}
                  <div className="detail-section">
                    <h3>Basic Information</h3>
                    <div className="detail-row">
                      <span className="label">Series Name:</span>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editData.name || ''} 
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{selectedSeries.name}</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Series Code:</span>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editData.seriesCode || ''} 
                          onChange={(e) => setEditData({...editData, seriesCode: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{selectedSeries.seriesCode}</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Security Type:</span>
                      {isEditing ? (
                        <select 
                          value={editData.securityType || ''} 
                          onChange={(e) => setEditData({...editData, securityType: e.target.value})}
                          className="edit-input"
                        >
                          <option value="Secured">Secured</option>
                          <option value="Unsecured">Unsecured</option>
                        </select>
                      ) : (
                        <span className="value">{selectedSeries.securityType}</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Debenture Trustee:</span>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editData.debentureTrusteeName || ''} 
                          onChange={(e) => setEditData({...editData, debentureTrusteeName: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{selectedSeries.debentureTrusteeName}</span>
                      )}
                    </div>
                  </div>

                  {/* Interest Information */}
                  <div className="detail-section">
                    <h3>Interest Information</h3>
                    <div className="detail-row">
                      <span className="label">Interest Rate:</span>
                      {isEditing ? (
                        <input 
                          type="number" 
                          step="0.01"
                          value={editData.interestRate || ''} 
                          onChange={(e) => setEditData({...editData, interestRate: parseFloat(e.target.value)})}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{selectedSeries.interestRate}%</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Interest Frequency:</span>
                      {isEditing ? (
                        <select 
                          value={editData.interestFrequency || ''} 
                          onChange={(e) => setEditData({...editData, interestFrequency: e.target.value})}
                          className="edit-input"
                        >
                          <option value="Monthly Interest">Monthly Interest</option>
                        </select>
                      ) : (
                        <span className="value">{selectedSeries.interestFrequency}</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Interest Payment Day:</span>
                      {isEditing ? (
                        <input 
                          type="number" 
                          min="1"
                          max="31"
                          value={editData.interestPaymentDay || ''} 
                          onChange={(e) => setEditData({...editData, interestPaymentDay: e.target.value ? parseInt(e.target.value) : ''})}
                          className="edit-input"
                          placeholder="Day of month (1-31)"
                        />
                      ) : (
                        <span className="value">
                          {selectedSeries.interestPaymentDay ? `${selectedSeries.interestPaymentDay} (Day of Month)` : 'Not Set'}
                        </span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Credit Rating:</span>
                      {isEditing ? (
                        <select 
                          value={editData.creditRating || ''} 
                          onChange={(e) => setEditData({...editData, creditRating: e.target.value})}
                          className="edit-input"
                        >
                          <option value="AAA">AAA</option>
                          <option value="AA+">AA+</option>
                          <option value="AA">AA</option>
                          <option value="AA-">AA-</option>
                          <option value="A+">A+</option>
                          <option value="A">A</option>
                          <option value="A-">A-</option>
                          <option value="BBB+">BBB+</option>
                          <option value="BBB">BBB</option>
                        </select>
                      ) : (
                        <span className="value">{selectedSeries.creditRating}</span>
                      )}
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="detail-section">
                    <h3>Financial Information</h3>
                    <div className="detail-row">
                      <span className="label">Target Amount:</span>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editData.targetAmount ? editData.targetAmount / 10000000 : ''} 
                          onChange={(e) => setEditData({...editData, targetAmount: parseFloat(e.target.value) * 10000000})}
                          className="edit-input"
                          placeholder="Amount in Cr"
                        />
                      ) : (
                        <span className="value">{formatCurrency(selectedSeries.targetAmount)}</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Total Issue Size:</span>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editData.totalIssueSize || ''} 
                          onChange={(e) => setEditData({...editData, totalIssueSize: parseFloat(e.target.value)})}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{selectedSeries.totalIssueSize}</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Face Value:</span>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editData.faceValue || ''} 
                          onChange={(e) => setEditData({...editData, faceValue: parseInt(e.target.value)})}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">₹{selectedSeries.faceValue.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Min Investment:</span>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editData.minInvestment || ''} 
                          onChange={(e) => setEditData({...editData, minInvestment: parseInt(e.target.value)})}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">₹{selectedSeries.minInvestment.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Min Subscription %:</span>
                      {isEditing ? (
                        <input 
                          type="number" 
                          step="0.01"
                          value={editData.minSubscriptionPercentage || ''} 
                          onChange={(e) => setEditData({...editData, minSubscriptionPercentage: parseFloat(e.target.value)})}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{selectedSeries.minSubscriptionPercentage}%</span>
                      )}
                    </div>
                  </div>

                  {/* Date Information */}
                  <div className="detail-section">
                    <h3>Date Information</h3>
                    <div className="detail-row">
                      <span className="label">Issue Date:</span>
                      {isEditing ? (
                        <input 
                          type="date" 
                          value={editData.issueDate ? editData.issueDate.split('/').reverse().join('-') : ''} 
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            const formatted = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                            setEditData({...editData, issueDate: formatted});
                          }}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{selectedSeries.issueDate}</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Maturity Date:</span>
                      {isEditing ? (
                        <input 
                          type="date" 
                          value={editData.maturityDate ? editData.maturityDate.split('/').reverse().join('-') : ''} 
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            const formatted = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                            setEditData({...editData, maturityDate: formatted});
                          }}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{selectedSeries.maturityDate}</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Tenure:</span>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editData.tenure || ''} 
                          onChange={(e) => setEditData({...editData, tenure: parseInt(e.target.value)})}
                          className="edit-input"
                          placeholder="Months"
                        />
                      ) : (
                        <span className="value">{selectedSeries.tenure} months</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Subscription Start:</span>
                      {isEditing ? (
                        <input 
                          type="date" 
                          value={editData.subscriptionStartDate ? editData.subscriptionStartDate.split('/').reverse().join('-') : ''} 
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            const formatted = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                            setEditData({...editData, subscriptionStartDate: formatted});
                          }}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{selectedSeries.subscriptionStartDate}</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Subscription End:</span>
                      {isEditing ? (
                        <input 
                          type="date" 
                          value={editData.subscriptionEndDate ? editData.subscriptionEndDate.split('/').reverse().join('-') : ''} 
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            const formatted = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                            setEditData({...editData, subscriptionEndDate: formatted});
                          }}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{selectedSeries.subscriptionEndDate}</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Series Start Date:</span>
                      {isEditing ? (
                        <input 
                          type="date" 
                          value={editData.seriesStartDate ? editData.seriesStartDate.split('/').reverse().join('-') : ''} 
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            const formatted = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                            setEditData({...editData, seriesStartDate: formatted});
                          }}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{selectedSeries.seriesStartDate || 'N/A'}</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Lock-in Date:</span>
                      {isEditing ? (
                        <input 
                          type="date" 
                          value={editData.lockInDate ? editData.lockInDate.split('/').reverse().join('-') : ''} 
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            const formatted = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                            setEditData({...editData, lockInDate: formatted});
                          }}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{selectedSeries.lockInDate || 'N/A'}</span>
                      )}
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className="detail-section">
                    <h3>Documents</h3>
                    <div className="detail-row">
                      <span className="label">Term Sheet:</span>
                      {isEditing ? (
                        <input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              setEditData({
                                ...editData, 
                                documents: {
                                  ...editData.documents,
                                  termSheet: e.target.files[0]
                                }
                              });
                            }
                          }}
                          className="edit-input"
                        />
                      ) : (
                        <div className="value" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span>Uploaded ✓</span>
                          {selectedSeries?.id && seriesDocuments[selectedSeries.id]?.find(d => d.document_type === 'term_sheet') && (
                            <button
                              onClick={() => handleViewDocument(seriesDocuments[selectedSeries.id].find(d => d.document_type === 'term_sheet').view_url)}
                              style={{
                                padding: '4px 12px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              <HiOutlineEye style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                              View
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Offer Document:</span>
                      {isEditing ? (
                        <input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              setEditData({
                                ...editData, 
                                documents: {
                                  ...editData.documents,
                                  offerDocument: e.target.files[0]
                                }
                              });
                            }
                          }}
                          className="edit-input"
                        />
                      ) : (
                        <div className="value" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span>Uploaded ✓</span>
                          {selectedSeries?.id && seriesDocuments[selectedSeries.id]?.find(d => d.document_type === 'offer_document') && (
                            <button
                              onClick={() => handleViewDocument(seriesDocuments[selectedSeries.id].find(d => d.document_type === 'offer_document').view_url)}
                              style={{
                                padding: '4px 12px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              <HiOutlineEye style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                              View
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Board Resolution:</span>
                      {isEditing ? (
                        <input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              setEditData({
                                ...editData, 
                                documents: {
                                  ...editData.documents,
                                  boardResolution: e.target.files[0]
                                }
                              });
                            }
                          }}
                          className="edit-input"
                        />
                      ) : (
                        <div className="value" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span>Uploaded ✓</span>
                          {selectedSeries?.id && seriesDocuments[selectedSeries.id]?.find(d => d.document_type === 'board_resolution') && (
                            <button
                              onClick={() => handleViewDocument(seriesDocuments[selectedSeries.id].find(d => d.document_type === 'board_resolution').view_url)}
                              style={{
                                padding: '4px 12px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              <HiOutlineEye style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                              View
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="detail-section">
                    <h3>Additional Information</h3>
                    <div className="detail-row">
                      <span className="label">Investors Size:</span>
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editData.investorsSize || ''} 
                          onChange={(e) => setEditData({...editData, investorsSize: parseInt(e.target.value)})}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{selectedSeries.investorsSize}</span>
                      )}
                    </div>
                    <div className="detail-row">
                      <span className="label">Description:</span>
                      {isEditing ? (
                        <textarea 
                          value={editData.description || ''} 
                          onChange={(e) => setEditData({...editData, description: e.target.value})}
                          className="edit-input"
                          rows="3"
                        />
                      ) : (
                        <span className="value">{selectedSeries.description || 'N/A'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                {!isEditing ? (
                  <>
                    {canEdit('approval') && (
                      <button 
                        className="edit-button"
                        onClick={handleEdit}
                      >
                        Edit Details
                      </button>
                    )}
                    <button 
                      className="approve-button-large"
                      onClick={handleApprove}
                    >
                      <HiOutlineLockClosed size={20} />
                      Lock & Submit
                    </button>
                    <button 
                      className="reject-button-large"
                      onClick={handleReject}
                    >
                      <HiOutlineX size={20} />
                      Reject Series
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="cancel-edit-button"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="save-edit-button"
                      onClick={handleSaveEdit}
                    >
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && seriesToDelete && (
          <div className="modal-overlay" onClick={handleDeleteCancel}>
            <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Delete Series</h3>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{seriesToDelete.name}</strong>?</p>
                <p className="warning-text">This action cannot be undone.</p>
              </div>
              <div className="modal-actions">
                <button 
                  className="cancel-button"
                  onClick={handleDeleteCancel}
                >
                  Cancel
                </button>
                <button 
                  className="delete-confirm-button"
                  onClick={handleDeleteConfirm}
                >
                  <HiOutlineTrash size={16} />
                  Delete Series
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="modal-overlay">
            <div className="modal-content reject-modal">
              <div className="modal-header">
                <h2>Reject Series</h2>
                <button className="close-button" onClick={handleRejectCancel}>×</button>
              </div>
              <div className="modal-body">
                <p>Please provide a reason for rejecting this series:</p>
                <p className="series-name-highlight">"{selectedSeries?.name}"</p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason (required)..."
                  rows={4}
                  className="rejection-reason-input"
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  className="cancel-button"
                  onClick={handleRejectCancel}
                >
                  Cancel
                </button>
                <button 
                  className="reject-confirm-button"
                  onClick={handleRejectConfirm}
                  disabled={!rejectionReason.trim()}
                >
                  <HiOutlineX size={16} />
                  Reject Series
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success/Error Message */}
      {showSuccessMessage && (
        <div className="success-popup">
          <div className="success-content">
            <span className="success-message">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading...</p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Approval;