# custom-target-studio Specification

## Purpose

Provides interactive definition, 3D sphere pinpointing, multi-domain ephemeris/topography evaluation, and Artemis candidate benchmarking for arbitrary lunar South Pole coordinates.

## Requirements

### Requirement: Arbitrary Selenographic Coordinate Input & Validation
The system SHALL provide an interface allowing users to enter custom lunar coordinates within the south-polar region ($80^\circ\text{S} - 90^\circ\text{S}$, longitude $0^\circ - 360^\circ$ or $-180^\circ - +180^\circ$), validating numerical boundaries and resolving local LOLA DEM elevation.

#### Scenario: Submitting valid polar coordinates
- **WHEN** the user inputs latitude $-88.5^\circ$ and longitude $120.0^\circ$
- **THEN** the system validates the coordinates, computes the elevation from the LOLA topographic grid, and prepares the candidate model

#### Scenario: Rejecting out-of-range coordinates
- **WHEN** the user inputs a latitude outside $[-90^\circ, -70^\circ]$ or non-numeric input
- **THEN** the system displays a clear validation error message and disables target creation

### Requirement: 3D Globe Pinpoint Raycasting
The 3D lunar rendering engine SHALL support a pinpoint placement mode allowing the user to click or touch any visible surface point on the lunar globe to instantiate a target at the clicked Selenographic coordinate.

#### Scenario: Clicking on the 3D Moon sphere in pinpoint mode
- **WHEN** pinpoint mode is active and the user clicks on the lunar surface
- **THEN** the system raycasts the intersection point, converts Cartesian space to Selenographic latitude and longitude, and drops an interactive beacon marker

### Requirement: Multi-Domain Telemetry & Benchmark Comparison
The system SHALL evaluate real-time solar illumination, Earth line-of-sight and DSN RF link margin, slope hazard, and water-ice volatiles for the custom target, comparing them against the nearest authoritative Artemis candidate site.

#### Scenario: Evaluating custom landing site conditions
- **WHEN** a custom target is selected
- **THEN** the system displays local Sun elevation, Earth elevation, DSN path loss and margin, LOLA slope, and delta metrics relative to the nearest Artemis candidate

### Requirement: Custom Landing Target Persistence
The system SHALL allow saving custom landing targets with user-defined names to local browser storage, making them selectable across the candidate dropdown, comparison matrix, and 3D globe.

#### Scenario: Saving and reloading a custom target
- **WHEN** the user saves a custom landing target named "Alpha Ridge"
- **THEN** "Alpha Ridge" is persisted in local storage and appears in the candidate site selector
