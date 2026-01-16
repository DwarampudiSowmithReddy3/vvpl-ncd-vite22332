import React, { useState, useRef, useEffect } from 'react';

const UpcomingPayoutCalendar = ({ date, payouts = [], series = [], type = 'payout' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Function to calculate days left
  const getDaysLeft = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Get the nearest maturity date for calendar display
  const getNearestMaturityDate = () => {
    if (!series || series.length === 0) return null;
    
    // Include both active and upcoming series for maturity tracking
    const approvedSeries = series.filter(s => s.status === 'active' || s.status === 'upcoming');
    if (approvedSeries.length === 0) return null;
    
    // Convert maturity dates and find the nearest one
    const maturityDates = approvedSeries.map(s => ({
      ...s,
      maturityDateObj: new Date(s.maturityDate.split('/').reverse().join('-'))
    }));
    
    const nearestSeries = maturityDates
      .filter(s => s.maturityDateObj >= new Date())
      .sort((a, b) => a.maturityDateObj - b.maturityDateObj)[0];
    
    return nearestSeries ? nearestSeries.maturityDate : null;
  };

  // Use the appropriate date based on type
  const displayDate = type === 'maturity' ? getNearestMaturityDate() : date;
  
  if (!displayDate) return null;

  // Parse the date (format: DD/MM/YYYY)
  const dateParts = displayDate.split('/');
  const d = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
  const day = d.getDate();
  const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();

  // Get data to display in popup based on type
  const getPopupData = () => {
    if (type === 'maturity' && series) {
      return series
        .filter(s => s.status === 'active' || s.status === 'upcoming')
        .map(s => ({
          name: s.name,
          daysLeft: getDaysLeft(s.maturityDate.split('/').reverse().join('-')),
          maturityDate: s.maturityDate,
          status: s.status
        }))
        .sort((a, b) => a.daysLeft - b.daysLeft);
    }
    return payouts;
  };

  const popupData = getPopupData();
  const popupTitle = type === 'maturity' ? 'Upcoming Series Maturity' : 'Upcoming Payouts';

  return (
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
            popupData.map((s, i) => (
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
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: s.status === 'upcoming' ? '#f59e0b' : '#2563eb'
                }}>
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
