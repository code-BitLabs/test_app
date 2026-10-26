import { TraversalPlan, TraversalWaypoint } from '@/domain/traversal/types';
import { LANDER_ANTENNA_HEIGHT_METERS, ROVER_ANTENNA_HEIGHT_METERS } from '@/domain/traversal/lineOfSight';

interface TraverseElevationTransectProps {
  plan: TraversalPlan;
  activeWaypointIndex: number | null;
  onSelectWaypoint: (index: number) => void;
}

export function TraverseElevationTransect({
  plan,
  activeWaypointIndex,
  onSelectWaypoint,
}: TraverseElevationTransectProps) {
  const { waypoints, totalDistanceKm } = plan;
  if (!waypoints || waypoints.length === 0) return null;

  const minElev = Math.min(...waypoints.map((w) => w.elevationMeters)) - 100;
  const maxElev = Math.max(...waypoints.map((w) => w.elevationMeters)) + 150;
  const elevRange = Math.max(100, maxElev - minElev);

  const svgWidth = 900;
  const svgHeight = 260;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;

  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const getX = (distKm: number) =>
    padLeft + (totalDistanceKm > 0 ? (distKm / totalDistanceKm) * plotW : 0);
  const getY = (elevM: number) =>
    padTop + plotH - ((elevM - minElev) / elevRange) * plotH;

  const areaPoints = [
    `${padLeft},${padTop + plotH}`,
    ...waypoints.map((w) => `${getX(w.distanceFromStartKm)},${getY(w.elevationMeters)}`),
    `${padLeft + plotW},${padTop + plotH}`,
  ].join(' ');

  const activeWaypoint: TraversalWaypoint | undefined =
    activeWaypointIndex !== null ? waypoints[activeWaypointIndex] : undefined;

  // Lander coordinate with mast
  const landerX = getX(0);
  const landerY = getY(waypoints[0].elevationMeters);
  const landerMastY = getY(waypoints[0].elevationMeters + LANDER_ANTENNA_HEIGHT_METERS * 5); // scaled visual mast

  return (
    <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--lm-color-border-subtle)] pb-2.5">
        <div>
          <h3 className="text-sm font-semibold text-[var(--lm-color-text-primary)]">
            LOLA Geodetic Altimetry & Slope Profile
          </h3>
          <p className="text-xs text-[var(--lm-color-text-muted)]">
            Continuous elevation transect showing slope hazard zones and line-of-sight clearance
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Safe (&lt;10°)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Caution (10°-15°)
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Hazard (&gt;15°)
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[650px] font-mono text-xs select-none"
          role="img"
          aria-label="Elevation profile transect"
        >
          <defs>
            <linearGradient id="transectGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padTop + plotH * (1 - ratio);
            const elevVal = Math.round(minElev + ratio * elevRange);
            return (
              <g key={ratio}>
                <line x1={padLeft} y1={y} x2={padLeft + plotW} y2={y} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
                <text x={padLeft - 8} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize="10">
                  {elevVal}m
                </text>
              </g>
            );
          })}

          {/* Ground Polygon */}
          <polygon points={areaPoints} fill="url(#transectGradient)" />

          {/* Polyline Segments Color-Coded by Slope */}
          {waypoints.map((w, idx) => {
            if (idx === 0) return null;
            const prev = waypoints[idx - 1];
            const strokeColor =
              w.terrainSafety === 'hazard' ? '#f43f5e' : w.terrainSafety === 'caution' ? '#f59e0b' : '#10b981';
            return (
              <line
                key={idx}
                x1={getX(prev.distanceFromStartKm)}
                y1={getY(prev.elevationMeters)}
                x2={getX(w.distanceFromStartKm)}
                y2={getY(w.elevationMeters)}
                stroke={strokeColor}
                strokeWidth={2.5}
              />
            );
          })}

          {/* Line-of-sight ray if active waypoint */}
          {activeWaypoint && (
            <line
              x1={landerX}
              y1={landerMastY}
              x2={getX(activeWaypoint.distanceFromStartKm)}
              y2={getY(activeWaypoint.elevationMeters + ROVER_ANTENNA_HEIGHT_METERS * 5)}
              stroke={activeWaypoint.lineOfSightToLander === 'occluded' ? '#ef4444' : '#38bdf8'}
              strokeWidth={1.5}
              strokeDasharray={activeWaypoint.lineOfSightToLander === 'occluded' ? '4 3' : undefined}
            />
          )}

          {/* Lander Origin Marker */}
          <circle cx={landerX} cy={landerY} r={5} fill="#38bdf8" stroke="#0f172a" strokeWidth={1.5} />
          <text x={landerX + 8} y={landerMastY - 6} fill="#38bdf8" fontSize="10" fontWeight="bold">
            Lander (0 km)
          </text>

          {/* Clickable Waypoint Nodes */}
          {waypoints.map((w) => {
            const cx = getX(w.distanceFromStartKm);
            const cy = getY(w.elevationMeters);
            const isSelected = activeWaypointIndex === w.index;
            return (
              <g
                key={w.index}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => onSelectWaypoint(w.index)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 6 : 3}
                  fill={isSelected ? '#facc15' : w.terrainSafety === 'hazard' ? '#f43f5e' : '#10b981'}
                  stroke="#0f172a"
                  strokeWidth={1.5}
                />
              </g>
            );
          })}

          {/* X Axis distance marks */}
          <line x1={padLeft} y1={padTop + plotH} x2={padLeft + plotW} y2={padTop + plotH} stroke="rgba(255,255,255,0.2)" />
          <text x={padLeft} y={padTop + plotH + 18} fill="rgba(255,255,255,0.5)" fontSize="10">0 km</text>
          <text x={padLeft + plotW / 2} y={padTop + plotH + 18} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">
            {(totalDistanceKm / 2).toFixed(1)} km
          </text>
          <text x={padLeft + plotW} y={padTop + plotH + 18} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="10">
            {totalDistanceKm.toFixed(1)} km
          </text>
        </svg>
      </div>
    </div>
  );
}
