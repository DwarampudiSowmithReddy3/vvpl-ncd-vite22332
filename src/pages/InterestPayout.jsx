import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import Layout from '../components/Layout';
import './InterestPayout.css';
import { MdOutlineFileDownload, MdPayment } from "react-icons/md";
import { FiSearch, FiFilter } from "react-icons/fi";
import { FaEye, FaRupeeSign } from "react-icons/fa";
import { MdDateRange, MdTrendingUp } from "react-icons/md";

const InterestPayout = () => {
  const navigate = useNavigate();
  const { series, investors } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeries, setFilterSeries] = useState('all');

  // Mock data for interest payouts - updated to use Series A, B, C
  const payoutData = [
    {
      id: 1,
      investorId: 'INV001',
      investorName: 'Rahul Sharma',
      seriesName: 'Series A',
      seriesId: 1,
      interestMonth: 'December 2025',
      interestDate: '15-Dec-2025',
      amount: 95833,
      status: 'Paid'
    },
    {
      id: 2,
      investorId: 'INV002',
      investorName: 'Priya Patel',
      seriesName: 'Series B',
      seriesId: 2,
      interestMonth: 'December 2025',
      interestDate: '25-Dec-2025',
      amount: 150000,
      status: 'Paid'
    },
    {
      id: 3,
      investorId: 'INV003',
      investorName: 'Amit Kumar',
      seriesName: 'Series A',
      seriesId: 1,
      interestMonth: 'January 2026',
      interestDate: '15-Jan-2026',
      amount: 95833,
      status: 'Pending'
    },
    {
      id: 4,
      investorId: 'INV004',
      investorName: 'Sneha Reddy',
      seriesName: 'Series C',
      seriesId: 3,
      interestMonth: 'January 2026',
      interestDate: '10-Jan-2026',
      amount: 87500,
      status: 'Pending'
    },
    {
      id: 5,
      investorId: 'INV005',
      investorName: 'Vikram Singh',
      seriesName: 'Series B',
      seriesId: 2,
      interestMonth: 'January 2026',
      interestDate: '25-Jan-2026',
      amount: 150000,
      status: 'Scheduled'
    },
    {
      id: 6,
      investorId: 'INV006',
      investorName: 'Anita Desai',
      seriesName: 'Series A',
      seriesId: 1,
      interestMonth: 'November 2025',
      interestDate: '15-Nov-2025',
      amount: 95833,
      status: 'Paid'
    },
    {
      id: 7,
      investorId: 'INV007',
      investorName: 'Rajesh Gupta',
      seriesName: 'Series C',
      seriesId: 3,
      interestMonth: 'December 2025',
      interestDate: '10-Dec-2025',
      amount: 87500,
      status: 'Paid'
    },
    {
      id: 8,
      investorId: 'INV008',
      investorName: 'Kavya Nair',
      seriesName: 'Series B',
      seriesId: 2,
      interestMonth: 'November 2025',
      interestDate: '25-Nov-2025',
      amount: 150000,
      status: 'Paid'
    }
  ];

  // Calculate summary statistics
  const totalInterestPaid = payoutData
    .filter(payout => payout.status === 'Paid')
    .reduce((sum, payout) => sum + payout.amount, 0);

  const totalLastPayout = payoutData
    .filter(payout => payout.interestMonth === 'December 2025' && payout.status === 'Paid')
    .reduce((sum, payout) => sum + payout.amount, 0);

  const nextPayoutAmount = payoutData
    .filter(payout => payout.status === 'Pending' || payout.status === 'Scheduled')
    .reduce((sum, payout) => sum + payout.amount, 0);

  const filteredPayouts = useMemo(() => {
    return payoutData.filter(payout => {
      const matchesSearch = 
        payout.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.investorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.seriesName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterSeries === 'all' || payout.seriesName === filterSeries;
      
      return matchesSearch && matchesFilter;
    });
  }, [payoutData, searchTerm, filterSeries]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'completed';
      case 'Pending':
        return 'pending';
      case 'Scheduled':
        return 'scheduled';
      default:
        return '';
    }
  };

  const handleSeriesClick = (seriesId) => {
    navigate(`/ncd-series/${seriesId}`);
  };

  const handleViewInvestor = (investorName) => {
    // Find the investor by name from the DataContext
    const investor = investors.find(inv => inv.name === investorName);
    if (investor) {
      navigate(`/investors/${investor.id}`);
    }
  };

  const handleExport = () => {
    const headers = ['Investor ID', 'Investor Name', 'Series Name', 'Interest Month', 'Interest Date', 'Amount', 'Status'];
    const rows = filteredPayouts.map(payout => [
      payout.investorId,
      payout.investorName,
      payout.seriesName,
      payout.interestMonth,
      payout.interestDate,
      `₹${payout.amount.toLocaleString('en-IN')}`,
      payout.status
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interest-payouts.csv';
    a.click();
  };

  return (
    <Layout>
      <div className="interest-payout-container">
        <div className="interest-payout-header">
          <div className="header-content">
            <h1>Interest Payout Management</h1>
            <p>Track and manage interest payments across all NCD series</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="payout-summary-cards">
          <div className="summary-card green">
            <div className="card-content">
              <p className="card-label">Total Interest Paid across all series</p>
              <div className="card-value-row">
                <h2 className="card-value">₹{totalInterestPaid.toLocaleString('en-IN')}</h2>
                <FaRupeeSign className="card-icon" />
              </div>
            </div>
          </div>
          
          <div className="summary-card orange">
            <div className="card-content">
              <p className="card-label">Total Last Payout across all series</p>
              <div className="card-value-row">
                <h2 className="card-value">₹{totalLastPayout.toLocaleString('en-IN')}</h2>
                <MdTrendingUp className="card-icon" />
              </div>
            </div>
          </div>
          
          <div className="summary-card blue">
            <div className="card-content">
              <p className="card-label">Next Payout</p>
              <div className="card-value-row">
                <h2 className="card-value">₹{nextPayoutAmount.toLocaleString('en-IN')}</h2>
                <MdDateRange className="card-icon" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="payout-controls">
          <div className="search-filter-section">
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by investor name, ID, or series..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-container">
              <FiFilter className="filter-icon" />
              <select
                value={filterSeries}
                onChange={(e) => setFilterSeries(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Series</option>
                <option value="Series A">Series A</option>
                <option value="Series B">Series B</option>
                <option value="Series C">Series C</option>
              </select>
            </div>
          </div>

          <div className="action-buttons">
            <button className="filter-button">
              <FiFilter size={16} />
              Advanced Filter
            </button>
            <button className="export-button" onClick={handleExport}>
              <MdOutlineFileDownload size={16} />
              Export Data
            </button>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="payouts-table-container">
          <table className="payouts-table">
            <thead>
              <tr>
                <th>Investor ID</th>
                <th>Investor Name</th>
                <th>Series Name</th>
                <th>Interest Month</th>
                <th>Interest Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map((payout) => (
                <tr key={payout.id}>
                  <td>
                    <span className="investor-id">{payout.investorId}</span>
                  </td>
                  <td>
                    <div className="investor-info">
                      <span className="investor-name">{payout.investorName}</span>
                    </div>
                  </td>
                  <td>
                    <button 
                      className="series-link"
                      onClick={() => handleSeriesClick(payout.seriesId)}
                    >
                      {payout.seriesName}
                    </button>
                  </td>
                  <td>{payout.interestMonth}</td>
                  <td>{payout.interestDate}</td>
                  <td>
                    <span className="amount">₹{payout.amount.toLocaleString('en-IN')}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusColor(payout.status)}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="view-button"
                      onClick={() => handleViewInvestor(payout.investorName)}
                    >
                      <FaEye size={12} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile-friendly card layout */}
          <div className="mobile-payouts-list">
            {filteredPayouts.map((payout) => (
              <div key={payout.id} className="mobile-payout-card">
                <div className="mobile-payout-header">
                  <div className="mobile-payout-info">
                    <h4>{payout.investorName}</h4>
                    <span className="investor-id">{payout.investorId}</span>
                  </div>
                  <span className={`status-badge ${getStatusColor(payout.status)}`}>
                    {payout.status}
                  </span>
                </div>
                
                <div className="mobile-payout-details">
                  <div className="mobile-payout-item">
                    <span className="mobile-payout-label">Series</span>
                    <button 
                      className="mobile-series-button"
                      onClick={() => handleSeriesClick(payout.seriesId)}
                    >
                      {payout.seriesName}
                    </button>
                  </div>
                  
                  <div className="mobile-payout-item">
                    <span className="mobile-payout-label">Amount</span>
                    <span className="mobile-payout-value mobile-amount">
                      ₹{payout.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div className="mobile-payout-item">
                    <span className="mobile-payout-label">Interest Month</span>
                    <span className="mobile-payout-value">{payout.interestMonth}</span>
                  </div>
                  
                  <div className="mobile-payout-item">
                    <span className="mobile-payout-label">Interest Date</span>
                    <span className="mobile-payout-value">{payout.interestDate}</span>
                  </div>
                </div>
                
                <div className="mobile-payout-footer">
                  <span className="mobile-payout-date">Status: {payout.status}</span>
                  <button
                    className="mobile-payout-view-button"
                    onClick={() => handleViewInvestor(payout.investorName)}
                  >
                    <FaEye size={12} /> View
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* No Results Message */}
          {filteredPayouts.length === 0 && (
            <div className="no-results">
              <MdPayment size={48} />
              <h3>No payouts found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default InterestPayout;