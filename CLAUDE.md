# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web application for designing 3D-printable speaker crossover mounting plates. Users can:
- Select audio components (capacitors, inductors, resistors) from a library
- Drag and drop them onto a virtual board
- Generate a 3D model with recesses and lead holes
- Export STL files for 3D printing

## Technology Stack

- **Frontend**: React with Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **2D Canvas**: Konva.js or Fabric.js
- **3D Generation**: OpenJSCAD (JSCAD) for parametric CAD in browser
- **State Management**: Zustand or React Context
- **Deployment**: Vercel (client-side STL generation)

## Component Data

The project uses `crossover_parts_verified_seed.json` containing 62 verified components:
- 18 capacitors (Jantzen Audio, AUDYN)
- 21 resistors (Mundorf, Intertechnik)
- 23 inductors (Jantzen Audio, Intertechnik)

Schema (all dimensions in mm):
- `brand`, `series`, `part_type`, `value`, `value_unit`
- `voltage_or_power`, `body_shape` (cylinder/ring)
- `body_diameter_mm`, `body_length_mm` (for cylinders)
- `outer_diameter_mm`, `inner_diameter_mm`, `height_mm` (for rings)
- `lead_diameter_mm`, `lead_exit` (axial/tangential)

## Current Status & Known Issues

### Working Features
- Basic UI structure with header, sidebar, canvas, and properties panel
- Component library displays all 62 components from JSON
- Search functionality in component library
- Tab-based filtering (Capacitors, Resistors, Inductors)
- Basic canvas with PCB board visualization
- Component cards show dimensions and specifications

### Recently Fixed Issues ✅
1. **Drag & Drop Fixed** - Components can now be dragged from library to canvas
2. **ScrollArea Fixed** - Component list now scrolls properly with height constraint
3. **File Operations Working** - New, Save, Load buttons are functional
4. **Grid System Added** - Canvas has 1mm/5mm/10mm grid with snap-to-grid
5. **Keyboard Shortcuts Added** - Delete, R (rotate), Escape, Ctrl+A

### Remaining Issues to Fix
1. **Board Size Hardcoded** - Still set to 200x150mm with no UI to change it
2. **No 3D Generation** - Generate 3D Model button non-functional
3. **No STL Export** - Export STL button non-functional
4. **No Zoom/Pan** - Canvas lacks zoom and pan controls
5. **No Collision Detection** - Components can overlap

## Implementation Plan & Progress

### Phase 1: Project Setup & Initial Architecture (Day 1-2)

#### Initialize Next.js Project
- [x] Create Next.js 14+ project with TypeScript and App Router
- [x] Install and configure Tailwind CSS
- [x] Set up shadcn/ui components (init, add needed components)
- [x] Configure ESLint and Prettier
- [x] Set up Git repository and initial commit

#### Project Structure
- [x] Create folder structure:
  ```
  /app              - Next.js app router pages
  /components       - React components
    /canvas         - 2D canvas components
    /library        - Part library UI
    /preview        - 3D preview components
    /ui             - shadcn/ui components
  /lib              - Utility functions
    /geometry       - Coordinate calculations
    /jscad          - OpenJSCAD integration
    /utils          - General utilities
  /data             - Component data
  /types            - TypeScript definitions
  /hooks            - Custom React hooks
  /public           - Static assets
  ```

#### Data Integration
- [x] Keep crossover_parts_verified_seed.json (delete CSV)
- [x] Create TypeScript interfaces for component data
- [x] Create data loading utilities
- [x] Implement component search/filter functions (basic search)
- [ ] Add data validation layer

### Phase 2: 2D Canvas Implementation (Day 3-5)

#### Canvas Foundation
- [x] Install and configure Konva.js (or Fabric.js) - Using react-konva v18
- [x] Create main canvas component
- [x] Implement board visualization (default 200x150mm) - Note: Changed from 150x100mm
- [ ] Add board dimension controls (width, height, thickness inputs)
- [x] Implement grid system:
  - [x] 1mm fine grid
  - [x] 5mm medium grid
  - [x] 10mm coarse grid
  - [x] Toggle grid visibility
- [ ] Add zoom controls (10% - 500% range)
- [ ] Implement pan functionality (middle mouse or spacebar+drag)
- [ ] Add ruler/measurement display

#### Component Library Sidebar
- [x] Create component library panel using shadcn/ui Sheet or Sidebar
- [x] Implement component list from JSON data
- [x] Add search bar with real-time filtering
- [x] Create filter controls:
  - [x] Type selector (capacitor/inductor/resistor) - Using Tabs
  - [ ] Brand multi-select
  - [ ] Value range slider
  - [ ] Power/Voltage filter
