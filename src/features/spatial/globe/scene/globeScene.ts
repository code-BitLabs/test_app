import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {
  SelenographicLatitudeDeg,
  SelenographicLongitudeDeg,
} from '@/domain/coordinates/frames';

/** The globe is modelled in scene units, not metres; this is the Moon sphere radius. */
export const MOON_SCENE_RADIUS = 1.45;

const SCENE_BACKGROUND = 0x070b12;
const CAMERA_FOV_DEG = 38;
const CAMERA_NEAR = 0.05;
const CAMERA_FAR = 100;
/** Nadir opening pose: straight down on 90°S, +Z (prime meridian) held up, Moon occupying ~76% of frame. */
const INITIAL_CAMERA_POSITION: readonly [number, number, number] = [0, -4.8, 0.0001];
const INITIAL_CAMERA_UP: readonly [number, number, number] = [0, 0, 1];
const CONTROL_DAMPING_FACTOR = 0.05;
export const CONTROL_MIN_DISTANCE = 0.015;
export const CONTROL_MAX_DISTANCE = 14.0;

const SUN_LIGHT_COLOR = 0xfffef5;
const SUN_LIGHT_INTENSITY = 3.2;
const SUN_SHADOW_MAP_SIZE = 2048;
const SUN_SHADOW_CAMERA_EXTENT = 2.2;
const SUN_SHADOW_NEAR = 0.5;
const SUN_SHADOW_FAR = 30;
const SUN_SHADOW_BIAS = -0.00015;
const EARTHSHINE_LIGHT_COLOR = 0x7dd3fc;
const EARTHSHINE_LIGHT_INTENSITY = 0.08;
const AMBIENT_SPACE_LIGHT_COLOR = 0x050a14;
const AMBIENT_SPACE_LIGHT_INTENSITY = 0.03;
/** Directional lights sit far along their body-fixed direction so rays read as parallel. */
const SUN_LIGHT_DISTANCE = 18.0;
const EARTHSHINE_LIGHT_DISTANCE = 15.0;
/** Opening pose before the first epoch is applied: Earth-side +Z. */
const EARTHSHINE_INITIAL_DISTANCE = 10;

/**
 * Selenographic lat/lon → scene Cartesian.
 * Lat: +90° North (+Y), -90° South (-Y). Lon: 0° prime meridian facing Earth (+Z),
 * +90° East (+X), 270° West (-X).
 */
export function latLonToVector3(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const phi = (90 - latDeg) * (Math.PI / 180);
  const theta = lonDeg * (Math.PI / 180);
  const x = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);
  return new THREE.Vector3(x, y, z);
}

export interface GlobeScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  sunLight: THREE.DirectionalLight;
  earthLight: THREE.DirectionalLight;
  composer?: EffectComposer;
  starfield?: THREE.Points;
}

/**
 * Creates an authentic 3D celestial starfield sphere with stellar color temperatures and magnitudes.
 */
export function createCelestialStarfield(count = 2500, radius = 70): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = radius + (Math.random() - 0.5) * 6.0;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    // Stellar color temperatures (O/B blue, A/F white, G yellow, M red)
    const starType = Math.random();
    let cr = 1.0, cg = 1.0, cb = 1.0;
    if (starType < 0.15) {
      cr = 0.75; cg = 0.85; cb = 1.0;
    } else if (starType < 0.65) {
      cr = 0.95; cg = 0.95; cb = 1.0;
    } else if (starType < 0.88) {
      cr = 1.0; cg = 0.92; cb = 0.70;
    } else {
      cr = 1.0; cg = 0.65; cb = 0.50;
    }
    const brightness = 0.4 + Math.random() * 0.6;
    colors[i * 3] = cr * brightness;
    colors[i * 3 + 1] = cg * brightness;
    colors[i * 3 + 2] = cb * brightness;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.5,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  const starfield = new THREE.Points(geometry, material);
  starfield.renderOrder = -100;
  return starfield;
}

