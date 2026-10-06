import type { NavigateFunction } from 'react-router-dom';

/**
 * "Zurueck" that cannot walk out of the app. navigate(-1) goes to the
 * previous history entry — but when the current page was the FIRST one
 * of the session (a shared link, a bookmarked page, a reload on a deep
 * route in some browsers) that entry is outside the app and Back lands
 * on a blank page. React Router stores the position in history.state.idx;
 * at 0 there is nothing inside the app to go back to, so go home instead.
 */
export function goBack(navigate: NavigateFunction, fallback = '/') {
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  if (typeof idx === 'number' && idx > 0) navigate(-1);
  else navigate(fallback, { replace: true });
}
