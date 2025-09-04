# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web application for designing 3D-printable speaker crossover mounting plates. Users can:
- Select audio components (capacitors, inductors, resistors) from a library
- Drag and drop them onto a virtual board
- Generate a 3D model with recesses and lead holes through procedural operations
- Export STL files for 3D printing

### Architecture: Procedural Generation System

The application uses a **separation of concerns** architecture:
1. **Placement Phase**: Users place components interactively on the board
2. **Operations Timeline**: All actions are tracked as procedural operations
3. **Generation Phase**: Operations are converted to JSCAD script for 3D generation
4. **Export Phase**: Final geometry is serialized to STL format

This approach provides:
- Clear separation between UI interaction and geometry generation
- Ability to toggle/reorder operations
- Reproducible generation from operation history
- Easy addition of new operation types (zip-ties, labels, etc.)

## Key Architecture Components

### Operations System
- **`/lib/operations-manager.ts`** - Manages procedural operations timeline
  - Tracks all operations with enable/disable state
  - Supports operation reordering and removal
  - Serializable for save/load functionality
  
- **`/lib/jscad-operations-generator.ts`** - Converts operations to JSCAD script
  - Generates executable JSCAD code from operations list
  - Handles all geometry types (recesses, holes, slots, channels)
  - Proper coordinate transformations for 3D generation

- **`/components/OperationsPanel.tsx`** - UI for operations timeline
  - Visual list with checkboxes for enable/disable
  - Reorder operations with up/down buttons
  - Add custom operations (zip-ties, labels, wire channels)
  - Generate button to create 3D model

- **`/components/HelpPanel.tsx`** - User assistance
  - Floating help button with keyboard shortcuts
  - Workflow instructions
  - Tips and best practices

## Technology Stack

- **Frontend**: React with Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **3D Interface**: React Three Fiber + Three.js (3D-first design)
- **3D Generation**: OpenJSCAD (JSCAD) for parametric CAD and STL export
- **State Management**: Zustand
- **Deployment**: Vercel (client-side STL generation)

## Component Data Schema (Enriched)

The project uses enriched component data with deterministic hole placement.
See DATA_CONTRACT.md for complete field specifications.

**Data Files:**
- `crossover_parts_verified_enriched.json`: 89 components with enriched fields
- `defaults_by_series.json`: Series-level defaults for lead patterns

**Key Enrichments:**
- `suggested_hole_diameter_mm`: Pre-calculated hole sizes
- `end_inset_mm`: Axial component hole positioning  
- `lead_pattern`, `lead_angle_*_deg`: Inductor lead positioning
- `hole_edge_offset_mm`: Radial offset for coil holes
- `board_min_wall_mm`: Safety clearances
- `label_text`: Auto-generated component labels
- `footprint_w_mm`, `footprint_h_mm`: 2D bounding boxes

## Current Status & Known Issues

### Working Features (Procedural Generation Architecture)
- **3D Scene with React Three Fiber** - Full 3D environment with board and components
- **Component Library** - All 89 components from enriched JSON data
- **Drag & Drop System** - Components draggable using TransformControls
- **Operations Timeline Panel** - Visual list of all procedural operations
- **Operation Management** - Toggle enable/disable, reorder operations
- **JSCAD Script Generation** - Convert operations to executable JSCAD code
- **Component Recesses** - Horizontal cylindrical cradles for axial components
- **Lead Hole Positioning** - Accurate hole placement using end_inset_mm
- **Zip-tie Slots** - Add zip-tie features for securing inductors
- **Wire Channels** - Create channels for wire routing
- **Mounting Holes** - Add mounting holes with optional countersinks
- **Help Panel** - Floating help with keyboard shortcuts and tips
- **Collision Detection** - Real-time collision checking with visual warnings
- **Board Preview Mode** - Toggle between Design View and Preview Board
- **STL Export** - Binary STL generation via OpenJSCAD
- **Keyboard Controls** - Delete, R (rotate), arrows (move), Ctrl+A (select all)
- **Grid System** - Snap-to-grid functionality with configurable grid size
- **Label System** - High-contrast labels (black text with white outline)
- **Lead Holes** - Visual indicators for component lead positions
- **Save/Load** - Project persistence with JSON format
- **Auto-save** - LocalStorage backup every 30 seconds

