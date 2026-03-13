# DesiFit - Dashboard Calorie Calculation Testing Guide

## System Overview

The DesiFit app uses **100% local storage** (AsyncStorage) for all data. No backend authentication or data storage is required.

## Data Storage Structure

### Food Logs (AsyncStorage key: `food_logs`)
```json
{
  "id": "1710345600000",
  "foodName": "Roti (Chapati)",
  "caloriesPerUnit": 70,
  "servingSize": "1 piece",
  "quantity": 2,
  "totalCalories": 140,
  "date": "2026-03-13",
  "timestamp": "2026-03-13T10:30:00Z"
}
```

### Exercise Logs (AsyncStorage key: `exercise_logs`)
```json
{
  "id": "1710345700000",
  "exerciseName": "Walking",
  "caloriesPerMinute": 4.2,
  "duration": 30,
  "caloriesBurned": 126,
  "date": "2026-03-13",
  "timestamp": "2026-03-13T11:00:00Z"
}
```

## Dashboard Calculation Logic

### Formula Implementation

```typescript
// 1. Filter logs for today's date
const today = getTodayString(); // Format: "YYYY-MM-DD"
const todayFoodLogs = allFoodLogs.filter(log => log.date === today);
const todayExerciseLogs = allExerciseLogs.filter(log => log.date === today);

// 2. Sum calories consumed (from food logs)
const caloriesConsumed = todayFoodLogs.reduce((sum, log) => {
  return sum + (log.totalCalories || 0);
}, 0);

// 3. Sum calories burned (from exercise logs)
const caloriesBurned = todayExerciseLogs.reduce((sum, log) => {
  return sum + (log.caloriesBurned || 0);
}, 0);

// 4. Calculate remaining calories
const remainingCalories = dailyCalorieGoal - caloriesConsumed + caloriesBurned;
```

### Expected Behavior

**Daily Calorie Goal**: Auto-calculated from BMR (e.g., 2000 cal)

**Example Calculation:**
- User logs 2 Rotis: 70 × 2 = 140 cal
- User logs 1.5 bowls Rice: 130 × 1.5 = 195 cal
- **Total Consumed**: 140 + 195 = **335 cal**

- User logs 30 mins Walking: 4.2 × 30 = 126 cal
- User logs 20 mins Running: 10 × 20 = 200 cal
- **Total Burned**: 126 + 200 = **326 cal**

- **Remaining**: 2000 - 335 + 326 = **1991 cal**

## Testing Steps

### Step 1: Setup Profile
1. Open app: https://health-score-desi.preview.emergentagent.com
2. Complete onboarding:
   - Name: Test User
   - Phone: 9876543210
   - Age: 28
   - Height: 175 cm
   - Current Weight: 80 kg
   - Goal Weight: 70 kg
3. Note your Daily Calorie Goal (e.g., ~2031 cal)

### Step 2: Test Food Logging
1. Go to **Food tab**
2. Verify "Today's Calories: 0 cal"
3. Tap **"Roti (Chapati)"**
4. Enter quantity: **2**
5. Verify calculation box shows: "70 × 2 = 140 cal"
6. Tap **"Log Food"**
7. Verify:
   - Success alert appears
   - "Today's Calories" updates to **140 cal**
   - Entry appears in "Today's Meals" showing:
     - "2x 1 piece • 70 cal/unit = 140 cal total"

### Step 3: Add More Food
1. Tap **"Rice (Cooked)"**
2. Enter quantity: **1.5**
3. Verify calculation: "130 × 1.5 = 195 cal"
4. Tap **"Log Food"**
5. Verify:
   - "Today's Calories" updates to **335 cal** (140 + 195)
   - Both entries visible in "Today's Meals"

### Step 4: Test Exercise Logging
1. Go to **Exercise tab**
2. Verify stats show: "0 Calories Burned, 0 Minutes"
3. Tap **"Walking"** card
4. Note: "~4.2 cal/min" shown on card
5. Enter duration: **30**
6. Verify calculation box shows: "4.2 × 30 = 126 cal"
7. Tap **"Log Exercise"**
8. Verify:
   - Success alert appears
   - Stats update to "126 Calories Burned, 30 Minutes"
   - Entry appears showing: "30 mins • 4.2 cal/min = 126 cal burned"

### Step 5: Add More Exercise
1. Tap **"Running"** card
2. Enter duration: **20**
3. Verify calculation: "10 × 20 = 200 cal"
4. Tap **"Log Exercise"**
5. Verify:
   - Stats show "326 Calories Burned, 50 Minutes" (126 + 200)
   - Both entries visible

