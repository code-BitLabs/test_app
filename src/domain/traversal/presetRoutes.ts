/**
 * Authoritative Lunar South Pole Exploration Preset Traverses
 *
 * Grounded in Artemis III candidate landing plateaus and adjacent
 * permanently shadowed region (PSR) volatile cold traps.
 */

import { PresetLunarTraverse } from './types';

export const PRESET_LUNAR_TRAVERSES: PresetLunarTraverse[] = [
  {
    id: 'shackleton-rim-to-floor',
    name: 'Shackleton Rim to Deep PSR Cold Trap',
    subtitle: 'Artemis III Peak to 40K Ultra-Cold Volatile Trap',
    description:
      'Descends from the permanently illuminated Shackleton Ridge plateau into the crater interior to sample exposed subsurface water ice.',
    originName: 'Shackleton Ridge Plateau',
    originLatDeg: -89.68,
    originLonDeg: 125.0,
    destinationName: 'Shackleton Crater Floor PSR',
    destinationLatDeg: -89.92,
    destinationLonDeg: 110.0,
    scientificGoal: 'Exposed surface volatile prospecting and cryogenic regolith coring.',
  },
  {
    id: 'mons-mouton-to-shoemaker',
    name: 'Mons Mouton to Shoemaker Crater Margin',
    subtitle: 'High Plateau Traverse to Ancient Impact Basin',
    description:
      'Navigates gentle rolling terrain from the Mons Mouton landing zone toward the volatile-rich ejecta blanket of Shoemaker crater.',
    originName: 'Mons Mouton Plateau',
    originLatDeg: -84.58,
    originLonDeg: 33.1,
    destinationName: 'Shoemaker Outer Ejecta Apron',
    destinationLatDeg: -86.50,
    destinationLonDeg: 38.5,
    scientificGoal: 'Regional stratigraphy, Pre-Nectarian massifs, and volatile gradient mapping.',
  },
  {
    id: 'malapert-to-haworth',
    name: 'Malapert Massif to Haworth Crater Flank',
    subtitle: 'Continuous DTE Communication to Deep Shadow Basin',
    description:
      'Traverses southward from the 5,000m high Malapert Massif peak toward the rim scarps of Haworth crater.',
    originName: 'Malapert Massif Peak',
    originLatDeg: -85.90,
    originLonDeg: 2.9,
    destinationName: 'Haworth Rim Scarp',
    destinationLatDeg: -87.10,
    destinationLonDeg: 358.0,
    scientificGoal: 'Long-range rover endurance and communication relay validation.',
  },
  {
    id: 'connecting-ridge-to-degerlache',
    name: 'Connecting Ridge to de Gerlache Basin',
    subtitle: 'High Sunlight Ridge to Steep Crater Wall Ingress',
    description:
      'Explores the narrow illuminated bridge between Shackleton and de Gerlache craters.',
    originName: 'Connecting Ridge Crest',
    originLatDeg: -89.44,
    originLonDeg: 222.5,
    destinationName: 'de Gerlache Rim Saddle',
    destinationLatDeg: -88.80,
    destinationLonDeg: 250.0,
    scientificGoal: 'Solar power harvesting corridors and slope stability testing.',
  },
];
