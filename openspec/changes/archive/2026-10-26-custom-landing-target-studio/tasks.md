# Tasks

## 1. Pure Domain Model & Storage Persistence

- [x] 1.1 Write failing unit tests for custom target model in `src/domain/target/__tests__/customTargetModel.test.ts` verifying coordinate validation, nearest candidate matching, ephemeris evaluation, and delta calculations
- [x] 1.2 Implement `src/domain/target/customTargetModel.ts` and verify all tests in `customTargetModel.test.ts` pass
- [x] 1.3 Write unit tests in `src/domain/target/__tests__/customTargetStorage.test.ts` and implement `src/domain/target/customTargetStorage.ts` with defensive JSON parsing and localStorage persistence

## 2. 3D Globe Pinpoint Raycasting & Inversion

- [x] 2.1 Write unit tests for 3D world-to-Selenographic coordinate inversion in `src/features/spatial/globe/__tests__/globePinpointRaycast.test.ts`
- [x] 2.2 Wire pinpoint click interaction into `src/features/spatial/globe/scene/globeScene.ts` and `LunarGlobe3D.tsx` to project click coordinates and drop custom beacon markers

## 3. UI Studio Modal & Telemetry Compare HUD

- [x] 3.1 Implement `src/features/spatial/target/CustomTargetStudioModal.tsx` ($\le 200$ lines) with latitude/longitude inputs, LOLA elevation resolver, and coordinate bounds validation
- [x] 3.2 Implement `src/features/spatial/target/CustomTargetCompareCard.tsx` ($\le 150$ lines) displaying side-by-side delta telemetry ($\Delta\text{Sun}$, $\Delta\text{Earth}$, $\Delta\text{Slope}$, $\Delta\text{Ice}$) against the nearest Artemis site
- [x] 3.3 Wire Custom Target Studio launcher into `SpatialViewport.tsx` and candidate selector, and verify with `bun test`, `tsc --noEmit`, and `agent-browser` visual verification
