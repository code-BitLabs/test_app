import React, { useMemo } from 'react';
import { DEFAULT_PROJECTION_CONFIG } from '@/domain/coordinates/projection';
import { ScientificMapLayerMode } from '@/features/spatial/model/spatialPreferences';
import { generateScientificMapRasterUrl } from './lolaRasterGenerator';

export interface ScientificRasterLayerProps {
  mode: ScientificMapLayerMode;
}

const { center: CENTER, maxRadius: MAX_RADIUS } = DEFAULT_PROJECTION_CONFIG;

export function ScientificRasterLayer({ mode }: ScientificRasterLayerProps) {
  const rasterUrl = useMemo(() => {
    return generateScientificMapRasterUrl(mode, 380);
  }, [mode]);

  if (!rasterUrl || mode === 'none') {
    return null;
  }

  const left = CENTER - MAX_RADIUS;
  const top = CENTER - MAX_RADIUS;
  const size = MAX_RADIUS * 2;

  return (
    <g className="scientific-raster-layer" data-testid="scientific-raster-layer" pointerEvents="none">
      <defs>
        <clipPath id="polar-disc-clip">
          <circle cx={CENTER} cy={CENTER} r={MAX_RADIUS} />
        </clipPath>
      </defs>

      <image
        href={rasterUrl}
        x={left}
        y={top}
        width={size}
        height={size}
        clipPath="url(#polar-disc-clip)"
        preserveAspectRatio="none"
        style={{
          imageRendering: 'auto',
          mixBlendMode: mode === 'hillshade' ? 'luminosity' : 'normal',
        }}
      />
    </g>
  );
}