/** Detects software WebGL implementations (SwiftShader, llvmpipe) to tune performance. */
export const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return true;
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : (gl as any).RENDERER;
    const gpu = String((gl as any).getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
})();

/** False when the host cannot give the globe a WebGL context at all. */
export function isWebGlAvailable(): boolean {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl') || probe.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

/** Renderer, camera, controls and the three lights, sized to the mount container. */
export function createGlobeScene(width: number, height: number): GlobeScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SCENE_BACKGROUND);

  const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV_DEG,
    width / height,
    CAMERA_NEAR,
    CAMERA_FAR,
  );
  camera.position.set(...INITIAL_CAMERA_POSITION);
  camera.up.set(...INITIAL_CAMERA_UP);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  // Cap at 1.0 on software WebGL, or 1.75 on GPU to eliminate 4K / retina fullscreen fillrate lag
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = CONTROL_DAMPING_FACTOR;
  controls.minDistance = CONTROL_MIN_DISTANCE;
  controls.maxDistance = CONTROL_MAX_DISTANCE;
  // Guard against spherical coordinate singularities at the exact poles
  controls.minPolarAngle = 0.015;
  controls.maxPolarAngle = Math.PI - 0.015;
  controls.target.set(0, 0, 0);

  const sunLight = new THREE.DirectionalLight(SUN_LIGHT_COLOR, SUN_LIGHT_INTENSITY);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = SUN_SHADOW_MAP_SIZE;
  sunLight.shadow.mapSize.height = SUN_SHADOW_MAP_SIZE;
  sunLight.shadow.camera.near = SUN_SHADOW_NEAR;
  sunLight.shadow.camera.far = SUN_SHADOW_FAR;
  sunLight.shadow.camera.left = -SUN_SHADOW_CAMERA_EXTENT;
  sunLight.shadow.camera.right = SUN_SHADOW_CAMERA_EXTENT;
  sunLight.shadow.camera.top = SUN_SHADOW_CAMERA_EXTENT;
  sunLight.shadow.camera.bottom = -SUN_SHADOW_CAMERA_EXTENT;
  sunLight.shadow.bias = SUN_SHADOW_BIAS;
  scene.add(sunLight);

  const ambientLight = new THREE.AmbientLight(AMBIENT_SPACE_LIGHT_COLOR, AMBIENT_SPACE_LIGHT_INTENSITY);
  scene.add(ambientLight);

  const earthLight = new THREE.DirectionalLight(EARTHSHINE_LIGHT_COLOR, EARTHSHINE_LIGHT_INTENSITY);
  earthLight.position.set(0, 0, EARTHSHINE_INITIAL_DISTANCE);
  scene.add(earthLight);

  // 3D Procedural Starfield Sphere
  const starfield = createCelestialStarfield();
  scene.add(starfield);

  // Hardware GPU Post-Processing Pipeline (Bloom, Tone Mapping)
  let composer: EffectComposer | undefined;
  if (!isSoftwareGl) {
    try {
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.28, // Natural grazing solar bloom strength
        0.35, // Glow radius
        0.88, // Luminance threshold (blinding solar peaks and Sun disc only)
      );
      composer.addPass(bloomPass);
    } catch {
      composer = undefined;
    }
  }

  return { scene, camera, renderer, controls, sunLight, earthLight, composer, starfield };
}

/** Aim the Sun and Earthshine lights at the sub-solar and sub-Earth points of the epoch. */
export function syncCelestialLighting(
  scene: GlobeScene,
  subSolarLatDeg: SelenographicLatitudeDeg,
  subSolarLonDeg: SelenographicLongitudeDeg,
  subEarthLatDeg: SelenographicLatitudeDeg,
  subEarthLonDeg: SelenographicLongitudeDeg,
): void {
  scene.sunLight.position.copy(latLonToVector3(subSolarLatDeg, subSolarLonDeg, SUN_LIGHT_DISTANCE));
  scene.earthLight.position.copy(
    latLonToVector3(subEarthLatDeg, subEarthLonDeg, EARTHSHINE_LIGHT_DISTANCE),
  );
}
