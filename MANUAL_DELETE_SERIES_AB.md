# Manual Delete Series AB - Browser Console Script

## 🚨 Immediate Solution

If you can still see Series AB, run this script in your browser console to delete it immediately:

### Step 1: Open Browser Console
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
- **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)

### Step 2: Copy and Paste This Script

```javascript
// Delete Series AB and AB from localStorage
(function() {
  console.log('🗑️ Starting cleanup of Series AB...');
  
  // Clean up series
  const series = JSON.parse(localStorage.getItem('series') || '[]');
  console.log('Before cleanup - Total series:', series.length);
  console.log('Series names:', series.map(s => s.name));
  
  const filteredSeries = series.filter(s => s.name !== 'Series AB' && s.name !== 'AB');
  console.log('After cleanup - Total series:', filteredSeries.length);
  console.log('Series names:', filteredSeries.map(s => s.name));
  
  localStorage.setItem('series', JSON.stringify(filteredSeries));
  console.log('✅ Series cleaned up!');
  
  // Clean up investors
  const investors = JSON.parse(localStorage.getItem('investors') || '[]');
  const cleanedInvestors = investors.map(inv => {
    if (inv.series && (inv.series.includes('Series AB') || inv.series.includes('AB'))) {
      console.log(`Cleaning investor ${inv.name} - removing Series AB/AB`);
      return {
        ...inv,
        series: inv.series.filter(s => s !== 'Series AB' && s !== 'AB'),
        investments: inv.investments ? 
          inv.investments.filter(i => i.seriesName !== 'Series AB' && i.seriesName !== 'AB') : 
          []
      };
    }
    return inv;
  });
  localStorage.setItem('investors', JSON.stringify(cleanedInvestors));
  console.log('✅ Investors cleaned up!');
  
  console.log('🎉 Cleanup complete! Please refresh the page.');
  alert('Series AB deleted! Please refresh the page (F5 or Ctrl+R)');
})();
```

### Step 3: Press Enter

### Step 4: Refresh the Page
- Press `F5` or `Ctrl+R` (Windows) / `Cmd+R` (Mac)

---

## ✅ Verification

After refreshing, Series AB should be completely gone from:
- NCD Series page
- Dashboard
- All dropdowns
- Investor records
- localStorage

---

## 🔧 Alternative: Clear All Data (Nuclear Option)

If the above doesn't work, you can clear all localStorage and start fresh:

```javascript
// WARNING: This will delete ALL data including other series and investors
localStorage.clear();
alert('All data cleared! Please refresh the page.');
```

Then refresh the page. The app will start with the initial demo data (Series A, B, C, D, E).

---

## 📝 What the Code Does

1. **Reads series from localStorage**
2. **Filters out** any series named "Series AB" or "AB"
3. **Saves** the cleaned series back to localStorage
4. **Cleans up investor records** that reference Series AB
5. **Prompts you** to refresh the page

---

## 🎯 Expected Result

After running the script and refreshing:
- ✅ Series AB is gone
- ✅ No investor has Series AB reference
- ✅ localStorage is clean
- ✅ Application works normally

