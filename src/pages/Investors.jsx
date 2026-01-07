import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Layout from '../components/Layout';
import './Investors.css';
import { MdOutlineFileDownload } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { FiFilter } from "react-icons/fi";
import { FaEye } from "react-icons/fa";
import { TiUserAdd } from "react-icons/ti";
import { HiOutlineDocumentText } from "react-icons/hi";
import { FiUpload } from "react-icons/fi";



const Investors = () => {
  const navigate = useNavigate();
  const { investors, getTotalInvestors, getKYCCompleted, getKYCRejected, getPendingKYC, addInvestor } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddInvestorModal, setShowAddInvestorModal] = useState(false);
  const [formData, setFormData] = useState({
    // Applicant's Personal Information
    fullName: '',
    email: '',
    residentialAddress: '',
    correspondenceAddress: '',
    pan: 'ABCDE1234F',
    aadhaar: '1234 5678 9012',
    dob: '',
    
    // Bank Details
    bankName: '',
    accountNumber: '1234567890123456',
    ifscCode: 'SBIN0001234',
    
    // Investment Information
    investmentAmount: '',
    paymentMode: 'NEFT',
    transferDate: '',
    
    // KYC Information
    occupation: '',
    sourceOfFunds: '',
    
    // Nomination (Optional)
    nomineeName: '',
    nomineeRelationship: '',
    nomineeMobile: '+91 ',
    nomineeEmail: '',
    nomineeAddress: '',
    
    // System fields
    phone: '+91 ',
    kycStatus: 'Pending',
    active: true,
    
    // Document uploads
    panDocument: null,
    aadhaarDocument: null,
    cancelledCheque: null,
    form15G15H: null,
    digitalSignature: null
  });

  const totalInvestors = getTotalInvestors();
  const kycCompleted = getKYCCompleted();
  const kycPending = getPendingKYC();
  const kycRejected = getKYCRejected();

  const filteredInvestors = useMemo(() => {
    return investors.filter(investor => {
      const matchesSearch = 
        investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.investorId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' || investor.kycStatus === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [investors, searchTerm, filterStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'completed';
      case 'Pending':
        return 'pending';
      case 'Rejected':
        return 'rejected';
      default:
        return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Completed':
        return 'Completed';
      case 'Pending':
        return 'Pending ';  // Add space to match length
      case 'Rejected':
        return 'Rejected ';  // Add space to match length
      default:
        return status;
    }
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Name', 'Investor ID', 'Email', 'Phone', 'Series', 'Investment', 'KYC Status', 'Date Joined'];
    const rows = filteredInvestors.map(inv => [
      inv.name,
      inv.investorId,
      inv.email,
      inv.phone,
      inv.series.join(', '),
      inv.investment,
      inv.kycStatus,
      inv.dateJoined
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'investors.csv';
    a.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  const handleFileInput = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  const generateInvestorId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newInvestor = {
      name: formData.fullName,
      investorId: generateInvestorId(),
      email: formData.email,
      phone: formData.phone,
      pan: formData.pan,
      dob: formData.dob,
      address: formData.residentialAddress,
      kycStatus: formData.kycStatus,
      active: formData.active,
      series: [],
      investment: parseInt(formData.investmentAmount) || 0,
      dateJoined: new Date().toLocaleDateString('en-GB')
    };
    addInvestor(newInvestor);
    setShowAddInvestorModal(false);
    // Reset form
    setFormData({
      fullName: '',
      email: '',
      residentialAddress: '',
      correspondenceAddress: '',
      pan: 'ABCDE1234F',
      aadhaar: '1234 5678 9012',
      dob: '',
      bankName: '',
      accountNumber: '1234567890123456',
      ifscCode: 'SBIN0001234',
      investmentAmount: '',
      paymentMode: 'NEFT',
      transferDate: '',
      occupation: '',
      sourceOfFunds: '',
      nomineeName: '',
      nomineeRelationship: '',
      nomineeMobile: '+91 ',
      nomineeEmail: '',
      nomineeAddress: '',
      phone: '+91 ',
      kycStatus: 'Pending',
      active: true,
      panDocument: null,
      aadhaarDocument: null,
      cancelledCheque: null,
      form15G15H: null,
      digitalSignature: null
    });
  };

  return (
    <Layout>
      <div className="investors-page">
        <div className="investors-header">
          <div>
            <h1 className="page-title">Investors</h1>
            <p className="page-subtitle">Manage investor profiles and KYC status.</p>
          </div>
          <button className="add-investor-button" onClick={() => setShowAddInvestorModal(true)}>
            <TiUserAdd size={20} /> Add Investor
          </button>
        </div>

        <div className="investors-summary-cards">
          <div className="summary-card">
            <p className="card-label">Total Investors</p>
            <h2 className="card-value">{totalInvestors}</h2>
          </div>
          <div className="summary-card green">
            <p className="card-label">KYC Completed</p>
            <h2 className="card-value">{kycCompleted}</h2>
          </div>
          <div className="summary-card orange">
            <p className="card-label">KYC Pending</p>
            <h2 className="card-value">{getPendingKYC()}</h2>
          </div>
          <div className="summary-card red">
            <p className="card-label">KYC Rejected</p>
            <h2 className="card-value">{kycRejected}</h2>
          </div>
        </div>

        <div className="investors-table-section">
          <div className="table-header">
            <h3 className="section-title">All Investors</h3>
            <div className="table-actions">
              <div className="search-container">
                <FiSearch size={16} />
                <input
                  type="text"
                  placeholder="Search investors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <button className="filter-button">
                <FiFilter size={16} />
              </button>
              <button onClick={handleExport} className="export-button">
                <MdOutlineFileDownload size={18} /> Export
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="investors-table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Contact</th>
                  <th>Series</th>
                  <th>Investment</th>
                  <th>KYC Status</th>
                  <th>Date Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvestors.map((investor) => (
                  <tr key={investor.id} className="investor-row">
  <td colSpan={7} className="scroll-row-cell">
    <div className="scroll-row-wrapper">
      <div className="scroll-row-content">

        {/* Investor */}
        <div className="cell investor">
          <div className="investor-name">{investor.name}</div>
          <div className="investor-id" style={{marginTop:"4px"}}>{investor.investorId}</div>
        </div>

        {/* Contact */}
        <div className="cell contact">
          <div>{investor.email}</div>
          <div className="phone">{investor.phone}</div>
        </div>

        {/* Series */}
        <div className="cell series">
          <div className="series-tags">
            {investor.series.map((s, idx) => (
              <span key={idx} className="series-tag">{s}</span>
            ))}
          </div>
        </div>

        {/* Investment */}
        <div className="cell investment">
          ₹{investor.investment.toLocaleString('en-IN')}
        </div>

        {/* KYC */}
        <div className="cell kyc">
          <span className={`status-badge ${getStatusColor(investor.kycStatus)}`}>
            {getStatusText(investor.kycStatus)}
          </span>
        </div>

        {/* Date */}
        <div className="cell date">
          {investor.dateJoined}
        </div>

        {/* Action */}
        <div className="cell action">
          <button
            className="view-button"
            onClick={() => navigate(`/investors/${investor.id}`)}
          >
            <FaEye size={16} /> View
          </button>
        </div>

      </div>
    </div>
  </td>
</tr>

                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile-friendly card layout */}
          <div className="mobile-investors-list">
            {filteredInvestors.map((investor) => (
              <div key={investor.id} className="mobile-investor-card">
                <div className="mobile-card-header">
                  <div className="mobile-investor-info">
                    <h4>{investor.name}</h4>
                    <span className="investor-id">{investor.investorId}</span>
                  </div>
                  <span className={`status-badge ${getStatusColor(investor.kycStatus)}`}>
                    {getStatusText(investor.kycStatus)}
                  </span>
                </div>
                
                <div className="mobile-card-details">
                  <div className="mobile-detail-item">
                    <span className="mobile-detail-label">Contact</span>
                    <div className="mobile-detail-value">
                      <div>{investor.email}</div>
                      <div style={{fontSize: '11px', color: '#64748b'}}>{investor.phone}</div>
                    </div>
                  </div>
                  
                  <div className="mobile-detail-item">
                    <span className="mobile-detail-label">Investment</span>
                    <span className="mobile-detail-value mobile-investment">
                      ₹{investor.investment.toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div className="mobile-detail-item">
                    <span className="mobile-detail-label">Series</span>
                    <div className="mobile-series-tags">
                      {investor.series.map((s, idx) => (
                        <span key={idx} className="series-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mobile-detail-item">
                    <span className="mobile-detail-label">Joined</span>
                    <span className="mobile-detail-value">{investor.dateJoined}</span>
                  </div>
                </div>
                
                <div className="mobile-card-footer">
                  <span className="mobile-date">Last updated: {investor.dateJoined}</span>
                  <button
                    className="mobile-view-button"
                    onClick={() => navigate(`/investors/${investor.id}`)}
                  >
                    <FaEye size={12} /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showAddInvestorModal && (
          <div className="modal-overlay" onClick={() => setShowAddInvestorModal(false)}>
            <div className="modal-content investor-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-with-icon">
                  <HiOutlineDocumentText size={24} className="title-icon" />
                  <h2>Onboard New Investor</h2>
                </div>
                <button 
                  className="close-button"
                  onClick={() => setShowAddInvestorModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="create-form investor-form">
                
                {/* Applicant's Personal Information */}
                <div className="form-section">
                  <h3 className="section-title">Applicant's Personal Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name*</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email ID*</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Birth*</label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number*</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (!value.startsWith('+91 ')) {
                            value = '+91 ' + value.replace(/^\+91\s*/, '');
                          }
                          setFormData({ ...formData, phone: value });
                        }}
                        required
                        placeholder="+91 Enter mobile number"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Residential Address*</label>
                      <textarea
                        value={formData.residentialAddress}
                        onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                        required
                        placeholder="Enter residential address"
                        rows="3"
                      />
                    </div>
                    <div className="form-group">
                      <label>Correspondence Address (if different)</label>
                      <textarea
                        value={formData.correspondenceAddress}
                        onChange={(e) => setFormData({ ...formData, correspondenceAddress: e.target.value })}
                        placeholder="Enter correspondence address or leave blank if same as residential"
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>PAN (Permanent Account Number)*</label>
                      <input
                        type="text"
                        value={formData.pan}
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                        required
                        placeholder="ABCDE1234F"
                        onFocus={(e) => {
                          if (e.target.value === 'ABCDE1234F') {
                            setFormData({ ...formData, pan: '' });
                          }
                        }}
                        style={{ 
                          color: formData.pan === 'ABCDE1234F' ? '#9ca3af' : '#1e293b',
                          fontStyle: formData.pan === 'ABCDE1234F' ? 'italic' : 'normal'
                        }}
                        maxLength="10"
                      />
                    </div>
                    <div className="form-group">
                      <label>Aadhaar Number*</label>
                      <input
                        type="text"
                        value={formData.aadhaar}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          value = value.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
                          setFormData({ ...formData, aadhaar: value });
                        }}
                        required
                        placeholder="1234 5678 9012"
                        onFocus={(e) => {
                          if (e.target.value === '1234 5678 9012') {
                            setFormData({ ...formData, aadhaar: '' });
                          }
                        }}
                        style={{ 
                          color: formData.aadhaar === '1234 5678 9012' ? '#9ca3af' : '#1e293b',
                          fontStyle: formData.aadhaar === '1234 5678 9012' ? 'italic' : 'normal'
                        }}
                        maxLength="14"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="form-section">
                  <h3 className="section-title">Bank Details for Interest/Redemption Payments</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Bank Name*</label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        required
                        placeholder="Enter bank name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Account Number*</label>
                      <input
                        type="text"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        required
                        placeholder="1234567890123456"
                        onFocus={(e) => {
                          if (e.target.value === '1234567890123456') {
                            setFormData({ ...formData, accountNumber: '' });
                          }
                        }}
                        style={{ 
                          color: formData.accountNumber === '1234567890123456' ? '#9ca3af' : '#1e293b',
                          fontStyle: formData.accountNumber === '1234567890123456' ? 'italic' : 'normal'
                        }}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>IFSC Code*</label>
                      <input
                        type="text"
                        value={formData.ifscCode}
                        onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                        required
                        placeholder="SBIN0001234"
                        onFocus={(e) => {
                          if (e.target.value === 'SBIN0001234') {
                            setFormData({ ...formData, ifscCode: '' });
                          }
                        }}
                        style={{ 
                          color: formData.ifscCode === 'SBIN0001234' ? '#9ca3af' : '#1e293b',
                          fontStyle: formData.ifscCode === 'SBIN0001234' ? 'italic' : 'normal'
                        }}
                        maxLength="11"
                      />
                    </div>
                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.active}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                          className="active-checkbox"
                        />
                        <span>Active Account</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Investment Information */}
                <div className="form-section">
                  <h3 className="section-title">Investment Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Amount to be Invested (in multiples of INR 1,00,000/-)*</label>
                      <input
                        type="number"
                        value={formData.investmentAmount}
                        onChange={(e) => setFormData({ ...formData, investmentAmount: e.target.value })}
                        required
                        placeholder="100000"
                        min="100000"
                        step="100000"
                      />
                    </div>
                    <div className="form-group">
                      <label>Mode of Payment*</label>
                      <select
                        value={formData.paymentMode}
                        onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                        required
                      >
                        <option value="NEFT">NEFT</option>
                        <option value="RTGS">RTGS</option>
                        <option value="Cheque">Cheque</option>
                        <option value="DD">Demand Draft</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Transfer (DD-MM-YYYY)*</label>
                      <input
                        type="date"
                        value={formData.transferDate}
                        onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>KYC Status</label>
                      <select
                        value={formData.kycStatus}
                        onChange={(e) => setFormData({ ...formData, kycStatus: e.target.value })}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Know Your Customer (KYC) */}
                <div className="form-section">
                  <h3 className="section-title">Know Your Customer (KYC)</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Occupation*</label>
                      <input
                        type="text"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        required
                        placeholder="Enter occupation"
                      />
                    </div>
                    <div className="form-group">
                      <label>Source of Funds*</label>
                      <select
                        value={formData.sourceOfFunds}
                        onChange={(e) => setFormData({ ...formData, sourceOfFunds: e.target.value })}
                        required
                      >
                        <option value="">Select source of funds</option>
                        <option value="Salary">Salary</option>
                        <option value="Business Income">Business Income</option>
                        <option value="Investment Returns">Investment Returns</option>
                        <option value="Inheritance">Inheritance</option>
                        <option value="Gift">Gift</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Nomination (Optional) */}
                <div className="form-section">
                  <h3 className="section-title">Nomination (Optional)</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name of Nominee</label>
                      <input
                        type="text"
                        value={formData.nomineeName}
                        onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                        placeholder="Enter nominee name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Relationship with Subscriber</label>
                      <select
                        value={formData.nomineeRelationship}
                        onChange={(e) => setFormData({ ...formData, nomineeRelationship: e.target.value })}
                      >
                        <option value="">Select relationship</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Mobile No</label>
                      <input
                        type="tel"
                        value={formData.nomineeMobile}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (!value.startsWith('+91 ')) {
                            value = '+91 ' + value.replace(/^\+91\s*/, '');
                          }
                          setFormData({ ...formData, nomineeMobile: value });
                        }}
                        placeholder="+91 Enter nominee mobile number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Id</label>
                      <input
                        type="email"
                        value={formData.nomineeEmail}
                        onChange={(e) => setFormData({ ...formData, nomineeEmail: e.target.value })}
                        placeholder="Enter nominee email"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Address</label>
                      <textarea
                        value={formData.nomineeAddress}
                        onChange={(e) => setFormData({ ...formData, nomineeAddress: e.target.value })}
                        placeholder="Enter nominee address"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                <div className="upload-section">
                  <h3 className="section-title">Attachments</h3>
                  <div className="upload-grid">
                    <div className="upload-item">
                      <label>PAN Document (Mandatory)*</label>
                      <div className="upload-wrapper">
                        <div 
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'panDocument')}
                        >
                          <div className="upload-content">
                            <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Drag and drop PAN document here</p>
                              <p className="file-limit">Limit 200MB per file</p>
                              <p className="file-limit">PDF, PNG, JPG, JPEG</p>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          id="panDocument"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileInput(e, 'panDocument')}
                          style={{ display: 'none' }}
                          required
                        />
                        <button
                          type="button"
                          className="browse-button"
                          onClick={() => document.getElementById('panDocument').click()}
                        >
                          Browse files
                        </button>
                      </div>
                      {formData.panDocument && (
                        <div className="file-selected">{formData.panDocument.name}</div>
                      )}
                    </div>

                    <div className="upload-item">
                      <label>Aadhaar Document (Mandatory)*</label>
                      <div className="upload-wrapper">
                        <div 
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'aadhaarDocument')}
                        >
                          <div className="upload-content">
                            <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Drag and drop Aadhaar document here</p>
                              <p className="file-limit">Limit 200MB per file</p>
                              <p className="file-limit">PDF, PNG, JPG, JPEG</p>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          id="aadhaarDocument"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileInput(e, 'aadhaarDocument')}
                          style={{ display: 'none' }}
                          required
                        />
                        <button
                          type="button"
                          className="browse-button"
                          onClick={() => document.getElementById('aadhaarDocument').click()}
                        >
                          Browse files
                        </button>
                      </div>
                      {formData.aadhaarDocument && (
                        <div className="file-selected">{formData.aadhaarDocument.name}</div>
                      )}
                    </div>

                    <div className="upload-item">
                      <label>Cancelled Cheque (Mandatory)*</label>
                      <div className="upload-wrapper">
                        <div 
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'cancelledCheque')}
                        >
                          <div className="upload-content">
                            <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Drag and drop cancelled cheque here</p>
                              <p className="file-limit">Limit 200MB per file</p>
                              <p className="file-limit">PDF, PNG, JPG, JPEG</p>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          id="cancelledCheque"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileInput(e, 'cancelledCheque')}
                          style={{ display: 'none' }}
                          required
                        />
                        <button
                          type="button"
                          className="browse-button"
                          onClick={() => document.getElementById('cancelledCheque').click()}
                        >
                          Browse files
                        </button>
                      </div>
                      {formData.cancelledCheque && (
                        <div className="file-selected">{formData.cancelledCheque.name}</div>
                      )}
                    </div>

                    <div className="upload-item">
                      <label>Form 15G/15H (Optional)</label>
                      <div className="upload-wrapper">
                        <div 
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'form15G15H')}
                        >
                          <div className="upload-content">
                            <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Drag and drop Form 15G/15H here</p>
                              <p className="file-limit">Limit 200MB per file</p>
                              <p className="file-limit">PDF, PNG, JPG, JPEG</p>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          id="form15G15H"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileInput(e, 'form15G15H')}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="browse-button"
                          onClick={() => document.getElementById('form15G15H').click()}
                        >
                          Browse files
                        </button>
                      </div>
                      {formData.form15G15H && (
                        <div className="file-selected">{formData.form15G15H.name}</div>
                      )}
                    </div>

                    <div className="upload-item">
                      <label>Digital Signature*</label>
                      <div className="upload-wrapper">
                        <div 
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'digitalSignature')}
                        >
                          <div className="upload-content">
                            <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Drag and drop digital signature here</p>
                              <p className="file-limit">Limit 200MB per file</p>
                              <p className="file-limit">PNG, JPG, JPEG</p>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          id="digitalSignature"
                          accept=".png,.jpg,.jpeg"
                          onChange={(e) => handleFileInput(e, 'digitalSignature')}
                          style={{ display: 'none' }}
                          required
                        />
                        <button
                          type="button"
                          className="browse-button"
                          onClick={() => document.getElementById('digitalSignature').click()}
                        >
                          Browse files
                        </button>
                      </div>
                      {formData.digitalSignature && (
                        <div className="file-selected">{formData.digitalSignature.name}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Declaration */}
                <div className="form-section declaration-section">
                  <h3 className="section-title">Declaration</h3>
                  <div className="declaration-text">
                    <p>
                      I hereby declare that the information provided above is true and correct to the best of my knowledge and belief. 
                      I undertake to inform the company of any changes in the above details promptly. I also authorize the company 
                      to use my bank account details for interest/redemption payments related to the Non-Convertible Debentures issue.
                    </p>
                  </div>
                  <div className="declaration-checkbox">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        required
                        className="active-checkbox"
                      />
                      <span>I agree to the above declaration</span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={() => setShowAddInvestorModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-button create-investor-button">
                    <TiUserAdd size={18} /> Create Investor
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

export default Investors;

