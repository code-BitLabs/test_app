import { prospectVolatilesAtCoordinates } from '@domain/volatiles/volatileProspector';
import { VolatileProspectingResult } from '@domain/volatiles/types';
import { VolatileProspectInput } from '@server/schemas/volatileSchemas';

export function prospectVolatilesService(
  input: VolatileProspectInput,
): VolatileProspectingResult {
  return prospectVolatilesAtCoordinates(input.latDeg, input.lonDeg);
}
