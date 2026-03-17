# 9Tours Test Documentation

## Overview

This document contains comprehensive test documentation for the 9Tours project, covering both manual test cases and automated E2E tests.

---

## Table of Contents

1. [Manual Test Cases](#manual-test-cases)
   - [1. Authentication](#1-authentication)
   - [2. Tour Management](#2-tour-management)
   - [3. Booking Flow](#3-booking-flow)
   - [4. Payment](#4-payment)
   - [5. Admin Dashboard](#5-admin-dashboard)
   - [6. Notifications](#6-notifications)
   - [7. User Profile](#7-user-profile)
2. [E2E Tests Implemented](#e2e-tests-implemented)
3. [Test Environment](#test-environment)
4. [Running Tests](#running-tests)

---

# Manual Test Cases

## 1. Authentication

### 1.1 User Registration

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| AUTH-REG-001 | Register with valid email and phone | 1. Navigate to `/register`<br>2. Fill: prefix, name, email, phone, password, confirmPassword<br>3. Click register | Redirect to profile completion or my-bookings | P0 |
| AUTH-REG-002 | Register with duplicate email | 1. Register with email `test@example.com`<br>2. Try to register again with same email | Show error "อีเมลซ้ำ" or "email already exists" | P0 |
| AUTH-REG-003 | Register with invalid email format | 1. Enter invalid email (no @, no domain)<br>2. Click register | Show validation error | P1 |
| AUTH-REG-004 | Register with password mismatch | 1. Enter different password in confirmPassword<br>2. Click register | Show error "รหัสผ่านไม่ตรงกัน" | P0 |
| AUTH-REG-005 | Register with short password (< 8 chars) | 1. Enter password less than 8 characters<br>2. Click register | Show validation error for password length | P1 |
| AUTH-REG-006 | Register with invalid phone format | 1. Enter phone number less than 10 digits<br>2. Click register | Show validation error for phone | P1 |
| AUTH-REG-007 | Register with empty required fields | 1. Leave all fields empty<br>2. Click register | Show "จำเป็น" (required) errors | P0 |
| AUTH-REG-008 | Register with Thai prefix options | 1. Try each prefix: นาย, นาง, นางสาว, อื่นๆ | All prefixes accepted | P2 |

### 1.2 User Login

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| AUTH-LOGIN-001 | Login with email | 1. Enter registered email<br>2. Enter password<br>3. Click login | Redirect to dashboard/my-bookings | P0 |
| AUTH-LOGIN-002 | Login with phone number | 1. Enter registered phone<br>2. Enter password<br>3. Click login | Redirect to dashboard/my-bookings | P0 |
| AUTH-LOGIN-003 | Login with wrong password | 1. Enter correct email, wrong password<br>2. Click login | Show error "รหัสผ่านไม่ถูกต้อง" | P0 |
| AUTH-LOGIN-004 | Login with non-existent account | 1. Enter non-existent email<br>2. Click login | Show error "ไม่พบบัญชีผู้ใช้" | P0 |
| AUTH-LOGIN-005 | Login with rememberMe checked | 1. Check rememberMe<br>2. Login<br>3. Close browser<br>4. Reopen app | User stays logged in | P1 |
| AUTH-LOGOUT-001 | Logout from user account | 1. Login as user<br>2. Click logout | Redirect to home, session cleared | P0 |

### 1.3 Admin Login

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| AUTH-ADMIN-001 | Admin login with credentials | 1. Go to login page<br>2. Enter admin credentials<br>3. Login | Redirect to `/admin/dashboard` | P0 |
| AUTH-ADMIN-002 | Regular user accessing admin | 1. Login as regular user<br>2. Try to access `/admin/*` | Redirect to home or show 403 | P0 |

---

## 2. Tour Management

### 2.1 Tour Listing

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| TOUR-LIST-001 | View all active tours | 1. Navigate to `/tours`<br>2. Wait for loading | Display list of active tours with images, prices | P0 |
| TOUR-LIST-002 | Search tours by keyword | 1. Enter search keyword<br>2. Click search | Show matching tours | P0 |
| TOUR-LIST-003 | Filter tours by category | 1. Select category filter<br>2. Apply | Show tours in that category | P1 |
| TOUR-LIST-004 | Filter tours by province/region | 1. Select province<br>2. Apply | Show tours in that province | P1 |
| TOUR-LIST-005 | Sort tours by price (low to high) | 1. Select sort by price ascending | Tours sorted correctly | P2 |
| TOUR-LIST-006 | Sort tours by price (high to low) | 1. Select sort by price descending | Tours sorted correctly | P2 |
| TOUR-LIST-007 | No tours found message | 1. Search with non-existent keyword | Show "ไม่พบทัวร์" message | P1 |
| TOUR-LIST-008 | Tour card displays correct info | 1. View tour card | Show: name, price, rating, image, duration | P0 |

### 2.2 Tour Details

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| TOUR-DETAIL-001 | View tour details | 1. Click on tour card<br>2. Wait for page load | Show: full description, itinerary, price, schedules | P0 |
| TOUR-DETAIL-002 | View tour schedules | 1. Go to tour details<br>2. Check schedule section | Show available dates with capacity | P0 |
| TOUR-DETAIL-003 | View tour pricing | 1. Go to tour details<br>2. Check price section | Show adult price, child price | P0 |
| TOUR-DETAIL-004 | Tour with no available schedules | 1. View tour with no schedules | Show message or disable booking | P1 |
| TOUR-DETAIL-005 | Tour images gallery | 1. View tour details<br>2. Check images | Display all tour images | P1 |

### 2.3 Admin Tour Management (CRUD)

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| TOUR-ADMIN-001 | Create new tour | 1. Go to `/admin/tours/new`<br>2. Fill all required fields<br>3. Submit | Tour created, redirect to tour list | P0 |
| TOUR-ADMIN-002 | Edit existing tour | 1. Go to tour edit page<br>2. Modify fields<br>3. Save | Tour updated successfully | P0 |
| TOUR-ADMIN-003 | Delete tour | 1. Go to tour list<br>2. Click delete on a tour<br>3. Confirm | Tour removed/soft deleted | P0 |
| TOUR-ADMIN-004 | Create tour with schedules | 1. Fill tour details<br>2. Add multiple schedules with dates<br>3. Save | Tour with schedules created | P0 |
| TOUR-ADMIN-005 | Edit tour schedules | 1. Go to edit tour<br>2. Add/remove/edit schedules | Schedules updated | P1 |
| TOUR-ADMIN-006 | Upload tour images | 1. Go to create/edit tour<br>2. Upload images | Images uploaded and displayed | P0 |
| TOUR-ADMIN-007 | Tour validation - required fields | 1. Submit without required fields | Show validation errors | P0 |
| TOUR-ADMIN-008 | Search tours in admin | 1. Use search in admin tour list | Show matching tours | P1 |

---

## 3. Booking Flow

### 3.1 Customer Booking

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| BOOK-001 | Complete booking flow | 1. Select tour<br>2. Choose schedule<br>3. Fill contact info<br>4. Review & pay | Booking created with pending_payment status | P0 |
| BOOK-002 | Booking with different contact | 1. Fill booking form<br>2. Toggle "ใช้ข้อมูลติดต่ออื่น"<br>3. Fill different contact | Contact info saved as specified | P0 |
| BOOK-003 | Booking with special request | 1. Fill booking form<br>2. Add special request<br>3. Complete booking | Special request saved | P1 |
| BOOK-004 | Booking with child pricing | 1. Add adults and children<br>2. Complete booking | Child price calculated correctly | P0 |
| BOOK-005 | Booking - schedule full | 1. Select fully booked schedule<br>2. Try to book | Show error or disable booking | P0 |
| BOOK-006 | Booking - view my bookings | 1. Go to `/my-bookings`<br>2. View booking list | Show user's bookings with status | P0 |
| BOOK-007 | Booking - view booking details | 1. Click on booking<br>2. View details | Show full booking information | P0 |
| BOOK-008 | Booking - cancel pending booking | 1. Go to pending booking<br>2. Click cancel | Booking status changed to canceled | P1 |
| BOOK-009 | Booking contact snapshot saved | 1. Book with custom contact different from account<br>2. Admin views booking | Contact details preserved | P0 |

### 3.2 Admin Booking Management

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| BOOK-ADMIN-001 | View all bookings | 1. Go to `/admin/bookings`<br>2. View list | Show all bookings | P0 |
| BOOK-ADMIN-002 | Filter bookings by status | 1. Select status filter<br>2. Apply | Show bookings with selected status | P0 |
| BOOK-ADMIN-003 | Search bookings by customer | 1. Search by email/phone<br>2. View results | Show matching bookings | P1 |
| BOOK-ADMIN-004 | View booking details | 1. Click on booking<br>2. View full details | Show complete booking info | P0 |
| BOOK-ADMIN-005 | View payment slip | 1. Go to booking with payment<br>2. View slip image | Display slip image | P0 |
| BOOK-ADMIN-006 | Approve booking | 1. Go to awaiting_approval booking<br>2. Click approve | Status changes to confirmed | P0 |
| BOOK-ADMIN-007 | Reject booking with reason | 1. Go to booking<br>2. Click reject<br>3. Add reason | Status changes to rejected, reason saved | P0 |
| BOOK-ADMIN-008 | Cancel confirmed booking | 1. Go to confirmed booking<br>2. Click cancel | Status changes to canceled | P1 |

---

## 4. Payment

### 4.1 Payment Slip Upload

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| PAY-001 | Upload valid payment slip | 1. Go to payment page<br>2. Upload JPG/PNG image | Preview displayed, file accepted | P0 |
| PAY-002 | Upload invalid file type | 1. Upload PDF/GIF/WebP | Show error "ไม่รองรับไฟล์ชนิดนี้" | P0 |
| PAY-003 | Upload oversized file | 1. Upload file > 10MB | Show error about file size | P0 |
| PAY-004 | Remove uploaded slip | 1. Upload slip<br>2. Click remove/ X button | Slip removed, can re-upload | P1 |
| PAY-005 | Submit without slip | 1. Click confirm without uploading | Show error "กรุณาแนบสลิป" | P0 |
| PAY-006 | Submit with slip | 1. Upload slip<br>2. Click confirm payment | Payment submitted, status changes | P0 |

### 4.2 QR Code Payment

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| PAY-QR-001 | Display QR code | 1. Go to payment page (within 15 min) | QR code displayed correctly | P0 |
| PAY-QR-002 | QR code amount correct | 1. View QR code | Amount matches booking total | P0 |
| PAY-QR-003 | QR code expires after 15 min | 1. Wait 15+ minutes<br>2. Refresh page | QR section shows "ปิดรับการสแกน QR แล้ว" | P0 |
| PAY-QR-004 | Grace period - upload only | 1. After 15 min, within 18 min | Can still upload slip, no QR | P0 |
| PAY-QR-005 | Payment window closed | 1. After 18 minutes | Upload disabled, show closed modal | P0 |

### 4.3 Payment Verification

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| PAY-VERIFY-001 | Slip verified - amount match | 1. Upload slip with correct amount | Verification: verified | P0 |
| PAY-VERIFY-002 | Slip verified - amount mismatch | 1. Upload slip with wrong amount | Verification: amount_mismatch | P0 |
| PAY-VERIFY-003 | Slip duplicate | 1. Upload already-used slip | Verification: duplicate | P0 |
| PAY-VERIFY-004 | Slip unreadable | 1. Upload unclear image | Verification: unreadable | P0 |
| PAY-VERIFY-005 | Slip verification failed | 1. Upload invalid slip | Verification: failed | P0 |

### 4.4 Payment Status

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| PAY-STATUS-001 | Pending payment status | 1. Create booking | Status: pending_payment | P0 |
| PAY-STATUS-002 | Awaiting approval status | 1. Upload slip | Status: awaiting_approval | P0 |
| PAY-STATUS-003 | Confirmed status | 1. Admin approves | Status: confirmed | P0 |
| PAY-STATUS-004 | Rejected status | 1. Admin rejects | Status: rejected | P0 |
| PAY-STATUS-005 | Canceled status | 1. User cancels / Admin cancels | Status: canceled | P0 |

---

## 5. Admin Dashboard

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| DASH-001 | View dashboard stats | 1. Go to `/admin/dashboard` | Show: total bookings, revenue, views | P0 |
| DASH-002 | Date filter - last 7 days | 1. Select date range | Stats update accordingly | P1 |
| DASH-003 | Date filter - last 30 days | 1. Select date range | Stats update accordingly | P1 |
| DASH-004 | Date filter - custom range | 1. Pick custom dates | Stats filtered correctly | P1 |
| DASH-005 | Clear date filter | 1. Apply filter then clear | Show all data | P1 |
| DASH-006 | View bookings pie chart | 1. View dashboard | Show booking status distribution | P1 |

---

## 6. Notifications

### 6.1 Customer Notifications

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| NOTIF-001 | Receive booking confirmed notification | 1. Admin approves booking | Notification appears | P0 |
| NOTIF-002 | Receive booking canceled notification | 1. Admin cancels booking | Notification appears | P0 |
| NOTIF-003 | View notification list | 1. Go to notifications | Show all notifications | P0 |
| NOTIF-004 | Notification unread count | 1. Check badge count | Shows correct unread count | P1 |
| NOTIF-005 | Mark notification as read | 1. Click on notification | Marked as read | P1 |
| NOTIF-006 | Mark all as read | 1. Click mark all read | All marked as read | P2 |

### 6.2 Admin Notifications

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| NOTIF-ADMIN-001 | Receive new booking notification | 1. Customer makes booking | Admin sees notification | P0 |
| NOTIF-ADMIN-002 | Receive payment slip notification | 1. Customer uploads slip | Admin sees notification | P0 |

---

## 7. User Profile

| Test Case ID | Description | Test Steps | Expected Result | Priority |
|--------------|-------------|------------|-----------------|----------|
| PROFILE-001 | View profile | 1. Go to profile page | Show user info | P0 |
| PROFILE-002 | Edit profile | 1. Modify profile fields<br>2. Save | Profile updated | P0 |
| PROFILE-003 | Change password | 1. Enter old password<br>2. Enter new password<br>3. Confirm | Password changed | P0 |
| PROFILE-004 | Wrong old password | 1. Enter wrong old password<br>2. Try to change | Show error | P1 |

---

# E2E Tests Implemented

## Test Files Location
```
tests/e2e/
├── registration.spec.ts
├── user-stitching.spec.ts
├── admin-tour.spec.ts
├── tour-listing.spec.ts
├── admin-booking.spec.ts
├── admin-dashboard.spec.ts
├── admin-auth.spec.ts
├── admin-auth-pom.spec.ts
├── customer-booking.spec.ts
└── tracking.spec.ts
```

## 1. registration.spec.ts

**Framework:** Playwright

| Test | Description | Priority |
|------|-------------|----------|
| can access registration page | Verify registration page loads | P0 |
| can register with email and password | Full registration flow | P0 |
| shows error for duplicate email | Duplicate email validation | P0 |
| validates required fields | Required field validation | P0 |
| validates password match | Password match validation | P0 |

---

## 2. user-stitching.spec.ts

**Framework:** Playwright

| Test | Description | Priority |
|------|-------------|----------|
| customer can login with phone after registering with email | Stitching phone to email account | P0 |
| customer can login with email after registering with phone | Stitching email to phone account | P0 |

---

## 3. admin-tour.spec.ts

**Framework:** Playwright

| Test | Description | Priority |
|------|-------------|----------|
| admin can create a new tour | Create tour with all fields | P0 |
| admin can edit an existing tour | Edit tour details | P0 |
| admin can search tours | Search functionality | P1 |
| admin can view tour list | View all tours | P0 |

---

## 4. tour-listing.spec.ts

**Framework:** Playwright

| Test | Description | Priority |
|------|-------------|----------|
| can search tours | Search by keyword | P0 |
| can filter by category | Category filter | P1 |
| can filter by region/province | Province filter | P1 |
| can sort tours | Sort functionality | P2 |
| can navigate to tour details | Click tour card | P0 |
| displays no results message | Empty search results | P1 |

---

## 5. admin-booking.spec.ts

**Framework:** Playwright

| Test | Description | Priority |
|------|-------------|----------|
| admin can view pending bookings list | View bookings | P0 |
| admin can filter bookings by status | Status filter | P0 |
| admin can view booking details with payment slip | View slip | P0 |
| admin can approve a booking payment | Approve booking | P0 |
| admin can reject a booking payment with reason | Reject booking | P0 |
| admin can search bookings by customer email | Search | P1 |

---

## 6. admin-dashboard.spec.ts

**Framework:** Playwright

| Test | Description | Priority |
|------|-------------|----------|
| dashboard loads with stats | View dashboard stats | P0 |
| date filter works | Filter by date | P1 |
| date filter clear button resets to all data | Clear filter | P1 |

---

## 7. admin-auth.spec.ts

**Framework:** Playwright

| Test | Description | Priority |
|------|-------------|----------|
| admin can access protected dashboard endpoints | API auth | P0 |
| restore dashboard session after reload | Session persistence | P0 |

---

## 8. customer-booking.spec.ts

**Framework:** Playwright

| Test | Description | Priority |
|------|-------------|----------|
| customer can complete booking, upload slip, and booking contact snapshot is saved | Full booking flow | P0 |
| customer can log in with a phone number | Phone login | P0 |

---

## 9. tracking.spec.ts

**Framework:** Playwright

| Test | Description | Priority |
|------|-------------|----------|
| can track booking by code | Track booking | P0 |

---

## Backend Unit Tests

Location: `backend/src/**/*.spec.ts`

| File | Tests | Coverage |
|------|-------|----------|
| `payments/payments.service.spec.ts` | 26 | getPaymentQr, createPayment, getSlipFilePath, cleanupOrphanSlipFiles |
| `easyslip/easyslip.service.spec.ts` | 5 | verifySlip |
| `bookings/bookings.service.spec.ts` | 2 | create, validation |
| `auth/auth.service.spec.ts` | Multiple | Authentication |
| `tours/tours.service.spec.ts` | Multiple | Tour CRUD |

---

# Test Environment

## Prerequisites

1. **Backend:** Node.js, PostgreSQL database
2. **Frontend:** Node.js, React
3. **E2E:** Playwright browsers installed

## Environment Variables

```bash
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=...
PROMPTPAY_ID=...
PROMPTPAY_ACCOUNT_NAME=...
SLIP2GO_API_SECRET=...

# E2E Tests
PLAYWRIGHT_FRONTEND_URL=http://127.0.0.1:5173
PLAYWRIGHT_API_URL=http://127.0.0.1:3000
```

---

# Running Tests

## E2E Tests (Playwright)

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/customer-booking.spec.ts

# Run with UI
npx playwright test --ui

# Run in headed mode
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium
```

## Backend Unit Tests (Jest)

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:cov

# Run specific test file
npm test -- payments.service.spec.ts

# Watch mode
npm run test:watch
```

## Frontend Unit Tests (Vitest)

```bash
cd frontend

# Run tests
npm run test

# Run with coverage
npm run test:coverage

# UI mode
npm run test -- --ui
```

---

# Test Data

## Seed Data

The project includes seed data for testing:

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Admin | admin@9tours.com | password123 | ADMIN |
| Test User | (various) | 12121212 | CUSTOMER |

---

# Notes

1. All E2E tests use the Page Object Model (POM) pattern where applicable
2. Tests are designed to be independent and can run in parallel
3. Some tests may require specific seed data to be present
4. Payment-related tests use mock images from `frontend/public/logo.png`

---

*Document generated: 2026-03-17*
*Last updated: 2026-03-17*
