import { solveParetoLandingWindows } from '@domain/windows/paretoWindowSolver';
import { ParetoOptimizationResult } from '@domain/windows/types';
import { ParetoWindowInput } from '@server/schemas/windowSchemas';

export function optimizeLandingWindowsService(
  input: ParetoWindowInput,
): ParetoOptimizationResult {
  return solveParetoLandingWindows(input);
}
