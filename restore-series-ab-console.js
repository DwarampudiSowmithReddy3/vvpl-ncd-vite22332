// RESTORE SERIES AB - Run this in browser console (F12)
// Copy and paste this entire script into the console and press Enter

(function() {
  console.log('🔍 Checking Series AB status...\n');
  
  // Step 1: Check current series
  const series = JSON.parse(localStorage.getItem('series') || '[]');
  const existingAB = series.find(s => s.name === 'Series AB' || s.name === 'AB');
  
  if (existingAB) {
    console.log('✅ Series AB already exists!');
    console.log('Series AB details:', existingAB);
    return;
  }
  
  console.log('❌ Series AB not found in localStorage');
  
  // Step 2: Check investor data
  const investors = JSON.parse(localStorage.getItem('investors') || '[]');
  const investorWithAB = investors.find(inv => 
    inv.name === 'Dwarampudi Sowmith Reddy' || 
    (inv.series && (inv.series.includes('Series AB') || inv.series.includes('AB')))
  );
  
  if (investorWithAB) {
    console.log('✅ Found investor with Series AB investment:');
    console.log('  Name:', investorWithAB.name);
    console.log('  Series:', investorWithAB.series);
    console.log('  Total Investment:', investorWithAB.investment);
    console.log('  Investments:', investorWithAB.investments);
    
    // Find the Series AB investment amount
    let seriesABAmount = 0;
    if (investorWithAB.investments && Array.isArray(investorWithAB.investments)) {
      const abInvestment = investorWithAB.investments.find(inv => 
        inv.seriesName === 'Series AB' || inv.seriesName === 'AB'
      );
      if (abInvestment) {
        seriesABAmount = abInvestment.amount;
      }
    }
    
    console.log('\n📝 Creating Series AB with investment amount:', seriesABAmount);
    
    // Step 3: Restore Series AB
    const today = new Date();
    const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    const maturityDate = new Date(today);
    maturityDate.setFullYear(maturityDate.getFullYear() + 5);
    const maturityStr = `${maturityDate.getDate()}/${maturityDate.getMonth() + 1}/${maturityDate.getFullYear()}`;
    
    const seriesAB = {
      id: series.length + 1,
      name: 'Series AB',
      status: 'active',
      interestRate: 10,
      interestFrequency: 'Monthly Interest',
      targetAmount: 100000000,
      fundsRaised: seriesABAmount,
      investors: 1,
      issueDate: todayStr,
      maturityDate: maturityStr,
      faceValue: 1000,
      minInvestment: 10000,
      releaseDate: todayStr,
      approvalStatus: 'approved',
      approvedAt: new Date().toISOString()
    };
    
    series.push(seriesAB);
    localStorage.setItem('series', JSON.stringify(series));
    
    console.log('\n✅ Series AB restored successfully!');
    console.log('Series AB details:', seriesAB);
    console.log('\n🔄 Please refresh the page (F5) to see Series AB');
    
    alert('✅ Series AB restored successfully!\n\nPlease refresh the page (F5) to see it in the NCD Series list.');
  } else {
    console.log('❌ No investor found with Series AB investment');
    console.log('\n💡 You may need to recreate Series AB through the UI:');
    console.log('   1. Go to NCD Series page');
    console.log('   2. Click "Create New Series"');
    console.log('   3. Enter Series AB details');
  }
})();
