import { Page, expect } from '@playwright/test';

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
}

export async function dismissToasts(page: Page) {
  await page.addLocatorHandler(
    page.locator('[data-sonner-toast], .Toastify__toast, [role="status"].toast, .MuiSnackbar-root'),
    async () => {
      const close = page.locator('[data-sonner-toast] [data-close], [data-sonner-toast] button[aria-label="Close"], .Toastify__close-button, .MuiSnackbar-root button');
      await close.first().click({ timeout: 2000 }).catch(() => {});
    },
    { times: 10, noWaitAfter: true }
  );
}

export async function checkForErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const errorElements = Array.from(
      document.querySelectorAll('.error, [class*="error"], [id*="error"]')
    );
    return errorElements.map(el => el.textContent || '').filter(Boolean);
  });
}

// Complete onboarding form with test data
export async function completeOnboarding(page: Page, userData?: {
  name?: string;
  phone?: string;
  age?: string;
  height?: string;
  currentWeight?: string;
  goalWeight?: string;
}) {
  const data = {
    name: userData?.name || 'Test User',
    phone: userData?.phone || '1234567890',
    age: userData?.age || '30',
    height: userData?.height || '170',
    currentWeight: userData?.currentWeight || '75',
    goalWeight: userData?.goalWeight || '65',
  };

  // Fill name
  const nameInput = page.getByPlaceholder('Enter your name');
  await nameInput.fill(data.name);
  
  // Fill phone
  const phoneInput = page.getByPlaceholder('10-digit phone number');
  await phoneInput.fill(data.phone);
  
  // Fill age
  const ageInput = page.getByPlaceholder('Age');
  await ageInput.fill(data.age);
  
  // Fill height
  const heightInput = page.getByPlaceholder('170');
  await heightInput.fill(data.height);
  
  // Fill current weight
  const currentWeightInput = page.getByPlaceholder('75');
  await currentWeightInput.fill(data.currentWeight);
  
  // Fill goal weight  
  const goalWeightInput = page.getByPlaceholder('65');
  await goalWeightInput.fill(data.goalWeight);
  
  // Click Get Started button
  await page.getByText('Get Started').click();
}

// Navigate to a specific tab
export async function navigateToTab(page: Page, tabName: string) {
  await page.getByRole('tab', { name: tabName }).click();
}
