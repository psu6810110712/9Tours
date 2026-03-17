import { test, expect } from '@playwright/test';
import { TrackingPage } from '../page-objects/TrackingPage';

const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? 'http://127.0.0.1:5173';

test.describe('Anonymous Tracking System', () => {
  test('anonymous tracking records views without consent', async ({ page }) => {
    const trackingPage = new TrackingPage(page);
    
    await trackingPage.gotoTourDetail(1);
    await trackingPage.waitForTrackingCall();

    const anonymousId = await trackingPage.getAnonymousId();
    expect(anonymousId).toBeTruthy();
    expect(anonymousId).toMatch(/^anon_[a-f0-9]+$/);
  });

  test('tracking sends x-anonymous-id header', async ({ page }) => {
    const trackingPage = new TrackingPage(page);
    
    await trackingPage.gotoTourDetail(1);
    const headers = await trackingPage.getTrackingRequestHeaders();

    expect(headers['x-anonymous-id']).toBeTruthy();
    expect(headers['x-anonymous-id']).toMatch(/^anon_[a-f0-9]+$/);
  });

  test('tracking persists anonymous_id in localStorage', async ({ page }) => {
    const trackingPage = new TrackingPage(page);
    
    await trackingPage.gotoTourDetail(1);
    await trackingPage.waitForTrackingCall();

    const anonymousId1 = await trackingPage.getAnonymousId();
    expect(anonymousId1).toBeTruthy();

    await trackingPage.reload();

    const anonymousId2 = await trackingPage.getAnonymousId();
    expect(anonymousId2).toBe(anonymousId1);
  });
});
