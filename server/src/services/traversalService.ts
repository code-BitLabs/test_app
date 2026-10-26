import { calculateTraversalPlan } from '@domain/traversal/traversePlanner';
import { TraversalPlan, TraversalPlanRequest } from '@domain/traversal/types';
import { TraversalRequestInput } from '@server/schemas/traversalSchemas';

export function computeTraversalPlanService(
  input: TraversalRequestInput,
): TraversalPlan {
  const domainRequest: TraversalPlanRequest = {
    originLatDeg: input.originLatDeg,
    originLonDeg: input.originLonDeg,
    destinationLatDeg: input.destinationLatDeg,
    destinationLonDeg: input.destinationLonDeg,
    rover: input.rover,
    maxWaypoints: input.maxWaypoints,
  };

  return calculateTraversalPlan(domainRequest);
}
