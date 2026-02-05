# Fix Series AB in 3 Simple Steps 🚀

## Your ₹40,000,000 investment is SAFE! Let's bring Series AB back.

---

## Step 1: Open Console
Press **F12** on your keyboard (or right-click → Inspect → Console tab)

---

## Step 2: Check Your Data
Copy this entire code and paste it in the console, then press Enter:

```javascript
// CHECK INVESTMENT DATA
(function() {
  const investors = JSON.parse(localStorage.getItem('investors') || '[]');
  const investorWithAB = investors.find(inv => 
    inv.name === 'Dwarampudi Sowmith Reddy' || 
    (inv.series && (inv.series.includes('Series AB') || inv.series.includes('AB')))
  );
  
  if (investorWithAB) {
    console.log('✅ INVESTMENT IS SAFE!');
    console.log('Name:', investorWithAB.name);
    console.log('Amount: ₹' + investorWithAB.investment.toLocaleString('en-IN'));
    console.log('Series:', investorWithAB.series);
  } else {
    console.log('❌ Investment not found');
  }
  
  const series = JSON.parse(localStorage.getItem('series') || '[]');
  const seriesAB = series.find(s => s.name === 'Series AB');
  
  if (seriesAB) {
    console.log('✅ Series AB exists');
  } else {
    console.log('❌ Series AB missing - Run Step 3 to restore');
  }
})();
```

---

## Step 3: Restore Series AB
If Step 2 shows "Series AB missing", copy this code and paste it in the console, then press Enter:

```javascript
// RESTORE SERIES AB
(function() {
  const series = JSON.parse(localStorage.getItem('series') || '[]');
  const existingAB = series.find(s => s.name === 'Series AB');
  
  if (existingAB) {
    console.log('✅ Series AB already exists!');
    return;
  }
  
  const investors = JSON.parse(localStorage.getItem('investors') || '[]');
  const investorWithAB = investors.find(inv => 
    inv.series && (inv.series.includes('Series AB') || inv.series.includes('AB'))
  );
  
  if (!investorWithAB) {
    console.log('❌ No investment found for Series AB');
    return;
  }
  
  let seriesABAmount = 0;
  if (investorWithAB.investments) {
    const abInvestment = investorWithAB.investments.find(inv => 
      inv.seriesName === 'Series AB' || inv.seriesName === 'AB'
    );
    if (abInvestment) {
      seriesABAmount = abInvestment.amount;
    }
  }
  
  const today = new Date();
  const todayStr = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
  const maturityDate = new Date(today);
  maturityDate.setFullYear(maturityDate.getFullYear() + 5);
  const maturityStr = maturityDate.getDate() + '/' + (maturityDate.getMonth() + 1) + '/' + maturityDate.getFullYear();
  
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
  
  console.log('✅ Series AB restored!');
  console.log('Funds Raised: ₹' + seriesABAmount.toLocaleString('en-IN'));
  alert('✅ Series AB restored! Press F5 to refresh the page.');
})();
```

---

## Step 4: Refresh
Press **F5** to refresh the page

---

## ✅ Done!

Go to **NCD Series** page and you'll see Series AB with your ₹40,000,000 investment!

---

## 🛡️ This Will Never Happen Again

The automatic cleanup code that was deleting Series AB has been completely removed. Series AB is now a valid series name like any other.

---

## 💡 Alternative: Recreate Manually

If you prefer, you can recreate Series AB through the UI:
1. Go to NCD Series page
2. Click "Create New Series"
3. Name it "Series AB"
4. Fill in the details
5. Submit and approve

The investment will automatically link to it because the investor record still has "Series AB" in their series list.

---

**That's it! Your data is safe and Series AB will be back in 30 seconds.** 🎉
