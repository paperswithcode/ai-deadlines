/**
 * E2E tests for the notification system
 */

import { test, expect } from '@playwright/test';
import {
  waitForPageReady,
  grantNotificationPermission,
  clearLocalStorage,
  setupSavedConferences,
  waitForToast,
  mockDateTime,
  createMockConference
} from '../utils/helpers';

test.describe('Notification System', () => {
  test.beforeEach(async ({ page, context }) => {
    // Navigate to home page
    await page.goto('/');

    // Clear storage after navigation
    await clearLocalStorage(page);
    await waitForPageReady(page);
  });

  test.describe('Permission Flow', () => {
    test('should show notification prompt for new users', async ({ page }) => {
      // Check if notification prompt is visible
      const prompt = page.locator('#notification-prompt');
      await expect(prompt).toBeVisible({ timeout: 5000 });
    });

    test('should request permission when enable button clicked', async ({ page, context }) => {
      // Grant permission at browser level
      await grantNotificationPermission(context);

      // Click enable notifications button
      const enableBtn = page.locator('#enable-notifications');
      if (await enableBtn.isVisible()) {
        await enableBtn.click();

        // Should show success toast
        const toast = await waitForToast(page);
        await expect(toast).toContainText('Notifications Enabled');
      }
    });

    test('should hide prompt after permission granted', async ({ page, context }) => {
      await grantNotificationPermission(context);

      const prompt = page.locator('#notification-prompt');
      const enableBtn = page.locator('#enable-notifications');

      if (await enableBtn.isVisible()) {
        await enableBtn.click();
        await expect(prompt).toBeHidden({ timeout: 5000 });
      }
    });
  });

  test.describe('Deadline Notifications', () => {
    test.beforeEach(async ({ page, context }) => {
      // Grant notification permission
      await grantNotificationPermission(context);

      // Set up mock conferences with various deadlines
      const conferences = [
        createMockConference({
          id: 'conf-7days',
          conference: 'PyCon Test 7 Days',
          cfp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 23:59:59'
        }),
        createMockConference({
          id: 'conf-3days',
          conference: 'PyCon Test 3 Days',
          cfp: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 23:59:59'
        }),
        createMockConference({
          id: 'conf-1day',
          conference: 'PyCon Test Tomorrow',
          cfp: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 23:59:59'
        })
      ];

      await setupSavedConferences(page, conferences);
    });

    test('should check for upcoming deadlines on page load', async ({ page }) => {
      // Reload page to trigger notification check
      await page.reload();
      await waitForPageReady(page);

      // Check localStorage for notification records
      const notified = await page.evaluate(() => {
        const data = localStorage.getItem('pythondeadlines-notified-deadlines');
        return data ? JSON.parse(data) : {};
      });

      // Should have notification records
      expect(Object.keys(notified).length).toBeGreaterThan(0);
    });

    test('should show in-app toast for upcoming deadlines', async ({ page }) => {
      // Trigger notification check
      await page.evaluate(() => {
        if (window.NotificationManager) {
          window.NotificationManager.checkUpcomingDeadlines();
        }
      });

      // Look for toast notifications
      const toasts = page.locator('.toast');
      const count = await toasts.count();

      // Should show at least one toast
      expect(count).toBeGreaterThan(0);

      // Check toast content
      const firstToast = toasts.first();
      await expect(firstToast).toContainText(/days? until CFP deadline/);
    });

    test('should not show duplicate notifications', async ({ page }) => {
      // First check
      await page.evaluate(() => {
        if (window.NotificationManager) {
          window.NotificationManager.checkUpcomingDeadlines();
        }
      });

      // Wait for toasts to appear and dismiss them
      await page.waitForSelector('.toast', { state: 'visible', timeout: 3000 }).catch(() => {});
      await page.evaluate(() => {
        document.querySelectorAll('.toast').forEach(t => t.remove());
      });

      // Second check - should not show duplicates
      await page.evaluate(() => {
        if (window.NotificationManager) {
          window.NotificationManager.checkUpcomingDeadlines();
        }
      });

      await page.waitForFunction(() => document.readyState === 'complete');

      // Should not have new toasts
      const toasts = page.locator('.toast:visible');
      const count = await toasts.count();
      expect(count).toBe(0);
    });
  });

  test.describe('Notification Settings', () => {
    test('should open settings modal', async ({ page }) => {
      // Click notification settings button (if exists)
      const settingsBtn = page.locator('[data-target="#notificationModal"], [data-bs-target="#notificationModal"]').first();

      if (await settingsBtn.isVisible()) {
        await settingsBtn.click();

        // Modal should be visible
        const modal = page.locator('#notificationModal');
        await expect(modal).toBeVisible();

        // Should have notification day options
        await expect(modal.locator('.notify-days')).toHaveCount(4); // 14, 7, 3, 1 days
      }
    });

    test('should save notification preferences', async ({ page }) => {
      const settingsBtn = page.locator('[data-target="#notificationModal"], [data-bs-target="#notificationModal"]').first();

      if (await settingsBtn.isVisible()) {
        await settingsBtn.click();

        const modal = page.locator('#notificationModal');

        // Uncheck 14-day notifications
        await modal.locator('input[value="14"]').uncheck();

        // Check 1-day notifications
        await modal.locator('input[value="1"]').check();

        // Save settings
        await modal.locator('#save-notification-settings').click();

        // Modal should close
        await expect(modal).toBeHidden({ timeout: 5000 });

        // Verify settings were saved
        const settings = await page.evaluate(() => {
          const data = localStorage.getItem('pythondeadlines-notification-settings');
          return data ? JSON.parse(data) : null;
        });

        expect(settings).toBeTruthy();
        expect(settings.days).toContain(1);
        expect(settings.days).not.toContain(14);
      }
    });
  });

  test.describe('Action Bar Notifications', () => {
    test('should trigger notifications for action bar saved conferences', async ({ page, context }) => {
      await grantNotificationPermission(context);

      // Set up action bar preferences
      await page.evaluate(() => {
        const prefs = {
          'conf-test': { save: true },
        };
        localStorage.setItem('pydeadlines_actionBarPrefs', JSON.stringify(prefs));
      });

      // Add a conference element to the page
      await page.evaluate(() => {
        const conf = document.createElement('div');
        conf.className = 'ConfItem';
        conf.dataset.confId = 'conf-test';
        conf.dataset.confName = 'Test Conference';
        conf.dataset.cfp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 23:59:59';
        document.body.appendChild(conf);
      });

      // Clear last check to allow notification
      await page.evaluate(() => {
        localStorage.removeItem('pydeadlines_lastNotifyCheck');
      });

      // Trigger action bar notification check
      await page.evaluate(() => {
        if (window.NotificationManager) {
          window.NotificationManager.checkActionBarNotifications();
        }
      });

      // Check that notification was scheduled
      const notifyRecord = await page.evaluate(() => {
        return localStorage.getItem('pydeadlines_notify_conf-test_7');
      });

      expect(notifyRecord).toBeTruthy();
    });
  });

  test.describe('Toast Notifications', () => {
    test('should show different toast styles', async ({ page }) => {
      // Test info toast
      await page.evaluate(() => {
        if (window.NotificationManager) {
          window.NotificationManager.showInAppNotification('Info', 'This is info', 'info');
        }
      });

      let toast = await waitForToast(page);
      await expect(toast.locator('.toast-header')).toHaveClass(/bg-info/);

      // Clear toast
      await page.evaluate(() => {
        document.querySelector('.toast')?.remove();
      });

      // Test warning toast
      await page.evaluate(() => {
        if (window.NotificationManager) {
          window.NotificationManager.showInAppNotification('Warning', 'This is warning', 'warning');
        }
      });

      toast = await waitForToast(page);
      await expect(toast.locator('.toast-header')).toHaveClass(/bg-warning/);

      // Clear toast
      await page.evaluate(() => {
        document.querySelector('.toast')?.remove();
      });

      // Test success toast
      await page.evaluate(() => {
        if (window.NotificationManager) {
          window.NotificationManager.showInAppNotification('Success', 'This is success', 'success');
        }
      });

      toast = await waitForToast(page);
      await expect(toast.locator('.toast-header')).toHaveClass(/bg-success/);
    });

    test('should auto-dismiss toasts', async ({ page }) => {
      await page.evaluate(() => {
        if (window.NotificationManager) {
          window.NotificationManager.showInAppNotification('Test', 'Auto dismiss test', 'info');
        }
      });

      const toast = await waitForToast(page);
      await expect(toast).toBeVisible();

      // Wait for auto-dismiss (toast should auto-dismiss after ~5 seconds)
      await expect(toast).toBeHidden({ timeout: 7000 });
    });

    test('should allow manual dismiss', async ({ page }) => {
      await page.evaluate(() => {
        if (window.NotificationManager) {
          window.NotificationManager.showInAppNotification('Test', 'Manual dismiss test', 'info');
        }
      });

      const toast = await waitForToast(page);
      const closeBtn = toast.locator('[data-dismiss="toast"], [data-bs-dismiss="toast"]');

      await closeBtn.click();
      await expect(toast).toBeHidden({ timeout: 1000 });
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should work on mobile viewport', async ({ page, context }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await grantNotificationPermission(context);
      await page.goto('/');
      await waitForPageReady(page);

      // Notification system should still initialize
      const hasNotificationManager = await page.evaluate(() => {
        return typeof window.NotificationManager !== 'undefined';
      });

      expect(hasNotificationManager).toBe(true);

      // Test toast on mobile
      await page.evaluate(() => {
        if (window.NotificationManager) {
          window.NotificationManager.showInAppNotification('Mobile Test', 'Works on mobile', 'info');
        }
      });

      const toast = await waitForToast(page);
      await expect(toast).toBeVisible();

      // Toast should be responsive
      const toastBox = await toast.boundingBox();
      expect(toastBox.width).toBeLessThanOrEqual(375);
    });
  });
});
