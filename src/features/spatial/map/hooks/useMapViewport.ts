import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import {
  DEFAULT_PROJECTION_CONFIG,
  type ProjectedPoint,
  type SelenographicCoordinate,
} from '@/domain/coordinates/projection';
import type { MapZoomPreset } from '@/features/spatial/map/components/MapToolbar';
import {
  REGIONAL_ZOOM,
  clampPan,
  coordinateFromPointer,
  dragOrigin,
  draggedPan,
  presetViewport,
  steppedZoom,
  wheelZoom,
  zoomAroundScreenPoint,
  zoomAroundWorldPoint,
  type MapViewport,
} from '@/features/spatial/map/model/mapViewportMath';

import { calculate2DPanSensitivity } from '@/features/spatial/interaction/zoomAwareInteractionModel';

const { svgSize: SVG_SIZE, center: MAP_CENTER } = DEFAULT_PROJECTION_CONFIG;

const REGIONAL_VIEWPORT: MapViewport = { zoom: REGIONAL_ZOOM, pan: { x: 0, y: 0 } };

/**
 * Owns the map's camera (zoom, pan, drag) and the live cursor readout. The camera
 * is view-only state: nothing outside the map reads it, so it never enters the
 * canonical scenario context.
 */
export function useMapViewport(sitePos: ProjectedPoint) {
  const [viewport, setViewport] = useState<MapViewport>(REGIONAL_VIEWPORT);
  const [activePreset, setActivePreset] = useState<MapZoomPreset | 'custom'>('regional');
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const [cursorCoord, setCursorCoord] = useState<SelenographicCoordinate | null>(null);
  const dragStartRef = useRef({ startX: 0, startY: 0, startPanX: 0, startPanY: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const { zoom, pan } = viewport;

  /** Selenographic coordinate under a pointer event, or null off the mapped disc. */
  const coordinateFromEvent = useCallback(
    (event: { clientX: number; clientY: number }): SelenographicCoordinate | null => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return coordinateFromPointer({
        clientX: event.clientX,
        clientY: event.clientY,
        rect,
        svgSize: SVG_SIZE,
        center: MAP_CENTER,
        viewport,
      });
    },
    [viewport],
  );

  const applyPreset = useCallback(
    (preset: MapZoomPreset) => {
      setActivePreset(preset);
      setViewport(presetViewport(preset, sitePos, MAP_CENTER));
    },
    [sitePos],
  );

  const resetViewport = useCallback(() => applyPreset('regional'), [applyPreset]);

  const zoomIn = useCallback(() => {
    setActivePreset('custom');
    setViewport((current) => zoomAroundWorldPoint(current, steppedZoom(current.zoom, 1), sitePos, MAP_CENTER));
  }, [sitePos]);

  const zoomOut = useCallback(() => {
    setActivePreset('custom');
    setViewport((current) => zoomAroundWorldPoint(current, steppedZoom(current.zoom, -1), sitePos, MAP_CENTER));
  }, [sitePos]);

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent) => {
      if (event.button !== 0) return;
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startPanX: viewport.pan.x,
        startPanY: viewport.pan.y,
      };
    },
    [viewport.pan.x, viewport.pan.y],
  );

  const handleMouseMove = useCallback(
    (event: ReactMouseEvent) => {
      if (isDraggingRef.current) {
        setActivePreset('custom');
        const rect = svgRef.current?.getBoundingClientRect();
        const renderedWidth = rect && rect.width > 0 ? rect.width : SVG_SIZE;
        const renderedHeight = rect && rect.height > 0 ? rect.height : SVG_SIZE;
        const renderedExtent = Math.min(renderedWidth, renderedHeight);
        setViewport((current) => {
          const { panMultiplier, svgUnitPerScreenPixel } = calculate2DPanSensitivity(
            current.zoom,
            renderedExtent,
            SVG_SIZE,
          );
          const deltaX = (event.clientX - dragStartRef.current.startX) * svgUnitPerScreenPixel * panMultiplier;
          const deltaY = (event.clientY - dragStartRef.current.startY) * svgUnitPerScreenPixel * panMultiplier;
          const rawPan = {
            x: dragStartRef.current.startPanX + deltaX,
            y: dragStartRef.current.startPanY + deltaY,
          };
          const boundedPan = clampPan(rawPan, current.zoom, MAP_CENTER);
          return { ...current, pan: boundedPan };
        });
      }
      setCursorCoord(coordinateFromEvent(event));
    },
    [coordinateFromEvent],
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    setCursorCoord(null);
  }, []);

  const handleWheel = useCallback(
    (event: ReactWheelEvent) => {
      event.preventDefault();
      setActivePreset('custom');
      const rect = svgRef.current?.getBoundingClientRect();
      const targetZoom = wheelZoom(viewport.zoom, event.deltaY);

      if (rect && rect.width > 0 && rect.height > 0) {
        const renderedExtent = Math.min(rect.width, rect.height);
        let renderedLeft = rect.left;
        let renderedTop = rect.top;
        if (rect.width > rect.height) {
          renderedLeft += (rect.width - renderedExtent) / 2;
        } else if (rect.height > rect.width) {
          renderedTop += (rect.height - renderedExtent) / 2;
        }

        const focalSvgX = ((event.clientX - renderedLeft) * SVG_SIZE) / renderedExtent;
        const focalSvgY = ((event.clientY - renderedTop) * SVG_SIZE) / renderedExtent;

        setViewport((current) =>
          zoomAroundScreenPoint(current, targetZoom, { x: focalSvgX, y: focalSvgY }, MAP_CENTER),
        );
      } else {
        setViewport((current) => ({
          ...current,
          zoom: targetZoom,
          pan: clampPan(current.pan, targetZoom, MAP_CENTER),
        }));
      }
    },
    [viewport.zoom],
  );

  /** Transform for the pannable <g>, frozen while dragging so the map tracks the cursor. */
  const viewportStyle = useMemo(
    () => ({
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
      transformOrigin: `${MAP_CENTER}px ${MAP_CENTER}px`,
      transition: isDragging ? 'none' : 'transform 0.15s ease-out',
    }),
    [pan, zoom, isDragging],
  );

  return {
    svgRef,
    zoom,
    pan,
    isDragging,
    activePreset,
    cursorCoord,
    viewportStyle,
    coordinateFromEvent,
    applyPreset,
    resetViewport,
    zoomIn,
    zoomOut,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleWheel,
  };
}