- [x] Display component cards with:
  - [x] Visual icon based on type (using colors)
  - [x] Name and value
  - [x] Key dimensions
- [ ] Add hover tooltips with full specifications

#### Visual Component Representations
- [x] Create component shape renderers (basic):
  - [x] Capacitors: Red rectangles/circles
  - [x] Resistors: Blue rectangles/circles
  - [x] Inductors: Green rectangles/circles
- [ ] Add dimension labels
- [ ] Show lead exit points

#### Drag & Drop System
- [x] Implement drag from library to canvas - **FIXED AND WORKING**
- [ ] Add ghost/preview during drag
- [x] Enable snap-to-grid on drop
- [x] Implement component selection
- [x] Add rotation controls:
  - [x] R key for 90° increments
  - [x] Shift+R for counter-clockwise
  - [ ] Visual rotation handle
- [x] Keyboard controls:
  - [ ] Arrow keys: Move 1mm (Shift for 5mm)
  - [x] Delete/Backspace: Remove component
  - [ ] Ctrl/Cmd+Z: Undo
  - [ ] Ctrl/Cmd+Y: Redo
  - [ ] Ctrl/Cmd+A: Select all
  - [ ] Ctrl/Cmd+D: Duplicate
- [ ] Multi-select functionality:
  - [ ] Shift+click to add to selection
  - [ ] Drag rectangle to select multiple
  - [ ] Move/rotate multiple components

#### Visual Feedback & Validation
- [ ] Show component footprint outline during placement
- [ ] Display lead hole positions as dots/circles
- [ ] Highlight grid snap points during drag
- [ ] Show dimension labels on selection
- [ ] Collision detection:
  - [ ] Red outline for overlapping components
  - [ ] Warning for components outside board
  - [ ] Minimum clearance indicators
- [ ] Real-time position/rotation display
- [ ] Visual alignment guides

### Phase 3: Geometry Engine (Day 6-7)

#### Coordinate System
- [ ] Define world coordinate system (0,0 at board top-left, mm units)
- [ ] Implement component local coordinate system
- [ ] Create transformation utilities:
  - [ ] Translation matrices
  - [ ] Rotation matrices
  - [ ] Combined transformations
- [ ] Calculate lead hole positions:
  - [ ] Axial leads: Two holes at body_length distance
  - [ ] Tangential leads: Exit points on ring circumference
- [ ] Account for lead diameter in hole calculations

#### Intermediate Geometry Specification (IGS)
- [ ] Design IGS TypeScript interfaces:
  ```typescript
  interface IGS {
    board: {
      width: number;
      height: number;
      thickness: number;
      cornerRadius?: number;
      mountingHoles?: MountingHole[];
    };
    components: PlacedComponent[];
    labels: Label[];
    features: BoardFeature[];
  }
  ```
- [ ] Implement IGS generation from canvas state
- [ ] Add IGS validation:
  - [ ] Components within bounds
  - [ ] Lead holes ≥2mm from edge
  - [ ] Component clearance ≥3mm
  - [ ] No overlapping recesses
- [ ] Create IGS serialization/deserialization
- [ ] Add IGS versioning for compatibility

#### Geometry Calculations
- [ ] Implement recess depth calculations (2-3mm typical)
- [ ] Calculate lead hole diameters (lead_diameter + 0.5mm)
- [ ] Generate bounding boxes for collision detection
- [ ] Create clearance zone calculations
- [ ] Implement board auto-sizing algorithm

### Phase 4: OpenJSCAD Integration (Day 8-10)

#### JSCAD Setup
- [ ] Install @jscad/modeling and dependencies
- [ ] Install @jscad/io for STL export
- [ ] Install @jscad/web for viewer
- [ ] Set up Web Worker for background processing
- [ ] Configure JSCAD with millimeter units
- [ ] Create JSCAD utility functions

#### Parametric Model Functions
- [ ] Create base plate generator:
  - [ ] Rectangular cuboid with dimensions
  - [ ] Optional corner radius
  - [ ] Optional mounting holes
- [ ] Component recess generators:
  - [ ] Cylindrical cradle (2.5mm deep) for capacitors/resistors
  - [ ] Ring recess (2mm deep) for inductors
  - [ ] Smooth edges for easy component placement
- [ ] Lead hole generator:
  - [ ] Through holes with clearance
  - [ ] Optional countersink
- [ ] Text/label generator:
  - [ ] Embossed text (0.5mm raised)
  - [ ] Engraved text (0.5mm deep)
  - [ ] Simple fonts for 3D printing

#### Boolean Operations Pipeline
- [ ] Implement deterministic operation order:
  1. Create base plate solid
  2. Create union of all recesses
  3. Subtract recesses from plate
  4. Create union of all holes
  5. Subtract holes from plate
  6. Add embossed features
  7. Subtract engraved features
- [ ] Ensure manifold geometry (watertight)
- [ ] Add error handling for invalid operations
- [ ] Implement geometry caching

### Phase 5: 3D Preview System (Day 11-12)

#### Preview Implementation
- [ ] Integrate @jscad/web viewer component
- [ ] Create preview panel with shadcn/ui Card
- [ ] Add 2D/3D view toggle button
- [ ] Implement view controls:
  - [ ] Orbit (left mouse)
  - [ ] Zoom (scroll wheel)
  - [ ] Pan (right mouse)
  - [ ] Reset view button
- [ ] Add preview quality settings:
  - [ ] Draft: 16 segments/circle
  - [ ] Normal: 32 segments/circle
  - [ ] High: 64 segments/circle
- [ ] Show generation progress indicator

#### Performance Optimization
- [ ] Implement Web Worker for JSCAD processing
- [ ] Add geometry caching system
- [ ] Implement debounced preview updates (500ms)
- [ ] Use progressive rendering:
  - [ ] Show bounding box immediately
  - [ ] Render base plate
  - [ ] Add features progressively
- [ ] Memory management:
  - [ ] Clear old geometries
  - [ ] Limit cache size
- [ ] Target performance:
  - [ ] <500ms for 10 components
  - [ ] <2s for 50 components

### Phase 6: Export & Persistence (Day 13-14)

#### STL Export
- [ ] Implement client-side STL generation
- [ ] Add export dialog with options:
  - [ ] File name input
  - [ ] Quality selection
  - [ ] Unit verification (mm)
- [ ] Generate binary STL for smaller files
- [ ] Add ASCII STL option
- [ ] Create metadata JSON sidecar:
  - [ ] Component list with positions
  - [ ] Board dimensions
  - [ ] Generation timestamp
  - [ ] Library version
  - [ ] Print recommendations
- [ ] Implement download functionality
- [ ] Add export validation checks

#### Save/Load Projects
- [ ] Design project file format (JSON)
- [ ] Implement project export:
  - [ ] Canvas state
  - [ ] Component positions
  - [ ] Board settings
  - [ ] User preferences
- [ ] Create import functionality:
  - [ ] File upload
  - [ ] Drag-and-drop support
  - [ ] Format validation
- [ ] LocalStorage integration:
  - [ ] Auto-save every 30 seconds
  - [ ] Restore on page reload
  - [ ] Clear old auto-saves
- [ ] Shareable links:
  - [ ] Compress state to URL
  - [ ] URL shortener integration
  - [ ] QR code generation
- [ ] Version migration system

### Phase 7: Advanced Features (Day 15-16)

#### Board Features
- [ ] Mounting holes:
  - [ ] Corner holes (3mm/4mm options)
  - [ ] Custom hole positions
  - [ ] Countersink option
- [ ] Standoffs:
  - [ ] Configurable height (3-10mm)
  - [ ] M3/M4 thread options
  - [ ] Snap-fit or screw mount
- [ ] Zip-tie features:
  - [ ] Slots for inductor securing
  - [ ] Width options (3mm/5mm)
  - [ ] Smooth edges
- [ ] Edge treatments:
  - [ ] Filleting (2mm radius)
  - [ ] Chamfer option
  - [ ] Break sharp edges

#### Labels & Markings
- [ ] Component value labels:
  - [ ] Auto-generate from data
  - [ ] Configurable font size
  - [ ] Smart positioning
- [ ] Custom text labels:
  - [ ] User text input
  - [ ] Multiple fonts
  - [ ] Size and depth control
- [ ] Node marking system:
  - [ ] Assign nodes (A, B, C, etc.)
  - [ ] Connection indicators
  - [ ] Wiring guide generation
- [ ] Label placement options:
  - [ ] Top embossed
  - [ ] Top engraved
  - [ ] Bottom engraved (auto-mirror)
  - [ ] Side labels
- [ ] Polarity indicators for capacitors

#### UI Enhancements
- [ ] Use 21st MCP for advanced UI components
- [ ] Add command palette (Cmd+K)
- [ ] Implement context menus
- [ ] Add keyboard shortcut overlay
- [ ] Create onboarding tour
- [ ] Add dark mode support

### Phase 8: Testing & Documentation (Day 17-18)

#### Testing Suite
- [ ] Unit tests:
  - [ ] Geometry calculations
  - [ ] Component data handling
  - [ ] Transformation matrices
  - [ ] Collision detection
- [ ] Integration tests:
  - [ ] Canvas interactions
  - [ ] Drag and drop
  - [ ] Import/export
- [ ] E2E tests:
  - [ ] Complete workflow
  - [ ] STL generation
  - [ ] File download
- [ ] Performance tests:
  - [ ] Canvas with 100+ components
  - [ ] 3D generation benchmarks
  - [ ] Memory usage profiling
- [ ] Browser compatibility:
  - [ ] Chrome/Edge
  - [ ] Firefox
  - [ ] Safari

#### Documentation
- [ ] User guide:
  - [ ] Getting started
  - [ ] Interface overview
  - [ ] Component placement
  - [ ] 3D preview and export
  - [ ] Tips and tricks
- [ ] Component measurement guide:
  - [ ] How to measure components
  - [ ] Adding custom components
  - [ ] Dimension guidelines
- [ ] Print settings guide:
  - [ ] Recommended slicers
  - [ ] Layer height: 0.2mm
  - [ ] Infill: 20% minimum
  - [ ] Material: PETG/ABS for heat
  - [ ] Support settings
- [ ] Video tutorials:
  - [ ] Quick start (5 min)
  - [ ] Complete walkthrough (15 min)
  - [ ] Advanced features (10 min)
- [ ] API documentation for contributors

### Phase 9: Deployment (Day 19-20)

#### Production Setup
- [ ] Configure Vercel deployment:
  - [ ] Environment variables
  - [ ] Build settings
  - [ ] Domain setup
- [ ] Performance optimizations:
  - [ ] Code splitting
  - [ ] Lazy loading
  - [ ] Asset optimization
  - [ ] CDN configuration
- [ ] Monitoring setup:
  - [ ] Error tracking (Sentry)
  - [ ] Analytics (Plausible/Umami)
  - [ ] Performance monitoring
  - [ ] User feedback widget
- [ ] SEO optimization:
  - [ ] Meta tags
  - [ ] Open Graph
  - [ ] Sitemap
  - [ ] Robots.txt

#### Final Validation
- [ ] Print test plates:
  - [ ] Various component types
  - [ ] Different sizes
  - [ ] Complex layouts
- [ ] Component fit testing:
  - [ ] Verify tolerances
  - [ ] Check recess depths
  - [ ] Test lead holes
- [ ] User testing:
  - [ ] Gather feedback
  - [ ] Identify pain points
  - [ ] Document issues
- [ ] Performance validation:
  - [ ] Load time <3s
  - [ ] 60fps interactions
  - [ ] Smooth 3D preview

### Post-Launch Enhancements

#### Extended Component Library
- [ ] Add more manufacturers
- [ ] Include exotic components
- [ ] Community contributions
- [ ] Automatic data updates

#### Advanced Features
- [ ] Circuit simulation integration
- [ ] BOM generation
- [ ] Cost calculator
- [ ] Multi-board projects
- [ ] Team collaboration

#### Export Options
- [ ] DXF for laser cutting
- [ ] SVG for documentation
- [ ] STEP for CAD import
- [ ] G-code generation

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run tests
npm run test

# Run E2E tests
npm run test:e2e
```

## Key Implementation Notes

### Units & Tolerances
- All dimensions in millimeters (mm)
- Default lead hole diameter = lead_diameter + 0.5mm
- Recess depth: 2-3mm for components
- Plate thickness: 5-6mm default
- Minimum clearance: 3mm between components

### Performance Targets
- 2D canvas: 60fps with 50+ components
- 3D preview update: <500ms for small boards, <2s for 50 parts
- STL generation: <5s for complex designs
- File size: <10MB for typical STL

### 3D Printing Considerations
- Use heat-resistant materials (ABS/PETG) for resistor heat
- Ensure wall thickness > 2× nozzle diameter
- Avoid overhangs requiring supports
- Keep text height 0.5-0.8mm for embossing
- Add 0.2mm tolerance for tight fits

## Resources

- Component data: `crossover_parts_verified_seed.json`
- shadcn/ui components: https://ui.shadcn.com/
- OpenJSCAD docs: https://openjscad.xyz/
- Konva.js docs: https://konvajs.org/

## Troubleshooting

Common issues and solutions:
- **3D preview slow**: Reduce preview quality or debounce updates
- **Components don't fit**: Check tolerance settings and printer calibration
- **STL won't slice**: Ensure manifold geometry and correct units
- **Canvas lag**: Reduce grid density or component count