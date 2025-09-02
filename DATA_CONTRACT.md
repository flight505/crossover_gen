# DATA_CONTRACT.md

## Enriched Component Data Schema

This document defines the enriched data structure for audio crossover components with deterministic hole placement formulas.

## Core Schema Fields

### Component Identity
- `brand`: string - Manufacturer name
- `series`: string - Product series name  
- `part_type`: "capacitor" | "resistor" | "inductor"
- `value`: number - Component value
- `value_unit`: string - Unit (µF, mH, Ω)
- `tolerance`: number - Tolerance percentage (optional)
- `voltage_or_power`: number - Voltage rating (V) for capacitors, Power rating (W) for resistors

### Physical Dimensions (all in mm)
- `body_shape`: "cylinder" | "coil" | "rectangular"
- `body_diameter_mm`: number - For cylinders and coils
- `body_length_mm`: number - For cylinders (height)
- `body_width_mm`: number - For rectangular bodies
- `body_height_mm`: number - For rectangular bodies
- `outer_diameter_mm`: number - For coils (ring inductors)
- `inner_diameter_mm`: number - For coils (ring inductors)
- `height_mm`: number - For coils (vertical height)

### Lead Configuration
- `lead_diameter_mm`: number - Wire lead diameter
- `lead_configuration`: "radial" | "axial"
- `lead_spacing_mm`: number - Distance between leads (radial only)

### Enriched Fields for Hole Placement
- `suggested_hole_diameter_mm`: number - Recommended PCB hole size
- `end_inset_mm`: number - Distance from body end to lead exit (axial only)
- `lead_pattern`: "adjacent" | "opposite" - For coil inductors only

## Hole Placement Formulas

### Default Hole Diameter
```
suggested_hole_diameter_mm = lead_diameter_mm + 0.3mm (clearance)
```

### Axial Components (Capacitors/Resistors)
For components with `lead_configuration: "axial"`:
```
hole_1_x = -body_length_mm/2 + end_inset_mm
hole_2_x = body_length_mm/2 - end_inset_mm
hole_y = 0 (centerline)
```

### Radial Components  
For components with `lead_configuration: "radial"`:
```
hole_1_x = -lead_spacing_mm/2
hole_2_x = lead_spacing_mm/2
hole_y = 0 (centerline)
```

### Coil/Ring Inductors
For components with `body_shape: "coil"`:

#### Adjacent Lead Pattern
```
lead_angle_1 = -15°
lead_angle_2 = +15°
hole_1_x = (inner_diameter_mm/2) * cos(lead_angle_1)
hole_1_y = (inner_diameter_mm/2) * sin(lead_angle_1)
hole_2_x = (inner_diameter_mm/2) * cos(lead_angle_2)
hole_2_y = (inner_diameter_mm/2) * sin(lead_angle_2)
```

#### Opposite Lead Pattern
```
lead_angle_1 = 0°
lead_angle_2 = 180°
hole_1_x = (inner_diameter_mm/2) * cos(lead_angle_1)
hole_1_y = (inner_diameter_mm/2) * sin(lead_angle_1)
hole_2_x = (inner_diameter_mm/2) * cos(lead_angle_2)
hole_2_y = (inner_diameter_mm/2) * sin(lead_angle_2)
```

## Safety Rules & Defaults

### Minimum Clearances
- Component body clearance: 0.5mm added to all body dimensions
- Lead hole clearance: 0.3mm added to lead diameter
- Edge clearance: Holes must be ≥2mm from board edge
- Component spacing: ≥3mm between adjacent components
- Inductor spacing: ≥50mm (or 2× coil diameter, whichever is larger)

### Recess Depths
```
recess_depth = min(
    component_height * 0.7,  // 70% of component height
    board_thickness - 0.5,   // Leave 0.5mm base
    3.0                      // Maximum 3mm deep
)
```

### Default Values
When dimensions are missing, apply these defaults:
- `lead_diameter_mm`: 0.8mm (standard)
- `end_inset_mm`: 2.5mm (axial components)
- `lead_spacing_mm`: 5.08mm (0.2" standard pitch)
- `suggested_hole_diameter_mm`: lead_diameter_mm + 0.3mm

## Series-Specific Defaults

### Jantzen Audio
- Superior Z-Cap: `end_inset_mm: 3.0`
- Cross Coil: `lead_pattern: "adjacent"`
- Wax Coil: `lead_pattern: "adjacent"`

### AUDYN
- True Copper Cap: `end_inset_mm: 2.5`
- CAP PLUS: `end_inset_mm: 2.5`

### Mundorf
- MResist: `end_inset_mm: 2.0`
- MOX: `end_inset_mm: 2.0`

### Intertechnik
- Resistors: `end_inset_mm: 2.0`
- Coils: `lead_pattern: "opposite"`

## Data Validation Requirements

### Required Fields
All components MUST have:
- `brand`, `series`, `part_type`, `value`, `value_unit`
- `body_shape`
- At least one dimension set (diameter+length OR width+height+depth)
- `lead_diameter_mm` OR use default 0.8mm

### Validation Rules
1. Hole diameter must be > lead diameter
2. End inset must be < body_length/2 (for axial)
3. Lead spacing must be > 0 (for radial)
4. All dimensions must be positive numbers
5. Coil inductors must have inner_diameter < outer_diameter

## Migration from Original Data

The original `crossover_parts_verified_seed.json` (62 components) should be enriched with:
1. Missing dimensions filled from manufacturer specs
2. `suggested_hole_diameter_mm` calculated
3. `end_inset_mm` added for axial components
4. `lead_pattern` specified for coils
5. Series-specific defaults applied

## 3D Model Generation

The enriched data enables deterministic 3D model generation:
1. Component body as primary shape
2. Recess calculated from body dimensions
3. Lead holes positioned by formulas
4. No ambiguity in placement
5. Rotation-aware transformations

## File Structure

```
/data
  crossover_parts_verified_enriched.json  # Main enriched dataset
  defaults_by_series.json                 # Series-specific defaults
  validation_schema.json                  # JSON Schema for validation
```

## Version Control

- Schema Version: 2.0.0
- Last Updated: 2024
- Breaking Changes from v1: Added deterministic hole placement fields