# Number Input Fields Fix - NCD Series Form

## 🐛 Problem Reported

When entering values in certain number fields in the "Add New NCD Series" form, the values are being reduced or changed unexpectedly.

## ✅ Solution Implemented

Added `min` and `max` attributes to all number input fields to prevent browser validation issues and ensure proper value handling.

---

## 📝 Fields Fixed

### 1. **Interest Rate (%)**
- Added: `min="0"` and `max="100"`
- Step: `0.01` (allows decimals like 9.5, 10.25)
- Prevents: Negative values and values over 100%

### 2. **Coupon Rate (%)**
- Added: `min="0"` and `max="100"`
- Step: `0.01` (allows decimals)
- Prevents: Negative values and values over 100%

### 3. **Target Amount (Cr)**
- Added: `min="0"`
- Step: `0.1` (allows decimals like 50.5 Cr)
- Prevents: Negative values

### 4. **Total Issue Size**
- Added: `min="0"`
- Prevents: Negative values

### 5. **Minimum Subscription Percentage (%)**
- Already had: `min="0"` and `max="100"`
- Step: `0.01`
- ✅ No changes needed

---

## 🔍 Possible Causes of Value Reduction

### 1. **Step Validation**
When a field has `step="0.01"` but no `min` attribute, the browser validates the value against the step starting from 0. If you enter a value that doesn't align with the step, the browser might round it.

**Example:**
- Field has `step="0.01"`
- You type `10.5` → Browser accepts it (10.50 is valid)
- You type `10.555` → Browser might round to `10.56` (nearest valid step)

### 2. **Browser Auto-correction**
Some browsers automatically correct invalid values when you:
- Tab out of the field
- Submit the form
- Click elsewhere

### 3. **onChange Handler**
The `onChange` handler stores the value as a string. When the form is submitted, it's converted to a number. This conversion might cause rounding.

---

## 🎯 Recommended Testing

Please test these specific scenarios:

### Test 1: Interest Rate
1. Enter `9.5` → Should stay as `9.5`
2. Enter `10.25` → Should stay as `10.25`
3. Enter `10.555` → Might round to `10.56` (this is normal browser behavior)

### Test 2: Target Amount
1. Enter `50` → Should stay as `50`
2. Enter `50.5` → Should stay as `50.5`
3. Enter `50.55` → Might round to `50.6` (step is 0.1)

### Test 3: Coupon Rate
1. Enter `8.75` → Should stay as `8.75`
2. Enter `9.125` → Might round to `9.13` (step is 0.01)

---

## 💡 If Problem Persists

If you're still seeing values being reduced, please tell me:

1. **Which specific field?** (e.g., Interest Rate, Target Amount)
2. **What value did you enter?** (e.g., 10.5)
3. **What value did it become?** (e.g., 10)
4. **When did it change?** (immediately, after tab, after submit)

This will help me identify the exact issue and provide a more targeted fix.

---

## 🔧 Alternative Solution (If Needed)

If the step validation is causing issues, we can:

1. **Remove step attribute** - Allow any decimal value
2. **Use type="text"** with pattern validation - More control over input
3. **Add custom validation** - JavaScript validation instead of browser validation

---

## 📊 Current Field Configuration

| Field | Type | Min | Max | Step | Purpose |
|-------|------|-----|-----|------|---------|
| Interest Rate | number | 0 | 100 | 0.01 | Percentage with 2 decimals |
| Coupon Rate | number | 0 | 100 | 0.01 | Percentage with 2 decimals |
| Target Amount | number | 0 | - | 0.1 | Crores with 1 decimal |
| Total Issue Size | number | 0 | - | - | Whole number |
| Min Subscription % | number | 0 | 100 | 0.01 | Percentage with 2 decimals |
| Face Value | number | - | - | - | Rupees (whole number) |
| Min Investment | number | - | - | - | Rupees (whole number) |
| Investors Size | number | - | - | - | Count (whole number) |
| Tenure | number | - | - | - | Months (whole number) |

---

## ✅ Summary

Added `min` and `max` attributes to prevent negative values and ensure proper validation. The form should now handle number inputs more reliably.

**If you're still experiencing issues, please provide specific details about which field and what values are being affected.**

