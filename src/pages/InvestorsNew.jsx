import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './InvestorsNew.css';
import { MdOutlineFileDownload, MdTrendingUp } from "react-icons/md";
import { FiSearch, FiFilter } from "react-icons/fi";
import { FaEye } from "react-icons/fa";
import { TiUserAdd } from "react-icons/ti";
import { HiOutlineDocumentText, HiOutlineMail, HiOutlinePhone, HiOutlineCalendar, HiOutlineChartBar } from "react-icons/hi";
import { FiUpload } from "react-icons/fi";

const InvestorsNew = () => {
  const navigate = useNavigate();
  const { showCreateButton } = usePermissions();
  const { user } = useAuth();
  const { 
    investors, 
    series, 
    getTotalInvestors, 
    getKYCCompleted, 
    getKYCRejected, 
    getPendingKYC, 
    addInvestor, 
    updateInvestor, 
    updateSeries, 
    addAuditLog, 
    addInvestmentTransaction, 
    getSeriesStatus 
  } = useData();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddInvestorModal, setShowAddInvestorModal] = useState(false);
  const [showAddInvestmentModal, setShowAddInvestmentModal] = useStattton>
                  <button className="invest-button" onClick={handleInvestmentSubmit}>
                    Invest ₹{investmentAmount ? parseInt(investmentAmount).toLocaleString('en-IN') : '0'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default InvestorsNew;            {investmentDocument && (
                        <div className="investment-file-selected">
                          <span>✓ File selected: {investmentDocument.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button className="cancel-button" onClick={handleCloseInvestmentForm}>
                    Cancel
                  </bu"investment-file-formats">PDF, JPG, PNG, DOC (Max 10MB)</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        onChange={(e) => setInvestmentDocument(e.target.files[0])}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="file-input"
                        id="investment-document"
                        style={{ display: 'none' }}
                      />
          ntent">
                        <FiUpload size={28} className="investment-upload-icon" />
                        <div className="investment-upload-text">
                          <p className="investment-upload-main">
                            {investmentDocument ? investmentDocument.name : 'Click to upload payment receipt/document'}
                          </p>
                          <p className="investment-upload-subtitle">or drag and drop your file here</p>
                          <p className=                   />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Upload Payment Document *</label>
                    <div 
                      className="investment-file-upload-area"
                      onClick={() => document.getElementById('investment-document').click()}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="investment-upload-coInvestment Transferred *</label>
                      <input
                        type="date"
                        className="amount-input"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Date of Investment Received *</label>
                      <input
                        type="date"
                        className="amount-input"
                        required
              value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      placeholder={`Minimum ₹${selectedSeries.minInvestment.toLocaleString('en-IN')}`}
                      min={selectedSeries.minInvestment}
                      className="amount-input"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of                <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(selectedSeries.fundsRaised / selectedSeries.targetAmount) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="investment-form">
                  <div className="form-group">
                    <label>Investment Amount *</label>
                    <input
                      type="number"
                      <div className="summary-item">
                      <span>Minimum Investment:</span>
                      <span>₹{selectedSeries.minInvestment.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="funds-raised">
                    <div className="progress-info">
                      <span>Funds Raised: {formatCurrency(selectedSeries.fundsRaised)} / {formatCurrency(selectedSeries.targetAmount)}</span>
                    </div>
     v className="series-summary">
                  <h3>Series Details</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span>Interest Rate:</span>
                      <span>{selectedSeries.interestRate}%</span>
                    </div>
                    <div className="summary-item">
                      <span>Frequency:</span>
                      <span>{selectedSeries.interestFrequency}</span>
                    </div>
         l */}
        {showInvestmentForm && selectedSeries && (
          <div className="modal-overlay" onClick={handleCloseInvestmentForm}>
            <div className="modal-content investment-form-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Invest in {selectedSeries.name}</h2>
                <button className="close-button" onClick={handleCloseInvestmentForm}>×</button>
              </div>
              <div className="modal-body">
                <di                              </span>
                              <span className="status-dates">
                                {s.subscriptionStartDate} - {s.subscriptionEndDate}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Investment Form Modae="status-item">
                              <span className="status-series-name">{s.name}</span>
                              <span className={`status-badge ${getSeriesStatus(s)}`}>
                                {getSeriesStatus(s) === 'upcoming' && '⏳ Upcoming'}
                                {getSeriesStatus(s) === 'accepting' && '✅ Accepting'}
                                {getSeriesStatus(s) === 'active' && '🔒 Closed'}
                                {getSeriesStatus(s) === 'DRAFT' && '📝 Draft'}
pportunities Available</h3>
                    <p>Currently, there are no series accepting new investments. Please check back later or contact support for more information.</p>
                    
                    {series.length > 0 && (
                      <div className="series-status-overview">
                        <h4>Current Series Status</h4>
                        <div className="status-list">
                          {series.map(s => (
                            <div key={s.id} classNam                       );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="no-series-message">
                    <div className="no-series-icon">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                      </svg>
                    </div>
                    <h3>No Investment O      <div className="series-card-footer">
                              <button className="invest-now-button">
                                <span>Invest Now</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                               </div>
                                <div className="progress-amounts">
                                  <span className="raised-amount">₹{series.fundsRaised.toLocaleString('en-IN')} raised</span>
                                  <span className="target-amount">₹{series.targetAmount.toLocaleString('en-IN')} target</span>
                                </div>
                              </div>
                            </div>
                            
                                         <span className="progress-label">Funding Progress</span>
                                  <span className="progress-percentage">{progress.toFixed(1)}%</span>
                                </div>
                                <div className="progress-bar-container">
                                  <div className="progress-bar-track">
                                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                                  </div>
           </div>
                                <div className="info-item">
                                  <span className="info-label">Maturity Date</span>
                                  <span className="info-value">{series.maturityDate}</span>
                                </div>
                              </div>
                              
                              <div className="funding-progress-section">
                                <div className="progress-header">
               n className="info-value">₹{series.minInvestment.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Subscription Period</span>
                                  <span className="info-value subscription-dates">
                                    {series.subscriptionStartDate} to {series.subscriptionEndDate}
                                  </span>
                                           <div className="series-info-grid">
                                <div className="info-item">
                                  <span className="info-label">Frequency</span>
                                  <span className="info-value">{series.interestFrequency}</span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Min Investment</span>
                                  <spaccepting Investments
                                </span>
                              </div>
                              <div className="series-interest-rate">
                                <span className="rate-value">{series.interestRate}%</span>
                                <span className="rate-label">Interest Rate</span>
                              </div>
                            </div>
                            
                            <div className="series-card-body">
          .targetAmount) * 100;
                        return (
                          <div key={series.id} className="investment-series-card" onClick={() => handleSeriesSelect(series)}>
                            <div className="series-card-header">
                              <div className="series-title-section">
                                <h4 className="series-title">{series.name}</h4>
                                <span className="series-status-badge accepting">
                                  ✓ A   <div className="series-selection-container">
                    <div className="series-selection-header">
                      <h3>Available Investment Opportunities</h3>
                      <p>Select a series to invest in. Only series currently accepting investments are shown.</p>
                    </div>
                    
                    <div className="series-cards-grid">
                      {availableSeries.map((series) => {
                        const progress = (series.fundsRaised / serieson && (
          <div className="modal-overlay" onClick={handleCloseSeriesSelection}>
            <div className="modal-content series-selection-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Select Series for Investment</h2>
                <button className="close-button" onClick={handleCloseSeriesSelection}>×</button>
              </div>
              <div className="modal-body">
                {availableSeries.length > 0 ? (
                            </div>

                <div className="modal-actions">
                  <button className="cancel-button" onClick={handleCloseInvestorDetails}>
                    Cancel
                  </button>
                  <button className="submit-button" onClick={handleProceedToSeries}>
                    Add New Investment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Series Selection Modal */}
        {showSeriesSelecti         <div className="detail-header-new">
                      <HiOutlineChartBar className="detail-icon-new" />
                      <span className="detail-title-new">Active Series</span>
                    </div>
                    <div className="series-tags-new">
                      {selectedInvestor.series.map((series, index) => (
                        <span key={index} className="series-tag-new">{series}</span>
                      ))}
                    </div>
                  </div>
          </div>
                  
                  <div className="detail-card-new">
                    <div className="detail-header-new">
                      <span className="detail-title-new">Current Investment</span>
                    </div>
                    <div className="detail-content-new investment-amount-new">₹{selectedInvestor.investment.toLocaleString('en-IN')}</div>
                  </div>
                  
                  <div className="detail-card-new full-width-new">
                            <div className="detail-content-new">{selectedInvestor.phone}</div>
                  </div>
                  
                  <div className="detail-card-new">
                    <div className="detail-header-new">
                      <HiOutlineCalendar className="detail-icon-new" />
                      <span className="detail-title-new">Date Joined</span>
                    </div>
                    <div className="detail-content-new">{selectedInvestor.dateJoined}</div>
           new" />
                      <span className="detail-title-new">Email</span>
                    </div>
                    <div className="detail-content-new">{selectedInvestor.email}</div>
                  </div>
                  
                  <div className="detail-card-new">
                    <div className="detail-header-new">
                      <HiOutlinePhone className="detail-icon-new" />
                      <span className="detail-title-new">Phone</span>
                    </div>
   vestor-id-display-new">{selectedInvestor.investorId}</span>
                  </div>
                  <span className={`kyc-status-badge-new kyc-${selectedInvestor.kycStatus.toLowerCase()}`}>
                    {selectedInvestor.kycStatus}
                  </span>
                </div>

                <div className="investor-details-grid-new">
                  <div className="detail-card-new">
                    <div className="detail-header-new">
                      <HiOutlineMail className="detail-icon-ew" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Investor Details</h2>
                <button className="close-button" onClick={handleCloseInvestorDetails}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="investor-info-header-new">
                  <div className="investor-name-section-new">
                    <h3>{selectedInvestor.name}</h3>
                    <span className="in            <button className="search-button" onClick={handleInvestorSearch}>
                      <FiSearch size={16} /> Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Investor Details Modal */}
        {showInvestorDetails && selectedInvestor && (
          <div className="modal-overlay" onClick={handleCloseInvestorDetails}>
            <div className="modal-content investor-details-modal-n        <div className="search-investor-section">
                  <label>Enter Investor ID:</label>
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      value={investorSearchTerm}
                      onChange={(e) => setInvestorSearchTerm(e.target.value)}
                      placeholder="Enter unique investor ID (e.g., ABCDE1234F)"
                      className="investor-search-input"
                    />
        nvestment Modal - Search Investor */}
        {showAddInvestmentModal && (
          <div className="modal-overlay" onClick={handleCloseInvestmentModal}>
            <div className="modal-content investment-search-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Investment</h2>
                <button className="close-button" onClick={handleCloseInvestmentModal}>×</button>
              </div>
              <div className="modal-body">
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

        {/* Add Ied to the Non-Convertible Debentures issue.
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
         on-section">
                  <h3 className="section-title">Declaration</h3>
                  <div className="declaration-text">
                    <p>
                      I hereby declare that the information provided above is true and correct to the best of my knowledge and belief. 
                      I undertake to inform the company of any changes in the above details promptly. I also authorize the company 
                      to use my bank account details for interest/redemption payments relatileInput(e, 'digitalSignature')}
                          style={{ display: 'none' }}
                          required
                        />
                      </div>
                      {formData.digitalSignature && (
                        <div className="file-selected">{formData.digitalSignature.name}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Declaration */}
                <div className="form-section declaratiand drop digital signature here</p>
                              <p className="file-limit">Limit 200MB per file</p>
                              <p className="file-limit">PDF, PNG, JPG, JPEG</p>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          id="digitalSignature"
                          accept=".png,.jpg,.jpeg"
                          onChange={(e) => handleFndleDragLeave}
                          onDrop={(e) => handleDrop(e, 'digitalSignature')}
                          onClick={() => document.getElementById('digitalSignature').click()}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="upload-content">
                            <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Click to upload or drag       {formData.form15G15H && (
                        <div className="file-selected">{formData.form15G15H.name}</div>
                      )}
                    </div>

                    <div className="upload-item">
                      <label>Digital Signature*</label>
                      <div className="upload-wrapper">
                        <div 
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={ha className="file-limit">PDF, PNG, JPG, JPEG</p>
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
                      </div>
                .getElementById('form15G15H').click()}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="upload-content">
                            <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Click to upload or drag and drop Form 15G/15H here</p>
                              <p className="file-limit">Limit 200MB per file</p>
                              <p          )}
                    </div>

                    <div className="upload-item">
                      <label>Form 15G/15H (Optional)</label>
                      <div className="upload-wrapper">
                        <div 
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'form15G15H')}
                          onClick={() => document            type="file"
                          id="cancelledCheque"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileInput(e, 'cancelledCheque')}
                          style={{ display: 'none' }}
                          required
                        />
                      </div>
                      {formData.cancelledCheque && (
                        <div className="file-selected">{formData.cancelledCheque.name}</div>
                      <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Click to upload or drag and drop cancelled cheque here</p>
                              <p className="file-limit">Limit 200MB per file</p>
                              <p className="file-limit">PDF, PNG, JPG, JPEG</p>
                            </div>
                          </div>
                        </div>
                        <input
                               <div 
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'cancelledCheque')}
                          onClick={() => document.getElementById('cancelledCheque').click()}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="upload-content">
                                  style={{ display: 'none' }}
                          required
                        />
                      </div>
                      {formData.aadhaarDocument && (
                        <div className="file-selected">{formData.aadhaarDocument.name}</div>
                      )}
                    </div>

                    <div className="upload-item">
                      <label>Cancelled Cheque (Mandatory)*</label>
                      <div className="upload-wrapper">
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
          onDrop={(e) => handleDrop(e, 'aadhaarDocument')}
                          onClick={() => document.getElementById('aadhaarDocument').click()}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="upload-content">
                            <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Click to upload or drag and drop Aadhaar document here</p>
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
                      </div>
                      {formData.panDocument && (
              ter' }}
                        >
                          <div className="upload-content">
                            <FiUpload size={24} className="upload-icon" />
                            <div className="upload-text">
                              <p>Click to upload or drag and drop PAN document here</p>
                              <p className="file-limit">Limit 200MB per file</p>
                              <p className="file-limit">PDF, PNG, JPG, JPEG</p>
                            </div>
               <label>PAN Document (Mandatory)*</label>
                      <div className="upload-wrapper">
                        <div 
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'panDocument')}
                          onClick={() => document.getElementById('panDocument').click()}
                          style={{ cursor: 'poin => setFormData({ ...formData, nomineeAddress: e.target.value })}
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
         ail}
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
                        onChange={(e)alue = '+91 ' + value.replace(/^\+91\s*/, '');
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
                        value={formData.nomineeEm          </select>
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
                            voption>
                        <option value="Spouse">Spouse</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Other">Other</option>
            lue })}
                        placeholder="Enter nominee name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Relationship with Subscriber</label>
                      <select
                        value={formData.nomineeRelationship}
                        onChange={(e) => setFormData({ ...formData, nomineeRelationship: e.target.value })}
                      >
                        <option value="">Select relationship</   {/* Nomination (Optional) */}
                <div className="form-section">
                  <h3 className="section-title">Nomination (Optional)</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name of Nominee</label>
                      <input
                        type="text"
                        value={formData.nomineeName}
                        onChange={(e) => setFormData({ ...formData, nomineeName: e.target.vation value="Salary">Salary</option>
                        <option value="Business Income">Business Income</option>
                        <option value="Investment Returns">Investment Returns</option>
                        <option value="Inheritance">Inheritance</option>
                        <option value="Gift">Gift</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

             iv>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Source of Funds*</label>
                      <select
                        value={formData.sourceOfFunds}
                        onChange={(e) => setFormData({ ...formData, sourceOfFunds: e.target.value })}
                        required
                      >
                        <option value="">Select source of funds</option>
                        <opm-group">
                      <label>KYC Status</label>
                      <select
                        value={formData.kycStatus}
                        onChange={(e) => setFormData({ ...formData, kycStatus: e.target.value })}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div className="form-row">
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
                    <div className="for     onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                          className="active-checkbox"
                        />
                        <span>Active Account</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Know Your Customer (KYC) */}
                <div className="form-section">
                  <h3 className="section-title">Know Your Customer (KYC)</h3>
                  <d= 'SBIN0001234' ? '#9ca3af' : '#1e293b',
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
                                          onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                        required
                        placeholder="SBIN0001234"
                        onFocus={(e) => {
                          if (e.target.value === 'SBIN0001234') {
                            setFormData({ ...formData, ifscCode: '' });
                          }
                        }}
                        style={{ 
                          color: formData.ifscCode ==er === '1234567890123456' ? '#9ca3af' : '#1e293b',
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
                   onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        required
                        placeholder="1234567890123456"
                        onFocus={(e) => {
                          if (e.target.value === '1234567890123456') {
                            setFormData({ ...formData, accountNumber: '' });
                          }
                        }}
                        style={{ 
                          color: formData.accountNumb                        value={formData.bankName}
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
 5678 9012"
                        onFocus={(e) => {
                          if (e.target.value === '1234 5678 9012') {
                            setFormData({ ...formData, aadhaar: '' });
                          }
                        }}
                        style={{ 
                          color: formData.aadhaar === '1234 5678 9012' ? '#9ca3af' : '#1e293b',
                          fontStyle: formData.aadhaar === '1234 5678 9012' ? 'italic' : 'normal'
                        }}
              abel>Aadhaar Number*</label>
                      <input
                        type="text"
                        value={formData.aadhaar}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          value = value.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
                          setFormData({ ...formData, aadhaar: value });
                        }}
                        required
                        placeholder="1234                          setFormData({ ...formData, pan: '' });
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
                      <l       <div className="form-group">
                      <label>PAN (Permanent Account Number)*</label>
                      <input
                        type="text"
                        value={formData.pan}
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                        required
                        placeholder="ABCDE1234F"
                        onFocus={(e) => {
                          if (e.target.value === 'ABCDE1234F') {
  ence Address (if different)</label>
                      <textarea
                        value={formData.correspondenceAddress}
                        onChange={(e) => setFormData({ ...formData, correspondenceAddress: e.target.value })}
                        placeholder="Enter correspondence address or leave blank if same as residential"
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="form-row">
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
                      <label>Correspond   if (!value.startsWith('+91 ')) {
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
               ata.dob}
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
                       ata.email}
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
                        value={formD                   type="text"
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
                        value={formD×
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
     )}>
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
                  vigate(`/investors/${investor.id}`)}
                      >
                        <FaEye />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All the existing modals remain the same */}
        {/* Add Investor Modal */}
        {showAddInvestorModal && (
          <div className="modal-overlay" onClick={() => setShowAddInvestorModal(falsetd>
                      <span className={`kyc-status ${getStatusColor(investor.kycStatus)}`}>
                        {investor.kycStatus}
                      </span>
                    </td>
                    <td>
                      <div className="date-joined">
                        {investor.dateJoined}
                      </div>
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => nag">
                                {s}
                              </span>
                            ))
                        ) : (
                          <span className="no-series">-</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="investment-amount">
                        ₹{investor.investment.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <           <div className="phone">{investor.phone}</div>
                      </div>
                    </td>
                    <td>
                      <div className="series-tags">
                        {investor.series && investor.series.length > 0 ? (
                          investor.series
                            .filter(s => s && typeof s === 'string' && s.startsWith('Series'))
                            .map((s, idx) => (
                              <span key={idx} className="series-tators.map((investor) => (
                  <tr key={investor.id}>
                    <td>
                      <div className="investor-info">
                        <div className="investor-name">{investor.name}</div>
                        <div className="investor-id">{investor.investorId}</div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="email">{investor.email}</div>
             
          {/* Table */}
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
                {filteredInvesn('investors') && (
                <>
                  <button className="add-investment-btn" onClick={() => setShowAddInvestmentModal(true)}>
                    <MdTrendingUp />
                    Add Investment
                  </button>
                  <button className="add-investor-btn" onClick={() => setShowAddInvestorModal(true)}>
                    <TiUserAdd />
                    Add Investor
                  </button>
                </>
              )}
            </div>
          </div>
           placeholder="Search Investors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <button className="filter-btn">
                <FiFilter />
              </button>
              <button className="export-btn" onClick={handleExport}>
                <MdOutlineFileDownload />
                Export
              </button>
              {showCreateButtocted</div>
            <div className="stat-value">{kycRejected}</div>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-section">
          <div className="table-header">
            <div className="table-title">
              <h2>All Investors</h2>
            </div>
            <div className="table-actions">
              <div className="search-box">
                <FiSearch className="search-icon" />
                <input
                  type="text"
       nvestors}</div>
          </div>
          <div className="stat-card stat-card-green">
            <div className="stat-label">KYC Completed</div>
            <div className="stat-value">{kycCompleted}</div>
          </div>
          <div className="stat-card stat-card-yellow">
            <div className="stat-label">KYC Pending</div>
            <div className="stat-value">{kycPending}</div>
          </div>
          <div className="stat-card stat-card-red">
            <div className="stat-label">KYC Reje">
        {/* Header */}
        <div className="investors-new-header">
          <div className="header-content">
            <h1 className="page-title">Investors</h1>
            <p className="page-subtitle">Manage investor profiles and KYC status</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card stat-card-blue">
            <div className="stat-label">Total Investors</div>
            <div className="stat-value">{totalIandleCloseInvestmentForm = () => {
    setShowInvestmentForm(false);
    setInvestmentAmount('');
    setInvestmentDocument(null);
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  const availableSeries = series.filter(s => {
    const status = getSeriesStatus(s);
    return status === 'accepting';
  });

  return (
    <Layout>
    alert(`Investment of ₹${parseInt(investmentAmount).toLocaleString('en-IN')} added successfully for ${selectedInvestor.name} in ${selectedSeries.name}`);
    
    // Close modal and refresh data without page reload
    handleCloseInvestmentForm();
    // Data will be automatically refreshed through context updates
  };

  // Reset functions
  const handleCloseInvestmentModal = () => {
    setShowAddInvestmentModal(false);
    setInvestorSearchTerm('');
  };

  const handleCloseInvestorDetails = () => {
    setShowInvestorDetails(false);
    setSelectedInvestor(null);
  };

  const handleCloseSeriesSelection = () => {
    setShowSeriesSelection(false);
    setSelectedSeries(null);
  };

  const h  ...selectedSeries,
      fundsRaised: selectedSeries.fundsRaised + parseInt(investmentAmount),
      investors: isNewSeriesForInvestor ? selectedSeries.investors + 1 : selectedSeries.investors
    };
    
    updateSeries(selectedSeries.id, updatedSeries);
    
    addInvestmentTransaction(
      selectedInvestor.investorId,
      selectedSeries.name,
      parseInt(investmentAmount),
      new Date().toLocaleDateString('en-GB')
    );
    
    alert(`Investment of ₹${parseInt(investmentAmount).toLocaleStri.name : 'Admin',
      addedByRole: user ? user.displayRole : 'Admin'
    };
    
    const updatedInvestor = {
      ...selectedInvestor,
      investment: selectedInvestor.investment + parseInt(investmentAmount),
      series: currentSeries.includes(selectedSeries.name) 
        ? currentSeries 
        : [...currentSeries, selectedSeries.name],
      investments: [...currentInvestments, newInvestment]
    };
    
    updateInvestor(selectedInvestor.id, updatedInvestor);
    
    const updatedSeries = {
    tSeries = Array.isArray(selectedInvestor.series) ? selectedInvestor.series : [];
    const currentInvestments = Array.isArray(selectedInvestor.investments) ? selectedInvestor.investments : [];
    
    const isNewSeriesForInvestor = !currentSeries.includes(selectedSeries.name);
    
    const newInvestment = {
      seriesName: selectedSeries.name,
      amount: parseInt(investmentAmount),
      date: new Date().toLocaleDateString('en-GB'),
      timestamp: new Date().toISOString(),
      addedBy: user ? usertAmount || !investmentDocument) {
      alert('Please fill all required fields and upload document.');
      return;
    }

    if (selectedInvestor.status === 'deleted') {
      alert('🚫 INVESTMENT SUBMISSION BLOCKED: Cannot process investment for DELETED account.');
      return;
    }

    if (selectedInvestor.status === 'deactivated' || selectedInvestor.active === false) {
      alert('🚫 INVESTMENT SUBMISSION BLOCKED: Cannot process investment for DEACTIVATED account.');
      return;
    }
    
    const curren
      } else if (seriesStatus === 'matured') {
        message = `🚫 INVESTMENT BLOCKED: Series "${series.name}" has matured and no longer accepts investments.`;
      } else {
        message = `🚫 INVESTMENT BLOCKED: Series "${series.name}" is not currently accepting investments.`;
      }
      
      alert(message);
      return;
    }
    
    setSelectedSeries(series);
    setShowSeriesSelection(false);
    setShowInvestmentForm(true);
  };

  const handleInvestmentSubmit = () => {
    if (!investmenNVESTMENT BLOCKED: Series "${series.name}" subscription has not started yet. Subscription starts on ${series.subscriptionStartDate}.`;
      } else if (seriesStatus === 'active') {
        message = `🚫 INVESTMENT BLOCKED: Series "${series.name}" subscription window has ended on ${series.subscriptionEndDate}. No new investments are accepted.`;
      } else if (seriesStatus === 'DRAFT') {
        message = `🚫 INVESTMENT BLOCKED: Series "${series.name}" is still in draft status and not approved for investments.`; investments to deactivated accounts. Please reactivate the account first.');
      return;
    }

    setSelectedInvestor(investor);
    setShowInvestorDetails(true);
  };

  const handleProceedToSeries = () => {
    setShowInvestorDetails(false);
    setShowSeriesSelection(true);
  };

  const handleSeriesSelect = (series) => {
    const seriesStatus = getSeriesStatus(series);
    
    if (seriesStatus !== 'accepting') {
      let message = '';
      if (seriesStatus === 'upcoming') {
        message = `🚫 I => inv.investorId === investorSearchTerm.trim());
    
    if (!investor) {
      alert('Investor not found. Please check the Investor ID.');
      return;
    }

    if (investor.status === 'deleted') {
      alert('🚫 INVESTMENT BLOCKED: This investor account has been DELETED. Cannot add investments to deleted accounts.');
      return;
    }

    if (investor.status === 'deactivated' || investor.active === false) {
      alert('🚫 INVESTMENT BLOCKED: This investor account has been DEACTIVATED. Cannot add234',
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

  // Investment flow handlers
  const handleInvestorSearch = () => {
    const investor = investors.find(inv.email,
        phone: formData.phone,
        kycStatus: formData.kycStatus,
        bankName: formData.bankName,
        documentsUploaded: kycDocuments.length
      }
    });
    
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
      ifscCode: 'SBIN0001uccess) {
      return;
    }
    
    addAuditLog({
      action: 'Created Investor',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `Created new investor "${formData.fullName}" (ID: ${newInvestor.investorId}) with KYC status: ${formData.kycStatus}`,
      entityType: 'Investor',
      entityId: newInvestor.investorId,
      changes: {
        investorName: formData.fullName,
        investorId: newInvestor.investorId,
        email: formData.email,
      phone: formData.phone,
      pan: formData.pan,
      dob: formData.dob,
      address: formData.residentialAddress,
      kycStatus: formData.kycStatus,
      active: formData.active,
      series: [],
      investment: 0,
      dateJoined: new Date().toLocaleDateString('en-GB'),
      bankAccountNumber: formData.accountNumber,
      ifscCode: formData.ifscCode,
      bankName: formData.bankName,
      kycDocuments: kycDocuments
    };
    
    const success = addInvestor(newInvestor);
    if (!s       name: 'Form 15G/15H',
        uploadedDate: uploadDate,
        status: formData.kycStatus,
        fileName: formData.form15G15H.name
      });
    }
    
    if (formData.digitalSignature) {
      kycDocuments.push({
        name: 'Digital Signature',
        uploadedDate: uploadDate,
        status: formData.kycStatus,
        fileName: formData.digitalSignature.name
      });
    }
    
    const newInvestor = {
      name: formData.fullName,
      investorId: generateInvestorId(),
      email: formDatarmData.aadhaarDocument) {
      kycDocuments.push({
        name: 'Aadhaar Card',
        uploadedDate: uploadDate,
        status: formData.kycStatus,
        fileName: formData.aadhaarDocument.name
      });
    }
    
    if (formData.cancelledCheque) {
      kycDocuments.push({
        name: 'Cancelled Cheque',
        uploadedDate: uploadDate,
        status: formData.kycStatus,
        fileName: formData.cancelledCheque.name
      });
    }
    
    if (formData.form15G15H) {
      kycDocuments.push({
 {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const kycDocuments = [];
    const uploadDate = new Date().toLocaleDateString('en-GB');
    
    if (formData.panDocument) {
      kycDocuments.push({
        name: 'PAN Card',
        uploadedDate: uploadDate,
        status: formData.kycStatus,
        fileName: formData.panDocument.name
      });
    }
    
    if (foreventDefault();
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
    for (let i = 0; i < 10; i++) ',
      changes: {
        documentType: 'Investors List',
        fileName: fileName,
        format: 'CSV',
        recordCount: filteredInvestors.length
      }
    });
  };

  // File handling
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
    e.ppe: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = 'investors.csv';
    a.download = fileName;
    a.click();
    
    addAuditLog({
      action: 'Downloaded Report',
      adminName: user ? user.name : 'Admin',
      adminRole: user ? user.displayRole : 'Admin',
      details: `Downloaded Investors List (${filteredInvestors.length} investors, CSV format)`,
      entityType: 'Investor',
      entityId: 'All Investorsfault: return '';
    }
  };

  const handleExport = () => {
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
    const blob = new Blob([csv], { ty = 
        investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.investorId.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [investors, searchTerm]);

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'completed';
      case 'Pending': return 'pending';
      case 'Rejected': return 'rejected';
      de,
    phone: '+91 ',
    kycStatus: 'Pending',
    active: true,
    panDocument: null,
    aadhaarDocument: null,
    cancelledCheque: null,
    form15G15H: null,
    digitalSignature: null
  });

  // Statistics
  const totalInvestors = getTotalInvestors();
  const kycCompleted = getKYCCompleted();
  const kycPending = getPendingKYC();
  const kycRejected = getKYCRejected();

  // Filtered investors
  const filteredInvestors = useMemo(() => {
    return investors.filter(investor => {
      const matchesSearchstmentDocument] = useState(null);

  // Form data for Add Investor
  const [formData, setFormData] = useState({
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
    occupation: '',
    sourceOfFunds: '',
    nomineeName: '',
    nomineeRelationship: '',
    nomineeMobile: '+91 ',
    nomineeEmail: '',
    nomineeAddress: ''e(false);
  const [showInvestorDetails, setShowInvestorDetails] = useState(false);
  const [showSeriesSelection, setShowSeriesSelection] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [investorSearchTerm, setInvestorSearchTerm] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentDocument, setInve