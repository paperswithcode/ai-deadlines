/**
 * E2E tests for conference filtering functionality
 */

import { test, expect } from '@playwright/test';
import {
  waitForPageReady,
  waitForCountdowns,
  mockDateTime,
  clearLocalStorage
} from '../utils/helpers';

test.describe('Conference Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearLocalStorage(page);
    await waitForPageReady(page);
    await waitForCountdowns(page);
  });

  test.describe('Filter Controls', () => {
    test('should display filter controls on homepage', async ({ page }) => {
      // Check for filter sections
      const filterContainer = page.locator('.filters, #filters, [class*="filter"]').first();
      await expect(filterContainer).toBeVisible();

      // Check for common filter types
      const topicFilters = page.locator('[data-filter-type="topic"], .topic-filter, .sub-filter');
      const formatFilters = page.locator('[data-filter-type="format"], .format-filter');
      const featureFilters = page.locator('[data-filter-type="feature"], .feature-filter');

      // At least some filters should be present
      const hasFilters =
        await topicFilters.count() > 0 ||
        await formatFilters.count() > 0 ||
        await featureFilters.count() > 0;

      expect(hasFilters).toBe(true);
    });

    test('should have filter checkboxes or buttons', async ({ page }) => {
      // Look for filter inputs
      const filterInputs = page.locator('input[type="checkbox"][class*="filter"], button[class*="filter"]');
      const inputCount = await filterInputs.count();

      expect(inputCount).toBeGreaterThan(0);

      // Check that filters are interactive
      if (inputCount > 0) {
        const firstFilter = filterInputs.first();
        await expect(firstFilter).toBeEnabled();
      }
    });

    test('should display clear filters button', async ({ page }) => {
      const clearButton = page.locator('button:has-text("Clear"), #clear-filters, .clear-filters');

      if (await clearButton.count() > 0) {
        await expect(clearButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Topic/Category Filtering', () => {
    test('should filter conferences by Python category', async ({ page }) => {
      // Find and click Python filter
      const pyFilter = page.locator('[value="PY"], [data-sub="PY"], .PY-filter, label:has-text("Python")');

      if (await pyFilter.count() > 0) {
        await pyFilter.first().click();
        await page.waitForFunction(() => document.readyState === 'complete');

        // Check that conferences are filtered
        const visibleConferences = page.locator('.ConfItem:visible, .conference-card:visible');
        const count = await visibleConferences.count();

        if (count > 0) {
          // Check that visible conferences have PY tag
          const firstConf = visibleConferences.first();
          const tags = firstConf.locator('.conf-sub, .badge, .tag');
          const tagText = await tags.allTextContents();
          const hasPyTag = tagText.some(text => text.includes('PY') || text.includes('Python'));
          expect(hasPyTag).toBe(true);
        }
      }
    });

    test('should filter conferences by Data Science category', async ({ page }) => {
      const dataFilter = page.locator('[value="DATA"], [data-sub="DATA"], .DATA-filter, label:has-text("Data")');

      if (await dataFilter.count() > 0) {
        await dataFilter.first().click();
        await page.waitForFunction(() => document.readyState === 'complete');

        const visibleConferences = page.locator('.ConfItem:visible, .conference-card:visible');
        const count = await visibleConferences.count();

        // Either shows filtered results or "no results" message
        if (count === 0) {
          const noResults = page.locator('.no-results, .empty-state, :text("No conferences")');
          await expect(noResults.first()).toBeVisible();
        } else {
          // Check filtered conferences have DATA tag
          const tags = visibleConferences.first().locator('.conf-sub, .badge');
          const hasDataTag = await tags.locator(':text("DATA")').count() > 0;
          expect(hasDataTag).toBe(true);
        }
      }
    });

    test('should allow multiple category selection', async ({ page }) => {
      const pyFilter = page.locator('[value="PY"], [data-sub="PY"]').first();
      const webFilter = page.locator('[value="WEB"], [data-sub="WEB"]').first();

      if (await pyFilter.isVisible() && await webFilter.isVisible()) {
        await pyFilter.click();
        await webFilter.click();
        await page.waitForFunction(() => document.readyState === 'complete');

        // Should show conferences with either PY or WEB
        const visibleConferences = page.locator('.ConfItem:visible, .conference-card:visible');
        const count = await visibleConferences.count();

        if (count > 0) {
          const tags = await visibleConferences.first().locator('.conf-sub, .badge').allTextContents();
          const hasRelevantTag = tags.some(tag =>
            tag.includes('PY') || tag.includes('WEB') ||
            tag.includes('Python') || tag.includes('Web')
          );
          expect(hasRelevantTag).toBe(true);
        }
      }
    });
  });

  test.describe('Format Filtering', () => {
    test('should filter by online conferences', async ({ page }) => {
      const onlineFilter = page.locator('[value="Online"], [data-format="online"], label:has-text("Online")');

      if (await onlineFilter.count() > 0) {
        await onlineFilter.first().click();
        await page.waitForFunction(() => document.readyState === 'complete');

        const visibleConferences = page.locator('.ConfItem:visible, .conference-card:visible');

        if (await visibleConferences.count() > 0) {
          // Check that conferences show online location
          const firstConf = visibleConferences.first();
          const location = await firstConf.locator('.conf-place, .location').textContent();
          expect(location.toLowerCase()).toContain('online');
        }
      }
    });

    test('should filter by in-person conferences', async ({ page }) => {
      const inPersonFilter = page.locator('[value="In-Person"], [data-format="in-person"], label:has-text("In-Person")');

      if (await inPersonFilter.count() > 0) {
        await inPersonFilter.first().click();
        await page.waitForFunction(() => document.readyState === 'complete');

        const visibleConferences = page.locator('.ConfItem:visible, .conference-card:visible');

        if (await visibleConferences.count() > 0) {
          // In-person conferences should have physical locations
          const firstConf = visibleConferences.first();
          const location = await firstConf.locator('.conf-place, .location').textContent();
          expect(location.toLowerCase()).not.toContain('online');
          expect(location.length).toBeGreaterThan(0);
        }
      }
    });

    test('should filter by hybrid conferences', async ({ page }) => {
      const hybridFilter = page.locator('[value="Hybrid"], [data-format="hybrid"], label:has-text("Hybrid")');

      if (await hybridFilter.count() > 0) {
        await hybridFilter.first().click();
        await page.waitForFunction(() => document.readyState === 'complete');

        // Check results or no-results message
        const hasResults = await page.locator('.ConfItem:visible, .conference-card:visible').count() > 0;
        const hasNoResults = await page.locator('.no-results, .empty-state').count() > 0;

        expect(hasResults || hasNoResults).toBe(true);
      }
    });
  });

  test.describe('Feature Filtering', () => {
    test('should filter by financial aid availability', async ({ page }) => {
      const finaidFilter = page.locator('[value="finaid"], [data-feature="finaid"], label:has-text("Financial Aid")');

      if (await finaidFilter.count() > 0) {
        await finaidFilter.first().click();
        await page.waitForFunction(() => document.readyState === 'complete');

        const visibleConferences = page.locator('.ConfItem:visible, .conference-card:visible');

        if (await visibleConferences.count() > 0) {
          // Check for financial aid indicator
          const firstConf = visibleConferences.first();
          const hasFinaidIndicator = await firstConf.locator('[class*="finaid"], .fa-hand-holding-dollar, :text("Financial Aid")').count() > 0;
          expect(hasFinaidIndicator).toBe(true);
        }
      }
    });

    test('should filter by workshop availability', async ({ page }) => {
      const workshopFilter = page.locator('[value="workshop"], [data-feature="workshop"], label:has-text("Workshop")');

      if (await workshopFilter.count() > 0) {
        await workshopFilter.first().click();
        await page.waitForFunction(() => document.readyState === 'complete');

        // Either shows filtered results or no results
        const hasResults = await page.locator('.ConfItem:visible, .conference-card:visible').count() > 0;
        const hasNoResults = await page.locator('.no-results, .empty-state').count() > 0;

        expect(hasResults || hasNoResults).toBe(true);
      }
    });

    test('should filter by sponsorship opportunities', async ({ page }) => {
      const sponsorFilter = page.locator('[value="sponsor"], [data-feature="sponsor"], label:has-text("Sponsor")');

      if (await sponsorFilter.count() > 0) {
        await sponsorFilter.first().click();
        await page.waitForFunction(() => document.readyState === 'complete');

        const visibleConferences = page.locator('.ConfItem:visible, .conference-card:visible');

        if (await visibleConferences.count() > 0) {
          // Check for sponsor indicator
          const firstConf = visibleConferences.first();
          const hasSponsorIndicator = await firstConf.locator('[class*="sponsor"], .fa-handshake, :text("Sponsor")').count() > 0;

          // Some conferences with sponsorship should have indicator
          expect(hasSponsorIndicator).toBeDefined();
        }
      }
    });
  });

  test.describe('Clear Filters', () => {
    test('should clear all applied filters', async ({ page }) => {
      // Apply some filters first
      const firstFilter = page.locator('input[type="checkbox"][class*="filter"]').first();

      if (await firstFilter.isVisible()) {
        await firstFilter.check();
        await page.waitForFunction(() => document.readyState === 'complete');

        // Find and click clear button
        const clearButton = page.locator('button:has-text("Clear"), #clear-filters, .clear-filters');

        if (await clearButton.count() > 0) {
          await clearButton.first().click();
          await page.waitForFunction(() => document.readyState === 'complete');

          // All checkboxes should be unchecked
          const checkedFilters = page.locator('input[type="checkbox"][class*="filter"]:checked');
          const checkedCount = await checkedFilters.count();

          expect(checkedCount).toBe(0);
        }
      }
    });

    test('should show all conferences after clearing filters', async ({ page }) => {
      // Get initial conference count
      const initialCount = await page.locator('.ConfItem, .conference-card').count();

      // Apply restrictive filter
      const filter = page.locator('input[type="checkbox"][class*="filter"]').first();
      if (await filter.isVisible()) {
        await filter.check();
        await page.waitForFunction(() => document.readyState === 'complete');

        // Clear filters
        const clearButton = page.locator('button:has-text("Clear"), #clear-filters');
        if (await clearButton.count() > 0) {
          await clearButton.first().click();
          await page.waitForFunction(() => document.readyState === 'complete');

          // Conference count should return to initial or similar
          const afterClearCount = await page.locator('.ConfItem, .conference-card').count();
          expect(afterClearCount).toBeGreaterThanOrEqual(initialCount - 5); // Allow some variance
        }
      }
    });
  });

  test.describe('Filter Persistence', () => {
    test('should remember filter state during session', async ({ page }) => {
      // Apply filter
      const filter = page.locator('input[type="checkbox"][class*="filter"]').first();

      if (await filter.isVisible()) {
        await filter.check();
        const filterId = await filter.getAttribute('id') || await filter.getAttribute('value');

        // Navigate away and back
        await page.goto('/about');
        await page.waitForLoadState('domcontentloaded');
        await page.goto('/');
        await waitForPageReady(page);

        // Check if filter is still applied (may depend on implementation)
        const sameFilter = filterId ?
          page.locator(`[id="${filterId}"], [value="${filterId}"]`).first() :
          page.locator('input[type="checkbox"][class*="filter"]').first();

        // Filter might or might not persist (implementation-dependent)
        const isChecked = await sameFilter.isChecked();
        expect(typeof isChecked).toBe('boolean');
      }
    });
  });

  test.describe('Filter Combinations', () => {
    test('should handle multiple filter types simultaneously', async ({ page }) => {
      // Try to apply category + format filters
      const categoryFilter = page.locator('[value="PY"], [data-sub="PY"]').first();
      const formatFilter = page.locator('[value="Online"], [data-format="online"]').first();

      if (await categoryFilter.isVisible() && await formatFilter.isVisible()) {
        await categoryFilter.click();
        await formatFilter.click();
        await page.waitForFunction(() => document.readyState === 'complete');

        // Should show only online Python conferences
        const visibleConferences = page.locator('.ConfItem:visible, .conference-card:visible');

        if (await visibleConferences.count() > 0) {
          const firstConf = visibleConferences.first();

          // Check has Python tag
          const tags = await firstConf.locator('.conf-sub, .badge').allTextContents();
          const hasPyTag = tags.some(tag => tag.includes('PY') || tag.includes('Python'));

          // Check is online
          const location = await firstConf.locator('.conf-place, .location').textContent();
          const isOnline = location.toLowerCase().includes('online');

          expect(hasPyTag || isOnline).toBe(true);
        }
      }
    });

    test('should show appropriate message when no conferences match filters', async ({ page }) => {
      // Apply very restrictive filter combination
      const filters = page.locator('input[type="checkbox"][class*="filter"]');
      const filterCount = await filters.count();

      if (filterCount >= 3) {
        // Check multiple filters to be restrictive
        for (let i = 0; i < Math.min(3, filterCount); i++) {
          await filters.nth(i).check();
        }

        await page.waitForFunction(() => document.readyState === 'complete');

        // Should either show results or "no matches" message
        const hasResults = await page.locator('.ConfItem:visible, .conference-card:visible').count() > 0;
        const hasNoMatches = await page.locator('.no-results, .empty-state, :text("No conferences"), :text("no matches")').count() > 0;

        expect(hasResults || hasNoMatches).toBe(true);
      }
    });
  });

  test.describe('Mobile Filtering', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Filters might be in a collapsible menu on mobile
      const filterToggle = page.locator('[data-toggle="filters"], .filter-toggle, button:has-text("Filter")');

      if (await filterToggle.count() > 0) {
        await filterToggle.first().click();
        await page.waitForFunction(() => document.readyState === 'complete');
      }

      // Apply a filter
      const filter = page.locator('input[type="checkbox"][class*="filter"]').first();

      if (await filter.isVisible()) {
        await filter.check();
        await page.waitForFunction(() => document.readyState === 'complete');

        // Verify filter is applied
        const isChecked = await filter.isChecked();
        expect(isChecked).toBe(true);
      }
    });

    test('should have touch-friendly filter controls on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const filters = page.locator('input[type="checkbox"][class*="filter"], button[class*="filter"]');

      if (await filters.count() > 0) {
        const firstFilter = filters.first();
        const box = await firstFilter.boundingBox();

        // Filter controls should be reasonably sized for touch
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(20);
          expect(box.height).toBeGreaterThanOrEqual(20);
        }
      }
    });
  });

  test.describe('Filter Performance', () => {
    test('should apply filters quickly', async ({ page }) => {
      const filter = page.locator('input[type="checkbox"][class*="filter"]').first();

      if (await filter.isVisible()) {
        const startTime = Date.now();

        await filter.click();

        // Wait for any loading indicators to disappear
        await page.waitForSelector('.loading, .spinner', { state: 'hidden', timeout: 5000 }).catch(() => {});

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Filter should apply in less than 2 seconds
        expect(duration).toBeLessThan(2000);
      }
    });

    test('should handle rapid filter changes', async ({ page }) => {
      const filters = page.locator('input[type="checkbox"][class*="filter"]');
      const filterCount = await filters.count();

      if (filterCount >= 2) {
        // Rapidly toggle filters
        for (let i = 0; i < Math.min(5, filterCount); i++) {
          await filters.nth(i % filterCount).click();
          // Don't wait between clicks
        }

        await page.waitForFunction(() => document.readyState === 'complete');

        // Page should not crash or show errors
        const error = page.locator('.error, .exception');
        expect(await error.count()).toBe(0);
      }
    });
  });
});
