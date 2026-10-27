import { CandidateSite } from '@/domain/sites/candidateSite';
import { CustomLandingTarget } from '@/domain/target/customTargetModel';
import { CameraPreset, ScientificMapLayerMode } from '@/features/spatial/model/spatialPreferences';
import {
  SelenographicLatitudeDeg,
  SelenographicLongitudeDeg,
} from '@/domain/coordinates/frames';
import { GlobeSceneHandle } from '@/features/spatial/globe/scene/globeSceneBuilder';

export interface GlobeSceneSyncInput {
  handleRef: { current: GlobeSceneHandle | null };
  selectedSiteIdRef: { current: string };
  selectedSite: CandidateSite;
  subSolarLatDeg: SelenographicLatitudeDeg;
  subSolarLonDeg: SelenographicLongitudeDeg;
  subEarthLatDeg: SelenographicLatitudeDeg;
  subEarthLonDeg: SelenographicLongitudeDeg;
  earthElevationDeg: number | null;
  showVectors: boolean;
  showGrid: boolean;
  showShadowRegions: boolean;
  showTerrain?: boolean;
  showMarkers?: boolean;
  showLabels?: boolean;
  showLaserTracks?: boolean;
  scientificMapMode?: ScientificMapLayerMode;
  cameraPreset: CameraPreset;
  applyCameraPreset: (preset: CameraPreset, site: CandidateSite) => void;
  isRoverActive?: boolean;
  customTarget?: CustomLandingTarget | null;
}
