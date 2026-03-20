

## Problem

When the user switches browser tabs (e.g. to check data in an old system) and returns, the entire reconciliation page resets, losing their selected bank account, month, day, and any in-progress work.

**Root cause**: The `AuthContext` sets `loading = true` every time a token refresh occurs (which happens when returning to a tab). The `ProtectedRoute` component unmounts all children while `loading` is true, destroying all component state.

## Solution

Two complementary fixes:

### 1. Prevent unnecessary unmounting during token refresh (AuthContext)

In `AuthContext.tsx`, avoid setting `loading = true` when the auth event is just a token refresh and the user is already authenticated. Only show the loading state on initial load or sign-in/sign-out transitions.

- Add a `initialLoadDone` ref to track whether the first auth check has completed
- On `TOKEN_REFRESHED` events, silently refresh roles in the background without flipping `loading` to true
- This prevents `ProtectedRoute` from unmounting the app on every tab switch

### 2. Persist reconciliation filter state (ReconciliationPanel)

In `ReconciliationPanel.tsx`, persist the user's selected account, month, and company filter to `sessionStorage` so that even if the component does remount (e.g. navigating away and back), selections are restored.

- Read initial values for `selectedAccount`, `selectedMonth`, and `companyFilter` from `sessionStorage`
- Write to `sessionStorage` on each change via `useEffect`

### Technical Details

**AuthContext changes** (`src/contexts/AuthContext.tsx`):
- Add `const initialLoadRef = useRef(true)` 
- In `onAuthStateChange`: only set `loading = true` if `initialLoadRef.current` is true
- After first successful role check, set `initialLoadRef.current = false`
- Token refreshes will still re-check roles but without unmounting the UI

**ReconciliationPanel changes** (`src/components/finance/reconciliation/ReconciliationPanel.tsx`):
- Initialize `selectedAccount`, `selectedMonth`, `companyFilter` from `sessionStorage` with fallback defaults
- Add `useEffect` hooks to persist these three values on change

