// This is a clean version to test the basic investment functionality
import React, { useState } from 'react';
import { useData } from '../context/DataContext';

const InvestorsClean = () => {
  const { investors, series, updateInvestor } = useData();
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState('');

  const handleSimpleInvestment = () => {
    if (!selectedInvestor || !selectedSeries || !investmentAmount) {
      alert('Please select investor, series, and amount');
      return;
    }

    // Simple update - just add the series to the investor
    const currentSeries = selectedInvestor.series || [];
    const updatedSeries = currentSeries.includes(selectedSeries.name) 
      ? currentSeries 
      : [...currentSeries, selectedSeries.name];

    const updatedInvestor = {
      ...selectedInvestor,
      series: updatedSeries,
      investment: (selectedInvestor.investment || 0) + parseInt(investmentAmount)
    };

    console.log('Updating investor:', selectedInvestor.id, 'with:', updatedInvestor);
    updateInvestor(selectedInvestor.id, updatedInvestor);
    
    alert('Investment processed!');
    setInvestmentAmount('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Clean Investment Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Select Investor:</h3>
        {investors.map(inv => (
          <button 
            key={inv.id}
            onClick={() => setSelectedInvestor(inv)}
            style={{ 
              margin: '5px', 
              padding: '10px',
              backgroundColor: selectedInvestor?.id === inv.id ? 'lightblue' : 'white'
            }}
          >
            {inv.name} (Series: {inv.series?.join(', ') || 'None'})
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Select Series:</h3>
        {series.map(s => (
          <button 
            key={s.id}
            onClick={() => setSelectedSeries(s)}
            style={{ 
              margin: '5px', 
              padding: '10px',
              backgroundColor: selectedSeries?.id === s.id ? 'lightgreen' : 'white'
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Investment Amount:</h3>
        <input 
          type="number"
          value={investmentAmount}
          onChange={(e) => setInvestmentAmount(e.target.value)}
          placeholder="Enter amount"
          style={{ padding: '10px', fontSize: '16px' }}
        />
      </div>

      <button 
        onClick={handleSimpleInvestment}
        style={{ 
          padding: '15px 30px', 
          fontSize: '18px', 
          backgroundColor: 'green', 
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Process Investment
      </button>

      <div style={{ marginTop: '30px' }}>
        <h3>Current Data:</h3>
        <p>Investors: {investors.length}</p>
        <p>Series: {series.length}</p>
        {selectedInvestor && (
          <div>
            <h4>Selected Investor:</h4>
            <pre>{JSON.stringify(selectedInvestor, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestorsClean;