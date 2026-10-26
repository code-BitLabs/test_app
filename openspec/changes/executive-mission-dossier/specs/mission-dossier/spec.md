# Spec Delta: mission-dossier

## Purpose

Enables end-to-end multi-domain mission briefing synthesis, preview, and multi-format export (Markdown, printable PDF, and JSON) for Artemis candidate sites and user-defined custom targets.

## ADDED Requirements

### Requirement: Multi-domain mission briefing synthesis
The system SHALL synthesize site geodesy, topocentric solar illumination, NASA DSN RF link budget, volatile water-ice prospecting yield, and rover traversal feasibility into a unified aerospace mission briefing model for any valid lunar south-polar site.

#### Scenario: Catalog candidate dossier generation
- **WHEN** user requests a mission dossier for a selected Artemis catalog candidate
- **THEN** system returns complete telemetry sections containing IAU/IAG coordinates, LOLA elevation, continuous sunlight envelope, DSN X-band/Ka-band margins, hydrogen wt% and water yield, and traversal safety classification

#### Scenario: Custom target dossier generation
- **WHEN** user requests a mission dossier for an arbitrary south-polar coordinate
- **THEN** system resolves LOLA DEM elevation, topocentric Sun/Earth angles, RF link margins, and comparative delta metrics benchmarking against the nearest Artemis candidate

### Requirement: Multi-format briefing formatting
The system SHALL format the synthesized mission dossier into GitHub-Flavored Markdown, machine-readable JSON telemetry, and print-ready HTML.

#### Scenario: Markdown briefing export
- **WHEN** user selects Markdown format and triggers download or clipboard copy
- **THEN** system outputs a publication-ready Markdown document containing executive summary, telemetry tables, and scientific provenance

#### Scenario: JSON telemetry interchange download
- **WHEN** user selects JSON format and triggers download
- **THEN** system downloads a JSON document with structured numerical fields, IAU reference frame metadata, and generation timestamp

### Requirement: Print-ready aerospace briefing presentation
The system SHALL provide a dedicated modal interface with print-optimized CSS rules allowing direct PDF generation via the browser print subsystem.

#### Scenario: Print stylesheet application
- **WHEN** user triggers the print command from the mission dossier modal
- **THEN** system presents high-contrast black-and-white aerospace typography, hide-on-print navigation elements, and clean section breaks suitable for paper or PDF

### Requirement: NextRush backend calculation route with client fallback
The system SHALL provide a NextRush backend endpoint `POST /api/dossier/generate` that validates site parameters and returns the synthesized dossier package, falling back to local client computation if the server is unreachable.

#### Scenario: Server calculation route invocation
- **WHEN** client posts valid landing site coordinates and target epoch to `POST /api/dossier/generate`
- **THEN** server returns HTTP 200 with complete structured dossier payload and execution telemetry

#### Scenario: Client offline fallback execution
- **WHEN** the backend server is unreachable or offline
- **THEN** client generates the complete mission dossier locally with identical calculation results without interrupting the user
