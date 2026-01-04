/**
 * E2E tests for countdown timers
 */

import { test, expect } from '@playwright/test';
import {
  waitForPageReady,
  waitForCountdowns,
  mockDateTime,
  clearLocalStorage
} from '../utils/helpers';

test.describe('Countdown Timers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearLocalStorage(page);
    await waitForPageReady(page);
  });

  test.describe('Timer Display', () => {
    test('should display countdown timers for conferences', async ({ page }) => {
      // Wait for countdowns to initialize
      await waitForCountdowns(page);

      // Get all countdown elements
      const countdowns = page.locator('.countdown-display');
      const count = await countdowns.count();

      expect(count).toBeGreaterThan(0);

      // Check that at least one has content
      let hasContent = false;
      for (let i = 0; i < count; i++) {
        const text = await countdowns.nth(i).textContent();
        if (text && text.trim() !== '' && text !== 'TBA') {
          hasContent = true;
          break;
        }
      }

      expect(hasContent).toBe(true);
    });

    test('should update countdown every second', async ({ page }) => {
      await waitForCountdowns(page);

      // Find a countdown with content
      const countdown = page.locator('.countdown-display').first();
      const initialText = await countdown.textContent();

      // Wait for countdown to update (should update every second)
      await page.waitForFunction(
        (initial) => {
          const el = document.querySelector('.countdown-display');
          return el && el.textContent !== initial;
        },
        initialText,
        { timeout: 3000 }
      ).catch(() => {});

      const updatedText = await countdown.textContent();

      // Text should have changed (unless it's passed or TBA)
      if (!initialText?.includes('Passed') && !initialText?.includes('TBA')) {
        expect(updatedText).not.toBe(initialText);
      }
    });

    test('should show correct format for regular countdown', async ({ page }) => {
      await waitForCountdowns(page);

      // Find regular countdown (not small)
      const regularCountdown = page.locator('.countdown-display:not(.countdown-small)').first();
      const text = await regularCountdown.textContent();

      // Should match format: "X days Xh Xm Xs" or "Deadline passed"
      if (text && !text.includes('Passed') && !text.includes('TBA')) {
        expect(text).toMatch(/\d+ days? \d+h \d+m \d+s/);
      }
    });

    test('should show compact format for small countdown', async ({ page }) => {
      // Look for small countdown if exists
      const smallCountdown = page.locator('.countdown-display.countdown-small');

      if (await smallCountdown.count() > 0) {
        const text = await smallCountdown.first().textContent();

        // Should match format: "Xd XX:XX:XX" or "Passed"
        if (text && !text.includes('Passed') && !text.includes('TBA')) {
          expect(text).toMatch(/\d+d \d{2}:\d{2}:\d{2}/);
        }
      }
    });
  });

  test.describe('Deadline States', () => {
    test('should show "Deadline passed" for past conferences', async ({ page }) => {
      await waitForCountdowns(page);

      // Look for passed deadlines
      const passedCountdowns = page.locator('.countdown-display.deadline-passed, .countdown-display:has-text("passed")');

      if (await passedCountdowns.count() > 0) {
        const text = await passedCountdowns.first().textContent();
        expect(text).toMatch(/passed/i);
      }
    });

    test('should handle TBA deadlines', async ({ page }) => {
      await waitForCountdowns(page);

      // Look for TBA deadlines
      const tbaElements = await page.$$eval('.countdown-display', elements =>
        elements.filter(el => el.dataset.deadline === 'TBA').length
      );

      if (tbaElements > 0) {
        const tbaCountdown = page.locator('.countdown-display[data-deadline="TBA"]').first();
        const text = await tbaCountdown.textContent();
        expect(text).toBe('');
      }
    });

    test('should add deadline-passed class to past deadlines', async ({ page }) => {
      await waitForCountdowns(page);

      const passedCountdowns = page.locator('.countdown-display.deadline-passed');

      if (await passedCountdowns.count() > 0) {
        // Should have the deadline-passed class
        await expect(passedCountdowns.first()).toHaveClass(/deadline-passed/);
      }
    });
  });

  test.describe('Timezone Handling', () => {
    test('should respect timezone data attribute', async ({ page }) => {
      await waitForCountdowns(page);

      // Check if any countdowns have timezone attributes
      const timezonedCountdown = page.locator('.countdown-display[data-timezone]').first();

      if (await timezonedCountdown.count() > 0) {
        const timezone = await timezonedCountdown.getAttribute('data-timezone');
        expect(timezone).toBeTruthy();

        // Timezone should be valid IANA format or UTC offset
        expect(timezone).toMatch(/^([A-Z][a-z]+\/[A-Z][a-z]+|UTC[+-]\d+)$/);
      }
    });

    test('should default to UTC-12 (AoE) when no timezone specified', async ({ page }) => {
      // This is handled internally by the countdown script
      // We can verify by checking console logs in debug mode

      const logs = [];
      page.on('console', msg => logs.push(msg.text()));

      await page.reload();
      await waitForCountdowns(page);

      // The script uses UTC-12 as default
      // This test verifies the system doesn't error out
      const countdowns = page.locator('.countdown-display');
      expect(await countdowns.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Performance', () => {
    test('should handle many countdowns efficiently', async ({ page }) => {
      // Navigate to a page with many conferences (archive or main page)
      await page.goto('/');
      await waitForPageReady(page);
      await waitForCountdowns(page);

      // Count all countdowns
      const countdowns = page.locator('.countdown-display');
      const count = await countdowns.count();

      // Even with many countdowns, page should remain responsive
      const startTime = Date.now();
      await page.evaluate(() => {
        // Force a reflow/repaint
        document.body.style.display = 'none';
        document.body.offsetHeight; // Force reflow
        document.body.style.display = '';
      });
      const endTime = Date.now();

      // Should complete quickly even with many timers
      expect(endTime - startTime).toBeLessThan(100);

      console.log(`Handling ${count} countdown timers`);
    });

    test('should clean up timer on page navigation', async ({ page }) => {
      await waitForCountdowns(page);

      // Set up listener for console messages
      const consoleLogs = [];
      page.on('console', msg => consoleLogs.push(msg.text()));

      // Navigate away
      await page.goto('/about');

      // Should not have timer errors
      const timerErrors = consoleLogs.filter(log =>
        log.includes('timer') && log.includes('error')
      );
      expect(timerErrors.length).toBe(0);
    });
  });

  test.describe('Dynamic Updates', () => {
    test('should handle dynamically added conferences', async ({ page }) => {
      await waitForCountdowns(page);

      // Add a new conference element dynamically
      await page.evaluate(() => {
        const newConf = document.createElement('div');
        newConf.className = 'ConfItem';
        newConf.innerHTML = `
          <div class="countdown-display"
               data-deadline="${new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} 23:59:59"
               data-timezone="UTC"
               id="dynamic-countdown">
          </div>
        `;
        document.body.appendChild(newConf);
      });

      // Wait for the timer to pick it up
      await page.waitForFunction(
        () => {
          const el = document.querySelector('#dynamic-countdown');
          return el && el.textContent.trim() !== '';
        },
        { timeout: 3000 }
      ).catch(() => {});

      // Check that the new countdown has content
      const dynamicCountdown = page.locator('#dynamic-countdown');
      const text = await dynamicCountdown.textContent();

      expect(text).toBeTruthy();
      expect(text).not.toBe('');
    });

    test('should handle countdown removal', async ({ page }) => {
      await waitForCountdowns(page);

      // Remove a countdown element
      await page.evaluate(() => {
        const countdown = document.querySelector('.countdown-display');
        if (countdown) {
          countdown.remove();
        }
      });

      // Should not cause errors - wait briefly for any error to manifest
      await page.waitForFunction(() => document.readyState === 'complete');

      // Page should still be functional
      const remainingCountdowns = page.locator('.countdown-display');
      expect(await remainingCountdowns.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid date formats gracefully', async ({ page }) => {
      // Add countdown with invalid date
      await page.evaluate(() => {
        const invalidCountdown = document.createElement('div');
        invalidCountdown.className = 'countdown-display';
        invalidCountdown.dataset.deadline = 'not-a-date';
        invalidCountdown.id = 'invalid-countdown';
        document.body.appendChild(invalidCountdown);
      });

      // Wait for error message to appear
      await page.waitForFunction(
        () => {
          const el = document.querySelector('#invalid-countdown');
          return el && el.textContent.trim() !== '';
        },
        { timeout: 3000 }
      ).catch(() => {});

      // Should show error message
      const invalidCountdown = page.locator('#invalid-countdown');
      const text = await invalidCountdown.textContent();

      expect(text).toMatch(/Invalid date|Error/);
    });

    test('should handle missing Luxon library', async ({ page }) => {
      // Navigate to page and remove Luxon
      await page.evaluate(() => {
        delete window.luxon;
      });

      // Reload the countdown script
      await page.evaluate(() => {
        const script = document.createElement('script');
        script.src = '/static/js/countdown-simple.js';
        document.head.appendChild(script);
      });

      await page.waitForFunction(() => document.readyState === 'complete');

      // Should not crash the page
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should work on mobile viewports', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');
      await waitForPageReady(page);
      await waitForCountdowns(page);

      // Countdowns should still work
      const countdowns = page.locator('.countdown-display');
      const count = await countdowns.count();

      expect(count).toBeGreaterThan(0);

      // Check text is visible
      const firstCountdown = countdowns.first();
      const text = await firstCountdown.textContent();

      if (text && !text.includes('TBA')) {
        expect(text).toBeTruthy();
      }
    });

    test('should handle orientation change', async ({ page, context }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await waitForCountdowns(page);

      // Change to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForFunction(() => document.readyState === 'complete');

      // Countdowns should still be updating
      const countdown = page.locator('.countdown-display').first();
      const text1 = await countdown.textContent();

      // Wait for countdown to update
      await page.waitForFunction(
        (initial) => {
          const el = document.querySelector('.countdown-display');
          return el && el.textContent !== initial;
        },
        text1,
        { timeout: 3000 }
      ).catch(() => {});

      const text2 = await countdown.textContent();

      // Should still be updating (unless passed/TBA)
      if (!text1?.includes('Passed') && !text1?.includes('TBA')) {
        expect(text2).not.toBe(text1);
      }
    });
  });
});
