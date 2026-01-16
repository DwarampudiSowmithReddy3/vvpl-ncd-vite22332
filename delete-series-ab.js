// Script to delete Series AB from localStorage
// Run this in browser console or use Node.js

// For browser console:
console.log('Current series in localStorage:');
const series = JSON.parse(localStorage.getItem('series') || '[]');
console.log(series);

// Filter out Series AB
const filteredSeries = series.filter(s => s.name !== 'Series AB' && s.name !== 'AB');
console.log('Series after removing AB:', filteredSeries);

// Save back to localStorage
localStorage.setItem('series', JSON.stringify(filteredSeries));
console.log('Series AB deleted successfully!');

// Also clean up investors if they have Series AB
const investors = JSON.parse(localStorage.getItem('investors') || '[]');
const cleanedInvestors = investors.map(inv => {
  if (inv.series && inv.series.includes('Series AB')) {
    return {
      ...inv,
      series: inv.series.filter(s => s !== 'Series AB' && s !== 'AB'),
      investments: inv.investments ? inv.investments.filter(i => i.seriesName !== 'Series AB' && i.seriesName !== 'AB') : []
    };
  }
  if (inv.series && inv.series.includes('AB')) {
    return {
      ...inv,
      series: inv.series.filter(s => s !== 'AB' && s !== 'Series AB'),
      investments: inv.investments ? inv.investments.filter(i => i.seriesName !== 'AB' && i.seriesName !== 'Series AB') : []
    };
  }
  return inv;
});
localStorage.setItem('investors', JSON.stringify(cleanedInvestors));
console.log('Investor records cleaned up!');
