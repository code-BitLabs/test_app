/** Primary navigation destinations of the observatory shell. */

export type NavTab = 'explore' | 'compare' | 'horizon' | 'traverse' | 'method';

/** Accessible name for each destination; doubles as the hover title. */
export const NAV_TAB_TITLES: Record<NavTab, string> = {
  explore: 'Explore Observatory',
  compare: 'Landing Site Navigator',
  horizon: 'Horizon Radar & Sky Dome',
  traverse: 'Rover Traversal & EVA Planner',
  method: 'Method & Data Reference',
};
