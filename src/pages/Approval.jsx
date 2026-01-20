import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './Approval.css';
import { HiOutlineEye, HiOutlineCheck, HiOutlineX, HiOutlineTrash, HiOutlineLockClosed, HiOutlineDocumentText } from "react-icons/hi";

const Approval = () => {
  const { series, approveSeries, deleteSeries, updateSeries, addAuditLog } = useData();
  const { canEdit, canDelete } = usePermissions();
  const { user } = useAuth();
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Only show DRAFT series in approval page
  const draftSeries = series.filter(s => s.status === 'DRAFT');

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  const handleViewDetails = (seriesItem) => {
    setSelectedSeries(seriesItem);
    setEditData({ ...seriesItem });
    setShowDetailsModal(true);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    // Track what changed
    const changes = {};
    if (editData.name !== selectedSeries.name) changes.name = { old: selectedSeries.name, new: editData.name };
    if (editData.interestRate !== selectedSeries.interestRate) changes.interestRate = { old: selectedSeries.interestRate, new: editData.interestRate };
    if (editData.targetAmount !== selectedSeries.targetAmount) changes.targetAmount = { old: selectedSeries.targetAmount, new: editData.targetAmount };
    if (editData.issueDate !== selectedSeries.issueDate) changes.issueDate = { old: selectedSeries.issueDate, new: editData.issueDate };
    if (editData.maturityDate !== selectedSeries.maturityDate) changes.maturityDate = { old: selectedSeries.maturityDate, new: editData.maturityDate };
    
    updateSeries(selectedSeries.id, editData);
    
    // Add audit log for series edit
    if (Object.keys(changes).length > 0) {
      addAuditLog({
        action: 'Edited Series',
        adminName: user ? user.name : 'Admin',
        adminRole: user ? user.displayRole : 'Admin',
        details: `Edited NCD series "${selectedSeries.name}" - Changed: ${Object.keys(changes).join(', ')}`,
        entityType: 'Series',
        entityId: selectedSeries.name,
        changes: changes
      });
    }
    
    setSelectedSeries({ ...selectedSeries, ...editData });
    setIsEditing(false);
  };

  const handleApprove = () => {
    if (selectedSeries) {
      approveSeries(selectedSeries.id, editData);
      
      // Add audit log for series approval
      addAuditLog({
        action: 'Approved Series',
        adminName: user ? user.name : 'Admin',
        adminRole: user ? user.displayRole : 'Admin',
        details: `Approved NCD series "${selectedSeries.name}" for release. Issue Date: ${editData.issueDate}, Target Amount: ${formatCurrency(editData.targetAmount)}`,
        entityType: 'Series',
        entityId: selectedSeries.name,
        changes: {
          status: { old: 'DRAFT', new: 'upcoming' },
          approvedAt: new Date().toISOString()
        }
      });
      
      setShowDetailsModal(false);
      setSelectedSeries(null);
    }
  };

  const handleReject = () => {
    if (selectedSeries) {
      const success = deleteSeries(selectedSeries.id);
      if (success) {
        // Add audit log for series rejection/deletion
        addAuditLog({
          action: 'Rejected Series',
          adminName: user ? user.name : 'Admin',
          adminRole: user ? user.displayRole : 'Admin',
          details: `Rejected and deleted NCD series "${selectedSeries.name}" (DRAFT status)`,
          entityType: 'Series',
          entityId: selectedSeries.name,
          changes: {
            status: { old: 'DRAFT', new: 'DELETED' },
            reason: 'Rejected during approval process'
          }
        });
        
        setShowDetailsModal(false);
        setSelectedSeries(null);
      }
    }
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
            <p>All series have been reviewed and approved.</p>
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
                      <span className="label">Coupon Rate:</span>
                      {isEditing ? (
                        <input 
                          type="number" 
                          step="0.01"
                          value={editData.couponRate || ''} 
                          onChange={(e) => setEditData({...editData, couponRate: parseFloat(e.target.value)})}
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{selectedSeries.couponRate}%</span>
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
                        <span className="value">
                          {selectedSeries.documents?.termSheet?.name || 'Uploaded ✓'}
                        </span>
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
                        <span className="value">
                          {selectedSeries.documents?.offerDocument?.name || 'Uploaded ✓'}
                        </span>
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
                        <span className="value">
                          {selectedSeries.documents?.boardResolution?.name || 'Uploaded ✓'}
                        </span>
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
      </div>
    </Layout>
  );
};

export default Approval;