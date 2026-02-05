// PERMANENT DUMMY DATA CLEANER - Runs on every app startup
export const clearDummyDataOnStartup = () => {
  console.log('🧹 Checking for dummy data on startup...');
  
  try {
    const investors = JSON.parse(localStorage.getItem('investors') || '[]');
    const series = JSON.parse(localStorage.getItem('series') || '[]');
    
    // Check for dummy data indicators
    const hasDummyInvestors = investors.some(inv => 
      inv.name?.includes('Rajesh Kumar') || 
      inv.name?.includes('Sowmith Reddy') || 
      inv.investorId === 'ABCDE1234F' ||
      inv.email?.includes('rajesh.kumar') ||
      inv.email?.includes('dsowmithreddy')
    );
    
    const hasDummySeries = series.some(s => 
      s.name === 'Series AB' || 
      s.name === 'Series A' || 
      s.name === 'Series B' || 
      s.name === 'Series C' ||
      (s.investors > 50 && s.fundsRaised > 10000000) // Suspiciously high numbers
    );
    
    if (hasDummyInvestors || hasDummySeries) {
      console.log('🚨 DUMMY DATA DETECTED - Auto-clearing...');
      
      // Nuclear clear
      localStorage.clear();
      sessionStorage.clear();
      
      // Set clean empty data
      localStorage.setItem('series', JSON.stringify([]));
      localStorage.setItem('investors', JSON.stringify([]));
      localStorage.setItem('complaints', JSON.stringify([]));
      localStorage.setItem('dataVersion', '8.0.0-auto-cleared');
      localStorage.setItem('lastDummyClear', new Date().toISOString());
      
      console.log('✅ Dummy data auto-cleared on startup');
      return true; // Indicates data was cleared
    } else {
      console.log('✅ No dummy data found - proceeding normally');
      return false; // No clearing needed
    }
  } catch (error) {
    console.error('Error checking dummy data:', error);
    // If there's any error, clear everything to be safe
    localStorage.clear();
    localStorage.setItem('series', JSON.stringify([]));
    localStorage.setItem('investors', JSON.stringify([]));
    localStorage.setItem('complaints', JSON.stringify([]));
    localStorage.setItem('dataVersion', '8.0.0-error-cleared');
    return true;
  }
};