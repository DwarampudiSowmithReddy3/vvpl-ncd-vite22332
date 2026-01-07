import React, { useState, useRef, useEffect } from 'react';

const UpcomingPayoutCalendar = ({ date, payouts = [] }) => {
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

  if (!date) return null;

  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();

  // Function to calculate days left
  const getDaysLeft = (payoutDate) => {
    const today = new Date();
    const target = new Date(payoutDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

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
          width: 260,
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
            Upcoming Payouts
          </h4>

          {payouts.map((p, i) => (
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
          ))}
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
