/** Primary navigation destinations of the observatory shell. */

export type NavTab = 'explore' | 'lab' | 'compare' | 'horizon' | 'traverse' | 'gallery' | 'method';

export interface NavTabItem {
  id: NavTab;
  label: string;
  path: string;
  title: string;
}

export const NAV_TABS: Record<NavTab, NavTabItem> = {
  explore: { id: 'explore', label: 'Explore', path: '/explore', title: 'Explore Observatory' },
  lab: { id: 'lab', label: '3D Lab', path: '/scenario/3d-lab', title: '3D Planetary Theater Lab' },
  compare: { id: 'compare', label: 'Navigator', path: '/compare', title: 'Landing Site Navigator' },
  horizon: { id: 'horizon', label: 'Horizon Radar', path: '/horizon', title: 'Horizon Radar & Sky Dome' },
  traverse: { id: 'traverse', label: 'Traverse', path: '/traverse', title: 'Rover Traversal & EVA Planner' },
  gallery: { id: 'gallery', label: 'Footage Gallery', path: '/gallery', title: 'NASA Footage Gallery' },
  method: { id: 'method', label: 'Method & Data', path: '/methodology', title: 'Method & Data Reference' },
};

/** Accessible name for each destination; doubles as the hover title. */
export const NAV_TAB_TITLES: Record<NavTab, string> = {
  explore: 'Explore Observatory',
  lab: '3D Planetary Theater Lab',
  compare: 'Landing Site Navigator',
  horizon: 'Horizon Radar & Sky Dome',
  traverse: 'Rover Traversal & EVA Planner',
  gallery: 'NASA Footage Gallery',
  method: 'Method & Data Reference',
};