### Recently Fixed Issues ✅
1. **STL Export** - Fixed JSCAD serialization array handling, STL files now contain geometry
2. **Coordinate System** - Fixed Y/Z axis mismatch between Three.js and JSCAD
3. **Component Recesses** - Proper dimensions from enriched data, correct positioning
4. **Component Dragging** - TransformControls working, constrained to XZ plane
5. **Label Visibility** - Black text with white outline for contrast
6. **Collision System** - Components turn red and show warning when colliding
7. **Board Preview** - Toggle button switches between design and preview modes
8. **Keyboard Shortcuts** - Full keyboard support implemented

### Remaining Issues to Fix
1. **Multi-select Box** - Drag rectangle to select multiple components
2. **Properties Panel** - Numerical position/rotation editing
3. **Undo/Redo System** - Ctrl+Z/Y for design changes
4. **Wire Routing Tools** - Manual hole placement and channel tools
5. **Auto-Layout** - One-click arrangement respecting clearances

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
- [x] Add data validation layer (IGS validation implemented)

### Phase 2: 2D Canvas Implementation (Day 3-5)

#### Canvas Foundation
- [x] Install and configure Konva.js (or Fabric.js) - Using react-konva v18
- [x] Create main canvas component
- [x] Implement board visualization (default 200x150mm) - Note: Changed from 150x100mm
- [x] Add board dimension controls (width, height, thickness inputs)
- [x] Implement grid system:
  - [x] 1mm fine grid
  - [x] 5mm medium grid
  - [x] 10mm coarse grid
  - [x] Toggle grid visibility
- [x] Add zoom controls (10% - 500% range)
- [x] Implement pan functionality (middle mouse or Cmd+drag)
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
- [x] Add hover tooltips with full specifications

#### Visual Component Representations
- [x] Create component shape renderers (basic):
  - [x] Capacitors: Red rectangles/circles
  - [x] Resistors: Blue rectangles/circles
  - [x] Inductors: Green rectangles/circles
- [x] Add dimension labels
- [x] Show lead exit points

#### Drag & Drop System
- [x] Implement drag from library to canvas - **FIXED AND WORKING**
- [x] Add ghost/preview during drag
- [x] Enable snap-to-grid on drop
- [x] Implement component selection
- [x] Add rotation controls:
  - [x] R key for 90° increments
  - [x] Shift+R for counter-clockwise
  - [ ] Visual rotation handle
- [x] Keyboard controls:
  - [x] Arrow keys: Move 1mm (Shift for 5mm)
  - [x] Delete/Backspace: Remove component
  - [x] Ctrl/Cmd+Z: Undo
  - [x] Ctrl/Cmd+Y: Redo
  - [x] Ctrl/Cmd+A: Select all
  - [ ] Ctrl/Cmd+D: Duplicate
- [x] Multi-select functionality:
  - [x] Shift+click to add to selection
  - [x] Drag rectangle to select multiple
  - [x] Move/rotate multiple components

#### Visual Feedback & Validation
- [x] Show component footprint outline during placement (ghost preview)
- [x] Display lead hole positions as dots/circles
- [ ] Highlight grid snap points during drag
- [x] Show dimension labels on selection
- [x] Collision detection:
  - [x] Red outline for overlapping components (shows warning)
  - [x] Warning for components outside board
  - [ ] Minimum clearance indicators
- [x] Real-time position/rotation display
- [x] Visual alignment guides

### Phase 3: Geometry Engine (Day 6-7)

#### Coordinate System
- [x] Define world coordinate system (0,0 at board top-left, mm units)
- [x] Implement component local coordinate system
- [x] Create transformation utilities:
  - [x] Translation matrices
  - [x] Rotation matrices
  - [x] Combined transformations
- [x] Calculate lead hole positions:
  - [x] Axial leads: Two holes at body_length distance
  - [x] Radial leads: Exit points based on lead spacing
- [x] Account for lead diameter in hole calculations

#### Intermediate Geometry Specification (IGS)
- [x] Design IGS TypeScript interfaces:
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
- [x] Implement IGS generation from canvas state
- [x] Add IGS validation:
  - [x] Components within bounds
  - [x] Lead holes ≥2mm from edge
  - [x] Component clearance ≥3mm
  - [x] No overlapping recesses
- [x] Create IGS serialization/deserialization
- [x] Add IGS versioning for compatibility

