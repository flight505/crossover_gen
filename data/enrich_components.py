#!/usr/bin/env python3
"""
Enrich component data with deterministic hole placement fields
"""

import json
from typing import Dict, Any, Optional

def get_series_defaults() -> Dict[str, Dict[str, Any]]:
    """Return series-specific defaults"""
    return {
        "Jantzen Audio": {
            "Superior Z-Cap": {"end_inset_mm": 3.0},
            "Alumen Z-Cap": {"end_inset_mm": 2.5},
            "Cross Coil": {"lead_pattern": "adjacent"},
            "Wax Coil": {"lead_pattern": "adjacent"},
        },
        "AUDYN": {
            "True Copper Cap": {"end_inset_mm": 2.5},
            "CAP PLUS": {"end_inset_mm": 2.5},
        },
        "Mundorf": {
            "MResist": {"end_inset_mm": 2.0},
            "MOX": {"end_inset_mm": 2.0},
        },
        "Intertechnik": {
            "_default_resistor": {"end_inset_mm": 2.0},
            "_default_coil": {"lead_pattern": "opposite"},
        }
    }

def enrich_component(comp: Dict[str, Any], series_defaults: Dict) -> Dict[str, Any]:
    """Enrich a single component with deterministic fields"""
    enriched = comp.copy()
    
    # Determine lead configuration based on lead_exit
    if comp.get("lead_exit") == "axial":
        enriched["lead_configuration"] = "axial"
    elif comp.get("lead_exit") == "radial" or comp.get("lead_exit") == "tangential":
        enriched["lead_configuration"] = "radial"
    else:
        # Default based on component type
        if comp["part_type"] in ["capacitor", "resistor"]:
            enriched["lead_configuration"] = "axial"
        else:
            enriched["lead_configuration"] = "radial"
    
    # Add suggested hole diameter
    lead_dia = comp.get("lead_diameter_mm", 0.8)  # Default 0.8mm
    if lead_dia is None:
        lead_dia = 0.8
    enriched["lead_diameter_mm"] = lead_dia
    enriched["suggested_hole_diameter_mm"] = round(lead_dia + 0.3, 2)
    
    # Add end_inset_mm for axial components
    if enriched["lead_configuration"] == "axial":
        # Check series defaults
        brand = comp.get("brand", "")
        series = comp.get("series", "")
        
        if brand in series_defaults and series in series_defaults[brand]:
            if "end_inset_mm" in series_defaults[brand][series]:
                enriched["end_inset_mm"] = series_defaults[brand][series]["end_inset_mm"]
        
        # Default if not set
        if "end_inset_mm" not in enriched:
            enriched["end_inset_mm"] = 2.5  # Default
    
    # Add lead_spacing_mm for radial components
    if enriched["lead_configuration"] == "radial":
        if "lead_spacing_mm" not in enriched:
            enriched["lead_spacing_mm"] = 5.08  # Standard 0.2" pitch
    
    # Add lead_pattern for coils
    if comp.get("body_shape") == "coil" or comp["part_type"] == "inductor":
        if comp.get("outer_diameter_mm") is not None:  # It's a ring/coil inductor
            enriched["body_shape"] = "coil"
            
            # Check series defaults
            brand = comp.get("brand", "")
            series = comp.get("series", "")
            
            if brand in series_defaults:
                if series in series_defaults[brand] and "lead_pattern" in series_defaults[brand][series]:
                    enriched["lead_pattern"] = series_defaults[brand][series]["lead_pattern"]
                elif "_default_coil" in series_defaults[brand]:
                    enriched["lead_pattern"] = series_defaults[brand]["_default_coil"]["lead_pattern"]
            
            # Default if not set
            if "lead_pattern" not in enriched:
                enriched["lead_pattern"] = "adjacent"  # Default
    
    # Clean up voltage/power field
    if "voltage_or_power" in enriched:
        val = enriched["voltage_or_power"]
        if isinstance(val, str):
            # Extract numeric value
            import re
            match = re.search(r'(\d+(?:\.\d+)?)', val)
            if match:
                enriched["voltage_or_power"] = float(match.group(1))
    
    # Ensure all dimension fields exist (even if null)
    dimension_fields = [
        "body_diameter_mm", "body_length_mm", "body_width_mm", "body_height_mm",
        "outer_diameter_mm", "inner_diameter_mm", "height_mm"
    ]
    for field in dimension_fields:
        if field not in enriched:
            enriched[field] = None
    
    # Add tolerance if missing
    if "tolerance" not in enriched:
        enriched["tolerance"] = None
    
    return enriched

def main():
    # Load original data
    with open("../crossover_parts_verified_seed.json", "r") as f:
        original_data = json.load(f)
    
    # Get series defaults
    series_defaults = get_series_defaults()
    
    # Enrich all components
    enriched_data = []
    for comp in original_data:
        enriched = enrich_component(comp, series_defaults)
        enriched_data.append(enriched)
    
    # Save enriched data
    with open("crossover_parts_verified_enriched.json", "w") as f:
        json.dump(enriched_data, f, indent=2)
    
    # Save series defaults
    with open("defaults_by_series.json", "w") as f:
        json.dump(series_defaults, f, indent=2)
    
    print(f"Enriched {len(enriched_data)} components")
    print(f"Saved to crossover_parts_verified_enriched.json")
    print(f"Saved defaults to defaults_by_series.json")

if __name__ == "__main__":
    main()