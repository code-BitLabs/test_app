import { useCallback, useEffect, useState } from 'react';
import { NavTab } from '@/app/header/config/navTabs';

/** Canonical URL path mapping per navigation tab. */
export const TAB_ROUTE_MAP: Record<NavTab, string> = {
  explore: '/explore',
  lab: '/scenario/3d-lab',
  compare: '/compare',
  horizon: '/horizon',
  traverse: '/traverse',
  gallery: '/gallery',
  method: '/methodology',
};

function parseTabSegment(source: string): NavTab | null {
  if (!source) return null;
  const raw = source.toLowerCase();
  if (raw.includes('3d-lab')) return 'lab';
  if (raw.includes('compare')) return 'compare';
  if (raw.includes('horizon')) return 'horizon';
  if (raw.includes('traverse')) return 'traverse';
  if (raw.includes('gallery')) return 'gallery';
  if (raw.includes('method')) return 'method';
  if (raw.includes('explore')) return 'explore';
  return null;
}

/** Resolves URL pathname/hash/search to a canonical mission tab with fallback to 'explore'. */
export function resolveTabFromPath(
  pathname: string = '',
  hash: string = '',
  search: string = '',
): NavTab {
  // 1. Pathname takes strict precedence over query search parameters and hash fallbacks
  const pathOnly = pathname.split('?')[0].split('#')[0];
  const tabFromPath = parseTabSegment(pathOnly);
  if (tabFromPath) return tabFromPath;

  // 2. Hash fragment routing fallback (e.g. #/gallery, #/scenario/3d-lab)
  const hashOnly = hash.split('?')[0];
  const tabFromHash = parseTabSegment(hashOnly);
  if (tabFromHash) return tabFromHash;

  // 3. Query search parameter fallback (e.g. ?tab=compare, ?scenario=3d-lab)
  const tabFromSearch = parseTabSegment(search);
  if (tabFromSearch) return tabFromSearch;

  return 'explore';
}

/** Resolves canonical URL path for a given mission navigation tab. */
export function resolvePathFromTab(tab: NavTab): string {
  return TAB_ROUTE_MAP[tab] ?? '/explore';
}

export interface UseMissionRouterResult {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  navigateToTab: (tab: NavTab) => void;
  currentPath: string;
}

/**
 * Authoritative History Router Hook
 * Keeps browser URL and activeTab in lockstep via pushState, popstate, and hashchange.
 */
export function useMissionRouter(initialTab?: NavTab): UseMissionRouterResult {
  const [activeTab, setActiveTabState] = useState<NavTab>(() => {
    if (initialTab) return initialTab;
    if (typeof window === 'undefined') return 'explore';
    return resolveTabFromPath(
      window.location.pathname ?? '',
      window.location.hash ?? '',
      window.location.search ?? '',
    );
  });

  const navigateToTab = useCallback((tab: NavTab) => {
    setActiveTabState(tab);
    if (typeof window === 'undefined') return;
    const targetPath = resolvePathFromTab(tab);
    if (window.location.pathname !== targetPath) {
      try {
        window.history.pushState({ tab }, '', targetPath);
      } catch {
        window.location.hash = `#${targetPath}`;
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocationChange = () => {
      const detected = resolveTabFromPath(
        window.location.pathname ?? '',
        window.location.hash ?? '',
        window.location.search ?? '',
      );
      setActiveTabState(detected);
    };

    const handleActivate3D = () => {
      navigateToTab('lab');
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('lm-activate-3d-moon', handleActivate3D);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('lm-activate-3d-moon', handleActivate3D);
    };
  }, [navigateToTab]);

  return {
    activeTab,
    setActiveTab: setActiveTabState,
    navigateToTab,
    currentPath: resolvePathFromTab(activeTab),
  };
}
