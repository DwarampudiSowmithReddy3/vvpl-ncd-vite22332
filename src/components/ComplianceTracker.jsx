import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ComplianceTracker.css';
import { 
  HiOutlineDownload,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineDocumentText,
  HiOutlineUpload,
  HiOutlineShieldCheck
} from 'react-icons/hi';
import { 
  MdNotifications,
  MdTrendingUp,
  MdAccountBalance,
  MdClose
} from 'react-icons/md';

const ComplianceTracker = ({ onClose, seriesData = null }) => {
  const navigate = useNavigate();
  
  // Default data structure - can be replaced with props for scalability
  const defaultSeriesData = {
    seriesName: 'Series C Issue',
    trusteeCompany: 'SBICAP Trustee Co. Ltd.',
    stats: {
      totalRequirements: 42,
      receivedCompleted: 12,
      pendingActions: 15,
      notApplicable: 15
    }
  };

  const currentSeries = seriesData || defaultSeriesData;

  // State for modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportSections, setExportSections] = useState({
    preCompliance: true,
    postCompliance: true,
    recurringCompliances: true,
    statistics: true
  });
  const [documentForm, setDocumentForm] = useState({
    title: '',
    category: 'pre-compliance',
    file: null,
    description: '',
    legalReference: ''
  });
  const preComplianceItems = [
    {
      document: 'Consent Letter (Accepted Copy)',
      legalReference: 'Internal Protocol',
      status: 'RECEIVED'
    },
    {
      document: 'CTC of MoA and AoA of the company',
      legalReference: 'Companies Act, 2013',
      status: 'IN RECORDS'
    },
    {
      document: 'Board Resolution appointing SBICAP Trustee Company Limited',
      legalReference: 'Section 179 (3) (c)',
      status: 'RECEIVED'
    },
    {
      document: 'Special Resolution to borrow money & charge assets',
      legalReference: 'Section 180 (1) (c) & (a)',
      status: 'RECEIVED'
    },
    {
      document: 'Capital Structure Certification (Authorized/Paid-up)',
      legalReference: 'Issuer Compliance',
      status: 'PENDING'
    },
    {
      document: 'Debenture Trustee Agreement (DTA) Execution',
      legalReference: 'Must be 1 day prior to issue',
      status: 'PENDING'
    }
  ];

  const criticalDeadlines = [
    {
      title: 'Debenture Trust Deed (DTD)',
      subtitle: 'Execution within 2 months',
      status: 'PENDING'
    },
    {
      title: 'Security Document Filing (CHG-9)',
      subtitle: 'MCA Filing within 30 days',
      status: 'PENDING'
    },
    {
      title: 'CERSAI Registration',
      subtitle: 'Within 30 days of execution',
      status: 'PENDING'
    }
  ];

  const allotmentStatus = [
    {
      title: 'E-form PAS-3 (Return of Allotment)',
      subtitle: 'Companies Rules, 2014',
      completed: true
    },
    {
      title: 'List of Allottees (Benpos)',
      subtitle: 'Final Record',
      completed: true
    },
    {
      title: 'Utilization Certificate',
      subtitle: 'Practicing CA Certificate',
      completed: false,
      status: 'Not Started'
    }
  ];

  const ongoingObligations = [
    {
      icon: <MdNotifications />,
      title: 'Interest Payment Confirmations',
      subtitle: 'Due for every Tranche payment.',
      color: '#8b5cf6'
    },
    {
      icon: <MdTrendingUp />,
      title: 'Quarterly Report to Trustee',
      subtitle: 'Format to be shared by STCL.',
      color: '#8b5cf6'
    },
    {
      icon: <MdAccountBalance />,
      title: 'Debenture Redemption Reserve',
      subtitle: 'Annual CA Certification required.',
      color: '#8b5cf6'
    }
  ];

  // Handler functions
  const handleExportReport = () => {
    setShowExportModal(true);
  };

  const handleAddDocument = () => {
    setShowAddDocumentModal(true);
  };

  const handleExportSubmit = () => {
    // Simulate export process
    const selectedSections = Object.keys(exportSections).filter(key => exportSections[key]);
    console.log(`Exporting ${exportFormat.toUpperCase()} report for ${currentSeries.seriesName}`);
    console.log('Selected sections:', selectedSections);
    
    // In real implementation, this would trigger actual export
    alert(`Exporting ${exportFormat.toUpperCase()} report for ${currentSeries.seriesName}...`);
    setShowExportModal(false);
  };

  const handleDocumentSubmit = (e) => {
    e.preventDefault();
    if (!documentForm.title || !documentForm.file) {
      alert('Please fill in all required fields and select a file.');
      return;
    }

    // Simulate document upload
    console.log('Uploading document:', documentForm);
    alert(`Document "${documentForm.title}" uploaded successfully!`);
    
    // Reset form
    setDocumentForm({
      title: '',
      category: 'pre-compliance',
      file: null,
      description: '',
      legalReference: ''
    });
    setShowAddDocumentModal(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setDocumentForm({ ...documentForm, file });
  };

  const handleSeriesClick = () => {
    // Map compliance series names to actual series IDs that SeriesDetails expects
    const seriesNameToIdMap = {
      'Series A NCD': '1',
      'Series B NCD': '2', 
      'Series C NCD': '3',
      'Series D NCD': '4',
      'Series E NCD': '1', // Map to existing series for demo
      'Series F NCD': '2',
      'Series G NCD': '3',
      'Series H NCD': '4',
      'Series I NCD': '1',
      'Series J NCD': '2',
      'Series K NCD': '3',
      'Series L NCD': '4',
      'Series M NCD': '1'
    };
    
    // Get the series ID from the mapping, default to '1' if not found
    const seriesId = seriesNameToIdMap[currentSeries.seriesName] || '1';
    
    navigate(`/ncd-series/${seriesId}`);
    onClose(); // Close the compliance tracker
  };

  return (
    <div className="compliance-tracker-overlay">
      <div className="compliance-tracker">
        {/* Navigation Header */}
        <nav className="compliance-nav">
          <div className="nav-left">
            <div className="nav-icon-blue">
              <HiOutlineShieldCheck size={18} />
            </div>
          </div>
          <div className="nav-center">
            <button className="series-name-box" onClick={handleSeriesClick}>
              <span className="series-name-text">{currentSeries.seriesName}</span>
            </button>
            <span className="nav-separator">|</span>
            <span className="nav-text-dark">{currentSeries.trusteeCompany}</span>
          </div>
          <button className="close-tracker" onClick={onClose}>
            <HiOutlineX size={18} />
          </button>
        </nav>

        {/* Main Content */}
        <div className="tracker-content">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-left">
              <h1>Compliance Checklist</h1>
              <p>Secured Unlisted Debenture/Bond Issue Tracking</p>
            </div>
            <div className="hero-actions">
              <button className="btn-outlined" onClick={handleExportReport}>
                <HiOutlineDownload size={16} />
                Export Report
              </button>
              <button className="btn-solid" onClick={handleAddDocument}>
                <HiOutlinePlus size={16} />
                Add Document
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-label">Total Requirements</div>
              <div className="stat-number">{currentSeries.stats.totalRequirements}</div>
            </div>
            <div className="stat-card with-green-border">
              <div className="stat-label">Received / Completed</div>
              <div className="stat-number green">{currentSeries.stats.receivedCompleted}</div>
            </div>
            <div className="stat-card with-yellow-border">
              <div className="stat-label">Pending Actions</div>
              <div className="stat-number yellow">{currentSeries.stats.pendingActions}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Not Applicable</div>
              <div className="stat-number gray">{currentSeries.stats.notApplicable}</div>
            </div>
          </div>

          {/* Phase 1: Pre-Compliance */}
          <div className="phase-section">
            <div className="phase-header">
              <span className="phase-number blue">1</span>
              <h2 className="phase-title">Pre-Compliance Phase</h2>
            </div>
            
            <div className="compliance-table">
              <div className="table-header">
                <div className="header-cell">Document / Compliance Requirement</div>
                <div className="header-cell">Legal Reference</div>
                <div className="header-cell">Status</div>
              </div>
              
              {preComplianceItems.map((item, index) => (
                <div key={index} className="table-row">
                  <div className="table-cell">{item.document}</div>
                  <div className="table-cell legal-ref">{item.legalReference}</div>
                  <div className="table-cell">
                    <span className={`status-badge ${item.status.toLowerCase().replace(' ', '-')}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phase 2: Post-Compliance */}
          <div className="phase-section">
            <div className="phase-header">
              <span className="phase-number orange">2</span>
              <h2 className="phase-title">Post-Compliance Phase</h2>
            </div>
            
            <div className="two-column-section">
              <div className="left-column">
                <div className="section-header">
                  <span className="section-icon orange">⚠️</span>
                  <h3>Critical Deadlines</h3>
                </div>
                
                {criticalDeadlines.map((item, index) => (
                  <div key={index} className="deadline-item">
                    <div className="deadline-content">
                      <div className="deadline-title">{item.title}</div>
                      <div className="deadline-subtitle">{item.subtitle}</div>
                    </div>
                    <span className="status-badge pending">{item.status}</span>
                  </div>
                ))}
              </div>
              
              <div className="right-column">
                <div className="section-header">
                  <span className="section-icon green">✅</span>
                  <h3>Allotment & Filing Status</h3>
                </div>
                
                {allotmentStatus.map((item, index) => (
                  <div key={index} className="allotment-item">
                    <div className="allotment-content">
                      <div className="allotment-title">{item.title}</div>
                      <div className="allotment-subtitle">{item.subtitle}</div>
                    </div>
                    {item.completed ? (
                      <span className="check-icon">✅</span>
                    ) : (
                      <span className="status-badge not-started">{item.status}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Phase 3: Recurring Compliances */}
          <div className="phase-section">
            <div className="phase-header">
              <span className="phase-number purple">3</span>
              <h2 className="phase-title">Recurring Compliances</h2>
            </div>
            
            <div className="ongoing-section">
              <div className="ongoing-header">
                <div className="ongoing-icon">📅</div>
                <div className="ongoing-content">
                  <h3>Ongoing Obligations</h3>
                  <p>These requirements trigger after the issue is completed and remain active throughout the NCD tenure.</p>
                </div>
              </div>
              
              <div className="obligations-grid">
                {ongoingObligations.map((item, index) => (
                  <div key={index} className="obligation-card">
                    <div className="obligation-icon">
                      {item.icon}
                    </div>
                    <div className="obligation-content">
                      <div className="obligation-title">{item.title}</div>
                      <div className="obligation-subtitle">{item.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Export Report Modal */}
        {showExportModal && (
          <div className="modal-overlay">
            <div className="modal-content export-modal">
              <div className="modal-header">
                <h3>Export Compliance Report</h3>
                <button className="modal-close" onClick={() => setShowExportModal(false)}>
                  <HiOutlineX size={20} />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Export Format</label>
                  <select 
                    value={exportFormat} 
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="form-select"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="word">Word Document</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Include Sections</label>
                  <div className="checkbox-group">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={exportSections.statistics}
                        onChange={(e) => setExportSections({...exportSections, statistics: e.target.checked})}
                      />
                      <span>Statistics Summary</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={exportSections.preCompliance}
                        onChange={(e) => setExportSections({...exportSections, preCompliance: e.target.checked})}
                      />
                      <span>Pre-Compliance Phase</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={exportSections.postCompliance}
                        onChange={(e) => setExportSections({...exportSections, postCompliance: e.target.checked})}
                      />
                      <span>Post-Compliance Phase</span>
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={exportSections.recurringCompliances}
                        onChange={(e) => setExportSections({...exportSections, recurringCompliances: e.target.checked})}
                      />
                      <span>Recurring Compliances</span>
                    </label>
                  </div>
                </div>

                <div className="export-info">
                  <HiOutlineDocumentText size={16} />
                  <span>Report will be generated for {currentSeries.seriesName}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowExportModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleExportSubmit}>
                  <HiOutlineDownload size={16} />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Document Modal */}
        {showAddDocumentModal && (
          <div className="modal-overlay">
            <div className="modal-content add-document-modal">
              <div className="modal-header">
                <h3>Add Compliance Document</h3>
                <button className="modal-close" onClick={() => setShowAddDocumentModal(false)}>
                  <HiOutlineX size={20} />
                </button>
              </div>
              
              <form onSubmit={handleDocumentSubmit} className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Document Title *</label>
                    <input
                      type="text"
                      value={documentForm.title}
                      onChange={(e) => setDocumentForm({...documentForm, title: e.target.value})}
                      placeholder="Enter document title"
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select 
                      value={documentForm.category} 
                      onChange={(e) => setDocumentForm({...documentForm, category: e.target.value})}
                      className="form-select"
                      required
                    >
                      <option value="pre-compliance">Pre-Compliance</option>
                      <option value="post-compliance">Post-Compliance</option>
                      <option value="recurring">Recurring Compliance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Legal Reference</label>
                  <input
                    type="text"
                    value={documentForm.legalReference}
                    onChange={(e) => setDocumentForm({...documentForm, legalReference: e.target.value})}
                    placeholder="e.g., Companies Act 2013, Section 42"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={documentForm.description}
                    onChange={(e) => setDocumentForm({...documentForm, description: e.target.value})}
                    placeholder="Brief description of the document"
                    className="form-textarea"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Upload Document *</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="file-input"
                      id="document-file"
                      required
                    />
                    <label htmlFor="document-file" className="file-upload-label">
                      <HiOutlineUpload size={24} />
                      <span>
                        {documentForm.file ? documentForm.file.name : 'Click to upload or drag and drop'}
                      </span>
                      <small>PDF, DOC, DOCX, JPG, PNG (Max 10MB)</small>
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setShowAddDocumentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <HiOutlinePlus size={16} />
                    Add Document
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceTracker;