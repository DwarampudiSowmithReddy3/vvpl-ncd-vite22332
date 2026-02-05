import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './NCDSeries.css';
import { HiOutlineEye, HiOutlineTrash } from "react-icons/hi";
import { HiOutlineDocumentText } from "react-icons/hi";



const NCDSeries = () => {
  const navigate = useNavigate();
  const { showCreateButton, canEdit, canDelete } = usePermissions();
  const { user } = useAuth();
  const { series, addSeries, deleteSeries, addAuditLog, getSeriesStatus, auditService } = useData();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    seriesCode: '',
    interestRate: '',
    couponRate: '',
    interestFrequency: 'Non-cumulative & Monthly',
    issueDate: '',
    maturityDate: '',
    tenure: '',
    subscriptionStartDate: '',
    subscriptionEndDate: '',
    faceValue: '',
    minInvestment: '',
    targetAmount: '',
    creditRating: '',
    lockInDate: '',
    releaseOption: 'now',
    releaseDate: '',
    securityType: 'Secured',
    totalIssueSize: '',
    status: 'DRAFT',
    description: '',
    debentureTrusteeName: '',
    investorsSize: '',
    minSubscriptionPercentage: '',
    termSheet: null,
    offerDocument: null,
    boardResolution: null
  });

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  const getStatusInfo = (s) => {
    const status = getSeriesStatus(s);
    
    switch (status) {
      case 'DRAFT':
        return { status: 'draft', label: 'Yet to be approved', color: 'gray' };
      case 'upcoming':
        return { status: 'upcoming', label: 'Releasing soon', color: 'orange' };
      case 'accepting':
        return { status: 'accepting', label: 'Accepting investments', color: 'blue' };
      case 'active':
        return { status: 'active', label: 'Active', color: 'green' };
      case 'matured':
        return { status: 'matured', label: 'Matured', color: 'gray' };
      default:
        return { status: 'unknown', label: 'Unknown', color: 'gray' };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate that all 3 documents are uploaded
    if (!formData.termSheet || !formData.offerDocument || !formData.boardResolution) {
      alert('Please upload all required documents (Term Sheet, Offer Document, and Board Resolution)');
      return;
    }
    
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    const newSeries = {
      name: formData.name,
      seriesCode: formData.seriesCode,
      interestRate: parseFloat(formData.interestRate),
      couponRate: parseFloat(formData.couponRate) || parseFloat(formData.interestRate),
      interestFrequency: formData.interestFrequency,
      issueDate: formatDate(formData.issueDate),
      maturityDate: formatDate(formData.maturityDate),
      tenure: parseInt(formData.tenure),
      subscriptionStartDate: formatDate(formData.subscriptionStartDate),
      subscriptionEndDate: formatDate(formData.subscriptionEndDate),
      faceValue: parseInt(formData.faceValue),
      minInvestment: parseInt(formData.minInvestment),
      targetAmount: parseFloat(formData.targetAmount) * 10000000, // Convert Cr to actual amount
      creditRating: formData.creditRating,
      lockInDate: formData.lockInDate ? formatDate(formData.lockInDate) : '',
      releaseDate: formData.releaseOption === 'now' ? formatDate(new Date().toISOString()) : formatDate(formData.releaseDate),
      securityType: formData.securityType,
      totalIssueSize: parseFloat(formData.totalIssueSize),
      status: formData.status,
      description: formData.description,
      debentureTrustee: formData.debentureTrusteeName,
      investorsSize: parseInt(formData.investorsSize),
      minSubscriptionPercentage: parseFloat(formData.minSubscriptionPercentage),
      documents: {
        termSheet: formData.termSheet,
        offerDocument: formData.offerDocument,
        boardResolution: formData.boardResolution
      }
    };
    
    const success = addSeries(newSeries);
    if (!success) {
      return; // Don't close form if duplicate name
    }
    
    // Add audit log for series creation
    addAuditLog({
      action: 'Created Series',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `Created new NCD series "${formData.name}" with target amount ${formatCurrency(parseFloat(formData.targetAmount) * 10000000)} and interest rate ${formData.interestRate}%`,
      entityType: 'Series',
      entityId: formData.name,
      changes: {
        seriesName: formData.name,
        targetAmount: parseFloat(formData.targetAmount) * 10000000,
        interestRate: parseFloat(formData.interestRate),
        issueDate: formatDate(formData.issueDate),
        maturityDate: formatDate(formData.maturityDate)
      }
    });
    
    setShowCreateForm(false);
    setFormData({
      name: '',
      seriesCode: '',
      interestRate: '',
      couponRate: '',
      interestFrequency: 'Non-cumulative & Monthly',
      issueDate: '',
      maturityDate: '',
      tenure: '',
      subscriptionStartDate: '',
      subscriptionEndDate: '',
      faceValue: '',
      minInvestment: '',
      targetAmount: '',
      creditRating: '',
      lockInDate: '',
      releaseOption: 'now',
      releaseDate: '',
      securityType: 'Secured',
      totalIssueSize: '',
      status: 'DRAFT',
      description: '',
      debentureTrusteeName: '',
      investorsSize: '',
      minSubscriptionPercentage: '',
      termSheet: null,
      offerDocument: null,
      boardResolution: null
    });
  };

  const handleFileUpload = (field, file) => {
    setFormData({ ...formData, [field]: file });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (e, field) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(field, files[0]);
    }
  };

  const handleFileInput = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(field, file);
    }
  };

  const handleDeleteClick = (series) => {
    setSeriesToDelete(series);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (seriesToDelete) {
      const success = deleteSeries(seriesToDelete.id);
      if (success) {
        setShowDeleteConfirm(false);
        setSeriesToDelete(null);
      } else {
        alert('Cannot delete active series. Only draft and upcoming series can be deleted.');
      }
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setSeriesToDelete(null);
  };

  // Separate series into categories based on actual status
  const draftSeries = series.filter(s => getSeriesStatus(s) === 'DRAFT');
  const rejectedSeries = series.filter(s => s.status === 'REJECTED');
  const upcomingSeries = series.filter(s => getSeriesStatus(s) === 'upcoming');
  const acceptingSeries = series.filter(s => getSeriesStatus(s) === 'accepting');
  const activeSeries = series.filter(s => getSeriesStatus(s) === 'active');
  const maturedSeries = series.filter(s => getSeriesStatus(s) === 'matured');

  // DEBUG: Log series data to check fields
  console.log('🔍 DEBUG - Active series data:', activeSeries.map(s => ({
    name: s.name,
    seriesCode: s.seriesCode,
    debentureTrustee: s.debentureTrustee
  })));

  return (
    <Layout>
      <div className="ncd-series-page">
        <div className="series-header">
          <div>
            <h1 className="page-title">NCD Series</h1>
            <p className="page-subtitle">Manage all your non-convertible debenture series</p>
          </div>
          {showCreateButton('ncdSeries') && (
            <button 
              className="create-button"
              onClick={() => setShowCreateForm(true)}
            >
              + Create New Series
            </button>
          )}
        </div>

        {/* Draft Series Section */}
        {draftSeries.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Pending Approval</h2>
              <p className="section-subtitle">Series awaiting board approval</p>
            </div>
            <div className="series-grid">
              {draftSeries.map((s) => {
                const statusInfo = getStatusInfo(s);
                const progress = (s.fundsRaised / s.targetAmount) * 100;
                return (
                  <div key={s.id} className="series-card draft-card">
                    <div className="card-banner draft-banner">
                      <div className="banner-content">
                        <div className="series-title-section">
                          <h3 className="series-name">{s.name}</h3>
                          <p className="series-code">{s.seriesCode}</p>
                        </div>
                        <div className="banner-status">
                          <span className={`status-pill ${statusInfo.color}`}>
                            {statusInfo.label.toUpperCase()}
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
                          className={`progress-fill ${statusInfo.color}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <div className="progress-text">
                          {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                        </div>
                        <div className="trustee-name">
                          {s.debentureTrustee}
                        </div>
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
                      <div className="detail-item">
                        <span className="detail-label">Lock-in Period:</span>
                        <span className="detail-value">{s.lockInPeriod || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Max Investors:</span>
                        <span className="detail-value">{s.investorsSize ? s.investorsSize.toLocaleString('en-IN') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="view-details-button"
                        onClick={() => navigate(`/ncd-series/${s.id}`)}
                      >
                        <HiOutlineEye size={18} />
                        <span>View Details</span>
                      </button>
                      {canDelete('ncdSeries') && (
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
          </>
        )}

        {/* Rejected Series Section */}
        {rejectedSeries.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Rejected Series</h2>
              <p className="section-subtitle">Series that were rejected during approval</p>
            </div>
            <div className="series-grid">
              {rejectedSeries.map((s) => {
                const statusInfo = { color: 'red', label: 'Rejected' };
                const progress = (s.fundsRaised / s.targetAmount) * 100;
                return (
                  <div key={s.id} className="series-card rejected-card">
                    <div className="card-banner rejected-banner">
                      <div className="banner-content">
                        <div className="series-title-section">
                          <h3 className="series-name">{s.name}</h3>
                          <p className="series-code">{s.seriesCode}</p>
                        </div>
                        <div className="banner-status">
                          <span className={`status-pill ${statusInfo.color}`}>
                            {statusInfo.label.toUpperCase()}
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
                          className={`progress-fill ${statusInfo.color}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <div className="progress-text">
                          {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                        </div>
                        <div className="trustee-name">
                          {s.debentureTrustee}
                        </div>
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
                        <span className="detail-value">₹{s.faceValue ? s.faceValue.toLocaleString('en-IN') : 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Rejected On:</span>
                        <span className="detail-value">{s.rejectedAt ? new Date(s.rejectedAt).toLocaleDateString('en-GB') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="view-details-button rejected-button"
                        onClick={() => handleViewDetails(s)}
                      >
                        <HiOutlineEye size={16} />
                        <span>View Rejection Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Upcoming Series Section - Approved but not yet released */}
        {upcomingSeries.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Releasing Soon</h2>
              <p className="section-subtitle">Approved series awaiting release date</p>
            </div>
            <div className="series-grid">
              {upcomingSeries.map((s) => {
                const statusInfo = getStatusInfo(s);
                const progress = (s.fundsRaised / s.targetAmount) * 100;
                return (
                  <div key={s.id} className="series-card upcoming-card">
                    <div className="card-banner upcoming-banner">
                      <div className="banner-content">
                        <div className="series-title-section">
                          <h3 className="series-name">{s.name}</h3>
                          <p className="series-code">{s.seriesCode}</p>
                        </div>
                        <div className="banner-status">
                          <span className={`status-pill ${statusInfo.color}`}>
                            {statusInfo.label.toUpperCase()}
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
                          className={`progress-fill ${statusInfo.color}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <div className="progress-text">
                          {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                        </div>
                        <div className="trustee-name">
                          {s.debentureTrustee}
                        </div>
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
                      <div className="detail-item">
                        <span className="detail-label">Lock-in Period:</span>
                        <span className="detail-value">{s.lockInPeriod || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Max Investors:</span>
                        <span className="detail-value">{s.investorsSize ? s.investorsSize.toLocaleString('en-IN') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="view-details-button"
                        onClick={() => navigate(`/ncd-series/${s.id}`)}
                      >
                        <HiOutlineEye size={18} />
                        <span>View Details</span>
                      </button>
                      {canDelete('ncdSeries') && (
                        <button 
                          className="delete-series-button"
                          onClick={() => handleDeleteClick(s)}
                          title="Delete Upcoming Series"
                        >
                          <HiOutlineTrash size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Accepting Investments Series Section - Within subscription window */}
        {acceptingSeries.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Accepting Investments</h2>
              <p className="section-subtitle">Series currently accepting new investments within subscription window</p>
            </div>
            <div className="series-grid">
              {acceptingSeries.map((s) => {
                const statusInfo = getStatusInfo(s);
                const progress = (s.fundsRaised / s.targetAmount) * 100;
                return (
                  <div key={s.id} className="series-card accepting-card">
                    <div className="card-banner accepting-banner">
                      <div className="banner-content">
                        <div className="series-title-section">
                          <h3 className="series-name">{s.name}</h3>
                          <p className="series-code">{s.seriesCode}</p>
                        </div>
                        <div className="banner-status">
                          <span className={`status-pill ${statusInfo.color}`}>
                            {statusInfo.label.toUpperCase()}
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
                          className={`progress-fill ${statusInfo.color}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <div className="progress-text">
                          {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                        </div>
                        <div className="trustee-name">
                          {s.debentureTrustee}
                        </div>
                      </div>
                    </div>
                    <div className="series-details">
                      <div className="detail-item">
                        <span className="detail-label">Subscription Start:</span>
                        <span className="detail-value">{s.subscriptionStartDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Subscription End:</span>
                        <span className="detail-value">{s.subscriptionEndDate}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Face Value:</span>
                        <span className="detail-value">₹{s.faceValue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Min Investment:</span>
                        <span className="detail-value">₹{s.minInvestment.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Lock-in Period:</span>
                        <span className="detail-value">{s.lockInPeriod || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Max Investors:</span>
                        <span className="detail-value">{s.investorsSize ? s.investorsSize.toLocaleString('en-IN') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="view-details-button"
                        onClick={() => navigate(`/ncd-series/${s.id}`)}
                      >
                        <HiOutlineEye size={18} />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Active Series Section */}
        {activeSeries.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Currently Running</h2>
            </div>
            <div className="series-grid">
              {activeSeries.map((s) => {
                const statusInfo = getStatusInfo(s);
                const progress = (s.fundsRaised / s.targetAmount) * 100;
                return (
                  <div key={s.id} className="series-card">
                    <div className="card-banner">
                      <div className="banner-content">
                        <div className="series-title-section">
                          <h3 className="series-name">{s.name}</h3>
                          <p className="series-code">{s.seriesCode}</p>
                        </div>
                        <div className="banner-status">
                          <span className={`status-pill ${statusInfo.color}`}>
                            {statusInfo.label.toUpperCase()}
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
                          className={`progress-fill ${statusInfo.color}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <div className="progress-text">
                          {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                        </div>
                        <div className="trustee-name">
                          {s.debentureTrustee}
                        </div>
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
                      <div className="detail-item">
                        <span className="detail-label">Lock-in Period:</span>
                        <span className="detail-value">{s.lockInPeriod || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Max Investors:</span>
                        <span className="detail-value">{s.investorsSize ? s.investorsSize.toLocaleString('en-IN') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="view-details-button"
                        onClick={() => navigate(`/ncd-series/${s.id}`)}
                      >
                        <HiOutlineEye size={18} />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Matured Series Section */}
        {maturedSeries.length > 0 && (
          <>
            <div className="section-header">
              <h2 className="section-title">Matured Series</h2>
              <p className="section-subtitle">Series that have completed their maturity period</p>
            </div>
            <div className="series-grid">
              {maturedSeries.map((s) => {
                const statusInfo = { status: 'matured', label: 'Matured', color: 'gray' };
                const progress = 100; // Matured series are 100% complete
                return (
                  <div key={s.id} className="series-card matured-card">
                    <div className="card-banner matured-banner">
                      <div className="banner-content">
                        <div className="series-title-section">
                          <h3 className="series-name">{s.name}</h3>
                          <p className="series-code">{s.seriesCode}</p>
                        </div>
                        <div className="banner-status">
                          <span className={`status-pill ${statusInfo.color}`}>
                            {statusInfo.label.toUpperCase()}
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
                          className={`progress-fill ${statusInfo.color}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <div className="progress-text">
                          {formatCurrency(s.fundsRaised)} / {formatCurrency(s.targetAmount)}
                        </div>
                        <div className="trustee-name">
                          {s.debentureTrustee}
                        </div>
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
                      <div className="detail-item">
                        <span className="detail-label">Lock-in Period:</span>
                        <span className="detail-value">{s.lockInPeriod || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Max Investors:</span>
                        <span className="detail-value">{s.investorsSize ? s.investorsSize.toLocaleString('en-IN') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="view-details-button matured-button"
                        onClick={() => navigate(`/ncd-series/${s.id}`)}
                      >
                        <HiOutlineEye size={18} />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {showCreateForm && (
          <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add New NCD Series</h2>
                <button 
                  className="close-button"
                  onClick={() => setShowCreateForm(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="create-form">
                {/* Basic Information Section */}
                <div className="form-section">
                  <h3 className="form-section-title">Basic Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Series Name*</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Enter series name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Series Code*</label>
                      <input
                        type="text"
                        value={formData.seriesCode}
                        onChange={(e) => setFormData({ ...formData, seriesCode: e.target.value })}
                        required
                        placeholder="Enter series code"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Security Type*</label>
                      <select
                        value={formData.securityType}
                        onChange={(e) => setFormData({ ...formData, securityType: e.target.value })}
                        required
                      >
                        <option value="Secured">Secured</option>
                        <option value="Unsecured">Unsecured</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status*</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        required
                      >
                        <option value="DRAFT">DRAFT</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Debenture Trustee Name*</label>
                      <input
                        type="text"
                        value={formData.debentureTrusteeName}
                        onChange={(e) => setFormData({ ...formData, debentureTrusteeName: e.target.value })}
                        required
                        placeholder="Enter debenture trustee name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Investors Size*</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.investorsSize}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setFormData({ ...formData, investorsSize: value });
                        }}
                        required
                        placeholder="Enter expected number of investors"
                      />
                    </div>
                  </div>
                </div>

                {/* Date & Tenure Information */}
                <div className="form-section">
                  <h3 className="form-section-title">Date & Tenure Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Issue Date*</label>
                      <input
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Tenure (months)*</label>
                      <input
                        type="number"
                        min="1"
                        max="600"
                        value={formData.tenure}
                        onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                        onKeyDown={(e) => {
                          // Prevent arrow keys from changing the value
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            e.preventDefault();
                          }
                        }}
                        required
                        placeholder="Enter tenure in months"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Maturity Date*</label>
                      <input
                        type="date"
                        value={formData.maturityDate}
                        onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Lock-in Date</label>
                      <input
                        type="date"
                        value={formData.lockInDate}
                        onChange={(e) => setFormData({ ...formData, lockInDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription Information */}
                <div className="form-section">
                  <h3 className="form-section-title">Subscription Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Subscription Start Date*</label>
                      <input
                        type="date"
                        value={formData.subscriptionStartDate}
                        onChange={(e) => setFormData({ ...formData, subscriptionStartDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Subscription End Date*</label>
                      <input
                        type="date"
                        value={formData.subscriptionEndDate}
                        onChange={(e) => setFormData({ ...formData, subscriptionEndDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Minimum Subscription of Issue Size (%)*</label>
                      <input
                        type="text"
                        value={formData.minSubscriptionPercentage}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow only numbers and one decimal point
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            // Validate range (0-100)
                            const numValue = parseFloat(value);
                            if (value === '' || (numValue >= 0 && numValue <= 100)) {
                              setFormData({ ...formData, minSubscriptionPercentage: value });
                            }
                          }
                        }}
                        required
                        placeholder="Enter minimum subscription percentage (0-100)"
                      />
                    </div>
                    <div className="form-group">
                      {/* Empty space for alignment */}
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="form-section">
                  <h3 className="form-section-title">Financial Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Face Value (₹)*</label>
                      <input
                        type="number"
                        step="1"
                        min="100"
                        max="100000"
                        value={formData.faceValue}
                        onChange={(e) => setFormData({ ...formData, faceValue: e.target.value })}
                        onKeyDown={(e) => {
                          // Prevent arrow keys from changing the value
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            e.preventDefault();
                          }
                        }}
                        required
                        placeholder="Enter face value (e.g., 1000)"
                      />
                    </div>
                    <div className="form-group">
                      <label>Minimum Investment (₹)*</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.minInvestment}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setFormData({ ...formData, minInvestment: value });
                        }}
                        required
                        placeholder="Enter minimum investment"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Target Amount (Cr)*</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10000"
                        value={formData.targetAmount}
                        onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                        onKeyDown={(e) => {
                          // Prevent arrow keys from changing the value
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            e.preventDefault();
                          }
                        }}
                        required
                        placeholder="Enter target amount in Crores (e.g., 5.5)"
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Issue Size*</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max="100000"
                        value={formData.totalIssueSize}
                        onChange={(e) => setFormData({ ...formData, totalIssueSize: e.target.value })}
                        onKeyDown={(e) => {
                          // Prevent arrow keys from changing the value
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            e.preventDefault();
                          }
                        }}
                        required
                        placeholder="Enter total issue size (in units)"
                      />
                    </div>
                  </div>
                </div>

                {/* Interest & Rating Information */}
                <div className="form-section">
                  <h3 className="form-section-title">Interest & Rating Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Interest Rate (%)*</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        value={formData.interestRate}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          // Prevent multiple decimal points
                          const parts = value.split('.');
                          const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value;
                          setFormData({ ...formData, interestRate: formatted, couponRate: formatted });
                        }}
                        required
                        placeholder="Enter interest rate"
                      />
                    </div>
                    <div className="form-group">
                      <label>Credit Rating*</label>
                      <select 
                        value={formData.creditRating}
                        onChange={(e) => setFormData({ ...formData, creditRating: e.target.value })}
                        required
                      >
                        <option value="">Select Rating</option>
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
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Non-cumulative & Monthly*</label>
                      <select
                        value={formData.interestFrequency}
                        onChange={(e) => setFormData({ ...formData, interestFrequency: e.target.value })}
                        required
                      >
                        <option value="Non-cumulative & Monthly">Non-cumulative & Monthly</option>
                      </select>
                    </div>
                    <div className="form-group">
                      {/* Empty space for alignment */}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="form-section">
                  <h3 className="form-section-title">Additional Information</h3>
                  <div className="form-group">
                    <label>Description / Notes</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="4"
                      placeholder="Enter any additional notes or description"
                    />
                  </div>
                </div>

                {/* Upload Documents section - keeping unchanged as requested */}
                <div className="upload-section">
                  <h3>Upload Documents</h3>
                  
                  <div className="form-group">
                    <label>Term Sheet*</label>
                    <div 
                      className="file-upload-area"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'termSheet')}
                      onClick={() => document.getElementById('termSheet').click()}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="upload-content">
                        <HiOutlineDocumentText size={24} />
                        <div className="upload-text">
                          <p>Click to upload or drag and drop file here</p>
                          <p className="file-limit">Limit 200MB per file • PDF</p>
                        </div>
                        <input
                          type="file"
                          id="termSheet"
                          accept=".pdf"
                          onChange={(e) => handleFileInput(e, 'termSheet')}
                          style={{ display: 'none' }}
                        />
                      </div>
                      {formData.termSheet && (
                        <div className="file-selected">
                          <span>✓ {formData.termSheet.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Offer Document*</label>
                    <div 
                      className="file-upload-area"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'offerDocument')}
                      onClick={() => document.getElementById('offerDocument').click()}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="upload-content">
                        <HiOutlineDocumentText size={24} />
                        <div className="upload-text">
                          <p>Click to upload or drag and drop file here</p>
                          <p className="file-limit">Limit 200MB per file • PDF</p>
                        </div>
                        <input
                          type="file"
                          id="offerDocument"
                          accept=".pdf"
                          onChange={(e) => handleFileInput(e, 'offerDocument')}
                          style={{ display: 'none' }}
                        />
                      </div>
                      {formData.offerDocument && (
                        <div className="file-selected">
                          <span>✓ {formData.offerDocument.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Board Resolution*</label>
                    <div 
                      className="file-upload-area"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'boardResolution')}
                      onClick={() => document.getElementById('boardResolution').click()}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="upload-content">
                        <HiOutlineDocumentText size={24} />
                        <div className="upload-text">
                          <p>Click to upload or drag and drop file here</p>
                          <p className="file-limit">Limit 200MB per file • PDF</p>
                        </div>
                        <input
                          type="file"
                          id="boardResolution"
                          accept=".pdf"
                          onChange={(e) => handleFileInput(e, 'boardResolution')}
                          style={{ display: 'none' }}
                        />
                      </div>
                      {formData.boardResolution && (
                        <div className="file-selected">
                          <span>✓ {formData.boardResolution.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    Save Series
                  </button>
                </div>
              </form>
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

export default NCDSeries;

