import { test, expect } from '@playwright/test';

/**
 * Daily Fitness Score Feature Tests
 * 
 * Tests the following features:
 * 1. Daily Fitness Score calculation on Dashboard
 * 2. Circular progress indicator display
 * 3. Score breakdown showing 4 categories
 * 4. Weekly average fitness score on Progress screen
 * 5. Score color changes based on value
 */

test.describe('Daily Fitness Score Feature', () => {
  
  test.beforeEach(async ({ page }) => {
    // Remove emergent preview badge if present
    await page.addInitScript(() => {
      const removeEmergentBadge = () => {
        const badge = document.querySelector('[class*="emergent"], [id*="emergent-badge"]');
        if (badge) badge.remove();
      };
      setInterval(removeEmergentBadge, 500);
    });
  });

  test('should display onboarding screen on first visit', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check onboarding page elements
    await expect(page.getByText('Welcome to DesiFit')).toBeVisible();
    await expect(page.getByText("Let's set up your profile")).toBeVisible();
    await expect(page.getByPlaceholder('Enter your name')).toBeVisible();
    await expect(page.getByPlaceholder('10-digit phone number')).toBeVisible();
    await expect(page.getByPlaceholder('Age')).toBeVisible();
    await expect(page.getByText('Get Started')).toBeVisible();
    
    await page.screenshot({ path: 'onboarding-screen.jpeg', quality: 20 });
  });

  test('should complete onboarding and show dashboard with fitness score', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Fill onboarding form
    await page.getByPlaceholder('Enter your name').fill('Test User');
    await page.getByPlaceholder('10-digit phone number').fill('1234567890');
    await page.getByPlaceholder('Age').fill('30');
    
    // Height and weight inputs use placeholder values
    const heightInput = page.locator('input[placeholder="170"]');
    await heightInput.fill('170');
    
    const currentWeightInput = page.locator('input[placeholder="75"]');
    await currentWeightInput.fill('75');
    
    const goalWeightInput = page.locator('input[placeholder="65"]');
    await goalWeightInput.fill('65');
    
    // Click Get Started
    await page.getByText('Get Started').click();
    
    // Wait for dashboard to load
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('Hello, Test User!')).toBeVisible({ timeout: 10000 });
    
    // Verify Daily Fitness Score card is displayed
    await expect(page.getByText('Daily Fitness Score')).toBeVisible();
    
    await page.screenshot({ path: 'dashboard-fitness-score.jpeg', quality: 20 });
  });

  test('should display circular progress indicator with score', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Complete onboarding first
    await page.getByPlaceholder('Enter your name').fill('Test User 2');
    await page.getByPlaceholder('10-digit phone number').fill('9876543210');
    await page.getByPlaceholder('Age').fill('25');
    await page.locator('input[placeholder="170"]').fill('165');
    await page.locator('input[placeholder="75"]').fill('70');
    await page.locator('input[placeholder="65"]').fill('60');
    await page.getByText('Get Started').click();
    
    // Wait for dashboard
    await expect(page.getByText('Hello, Test User 2!')).toBeVisible({ timeout: 10000 });
    
    // Check for circular progress (SVG elements)
    const svgElements = page.locator('svg');
    await expect(svgElements.first()).toBeVisible();
    
    // Check for score value (/ 100 text indicates the score display)
    await expect(page.getByText('/ 100')).toBeVisible();
    
    await page.screenshot({ path: 'circular-progress-indicator.jpeg', quality: 20 });
  });

  test('should show score breakdown with 4 categories', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Complete onboarding
    await page.getByPlaceholder('Enter your name').fill('Test User 3');
    await page.getByPlaceholder('10-digit phone number').fill('5555555555');
    await page.getByPlaceholder('Age').fill('28');
    await page.locator('input[placeholder="170"]').fill('175');
    await page.locator('input[placeholder="75"]').fill('80');
    await page.locator('input[placeholder="65"]').fill('70');
    await page.getByText('Get Started').click();
    
    // Wait for dashboard
    await expect(page.getByText('Daily Fitness Score')).toBeVisible({ timeout: 10000 });
    
    // Verify all 4 score breakdown categories are displayed (exact match to avoid "Today's Calories")
    await expect(page.getByText('Calories', { exact: true })).toBeVisible();
    await expect(page.getByText('40 pts')).toBeVisible();
    
    // Exercise = 30 pts (use first() since tab also has "Exercise")
    await expect(page.getByText('Exercise', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('30 pts')).toBeVisible();
    
    // Habits = 20 pts (use first() since tab also has "Habits")
    await expect(page.getByText('Habits', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('20 pts')).toBeVisible();
    
    // Bonus = 10 pts
    await expect(page.getByText('Bonus', { exact: true })).toBeVisible();
    await expect(page.getByText('10 pts')).toBeVisible();
    
    await page.screenshot({ path: 'score-breakdown-categories.jpeg', quality: 20 });
  });

  test('should display motivational hint based on score', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Complete onboarding
    await page.getByPlaceholder('Enter your name').fill('Test User 4');
    await page.getByPlaceholder('10-digit phone number').fill('4444444444');
    await page.getByPlaceholder('Age').fill('35');
    await page.locator('input[placeholder="170"]').fill('180');
    await page.locator('input[placeholder="75"]').fill('85');
    await page.locator('input[placeholder="65"]').fill('75');
    await page.getByText('Get Started').click();
    
    // Wait for dashboard
    await expect(page.getByText('Daily Fitness Score')).toBeVisible({ timeout: 10000 });
    
    // One of these hints should be visible based on score
    const hints = [
      'Excellent! Keep it up!',
      'Good progress! Almost there!',
      'Getting started! Keep pushing!',
      'Every step counts!'
    ];
    
    let hintFound = false;
    for (const hint of hints) {
      const hintLocator = page.getByText(hint);
      if (await hintLocator.isVisible().catch(() => false)) {
        hintFound = true;
        break;
      }
    }
    
    expect(hintFound).toBe(true);
    
    await page.screenshot({ path: 'motivational-hint.jpeg', quality: 20 });
  });

  test('should navigate to Progress tab and show Weekly Fitness Score', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Complete onboarding
    await page.getByPlaceholder('Enter your name').fill('Test User 5');
    await page.getByPlaceholder('10-digit phone number').fill('6666666666');
    await page.getByPlaceholder('Age').fill('32');
    await page.locator('input[placeholder="170"]').fill('168');
    await page.locator('input[placeholder="75"]').fill('72');
    await page.locator('input[placeholder="65"]').fill('68');
    await page.getByText('Get Started').click();
    
    // Wait for dashboard
    await expect(page.getByText('Hello, Test User 5!')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Progress tab using role selector
    await page.getByRole('tab', { name: 'Progress' }).click();
    
    // Wait for Progress screen to load
    await expect(page.getByText('Monthly Progress')).toBeVisible({ timeout: 10000 });
    
    // Check Weekly Fitness Score card
    await expect(page.getByText('Weekly Fitness Score')).toBeVisible();
    await expect(page.getByText('7-Day Average')).toBeVisible();
    
    await page.screenshot({ path: 'progress-weekly-score.jpeg', quality: 20 });
  });

  test('should display weekly score hint based on average', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Complete onboarding
    await page.getByPlaceholder('Enter your name').fill('Test User 6');
    await page.getByPlaceholder('10-digit phone number').fill('7777777777');
    await page.getByPlaceholder('Age').fill('40');
    await page.locator('input[placeholder="170"]').fill('172');
    await page.locator('input[placeholder="75"]').fill('78');
    await page.locator('input[placeholder="65"]').fill('72');
    await page.getByText('Get Started').click();
    
    // Wait for dashboard
    await expect(page.getByText('Hello, Test User 6!')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Progress tab using role selector
    await page.getByRole('tab', { name: 'Progress' }).click();
    
    // Wait for Weekly Fitness Score
    await expect(page.getByText('Weekly Fitness Score')).toBeVisible({ timeout: 10000 });
    
    // One of these hints should be visible based on weekly average
    const weeklyHints = [
      'Outstanding consistency!',
      'Good work this week!',
      'Building momentum!',
      'Keep going, you got this!',
      'Log activities to track your score'
    ];
    
    let weeklyHintFound = false;
    for (const hint of weeklyHints) {
      const hintLocator = page.getByText(hint);
      if (await hintLocator.isVisible().catch(() => false)) {
        weeklyHintFound = true;
        break;
      }
    }
    
    expect(weeklyHintFound).toBe(true);
    
    await page.screenshot({ path: 'weekly-score-hint.jpeg', quality: 20 });
  });

  test('should show data count for weekly score', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Complete onboarding
    await page.getByPlaceholder('Enter your name').fill('Test User 7');
    await page.getByPlaceholder('10-digit phone number').fill('8888888888');
    await page.getByPlaceholder('Age').fill('29');
    await page.locator('input[placeholder="170"]').fill('176');
    await page.locator('input[placeholder="75"]').fill('82');
    await page.locator('input[placeholder="65"]').fill('75');
    await page.getByText('Get Started').click();
    
    // Wait for dashboard  
    await expect(page.getByText('Hello, Test User 7!')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Progress tab using role selector
    await page.getByRole('tab', { name: 'Progress' }).click();
    
    // Wait for Weekly Fitness Score
    await expect(page.getByText('Weekly Fitness Score')).toBeVisible({ timeout: 10000 });
    
    // Check for "Based on X day(s) of data" text (specific to weekly score section)
    const dataCountText = page.getByText(/Based on \d+ day.* of data/);
    await expect(dataCountText).toBeVisible();
    
    await page.screenshot({ path: 'weekly-score-data-count.jpeg', quality: 20 });
  });
});