### Step 6: Verify Dashboard Calculations
1. Go to **Dashboard tab**
2. Pull down to refresh
3. **Verify the following numbers:**

   **Calories Consumed**: 335 cal ✓
   - Should match sum of food logs (140 + 195)
   
   **Calories Burned**: 326 cal ✓
   - Should match sum of exercise logs (126 + 200)
   
   **Daily Goal**: ~2031 cal ✓
   - Auto-calculated from your profile
   
   **Remaining Calories**: ~2022 cal ✓
   - Formula: 2031 - 335 + 326 = 2022

4. Verify progress bar reflects consumption percentage
5. Verify color-coded stat boxes show correct numbers

### Step 7: Test Real-Time Updates
1. While on Dashboard, note current numbers
2. Switch to **Food tab**
3. Log "Idli": 3 pieces
   - Calculation: 39 × 3 = 117 cal
4. Switch back to **Dashboard**
5. Pull down to refresh
6. **Verify**: Consumed increases by 117 cal (335 → 452)
7. **Verify**: Remaining decreases by 117 cal

### Step 8: Test Delete Functionality
1. Go to **Food tab**
2. Tap trash icon on one food entry
3. Verify entry is removed
4. Note new "Today's Calories" total
5. Go to **Dashboard**
6. Pull down to refresh
7. **Verify**: Numbers updated correctly

### Step 9: Test Date Filtering
1. Log several food and exercise entries today
2. Go to **Dashboard**
3. **Verify**: Only today's entries are counted
4. Wait until tomorrow (or change device date)
5. **Verify**: Dashboard resets to 0/0 for new day
6. **Verify**: Previous day's logs are still stored but not counted

## Expected Results Checklist

- [ ] Food logs store: foodName, caloriesPerUnit, quantity, totalCalories, date
- [ ] Exercise logs store: exerciseName, duration, caloriesBurned, date
- [ ] Dashboard shows correct sum of food totalCalories for today
- [ ] Dashboard shows correct sum of exercise caloriesBurned for today
- [ ] Remaining = Daily Goal - Consumed + Burned (formula is correct)
- [ ] Dashboard updates when new food is logged
- [ ] Dashboard updates when new exercise is logged
- [ ] Dashboard updates when entry is deleted
- [ ] Pull-to-refresh reloads data correctly
- [ ] Only today's logs are counted (date filtering works)
- [ ] All calculations match displayed values
- [ ] No phantom calories or incorrect sums

## Common Issues & Solutions

### Issue: Dashboard shows 0/0 after logging
**Solution**: Pull down to refresh the dashboard

### Issue: Calories don't match food logs
**Solution**: Check that food logs store `totalCalories` (not just `calories`)

### Issue: Exercise calories not adding up
**Solution**: Verify exercise logs store `caloriesBurned` field

### Issue: Old entries still counting
**Solution**: Check date filtering - should only count today's date

### Issue: Negative remaining calories
**This is normal** - means you've consumed more than your goal

## Storage Verification (Developer)

To check AsyncStorage data:
1. Open browser DevTools → Application → Local Storage
2. Look for AsyncStorage keys:
   - `food_logs` - All food entries (array)
   - `exercise_logs` - All exercise entries (array)
   - `userProfile` - User info with dailyCalorieGoal
3. Verify data structure matches examples above

## Formula Verification Examples

### Test Case 1: Basic Calculation
- Daily Goal: 2000 cal
- Food: 500 cal consumed
- Exercise: 200 cal burned
- **Expected Remaining**: 2000 - 500 + 200 = **1700 cal** ✓

### Test Case 2: Over Goal
- Daily Goal: 2000 cal
- Food: 2500 cal consumed
- Exercise: 300 cal burned
- **Expected Remaining**: 2000 - 2500 + 300 = **-200 cal** ✓
- (Shows as negative - user exceeded goal)

### Test Case 3: No Exercise
- Daily Goal: 2000 cal
- Food: 800 cal consumed
- Exercise: 0 cal burned
- **Expected Remaining**: 2000 - 800 + 0 = **1200 cal** ✓

### Test Case 4: Multiple Entries
- Daily Goal: 2000 cal
- Food Logs:
  - Roti: 70 × 2 = 140 cal
  - Rice: 130 × 1.5 = 195 cal
  - Dal: 100 × 1 = 100 cal
  - Total: 435 cal
- Exercise Logs:
  - Walking: 4.2 × 30 = 126 cal
  - Yoga: 4.2 × 45 = 189 cal
  - Total: 315 cal
- **Expected Remaining**: 2000 - 435 + 315 = **1880 cal** ✓

## Success Criteria

✅ **All formulas are correct**
✅ **Data is stored with proper fields**
✅ **Dashboard sums only today's logs**
✅ **Real-time updates work**
✅ **Pull-to-refresh reloads data**
✅ **Delete updates calculations**
✅ **Date filtering prevents old logs from counting**
✅ **No backend dependencies - 100% local**

---

**App Link**: https://health-score-desi.preview.emergentagent.com

**Last Updated**: March 13, 2026