#### Geometry Calculations
- [x] Implement recess depth calculations (2-3mm typical)
- [x] Calculate lead hole diameters (lead_diameter + 0.3mm clearance)
- [x] Generate bounding boxes for collision detection
- [x] Create clearance zone calculations
- [ ] Implement board auto-sizing algorithm

### Phase 4: OpenJSCAD Integration (Day 8-10)

#### JSCAD Setup
- [x] Install @jscad/modeling and dependencies
- [x] Install @jscad/stl-serializer for STL export
- [x] Install @react-three/fiber and three.js for 3D viewer
- [x] 3D preview visualization implemented
- [x] Configure JSCAD with millimeter units
- [x] Create JSCAD utility functions

#### Parametric Model Functions
- [x] Create base plate generator:
  - [x] Rectangular cuboid with dimensions
  - [x] Optional corner radius
  - [x] Optional mounting holes
- [x] Component recess generators:
  - [x] Cylindrical cradle (2.5mm deep) for capacitors/resistors
  - [x] Rectangular recesses for axial components
  - [ ] Smooth edges for easy component placement
- [x] Lead hole generator:
  - [x] Through holes with clearance
  - [ ] Optional countersink
- [x] Text/label generator:
  - [x] Embossed text (0.5mm raised)
  - [x] Engraved text (0.5mm deep)
  - [x] Simple fonts for 3D printing

#### Boolean Operations Pipeline
- [x] Implement deterministic operation order:
  1. Create base plate solid
  2. Create union of all recesses
  3. Subtract recesses from plate
  4. Create union of all holes
  5. Subtract holes from plate
  6. Add embossed features (pending)
  7. Subtract engraved features (pending)
- [x] Ensure manifold geometry (watertight)
- [x] Add error handling for invalid operations
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
- [x] Implement client-side STL generation
- [x] Add export dialog with options:
  - [x] File name input (in toolbar)
  - [ ] Quality selection
  - [x] Unit verification (mm)
- [x] Generate binary STL for smaller files
- [ ] Add ASCII STL option
- [ ] Create metadata JSON sidecar:
  - [ ] Component list with positions
  - [ ] Board dimensions
  - [ ] Generation timestamp
  - [ ] Library version
  - [ ] Print recommendations
- [x] Implement download functionality
- [x] Add export validation checks

#### Save/Load Projects
- [x] Design project file format (JSON)
- [x] Implement project export:
  - [x] Canvas state
  - [x] Component positions
  - [x] Board settings
  - [ ] User preferences
- [x] Create import functionality:
  - [x] File upload
  - [ ] Drag-and-drop support
  - [x] Format validation
- [x] LocalStorage integration:
  - [x] Auto-save every 30 seconds
  - [x] Restore on page reload
  - [x] Clear old auto-saves
- [x] Shareable links:
  - [x] Compress state to URL
  - [ ] URL shortener integration
  - [ ] QR code generation
- [ ] Version migration system

### Phase 7: Advanced Features (Day 15-16)

#### Board Features
- [x] Mounting holes:
  - [x] Corner holes (3mm/4mm options)
  - [x] Custom hole positions
  - [x] Countersink option
- [x] Standoffs:
  - [x] Configurable height (3-10mm)
  - [x] M3/M4 thread options
  - [x] Snap-fit or screw mount
- [x] Zip-tie features:
  - [x] Slots for inductor securing
  - [x] Width options (3mm/5mm)
  - [x] Smooth edges
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
  - [x] Adding custom components (CustomComponentDialog implemented)
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

### Phase 10: Professional 3D Board Features (Advanced)

#### Two-Sided Board Design
- [ ] Top side component features:
  - [ ] Deep component recesses (3-4mm for secure fit)
  - [ ] Shaped profiles matching component types
  - [ ] Tapered edges for easy insertion
  - [ ] Component orientation guides
- [ ] Bottom side connection features:
  - [ ] Raised node pads (1-2mm) at connection points
  - [ ] Node clustering for components sharing connections
  - [ ] Optional wire channels between nodes
  - [ ] Countersinks around lead holes
- [ ] Through-board features:
  - [ ] Properly sized lead holes (diameter + 0.3mm)
  - [ ] Lead hole spacing matched to component specs
  - [ ] Grouped holes for shared electrical nodes

