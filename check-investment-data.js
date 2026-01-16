// CHECK INVESTMENT DATA - Run this in browser console (F12)
// This will show you if the investment data is still safe

(function() {
  console.log('🔍 Checking investment data for Series AB...\n');
  
  // Get all investors
  const investors = JSON.parse(localStorage.getItem('investors') || '[]');
  
  // Find investor with Series AB
  const investorWithAB = investors.find(inv => 
    inv.name === 'Dwarampudi Sowmith Reddy' || 
    (inv.series && (inv.series.includes('Series AB') || inv.series.includes('AB')))
  );
  
  if (investorWithAB) {
    console.log('✅ INVESTMENT DATA IS SAFE!\n');
    console.log('Investor Details:');
    console.log('─────────────────────────────────────');
    console.log('Name:', investorWithAB.name);
    console.log('Investor ID:', investorWithAB.investorId);
    console.log('Email:', investorWithAB.email);
    console.log('Phone:', investorWithAB.phone);
    console.log('Total Investment:', '₹' + investorWithAB.investment.toLocaleString('en-IN'));
    console.log('Series:', investorWithAB.series);
    console.log('\nInvestment Breakdown:');
    console.log('─────────────────────────────────────');
    
    if (investorWithAB.investments && Array.isArray(investorWithAB.investments)) {
      investorWithAB.investments.forEach((inv, index) => {
        console.log(`${index + 1}. ${inv.seriesName}: ₹${inv.amount.toLocaleString('en-IN')} (Date: ${inv.date})`);
      });
    } else {
      console.log('No detailed investment breakdown available');
    }
    
    console.log('\n─────────────────────────────────────');
    console.log('KYC Status:', investorWithAB.kycStatus);
    console.log('Date Joined:', investorWithAB.dateJoined);
    console.log('Bank:', investorWithAB.bankName);
    console.log('Account Number:', investorWithAB.bankAccountNumber);
    console.log('IFSC Code:', investorWithAB.ifscCode);
    
    // Check if Series AB exists
    const series = JSON.parse(localStorage.getItem('series') || '[]');
    const seriesAB = series.find(s => s.name === 'Series AB' || s.name === 'AB');
    
    console.log('\n─────────────────────────────────────');
    if (seriesAB) {
      console.log('✅ Series AB exists in localStorage');
      console.log('Series AB Status:', seriesAB.status);
      console.log('Funds Raised:', '₹' + seriesAB.fundsRaised.toLocaleString('en-IN'));
      console.log('Investors:', seriesAB.investors);
    } else {
      console.log('❌ Series AB NOT found in localStorage');
      console.log('\n💡 Next Steps:');
      console.log('   1. Run the restore-series-ab-console.js script');
      console.log('   2. Or recreate Series AB through the UI');
      console.log('   3. The investment will automatically link when Series AB is restored');
    }
  } else {
    console.log('❌ No investor found with Series AB investment');
    console.log('\nSearching all investors for any Series AB reference...\n');
    
    investors.forEach(inv => {
      if (inv.series && (inv.series.includes('Series AB') || inv.series.includes('AB'))) {
        console.log('Found:', inv.name, '- Series:', inv.series);
      }
      if (inv.investments) {
        const abInv = inv.investments.find(i => i.seriesName === 'Series AB' || i.seriesName === 'AB');
        if (abInv) {
          console.log('Found investment:', inv.name, '- Amount:', abInv.amount);
        }
      }
    });
  }
  
  console.log('\n─────────────────────────────────────');
  console.log('Total Investors in System:', investors.length);
  console.log('Total Series in System:', JSON.parse(localStorage.getItem('series') || '[]').length);
})();
