# Investment Flow & Data Consistency Fix

## Current Issues:
1. NCD Series page cards (Funds Raised, Investors, Interest Rate, Progress) not updating when new investments are made
2. Need clickable cards to show investor details
3. Data consistency across the entire application

## Implementation Plan:

### 1. Fix Data Flow
- When investment is added via "Add Investment":
  - Update investor data (investment amount, series list)
  - Update series data (fundsRaised, investor count)
  - Ensure all pages reflect the changes

### 2. Add Clickable Modals
- **Funds Raised Card**: Click to show modal with:
  - Investor Name
  - Investor ID
  - Amount Invested in this series
  - Total list with sum

- **Investors Card**: Click to show modal with:
  - Investor Name
  - Investor ID
  - KYC Status
  - Investment Amount in this series

### 3. Data Calculation Logic
- For each series, calculate from actual investor data:
  - Total funds = Sum of (investor.investment / investor.series.length) for all investors in that series
  - Investor count = Number of unique investors who have this series
  - Progress = (fundsRaised / targetAmount) * 100

## Files to Modify:
1. `src/pages/NCDSeries.jsx` - Add click handlers and modals
2. `src/pages/NCDSeries.css` - Style the modals
3. `src/context/DataContext.jsx` - Ensure proper data sync

## Status: IN PROGRESS