#### Advanced Labeling System
- [ ] Top side labels:
  - [ ] Component ID labels (C1, L1, R1)
  - [ ] Component value labels (4.7µF, 2.2mH)
  - [ ] Polarity indicators (+/-) for electrolytic capacitors
  - [ ] Orientation arrows for inductors
- [ ] Bottom side labels:
  - [ ] Node letter labels (A, B, C) for connections
  - [ ] Terminal labels (IN+, IN-, T+, T-, W+, W-)
  - [ ] Wire gauge indicators at connection points
  - [ ] Test point markers
- [ ] Label rendering:
  - [ ] Embossed text (0.5mm raised)
  - [ ] Engraved text (0.5mm deep)
  - [ ] Auto-mirroring for bottom text
  - [ ] Font size based on available space

#### Wire Management System
- [ ] Bottom side wire channels:
  - [ ] Channels connecting node points (2mm wide, 1.5mm deep)
  - [ ] Width adjustment for different wire gauges
  - [ ] Smooth channel transitions
  - [ ] Channel intersection handling
- [ ] Strain relief features:
  - [ ] Wire entry guides at board edges
  - [ ] Cable clamp positions
  - [ ] Zip-tie slots (3mm wide) along channels
  - [ ] Wire bend radius enforcement
- [ ] Terminal block integration:
  - [ ] Raised platforms (3mm) for terminal blocks
  - [ ] Screw hole positions for common terminal blocks
  - [ ] Wire approach angles for easy connection
  - [ ] Terminal block model library

#### Assembly Method Support
- [ ] Twisted lead method:
  - [ ] Tighter node clustering for easier twisting
  - [ ] Lead length indicators
  - [ ] Twist direction guides
- [ ] Channel routing method:
  - [ ] Complete channel network generation
  - [ ] Channel depth based on wire count
  - [ ] Color-coded channel system
- [ ] Hybrid method:
  - [ ] Selective channel generation
  - [ ] Mixed connection indicators
  - [ ] Flexible node spacing

### Phase 11: Intelligent Auto-Layout System

#### Circuit Topology Analysis
- [ ] Schematic parser:
  - [ ] Identify electrical nodes from connections
  - [ ] Extract circuit paths (high-pass, low-pass, etc.)
  - [ ] Determine signal flow direction
  - [ ] Calculate current paths
- [ ] Node mapping:
  - [ ] Create node connection matrix
  - [ ] Identify shared connection points
  - [ ] Assign node letters automatically
  - [ ] Generate node priority based on connections
- [ ] Component relationships:
  - [ ] Group series components
  - [ ] Identify parallel branches
  - [ ] Map filter sections
  - [ ] Track signal path components

#### Auto-Layout Algorithm Implementation
- [ ] Initial placement algorithm:
  - [ ] Force-directed graph for initial positions
  - [ ] Node-based clustering
  - [ ] Component type grouping
  - [ ] Maintain logical signal flow
- [ ] Constraint system:
  - [ ] Minimum component spacing (5mm default)
  - [ ] Inductor spacing (50mm minimum, 2x coil diameter)
  - [ ] Edge clearance (10mm from board edge)
  - [ ] Thermal spacing for power resistors
- [ ] Optimization engine:
  - [ ] Genetic algorithm for placement optimization
  - [ ] Cost function with weighted objectives:
    - [ ] Minimize total wire length (40% weight)
    - [ ] Minimize EMI interference (40% weight)
    - [ ] Aesthetic balance (20% weight)
  - [ ] Iterative refinement passes
  - [ ] Local search for fine-tuning

#### Electromagnetic Interference Prevention
- [ ] Inductor placement rules:
  - [ ] Calculate magnetic field zones
  - [ ] Enforce 90° rotation between adjacent inductors
  - [ ] Maintain 2" (50mm) minimum separation
  - [ ] Keep 150mm from speaker driver positions
- [ ] Field strength calculation:
  - [ ] Model inductor magnetic fields
  - [ ] Calculate mutual inductance
  - [ ] Identify interference zones
  - [ ] Generate field strength heatmap
- [ ] Component immunity mapping:
  - [ ] Mark capacitors as EMI-immune
  - [ ] Identify sensitive components
  - [ ] Create keep-out zones
  - [ ] Allow capacitor-on-inductor placement

#### Layout Configuration System
- [ ] User preferences:
  - [ ] Layout style (compact, spread, balanced)
  - [ ] Assembly method preference
  - [ ] Component grouping options
  - [ ] Aesthetic preferences
