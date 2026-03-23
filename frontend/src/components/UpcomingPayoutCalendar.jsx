import React, { useState, useRef, useEffect } from 'react';
import apiService from '../services/api';
import './UpcomingPayoutCalendar.css';

const calendarBoxStyle = {
  width: 56, height: 56, borderRadius: 12, background: '#ffffff',
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer'
};
const monthBannerStyle = {
  width: '100%', background: '#2563eb', color: '#fff',
  fontSize: 12, fontWeight: 600, textAlign: 'center', padding: '4px 0'
};
const dayStyle = {
  flex: 1, display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#1e293b'
};
const popupStyle = {
  position: 'absolute', top: 64, right: 0, width: 300,
  background: '#fff', borderRadius: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  padding: 12, zIndex: 1000
};

const UpcomingPayoutCalendar = ({ calendarData, payouts = [], type = 'payout' }) => {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [seriesDetail, setSeriesDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false); setSelectedId(null); setSeriesDetail(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDaysClick = async (e, s) => {
    e.stopPropagation();
    if (selectedId === s.seriesId) {
      setSelectedId(null); setSeriesDetail(null); return;
    }
    setSelectedId(s.seriesId); setSeriesDetail(null); setDetailLoading(true);
    try {
      if (s.seriesId) {
        const data = await apiService.getSeriesInsights(s.seriesId);
        setSeriesDetail(data);
      }
    } catch (err) { setSeriesDetail(null); }
    finally { setDetailLoading(false); }
  };

  if (type === 'maturity' && (!calendarData || !calendarData.calendar_display)) {
    const defaultDay = new Date().getDate().toString().padStart(2, '0');
    const defaultMonth = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();
    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <div onClick={() => setOpen(!open)} style={calendarBoxStyle}>
          <div style={monthBannerStyle}>{defaultMonth}</div>
          <div style={dayStyle}>{defaultDay}</div>
        </div>
        {open && (
          <div style={popupStyle}>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>No upcoming maturity data.</p>
          </div>
        )}
      </div>
    );
  }

  if (type === 'payout' && !payouts) return null;

  const { calendar_display, series_list } = calendarData || {};
  const day = calendar_display?.day || '--';
  const month = calendar_display?.month || '---';
  const popupTitle = type === 'maturity' ? 'Upcoming Series Maturity' : 'Upcoming Payouts';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => { setOpen(!open); setSelectedId(null); setSeriesDetail(null); }}
        style={calendarBoxStyle}
      >
        <div style={monthBannerStyle}>{month}</div>
        <div style={dayStyle}>{day}</div>
      </div>

      {open && (
        <div style={popupStyle}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
            {popupTitle}
          </h4>

          {type === 'maturity' ? (
            (series_list || []).length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>No upcoming series.</p>
            ) : (
              (series_list || []).map((s, i) => (
                <div key={i}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px', borderRadius: 8, marginBottom: 4,
                    background: selectedId === s.seriesId ? '#eff6ff' : '#f8fafc',
                    border: selectedId === s.seriesId ? '1px solid #bfdbfe' : '1px solid transparent'
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Maturity: {s.maturityDate}</div>
                      {s.lockInStatus && (
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{s.lockInStatus}</div>
                      )}
                    </div>
                    <div
                      onClick={(e) => handleDaysClick(e, s)}
                      style={{
                        fontSize: 12, fontWeight: 600, color: '#2563eb', cursor: 'pointer',
                        padding: '4px 8px', borderRadius: 4,
                        background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {s.daysLeft} days
                    </div>
                  </div>

                  {selectedId === s.seriesId && (
                    <div style={{
                      background: '#f0f9ff', border: '1px solid #bae6fd',
                      borderRadius: 8, padding: '10px 12px', marginBottom: 6, fontSize: 12
                    }}>
                      {detailLoading ? (
                        <div style={{ color: '#64748b', textAlign: 'center', padding: '6px 0' }}>Loading...</div>
                      ) : seriesDetail ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Interest Rate</span>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{s.interestRate ?? '--'}%</span>
                          </div>
                          {seriesDetail.maturity && (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Active Investors</span>
                                <span style={{ fontWeight: 600, color: '#1e293b' }}>{seriesDetail.maturity.active_investors_count ?? 0}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Days to Maturity</span>
                                <span style={{ fontWeight: 600, color: seriesDetail.maturity.days_left > 30 ? '#059669' : '#dc2626' }}>
                                  {seriesDetail.maturity.days_left ?? s.daysLeft}
                                </span>
                              </div>
                            </>
                          )}
                          {seriesDetail.lock_in && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#64748b' }}>Lock-in Status</span>
                              <span style={{ fontWeight: 600, color: seriesDetail.lock_in.is_active ? '#dc2626' : '#059669' }}>
                                {seriesDetail.lock_in.is_active ? 'Active' : 'Ended'}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ color: '#64748b', textAlign: 'center', padding: '4px 0' }}>No details available</div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )
          ) : (
            (payouts || []).map((p, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px', borderRadius: 8, marginBottom: 6, background: '#f8fafc'
              }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.series}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#2563eb' }}>{p.days_left ?? 0} days</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UpcomingPayoutCalendar;
