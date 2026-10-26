import React, { useState, useRef, useCallback } from 'react';
import { useScenarioModel, useScenarioCommands } from '@/app/scenario/context/scenarioContext';
import { useSpatialPreferences } from '@/features/spatial/hooks/useSpatialPreferences';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { RoverTelemetry } from '@/features/spatial/globe/interaction/lunarRoverController';

export function usePlanetaryTheaterState() {
  const { site: selectedSite, conditions, ephemeris, epochIsoUtc, epochMs } = useScenarioModel();
  const { selectSite, setEpoch } = useScenarioCommands();
  const { preferences, toggleLayer, selectCameraPreset, selectScientificMapMode } = useSpatialPreferences();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showSitePanel, setShowSitePanel] = useState(true);
  const [showTerrain, setShowTerrain] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [roverTelemetry, setRoverTelemetry] = useState<RoverTelemetry | null>(null);
  const [isRoverActive, setIsRoverActive] = useState(false);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlyoverActive, setIsFlyoverActive] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const epochRef = useRef(epochMs);
  epochRef.current = epochMs;

  React.useEffect(() => {
    if (preferences.cameraPreset !== 'horizon' && isRoverActive) {
      setIsRoverActive(false);
    }
  }, [preferences.cameraPreset, isRoverActive]);

  const stepTimeHours = useCallback(
    (hours: number) => {
      setEpoch(epochRef.current + hours * 3600 * 1000);
    },
    [setEpoch],
  );

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setEpoch(epochRef.current + 3600 * 1000);
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying, setEpoch]);

  const handleSelectSite = useCallback(
    (site: CandidateSite) => {
      selectSite(site.id);
    },
    [selectSite],
  );

  const handleResetCamera = useCallback(() => {
    setIsFlyoverActive(false);
    setIsRoverActive(false);
    selectCameraPreset('nadir');
    const defaultSite = CANDIDATE_SITES[0];
    if (defaultSite) selectSite(defaultSite.id);
  }, [selectCameraPreset, selectSite]);

  return {
    selectedSite,
    conditions,
    ephemeris,
    epochIsoUtc,
    preferences,
    toggleLayer,
    selectCameraPreset,
    selectScientificMapMode,
    isFullscreen,
    setIsFullscreen,
    showDiagnostics,
    setShowDiagnostics,
    showSitePanel,
    setShowSitePanel,
    showTerrain,
    setShowTerrain,
    showMarkers,
    setShowMarkers,
    showLabels,
    setShowLabels,
    roverTelemetry,
    setRoverTelemetry,
    isRoverActive,
    setIsRoverActive,
    isControlsCollapsed,
    setIsControlsCollapsed,
    isPlaying,
    togglePlayback,
    stepTimeHours,
    isFlyoverActive,
    setIsFlyoverActive,
    isSplitView,
    setIsSplitView,
    isComparisonOpen,
    setIsComparisonOpen,
    containerRef,
    handleSelectSite,
    handleResetCamera,
  };
}
