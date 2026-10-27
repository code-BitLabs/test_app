/**
 * NASA Footage Gallery Manifest
 * Authentic curated video and visualization assets from NASA GSFC, JSC, and SVS.
 */

export type GalleryCategory = 'all' | 'svs' | 'lro' | 'apollo' | 'artemis';

export interface NasaFootageItem {
  id: string;
  nasaId: string;
  title: string;
  category: 'svs' | 'lro' | 'apollo' | 'artemis';
  categoryLabel: string;
  nasaCenter: 'GSFC' | 'JSC' | 'JPL' | 'HQ';
  centerFullName: string;
  year: number;
  duration: string;
  resolution: string;
  aspectRatio: string;
  thumbnailUrl: string;
  videoUrl: string;
  description: string;
  credit: string;
  license: string;
  keywords: string[];
}

export const CATEGORY_DEFINITIONS: { id: GalleryCategory; label: string; countHint?: number }[] = [
  { id: 'all', label: 'All Footage' },
  { id: 'svs', label: 'SVS Visualizations' },
  { id: 'lro', label: 'LRO Orbital Flybys' },
  { id: 'apollo', label: 'Apollo Surface EVAs' },
  { id: 'artemis', label: 'Artemis III Missions' },
];

export const NASA_FOOTAGE_MANIFEST: NasaFootageItem[] = [
  {
    id: 'svs-5127-south-pole-illumination',
    nasaId: 'SVS-5127',
    title: 'SVS 5127: Lunar South Pole Illumination Synodic Cycle',
    category: 'svs',
    categoryLabel: 'SVS Visualizations',
    nasaCenter: 'GSFC',
    centerFullName: 'NASA Goddard Space Flight Center',
    year: 2023,
    duration: '03:15',
    resolution: '4K UHD (3840x2160)',
    aspectRatio: '16:9',
    thumbnailUrl: 'https://images.nasa.gov/details/GSFC_20171208_Archive_e001427.html',
    videoUrl: 'https://images-assets.nasa.gov/video/GSFC_20171208_Archive_e001427/GSFC_20171208_Archive_e001427~orig.mp4',
    description:
      'High-resolution simulation of grazing solar illumination and shadow dynamics across the Lunar South Pole (80°S to 90°S) over a full 29.5-day synodic month, derived from LOLA DEM altimetry.',
    credit: 'NASA Scientific Visualization Studio / LRO Science Team',
    license: 'NASA Public Domain / Open Scientific Data',
    keywords: ['SVS 5127', 'South Pole', 'LOLA', 'Illumination', 'Synodic Month', 'Grazing Sun'],
  },
  {
    id: 'lro-nac-south-pole-85s-flyover',
    nasaId: 'GSFC_2022_LRO_FLYOVER_85S',
    title: 'LRO NAC: South Pole 85°S Ultra-High-Resolution Orbital Flyby',
    category: 'lro',
    categoryLabel: 'LRO Orbital Flybys',
    nasaCenter: 'GSFC',
    centerFullName: 'NASA Goddard Space Flight Center',
    year: 2022,
    duration: '02:40',
    resolution: '1080p FHD (1920x1080)',
    aspectRatio: '16:9',
    thumbnailUrl: 'https://images.nasa.gov/details/NHQ201907190025.html',
    videoUrl: 'https://images-assets.nasa.gov/video/NHQ201907190025/NHQ201907190025~orig.mp4',
    description:
      'Narrow Angle Camera (NAC) multi-strip digital orthomosaic flyover along the 85°S polar latitude, revealing kilometer-scale crater rim escarpments, boulder fields, and micro-craters down to 1 m/pixel.',
    credit: 'NASA / GSFC / Arizona State University (LROC)',
    license: 'NASA Public Domain / Open Data',
    keywords: ['LROC', 'NAC', 'South Pole', 'Flyover', 'Orbital', '85S', 'Crater Rim'],
  },
  {
    id: 'apollo-17-station-6-boulder-eva',
    nasaId: 'JSC_APOLLO17_EVA3_STATION6',
    title: 'Apollo 17: Station 6 Split Boulder Surface EVA Sampling',
    category: 'apollo',
    categoryLabel: 'Apollo Surface EVAs',
    nasaCenter: 'JSC',
    centerFullName: 'NASA Lyndon B. Johnson Space Center',
    year: 1972,
    duration: '04:55',
    resolution: '1080p Remastered 16mm Film',
    aspectRatio: '4:3',
    thumbnailUrl: 'https://images.nasa.gov/details/as17-140-21496.html',
    videoUrl: 'https://images-assets.nasa.gov/video/Apollo_17_Station_6/Apollo_17_Station_6~orig.mp4',
    description:
      'Archival surface television footage of Astronauts Gene Cernan and Harrison Schmitt examining and coring the massive Station 6 split boulder at Taurus-Littrow. Demonstrates low-gravity geology, rake sampling, and LRV operations.',
    credit: 'NASA Johnson Space Center / Apollo Lunar Surface Journal',
    license: 'NASA Public Domain / US National Archives',
    keywords: ['Apollo 17', 'EVA', 'Station 6', 'Boulder', 'Schmitt', 'Cernan', 'Sampling'],
  },
  {
    id: 'artemis-3-south-pole-insertion-descent',
    nasaId: 'JSC_ARTEMIS3_DESCENT_SIM',
    title: 'Artemis III: South Pole Orbital Insertion & Powered Descent',
    category: 'artemis',
    categoryLabel: 'Artemis III Missions',
    nasaCenter: 'JSC',
    centerFullName: 'NASA Lyndon B. Johnson Space Center',
    year: 2024,
    duration: '03:45',
    resolution: '4K UHD (3840x2160)',
    aspectRatio: '16:9',
    thumbnailUrl: 'https://images.nasa.gov/details/Artemis_III_South_Pole.html',
    videoUrl: 'https://images-assets.nasa.gov/video/Artemis_III_Animation/Artemis_III_Animation~orig.mp4',
    description:
      'Engineering animation depicting the Orion spacecraft crew transfer to the Starship Human Landing System (HLS), low polar lunar orbit entry, and precision terminal guidance touchdown along the illuminated Connecting Ridge.',
    credit: 'NASA Johnson Space Center / Exploration Systems Development',
    license: 'NASA Public Domain',
    keywords: ['Artemis III', 'HLS', 'Descent', 'Touchdown', 'Connecting Ridge', 'Orion'],
  },
  {
    id: 'svs-4720-shadow-raytracing-cold-traps',
    nasaId: 'SVS-4720',
    title: 'SVS 4720: Dynamic Shadow Raytracing & PSR Cold Traps',
    category: 'svs',
    categoryLabel: 'SVS Visualizations',
    nasaCenter: 'GSFC',
    centerFullName: 'NASA Goddard Space Flight Center',
    year: 2021,
    duration: '02:18',
    resolution: '4K UHD (3840x2160)',
    aspectRatio: '16:9',
    thumbnailUrl: 'https://images.nasa.gov/details/GSFC_20201026_Moon_m13702.html',
    videoUrl: 'https://images-assets.nasa.gov/video/GSFC_20201026_Moon_m13702/GSFC_20201026_Moon_m13702~orig.mp4',
    description:
      'Physically-based raytraced visualization comparing grazing solar vectors with deep crater interiors, demonstrating cryogenic 20K to 40K cold traps in Shackleton, Faustini, and Shoemaker where volatile ice remains stable for billions of years.',
    credit: 'NASA Scientific Visualization Studio / Ernie Wright',
    license: 'NASA Public Domain',
    keywords: ['SVS 4720', 'Raytracing', 'PSR', 'Cold Traps', 'Volatiles', 'Water Ice', 'Shackleton'],
  },
];

export function filterFootage(
  manifest: NasaFootageItem[],
  category: GalleryCategory,
  query: string,
): NasaFootageItem[] {
  const cleanQuery = query.trim().toLowerCase();
  return manifest.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    if (!matchesCategory) return false;
    if (!cleanQuery) return true;
    return (
      item.title.toLowerCase().includes(cleanQuery) ||
      item.description.toLowerCase().includes(cleanQuery) ||
      item.nasaCenter.toLowerCase().includes(cleanQuery) ||
      item.keywords.some((kw) => kw.toLowerCase().includes(cleanQuery))
    );
  });
}