- [ ] Constraint editor:
  - [ ] Custom spacing rules
  - [ ] Component pinning/locking
  - [ ] Preferred zones
  - [ ] Forbidden areas
- [ ] Multiple layout generation:
  - [ ] Generate 3-5 layout options
  - [ ] Score each layout
  - [ ] Present options to user
  - [ ] Allow manual selection

#### Assembly Instruction Generation
- [ ] Connection matrix:
  - [ ] List all node connections
  - [ ] Group by connection letter
  - [ ] Order by assembly sequence
  - [ ] Include wire length estimates
- [ ] Step-by-step guide:
  - [ ] Component placement order
  - [ ] Connection sequence
  - [ ] Testing checkpoints
  - [ ] Common mistake warnings
- [ ] Visual documentation:
  - [ ] Bottom-view connection diagram
  - [ ] Color-coded node map
  - [ ] 3D assembly animation
  - [ ] Printable assembly sheet
- [ ] BOM integration:
  - [ ] Component list with positions
  - [ ] Wire length calculations
  - [ ] Terminal block requirements
  - [ ] Hardware list (screws, zip-ties)

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

## Recently Completed Tasks (Phase 2 - Final Update)

### Completed on Current Session:
- ✅ **Multi-select functionality**:
  - Implemented Shift+click and Ctrl/Cmd+click for adding to selection
  - Added drag rectangle selection for selecting multiple components
  - Batch operations (rotate all, flip all, delete all) for multiple selected components
  - Updated PropertiesPanel to show batch actions for multiple selections

- ✅ **Hover tooltips with specifications**:
  - Shows full component details on hover (brand, series, type, value, tolerance, voltage)
  - Displays lead configuration and spacing
  - Shows current position and rotation
  - Positioned near cursor for easy reading

- ✅ **Ghost preview during drag**:
  - Semi-transparent preview shows where component will be placed
  - Preview follows cursor and snaps to grid
  - Clear visual feedback during drag operations

- ✅ **Real-time position/rotation display**:
  - Shows X, Y coordinates in mm when dragging components
  - Displays rotation angle
  - Bottom-left status bar with monospace font for clarity
  - Updates in real-time during drag operations

- ✅ **Select All (Ctrl/Cmd+A)**:
  - Keyboard shortcut now selects all components on canvas

### Phase 2 Summary:
All major Phase 2 features are now complete. The 2D canvas implementation includes:
- Full drag & drop system with visual feedback
- Comprehensive keyboard shortcuts
- Multi-selection capabilities
- Visual guides and collision detection
- Real-time position tracking
- Professional UI polish with tooltips and previews

Ready to proceed to Phase 3: Geometry Engine and 3D generation.

## Phase 3 Completed Tasks (Current Session - Geometry Engine Implementation)

### Completed Today:
- ✅ **Coordinate System Implementation**:
  - Defined world coordinate system with board centered at origin
  - Implemented component local coordinate transformations
  - Created rotation and translation utilities
  - Calculated lead hole positions for both radial and axial configurations

- ✅ **Geometry Calculations**:
  - Implemented recess depth calculations (min of component height * 0.7, board thickness - 0.5mm, 3mm)
  - Added proper clearances (0.5mm for component bodies, 0.3mm for lead holes)
  - Fixed coordinate transformations for proper 3D positioning

- ✅ **OpenJSCAD Integration**:
  - Researched and verified @jscad/modeling and @jscad/stl-serializer packages
  - Fixed API usage (cuboid vs cube)
  - Implemented proper boolean operations pipeline
  - Created working STL export with binary format

- ✅ **3D Model Generation**:
  - Base board generation with proper dimensions
  - Component-specific recess shapes (cylindrical for round, rectangular for others)
  - Lead hole positioning with rotation support
  - Proper subtraction operations for manifold geometry

- ✅ **STL Export**:
  - Binary STL generation for smaller file sizes
  - Browser-based download functionality
  - Error handling and validation

### Technical Details:
- Fixed component dimension references to use actual data structure
- Implemented proper lead configurations (radial vs axial)
- Added rotation calculations for lead hole positioning
- Corrected JSCAD API usage (cuboid for rectangular shapes)
- Ensured watertight geometry for 3D printing

Phase 3 is now complete with a functional geometry engine ready for 3D printing!