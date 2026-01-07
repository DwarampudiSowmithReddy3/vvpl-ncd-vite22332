import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Layout from '../components/Layout';
import './NCDSeries.css';
import { HiOutlineEye } from "react-icons/hi";
import { HiOutlineDocumentText } from "react-icons/hi";



const NCDSeries = () => {
  const navigate = useNavigate();
  const { series, addSeries } = useData();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    seriesCode: '',
    interestRate: '',
    couponRate: '',
    interestFrequency: 'MONTHLY',
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
    
    const maturityDate = parseDate(s.maturityDate);
    const releaseDate = parseDate(s.releaseDate);

    if (maturityDate && maturityDate < today) {
      return { status: 'expired', label: 'Expired', color: 'red' };
    }
    if (releaseDate && releaseDate > today) {
      return { status: 'upcoming', label: `Upcoming (${s.releaseDate})`, color: 'orange' };
    }
    return { status: 'active', label: 'Active', color: 'green' };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
      documents: {
        termSheet: formData.termSheet,
        offerDocument: formData.offerDocument,
        boardResolution: formData.boardResolution
      }
    };
    addSeries(newSeries);
    setShowCreateForm(false);
    setFormData({
      name: '',
      seriesCode: '',
      interestRate: '',
      couponRate: '',
      interestFrequency: 'MONTHLY',
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

  return (
    <Layout>
      <div className="ncd-series-page">
        <div className="series-header">
          <div>
            <h1 className="page-title">NCD Series</h1>
            <p className="page-subtitle">Manage all your non-convertible debenture series</p>
          </div>
          <button 
            className="create-button"
            onClick={() => setShowCreateForm(true)}
          >
            + Create New Series
          </button>
        </div>

        <div className="series-grid">
          {series.map((s) => {
            const statusInfo = getStatusInfo(s);
            const progress = (s.fundsRaised / s.targetAmount) * 100;
            return (
              <div key={s.id} className="series-card">
                <div className="card-header">
                  <h3 className="series-name">{s.name}</h3>
                  <div className="status-tags">
                    <span className={`status-tag ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="frequency-tag">{s.interestFrequency}</span>
                  </div>
                </div>
                <div className="interest-rate">
                  {s.interestRate}%
                </div>
                <div className="series-stats">
                  <span className="investors-count">{s.investors} investors</span>
                </div>
                <div className="funds-progress">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${statusInfo.color}`}
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
                <button 
                  className="view-details-button"
                  onClick={() => navigate(`/ncd-series/${s.id}`)}
                >
                  <HiOutlineEye size={18} /> View Details
                </button>
              </div>
            );
          })}
        </div>

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
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
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
                        value={formData.tenure}
                        onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                        required
                        placeholder="Enter tenure"
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
                </div>

                {/* Financial Information */}
                <div className="form-section">
                  <h3 className="form-section-title">Financial Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Face Value (₹)*</label>
                      <input
                        type="number"
                        value={formData.faceValue}
                        onChange={(e) => setFormData({ ...formData, faceValue: e.target.value })}
                        required
                        placeholder="Enter face value"
                      />
                    </div>
                    <div className="form-group">
                      <label>Minimum Investment (₹)*</label>
                      <input
                        type="number"
                        value={formData.minInvestment}
                        onChange={(e) => setFormData({ ...formData, minInvestment: e.target.value })}
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
                        value={formData.targetAmount}
                        onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                        required
                        placeholder="Enter target amount"
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Issue Size*</label>
                      <input
                        type="number"
                        value={formData.totalIssueSize}
                        onChange={(e) => setFormData({ ...formData, totalIssueSize: e.target.value })}
                        required
                        placeholder="Enter total issue size"
                      />
                    </div>
                  </div>
                </div>

                {/* Interest & Rating Information */}
                <div className="form-section">
                  <h3 className="form-section-title">Interest & Rating Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Coupon Rate (%)*</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.couponRate}
                        onChange={(e) => setFormData({ ...formData, couponRate: e.target.value })}
                        required
                        placeholder="Enter coupon rate"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Credit Rating*</label>
                        <select value={formData.creditRating}
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

                <div className="form-group">
                  <label>Interest Payment Frequency*</label>
                    <select
                      value={formData.interestFrequency}
                      onChange={(e) => setFormData({ ...formData, interestFrequency: e.target.value })}
                      required
                    >
                    <option value="ANNUAL">Annual</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
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
                    >
                      <div className="upload-content">
                        <HiOutlineDocumentText size={18} />
                        <div className="upload-text">
                          <p>Drag and drop file here</p>
                          <p className="file-limit">Limit 200MB per file • PDF</p>
                        </div>
                        <input
                          type="file"
                          id="termSheet"
                          accept=".pdf"
                          onChange={(e) => handleFileInput(e, 'termSheet')}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="browse-button"
                          onClick={() => document.getElementById('termSheet').click()}
                        >
                          Browse Files
                        </button>
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
                    >
                      <div className="upload-content">
                        <span className="upload-icon">
                        <HiOutlineDocumentText size={18} /></span>
                        <div className="upload-text">
                          <p>Drag and drop file here</p>
                          <p className="file-limit">Limit 200MB per file • PDF</p>
                        </div>
                        <input
                          type="file"
                          id="offerDocument"
                          accept=".pdf"
                          onChange={(e) => handleFileInput(e, 'offerDocument')}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="browse-button"
                          onClick={() => document.getElementById('offerDocument').click()}
                        >
                          Browse Files
                        </button>
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
                    >
                      <div className="upload-content">
                        <span className="upload-icon">
                         <HiOutlineDocumentText size={18} /></span>
                        <div className="upload-text">
                          <p>Drag and drop file here</p>
                          <p className="file-limit">Limit 200MB per file • PDF</p>
                        </div>
                        <input
                          type="file"
                          id="boardResolution"
                          accept=".pdf"
                          onChange={(e) => handleFileInput(e, 'boardResolution')}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="browse-button"
                          onClick={() => document.getElementById('boardResolution').click()}
                        >
                          Browse Files
                        </button>
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
                    ✕ Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    Save Series
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NCDSeries;

