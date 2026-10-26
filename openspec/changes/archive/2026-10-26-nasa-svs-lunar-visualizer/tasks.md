# Tasks

## 1. NASA SVS 3727 False-Color Topography & Elevation Legend

- [x] 1.1 Implement `src/domain/terrain/nasaSvsColorRamp.ts` with 16-stop LOLA hypsometry and verify with unit tests in `src/domain/terrain/__tests__/nasaSvsColorRamp.test.ts`
- [x] 1.2 Build `src/features/spatial/globe/components/NasaSvsElevationLegend.tsx` docked elevation scale bar (-8 km to +8 km) and verify file size is $\le 200$ lines
- [x] 1.3 Add SVS 3727 false-color texture generation to `src/features/spatial/globe/scene/globeSurfaceMaterial.ts` mapping `ldem_topo.jpg` and verify surface texture transitions

## 2. Seamless Radial Spherical Polar Cap Geometry

- [x] 2.1 Write unit tests for radial spherical polar cap deformation in `src/features/spatial/globe/__tests__/globeSphericalPolarCap.test.ts`
- [x] 2.2 Implement `buildSphericalPolarCapGeometry` in `src/features/spatial/globe/terrain/globeMultiLodTerrain.ts` along spherical normals ($80^\circ\text{S}-90^\circ\text{S}$), removing the 105 km planar box and downward boundary skirts
- [x] 2.3 Mount seamless spherical polar cap and NASA SVS 3760 floating crater billboards in `src/features/spatial/globe/scene/globePolarTerrain.ts` and verify no geometry seams or skirts exist

## 3. NASA SVS 3633 LOLA Laser Altimeter Ground Tracks

- [x] 3.1 Implement `src/features/spatial/globe/scene/globeLaserTracks.ts` generating 36 converging orbital laser passes across the South Pole with elevation color coding
- [x] 3.2 Wire laser ground tracks toggle into `spatialToolbarOptions.ts` and `LunarGlobe3D.tsx` and verify interactive layer switching

## 4. Photorealistic Blue Marble Earth & Physical Solar Phasing

- [x] 4.1 Update `src/features/spatial/globe/scene/globeCelestialVectors.ts` to replace unlit cyan `atmosphereMesh` with realistic Blue Marble Earth texture and sunward terminator orientation
- [x] 4.2 Calibrate high-contrast directional solar grazing lighting in `src/features/spatial/globe/scene/globeScene.ts` for deep black umbra shadows in crater floors

## 5. Modernize Legacy Scenario3DLab into Planetary Theater

- [x] 5.1 Extract `PlanetaryTheaterHeader.tsx`, `PlanetaryTheaterSidebar.tsx`, and `PlanetaryTheaterToolbar.tsx` from `Scenario3DLab.tsx` ensuring all files are $\le 200$ lines
- [x] 5.2 Refactor `Scenario3DLab.tsx` to mount `LunarGlobe3D` and verify `bun test`, `tsc --noEmit`, and `agent-browser` visual rendering
