import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { MdPayment, MdTrendingUp } from 'react-icons/md';
import { HiUsers } from 'react-icons/hi';
import './UpcomingPayoutCalendar.css';

const UpcomingPayoutCalendar = ({ calendarData, payouts = [], type = 'payout' }) => {
  const [open, setOpen] = useState(false);
  const [showMaturityModal, setShowMaturityModal] = useState(false);
  const [selectedSeriesName, setSelectedSeriesName] = useState(null);
  const ref = useRef(null);
  const { investors, series } = useData();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper function to calculate days left
  const getDaysLeft = (dateString) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Helper function to get maturity modal data
  const getMaturityModalData = (seriesName) => {
    const seriesData = series.find(s => s.name === seriesName);
    if (!seriesData) return [];

    const investorsInSeries = investors.filter(inv => 
      inv.series && inv.series.includes(seriesName)
    );

    const totalInvestment = investorsInSeries.reduce((sum, inv) => {
      const investment = inv.investments?.find(i => i.seriesName === seriesName);
      return sum + (investment?.amount || 0);
    }, 0);

    const investorDetails = investorsInSeries.map(inv => {
      const investment = inv.investments?.find(i => i.seriesName === seriesName);
      return {
        investorId: inv.investorId,
        investorName: inv.name,
        seriesName: seriesName,
        investedAmount: investment?.amount || 0,
        daysLeftForMaturity: getDaysLeft(seriesData.maturityDate),
        lockInStatus: 'Active' // Simplified for now
      };
    });

    return [{
      seriesName: seriesName,
      daysLeftForMaturity: getDaysLeft(seriesData.maturityDate),
      totalPayouts: 0, // TODO: Calculate from payout history
      totalInvestors: investorsInSeries.length,
      totalInvestment: totalInvestment,
      investorDetails: investorDetails
    }];
  };

  // If no calendar data from backend, show default calendar
  if (type === 'maturity' && (!calendarData || !calendarData.calendar_display)) {
    if (import.meta.env.DEV) { console.log('⚠️ Calendar showing default - no backend data:', calendarData); }
    // Show default calendar instead of hiding
    const defaultDay = new Date().getDate().toString().padStart(2, '0');
    const defaultMonth = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();
    
    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <div
          onClick={() => setOpen(!open)}
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: '#ffffff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '100%',
            background: '#2563eb',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            textAlign: 'center',
            padding: '4px 0'
          }}>
            {defaultMonth}
          </div>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 700,
            color: '#1e293b'
          }}>
            {defaultDay}
          </div>
        </div>
        {open && (
          <div style={{
            position: 'absolute',
            top: 64,
            right: 0,
            width: 280,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            padding: 12,
            zIndex: 100
          }}>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Loading calendar data...</p>
          </div>
        )}
      </div>
    );
  }

  // For payout type, keep old logic (not changed yet)
  if (type === 'payout' && !payouts) {
    return null;
  }

  // Get display data from backend
  const { calendar_display, series_list } = calendarData || {};
  const day = calendar_display?.day || 'N/A';
  const month = calendar_display?.month || 'INVALID';

  if (import.meta.env.DEV) { console.log('✅ Calendar rendering with:', { day, month, series_count: series_list?.length }); }

  const popupTitle = type === 'maturity' ? 'Upcoming Series Maturity' : 'Upcoming Payouts';

  const handleDaysClick = (e, seriesName) => {
    e.stopPropagation();
    if (type === 'maturity') {
      setSelectedSeriesName(seriesName);
      setShowMaturityModal(true);
      setOpen(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  };

  return (
    <>
      <div ref={ref} style={{ position: 'relative' }}>
        
        {/* Calendar box */}
        <div
          onClick={() => setOpen(!open)}
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: '#ffffff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '100%',
            background: '#2563eb',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            textAlign: 'center',
            padding: '4px 0'
          }}>
            {month}
          </div>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 700,
            color: '#1e293b'
          }}>
            {day}
          </div>
        </div>

        {/* Popup */}
        {open && (
          <div style={{
            position: 'absolute',
            top: 64,
            right: 0,
            width: 280,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            padding: 12,
            zIndex: 100,
            animation: 'fadeSlide 0.2s ease-out'
          }}>
            <h4 style={{
              margin: '0 0 8px 0',
              fontSize: 14,
              fontWeight: 600,
              color: '#1e293b'
            }}>
              {popupTitle}
            </h4>

            {type === 'maturity' ? (
              (series_list || []).map((s, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  borderRadius: 8,
                  marginBottom: 6,
                  background: '#f8fafc'
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      Maturity: {s.maturityDate} • {s.status === 'upcoming' ? 'Releasing soon' : 'Active'}
                    </div>
                  </div>
                  <div 
                    onClick={(e) => handleDaysClick(e, s.name)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: s.status === 'upcoming' ? '#f59e0b' : '#2563eb',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: 'rgba(37, 99, 235, 0.1)',
                      border: '1px solid rgba(37, 99, 235, 0.2)'
                    }}
                  >
                    {s.daysLeft} days left
                  </div>
                </div>
              ))
            ) : (
              payouts.map((p, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  borderRadius: 8,
                  marginBottom: 6,
                  background: '#f8fafc'
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.series}</div>
                  </div>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#2563eb'
                  }}>
                    {getDaysLeft(p.date)} days left
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Maturity Details Modal */}
      {showMaturityModal && (
        <div className="modal-overlay" onClick={() => {
          setShowMaturityModal(false);
          setSelectedSeriesName(null);
        }}>
          <div className="maturity-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="maturity-modal-header">
              <h2>Series Maturity Details</h2>
              <button 
                className="close-button"
                onClick={() => {
                  setShowMaturityModal(false);
                  setSelectedSeriesName(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="maturity-modal-body">
              {getMaturityModalData(selectedSeriesName).map((seriesData, index) => (
                <div key={index} className="maturity-content">
                  {/* Series Info Header */}
                  <div className="series-info-header">
                    <h3>{seriesData.seriesName}</h3>
                    <span className="maturity-days">{seriesData.daysLeftForMaturity} days to maturity</span>
                  </div>

                  {/* Summary Stats */}
                  <div className="maturity-stats">
                    <div className="stat-item">
                      <div className="stat-header">
                        <MdPayment className="stat-icon payout-icon" />
                        <span className="stat-label">Total Payouts Till Date</span>
                      </div>
                      <span className="stat-value">{formatCurrency(seriesData.totalPayouts)}</span>
                    </div>
                    <div className="stat-item">
                      <div className="stat-header">
                        <HiUsers className="stat-icon investors-icon" />
                        <span className="stat-label">Total Investors</span>
                      </div>
                      <span className="stat-value">{seriesData.totalInvestors}</span>
                    </div>
                    <div className="stat-item">
                      <div className="stat-header">
                        <MdTrendingUp className="stat-icon investment-icon" />
                        <span className="stat-label">Total Investment</span>
                      </div>
                      <span className="stat-value">{formatCurrency(seriesData.totalInvestment)}</span>
                    </div>
                  </div>

                  {/* Investors Table */}
                  <div className="investors-section">
                    <h4>Investor Details</h4>
                    <div className="table-wrapper">
                      <table className="maturity-table">
                        <thead>
                          <tr>
                            <th>Investor ID</th>
                            <th>Investor Name</th>
                            <th>Series Name</th>
                            <th>Invested Amount</th>
                            <th>Days to Maturity</th>
                            <th>Lock-in Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesData.investorDetails.map((investor, idx) => (
                            <tr key={idx}>
                              <td>{investor.investorId}</td>
                              <td>{investor.investorName}</td>
                              <td>{investor.seriesName}</td>
                              <td>₹{investor.investedAmount.toLocaleString('en-IN')}</td>
                              <td>{investor.daysLeftForMaturity} days</td>
                              <td className={investor.lockInStatus.includes('ended') ? 'lock-ended' : 'lock-active'}>
                                {investor.lockInStatus}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Animation style
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeSlide {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;
document.head.appendChild(style);

export default UpcomingPayoutCalendar;
