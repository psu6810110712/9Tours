# Migrate Authentication to HTTP-Only Cookies

This change will migrate the application from storing the JWT access token in frontend memory / local storage hints to using secure HTTP-only cookies. This increases security by preventing Cross-Site Scripting (XSS) attacks from stealing the token.

## Proposed Changes

### Backend

#### [MODIFY] auth.controller.ts
- Create a helper method `setAuthCookies` to set both `access_token` (expires in 15 minutes) and `refresh_token` (expires in 7-30 days) as HTTP-only secure cookies.
- Update [login](file:///c:/Users/TUF/9Tours/frontend/src/context/AuthContext.tsx#122-128), [register](file:///c:/Users/TUF/9Tours/frontend/src/services/authService.ts#68-70), [refresh](file:///c:/Users/TUF/9Tours/frontend/src/services/authService.ts#77-79), and [googleCallback](file:///c:/Users/TUF/9Tours/backend/src/auth/auth.controller.ts#69-84) to call this method to set the cookies.
- Update the API responses to only return the `user` object and omit the tokens from the JSON body.
- Update [logout](file:///c:/Users/TUF/9Tours/backend/src/auth/auth.controller.ts#109-114) to clear both the `access_token` and `refresh_token` cookies.

#### [MODIFY] jwt.strategy.ts
- Change `jwtFromRequest` to extract the token directly from `req.cookies.access_token` instead of looking for the `Authorization: Bearer` header.

#### [MODIFY] auth.service.ts
- Update the signatures if needed so we know `expiresIn` for the `access_token` cookie.

### Frontend

#### [MODIFY] api.ts
- Remove the `accessToken` variable, [getAccessToken](file:///c:/Users/TUF/9Tours/frontend/src/services/api.ts#7-8), and [setAccessToken](file:///c:/Users/TUF/9Tours/frontend/src/services/api.ts#6-7) functions since the browser will now manage the token automatically.
- Remove the request interceptor that adds the `Authorization: Bearer` header.
- Update [requestSessionRefresh](file:///c:/Users/TUF/9Tours/frontend/src/services/api.ts#32-59) interceptor logic because retrying a request will now automatically pick up the new cookies.

#### [MODIFY] authService.ts
- Update the [AuthResponse](file:///c:/Users/TUF/9Tours/frontend/src/services/authService.ts#29-33) and [SessionRefreshResponse](file:///c:/Users/TUF/9Tours/frontend/src/services/api.ts#11-15) interfaces to remove `access_token`, as APIs will only return `user` data.

#### [MODIFY] AuthContext.tsx
- Remove the `token` state and simplify [applySession](file:///c:/Users/TUF/9Tours/frontend/src/context/AuthContext.tsx#59-65) and [clearSession](file:///c:/Users/TUF/9Tours/frontend/src/context/AuthContext.tsx#66-72) to only manage the `user` object and the `auth_session_active` hint (if we still want to use it for initial load behavior).

## Verification Plan

### Manual Verification
1. I will use the browser subagent to:
   - Navigate to the frontend website.
   - Log in using an existing account.
   - Verify that the `access_token` and `refresh_token` are successfully set as HTTP-Only cookies.
   - Refresh the page and confirm that the user remains logged in (checking the `/auth/refresh` or `/auth/me` flow).
   - Perform an action that requires authentication (e.g. load "My Bookings" or Admin dashboard) and verify it succeeds without the `Authorization: Bearer` header.
   - Log out and confirm that the cookies are cleared and the user is redirected appropriately.
