import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { CameraPreset } from '@/features/spatial/model/spatialPreferences';

const TRANSITION_PROGRESS_STEP = 0.055;
const TRANSITION_LERP_FACTOR = 0.14;

export interface CameraPose {
  camPos: THREE.Vector3;
  lookTarget: THREE.Vector3;
  upVector: THREE.Vector3;
}

export interface CameraTransitioner {
  moveTo: (preset: CameraPreset, site: CandidateSite) => void;
  cancel: () => void;
  isTransitioning: () => boolean;
  /** Advances an in-flight transition; idles at zero cost between preset changes. */
  step: (camera: THREE.PerspectiveCamera, controls: OrbitControls) => void;
}

/**
 * Creates an interruptible camera transitioner between presets.
 */
export function createCameraTransitionerWithResolver(
  poseResolver: (preset: CameraPreset, site: CandidateSite) => CameraPose,
): CameraTransitioner {
  let target: (CameraPose & { progress: number }) | null = null;

  return {
    moveTo: (preset, site) => {
      target = { ...poseResolver(preset, site), progress: 0 };
    },
    cancel: () => {
      target = null;
    },
    isTransitioning: () => target !== null,
    step: (camera, controls) => {
      if (!target) return;
      target.progress = Math.min(1.0, target.progress + TRANSITION_PROGRESS_STEP);
      camera.position.lerp(target.camPos, TRANSITION_LERP_FACTOR);
      controls.target.lerp(target.lookTarget, TRANSITION_LERP_FACTOR);
      camera.up.lerp(target.upVector, TRANSITION_LERP_FACTOR);
      if (camera.up.lengthSq() > 1e-4) {
        camera.up.normalize();
      }
      camera.lookAt(controls.target);

      if (target.progress >= 1.0) {
        camera.position.copy(target.camPos);
        controls.target.copy(target.lookTarget);
        camera.up.copy(target.upVector).normalize();
        camera.lookAt(controls.target);

        if ((controls as any)._quat && (controls as any)._quatInverse) {
          (controls as any)._quat.setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
          (controls as any)._quatInverse.copy((controls as any)._quat).invert();
        }
        (controls as any)._sphericalDelta?.set(0, 0, 0);
        (controls as any)._panOffset?.set(0, 0, 0);
        (controls as any)._scale = 1;
        if (typeof controls.update === 'function') {
          controls.update();
        }
        target = null;
      }
    },
  };
}
