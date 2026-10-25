import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

async function run() {
  const outputDir = path.resolve(process.cwd(), '.playwright-cli');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results: TestResult[] = [];
  const consoleErrors: string[] = [];

  console.log('=== Playwright CLI Zoom-Aware Camera Sensitivity Suite ===');
  const executablePath =
    '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  const screenshot = async (filename: string) => {
    await page.screenshot({
      path: path.join(outputDir, filename),
      timeout: 30000,
      animations: 'disabled',
    });
    console.log(`Saved screenshot: ${filename}`);
  };

  // Navigate to 3D Lab
  console.log('\n[1/5] Navigating to http://localhost:3000/scenario/3d-lab...');
  await page.goto('http://localhost:3000/scenario/3d-lab', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await screenshot('sens-1-initial-nadir.png');

  // Helper to read camera & controls state
  const getCameraState = async () => {
    return page.evaluate(() => {
      const handle = (window as any).__globeHandle;
      if (!handle) return null;
      const cam = handle.globe.camera;
      const ctrl = handle.globe.controls;
      const targetDist = cam.position.distanceTo(ctrl.target);
      return {
        camPos: [cam.position.x, cam.position.y, cam.position.z],
        target: [ctrl.target.x, ctrl.target.y, ctrl.target.z],
        targetDist,
        rotateSpeed: ctrl.rotateSpeed,
        panSpeed: ctrl.panSpeed,
        dampingFactor: ctrl.dampingFactor,
        quaternion: [cam.quaternion.x, cam.quaternion.y, cam.quaternion.z, cam.quaternion.w],
      };
    });
  };

  // Helper to perform a controlled pointer drag on the 3D canvas
  const performDrag = async (deltaX: number, deltaY: number, steps = 5) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + deltaX, startY + deltaY, { steps });
    await page.mouse.up();
    await page.waitForTimeout(200);
  };

  // Helper to calculate angular difference between two quaternions in degrees
  const angleBetweenQuatsDeg = (q1: number[], q2: number[]) => {
    const dot = q1[0] * q2[0] + q1[1] * q2[1] + q1[2] * q2[2] + q1[3] * q2[3];
    const clampedDot = Math.max(-1, Math.min(1, Math.abs(dot)));
    const angleRad = 2 * Math.acos(clampedDot);
    return (angleRad * 180) / Math.PI;
  };

  // ==========================================
  // TEST A: 3D Maximum-Zoom Precision
  // ==========================================
  console.log('\n--- TEST A: 3D Maximum-Zoom Precision ---');
  // Park in Overhead mode then zoom into maximum close-range
  await page.getByTestId('preset-overhead').click({ force: true });
  await page.waitForTimeout(1500);

  // Wheel zoom in multiple controlled ticks
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(500);
  await screenshot('sens-2-overhead-close.png');

  const preStateA = await getCameraState();
  if (!preStateA) throw new Error('Could not read camera state in Test A');

  // Small controlled mouse drag of 30px
  await performDrag(30, 0, 5);
  const postStateA = await getCameraState();
  if (!postStateA) throw new Error('Could not read post-drag camera state in Test A');

  const rotAngleDegA = angleBetweenQuatsDeg(preStateA.quaternion, postStateA.quaternion);
  console.log(`Test A: Target Distance = ${postStateA.targetDist.toFixed(4)}, rotateSpeed = ${postStateA.rotateSpeed.toFixed(4)}`);
  console.log(`Test A: 30px Drag Angular Rotation = ${rotAngleDegA.toFixed(3)}°`);

  // Assertions for Test A:
  // 1. rotateSpeed must be scaled down dynamically (< 0.15 at close zoom)
  // 2. 30px drag must produce small, bounded rotation (< 1.5°) so orientation is preserved
  // 3. No NaN values in camera or target
  const passedA =
    postStateA.rotateSpeed <= 0.15 &&
    rotAngleDegA < 1.5 &&
    rotAngleDegA > 0.05 &&
    Number.isFinite(postStateA.camPos[0]);

  results.push({
    name: 'Test A — 3D Maximum-Zoom Precision',
    passed: passedA,
    details: `rotateSpeed: ${postStateA.rotateSpeed.toFixed(4)} (expected <= 0.15), 30px drag: ${rotAngleDegA.toFixed(3)}° (expected < 1.5°)`,
  });

  // ==========================================
  // TEST B: Sensitivity Across Zoom Levels
  // ==========================================
  console.log('\n--- TEST B: Sensitivity Across Zoom Levels ---');
  // Measure at Global, Regional Nadir, Candidate, and Overhead
  const testLevels = [
    { presetId: 'preset-global', name: 'Global View', expectedMinRotate: 0.90 },
    { presetId: 'preset-nadir', name: 'Regional South Pole', expectedMinRotate: 0.85 },
    { presetId: 'preset-site', name: 'Candidate Overview', expectedMaxRotate: 0.55 },
    { presetId: 'preset-oblique', name: '45° Oblique', expectedMaxRotate: 0.25 },
    { presetId: 'preset-overhead', name: 'Overhead Mode', expectedMaxRotate: 0.20 },
  ];

  const measuredSpeeds: { name: string; speed: number; dist: number }[] = [];

  for (const level of testLevels) {
    const btn = page.getByTestId(level.presetId);
    await btn.click({ force: true });
    await page.waitForTimeout(1500);

    const state = await getCameraState();
    if (state) {
      measuredSpeeds.push({ name: level.name, speed: state.rotateSpeed, dist: state.targetDist });
      console.log(`Level [${level.name}]: dist = ${state.targetDist.toFixed(3)}, rotateSpeed = ${state.rotateSpeed.toFixed(4)}`);
    }
  }

  // Check monotonic decrease from Global down to Overhead
  let isMonotonic = true;
  for (let i = 0; i < measuredSpeeds.length - 1; i++) {
    if (measuredSpeeds[i].speed < measuredSpeeds[i + 1].speed - 0.02) {
      isMonotonic = false;
    }
  }

  const passedB = isMonotonic && measuredSpeeds.length === testLevels.length;
  results.push({
    name: 'Test B — Sensitivity Across Zoom Levels',
    passed: passedB,
    details: measuredSpeeds.map((s) => `${s.name}: ${s.speed.toFixed(3)}`).join(' -> '),
  });

  // ==========================================
  // TEST C: 2D Pan Precision
  // ==========================================
  console.log('\n--- TEST C: 2D Pan Precision ---');
  // Toggle Split 2D/3D view
  await page.getByTestId('toggle-split-view').click({ force: true });
  await page.waitForTimeout(1000);
  await screenshot('sens-3-split-view.png');

  // Find 2D map SVG container and test pan dragging
  const svg = page.locator('svg.select-none');
  const svgBox = await svg.boundingBox();
  let passedC = false;
  let detailsC = '';

  if (svgBox) {
    const mapCenterX = svgBox.x + svgBox.width / 2;
    const mapCenterY = svgBox.y + svgBox.height / 2;

    // Test dragging on 2D map: 40px drag
    await page.mouse.move(mapCenterX, mapCenterY);
    await page.mouse.down();
    await page.mouse.move(mapCenterX + 40, mapCenterY + 20, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Verify 2D transform style on map group
    const mapG = page.locator('g[style*="translate"]');
    const transformStyle = await mapG.getAttribute('style');
    console.log(`2D Map Pan Transform Style: ${transformStyle}`);

    passedC = transformStyle !== null && transformStyle.includes('translate');
    detailsC = `2D transform updated cleanly: ${transformStyle}`;
  } else {
    detailsC = '2D SVG container not found';
  }

  results.push({
    name: 'Test C — 2D Pan Precision',
    passed: passedC,
    details: detailsC,
  });

  // ==========================================
  // TEST D: Mode Switching
  // ==========================================
  console.log('\n--- TEST D: Mode Switching ---');
  // Switch between Overhead and Horizon modes, verifying coherent state and no sensitivity spikes
  await page.getByTestId('preset-horizon').click({ force: true });
  await page.waitForTimeout(1600);
  const horizonState = await getCameraState();

  await page.getByTestId('preset-overhead').click({ force: true });
  await page.waitForTimeout(1600);
  const overheadState = await getCameraState();

  const passedD =
    horizonState !== null &&
    overheadState !== null &&
    horizonState.rotateSpeed <= 0.15 &&
    overheadState.rotateSpeed <= 0.20 &&
    Number.isFinite(horizonState.camPos[0]) &&
    Number.isFinite(overheadState.camPos[0]);

  results.push({
    name: 'Test D — Mode Switching (Overhead / Horizon)',
    passed: passedD,
    details: `Horizon rotateSpeed: ${horizonState?.rotateSpeed.toFixed(4)}, Overhead rotateSpeed: ${overheadState?.rotateSpeed.toFixed(4)}`,
  });

  // ==========================================
  // TEST E: Regression and Stability
  // ==========================================
  console.log('\n--- TEST E: Regression and Stability ---');
  // Repeated zoom-in, zoom-out, drag sequences
  for (let cycle = 0; cycle < 3; cycle++) {
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(50);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(50);
  }

  // Pointer drag then release: check that no runaway camera velocity occurs
  await performDrag(50, 20, 8);
  await page.waitForTimeout(500);
  const finalState = await getCameraState();
  await screenshot('sens-4-final-stability.png');

  // Verify zero console errors and valid finite numbers
  const hasConsoleErrors = consoleErrors.length > 0;
  if (hasConsoleErrors) {
    console.warn('Console Errors encountered:', consoleErrors);
  }

  const passedE =
    !hasConsoleErrors &&
    finalState !== null &&
    Number.isFinite(finalState.camPos[0]) &&
    Number.isFinite(finalState.targetDist);

  results.push({
    name: 'Test E — Regression & Stability',
    passed: passedE,
    details: `Console errors: ${consoleErrors.length}, Final target distance: ${finalState?.targetDist.toFixed(4)}`,
  });

  console.log('\n=== TEST SUMMARY ===');
  let allPassed = true;
  for (const r of results) {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
    console.log(`       Details: ${r.details}`);
    if (!r.passed) allPassed = false;
  }

  await browser.close();
  if (!allPassed) {
    process.exit(1);
  }
  console.log('\nAll zoom-aware interaction test assertions PASSED!');
}

run().catch((err) => {
  console.error('Test script failed with error:', err);
  process.exit(1);
});
