/** Primary navigation destinations of the observatory shell. */

export type NavTab = 'explore' | 'compare' | 'horizon' | 'method';

/** Accessible name for each destination; doubles as the hover title. */
export const NAV_TAB_TITLES: Record<NavTab, string> = {
  explore: 'Explore Observatory',
  compare: 'Landing Site Navigator',
  horizon: 'Horizon Radar & Sky Dome',
  method: 'Method & Data Reference',
};
