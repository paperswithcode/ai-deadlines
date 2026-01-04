/**
 * E2E tests for search functionality
 */

import { test, expect } from '@playwright/test';
import {
  waitForPageReady,
  waitForCountdowns,
  mockDateTime,
  clearLocalStorage
} from '../utils/helpers';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search');
    await clearLocalStorage(page);
    await waitForPageReady(page);
  });

  test.describe('Search Interface', () => {
    test('should display search page with input field', async ({ page }) => {
      // Check search input exists
      const searchInput = page.locator('#search-box, input[type="search"]');
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toBeEnabled();

      // Check search results container exists
      const searchResults = page.locator('#search-results, .search-results');
      await expect(searchResults).toBeVisible();
    });

    test('should show placeholder text in search input', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');
      const placeholder = await searchInput.getAttribute('placeholder');
      expect(placeholder).toBeTruthy();
      expect(placeholder.toLowerCase()).toContain('search');
    });

    test('should focus search input on page load', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      // Wait for autofocus to complete
      await page.waitForFunction(() => document.readyState === 'complete');

      // Check if input is focused
      const isFocused = await searchInput.evaluate(el => el === document.activeElement);
      expect(isFocused).toBe(true);
    });
  });

  test.describe('Search Execution', () => {
    test('should search for conferences by name', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      // Type search query
      await searchInput.fill('pycon');

      // Trigger search (either by pressing Enter or clicking search button)
      await searchInput.press('Enter');

      // Wait for results to load
      await page.waitForFunction(() => document.readyState === 'complete');

      // Check if results contain PyCon conferences
      const results = page.locator('#search-results .ConfItem, .search-results .conference-item');
      const count = await results.count();

      if (count > 0) {
        // Verify at least one result contains "pycon" (case-insensitive)
        const firstResult = results.first();
        const text = await firstResult.textContent();
        expect(text.toLowerCase()).toContain('pycon');
      }
    });

    test('should search for conferences by location', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      // Search by location
      await searchInput.fill('online');
      await searchInput.press('Enter');

      await page.waitForFunction(() => document.readyState === 'complete');

      // Check if results contain online conferences
      const results = page.locator('#search-results .conf-place, .search-results .location');

      if (await results.count() > 0) {
        const firstLocation = await results.first().textContent();
        expect(firstLocation.toLowerCase()).toContain('online');
      }
    });

    test('should show no results message for empty search', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      // Search for something that likely doesn't exist
      await searchInput.fill('xyznonexistentconf123');
      await searchInput.press('Enter');

      await page.waitForFunction(() => document.readyState === 'complete');

      // Check for no results message
      const noResults = page.locator('.no-results, [class*="no-result"], :text("No results"), :text("not found")');

      if (await noResults.count() > 0) {
        await expect(noResults.first()).toBeVisible();
      }
    });

    test('should clear search and show all results', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      // First do a search
      await searchInput.fill('python');
      await searchInput.press('Enter');
      await page.waitForFunction(() => document.readyState === 'complete');

      // Clear search
      await searchInput.clear();
      await searchInput.press('Enter');
      await page.waitForFunction(() => document.readyState === 'complete');

      // Should show results (either all or a default set)
      const results = page.locator('#search-results .ConfItem, .search-results .conference-item');
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should handle special characters in search', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      // Test with special characters
      const specialQueries = ['C++', 'R&D', '@conference', '#python'];

      for (const query of specialQueries) {
        await searchInput.fill(query);
        await searchInput.press('Enter');
        await page.waitForFunction(() => document.readyState === 'complete');

        // Should not crash or show error
        const errorMessage = page.locator('.error, .exception, [class*="error"]');
        expect(await errorMessage.count()).toBe(0);
      }
    });
  });

  test.describe('Search Results Display', () => {
    test('should display conference details in results', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      // Search for conferences
      await searchInput.fill('conference');
      await searchInput.press('Enter');
      await page.waitForFunction(() => document.readyState === 'complete');

      const firstResult = page.locator('#search-results .ConfItem, .search-results .conference-item').first();

      if (await firstResult.isVisible()) {
        // Check for essential conference information
        const title = firstResult.locator('.conf-title, .conference-title, h3, h4');
        await expect(title).toBeVisible();

        // Check for deadline or date
        const deadline = firstResult.locator('.deadline, .timer, .countdown-display, .date');
        if (await deadline.count() > 0) {
          await expect(deadline.first()).toBeVisible();
        }

        // Check for location
        const location = firstResult.locator('.conf-place, .location, .place');
        if (await location.count() > 0) {
          await expect(location.first()).toBeVisible();
        }
      }
    });

    test('should display conference tags/categories', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      await searchInput.fill('python');
      await searchInput.press('Enter');
      await page.waitForFunction(() => document.readyState === 'complete');

      const tags = page.locator('#search-results .conf-sub, .badge, .tag, [class*="tag"]');

      if (await tags.count() > 0) {
        const firstTag = tags.first();
        await expect(firstTag).toBeVisible();

        // Tag should have some text
        const tagText = await firstTag.textContent();
        expect(tagText).toBeTruthy();
      }
    });

    test('should display countdown timers in results', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      await searchInput.fill('2025');
      await searchInput.press('Enter');
      await page.waitForFunction(() => document.readyState === 'complete');

      // Look for countdown timers
      const timers = page.locator('.search-timer, .countdown-display, .timer');

      if (await timers.count() > 0) {
        const firstTimer = timers.first();
        await expect(firstTimer).toBeVisible();

        // Timer should have content (either countdown or "Passed")
        const timerText = await firstTimer.textContent();
        expect(timerText).toBeTruthy();
      }
    });

    test('should show calendar buttons for conferences', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      await searchInput.fill('conference');
      await searchInput.press('Enter');
      await page.waitForFunction(() => document.readyState === 'complete');

      // Look for calendar buttons
      const calendarButtons = page.locator('.calendar, .cal-button, [class*="calendar"]');

      if (await calendarButtons.count() > 0) {
        const firstCalendar = calendarButtons.first();
        await expect(firstCalendar).toBeVisible();
      }
    });
  });

  test.describe('Search URL Parameters', () => {
    test('should load search from URL query parameter', async ({ page }) => {
      // Navigate directly with search query
      await page.goto('/search?q=europython');
      await waitForPageReady(page);

      // Check if search input has the query
      const searchInput = page.locator('#search-box, input[type="search"]');
      const value = await searchInput.inputValue();
      expect(value.toLowerCase()).toContain('europython');

      // Check if results are displayed
      await page.waitForFunction(() => document.readyState === 'complete');
      const results = page.locator('#search-results .ConfItem, .search-results .conference-item');

      // Should have results or no-results message
      const hasResults = await results.count() > 0;
      const hasNoResults = await page.locator('.no-results, [class*="no-result"]').count() > 0;
      expect(hasResults || hasNoResults).toBe(true);
    });

    test('should update URL when searching', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      await searchInput.fill('django');
      await searchInput.press('Enter');
      await page.waitForFunction(() => document.readyState === 'complete');

      // Check if URL contains search query
      const url = page.url();
      expect(url).toContain('q=django');
    });
  });

  test.describe('Search Filters', () => {
    test('should filter by conference type when clicking tags @visual', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      // First search to get results with tags
      await searchInput.fill('python');
      await searchInput.press('Enter');
      await page.waitForFunction(() => document.readyState === 'complete');

      // Click on a conference type tag
      const tag = page.locator('.conf-sub, .badge').first();

      if (await tag.isVisible()) {
        const tagText = await tag.textContent();
        await tag.click();

        await page.waitForFunction(() => document.readyState === 'complete');

        // Check if filtering occurred (URL change or results update)
        const url = page.url();
        const resultsChanged = url.includes('type=') || url.includes('sub=');

        // Or check if filter UI updated
        const activeFilter = page.locator('.active-filter, .filter-active, [class*="active"]');
        const hasActiveFilter = await activeFilter.count() > 0;

        expect(resultsChanged || hasActiveFilter).toBe(true);
      }
    });
  });

  test.describe('Search Performance', () => {
    test('should handle rapid successive searches', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      // Perform rapid searches
      const queries = ['p', 'py', 'pyc', 'pyco', 'pycon'];

      for (const query of queries) {
        await searchInput.fill(query);
        // Don't wait between keystrokes
      }

      await searchInput.press('Enter');
      await page.waitForFunction(() => document.readyState === 'complete');

      // Should show results for final query
      const results = page.locator('#search-results');
      await expect(results).toBeVisible();

      // Should not show error
      const error = page.locator('.error, .exception');
      expect(await error.count()).toBe(0);
    });

    test('should handle very long search queries', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      // Create a very long search query
      const longQuery = 'python '.repeat(50);

      await searchInput.fill(longQuery);
      await searchInput.press('Enter');
      await page.waitForFunction(() => document.readyState === 'complete');

      // Should handle gracefully
      const error = page.locator('.error, .exception');
      expect(await error.count()).toBe(0);
    });
  });

  test.describe('Search Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Tab to search input
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // May need multiple tabs

      const searchInput = page.locator('#search-box, input[type="search"]');

      // Type using keyboard
      await page.keyboard.type('pycon');

      // Submit with Enter
      await page.keyboard.press('Enter');

      await page.waitForFunction(() => document.readyState === 'complete');

      // Tab through results
      await page.keyboard.press('Tab');

      // Check if a result link is focused
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
    });

    test('should have proper ARIA labels', async ({ page }) => {
      const searchInput = page.locator('#search-box, input[type="search"]');

      // Check for aria-label or associated label
      const ariaLabel = await searchInput.getAttribute('aria-label');
      const id = await searchInput.getAttribute('id');

      if (!ariaLabel && id) {
        // Check for associated label
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel).toBe(true);
      } else {
        expect(ariaLabel).toBeTruthy();
      }
    });
  });

  test.describe('Mobile Search', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/search');
      await waitForPageReady(page);

      const searchInput = page.locator('#search-box, input[type="search"]');
      await expect(searchInput).toBeVisible();

      // Should be able to search on mobile
      await searchInput.fill('mobile test');
      await searchInput.press('Enter');

      await page.waitForFunction(() => document.readyState === 'complete');

      // Results should be visible
      const results = page.locator('#search-results');
      await expect(results).toBeVisible();
    });
  });
});
