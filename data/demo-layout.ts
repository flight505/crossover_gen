import { PlacedComponent } from '@/types'

export const demoLayout: PlacedComponent[] = [
  // Capacitor 1 - Top left
  {
    id: 'demo-cap-1',
    component: {
      brand: 'Jantzen Audio',
      series: 'Alumen Z-Cap',
      part_type: 'capacitor',
      value: '4.7µF',
      voltage: '100 VDC',
      dimensions: {
        length: 18,
        width: 18,
        height: 44,
        diameter: 18
      },
      lead_config: {
        spacing: 10,
        diameter: 0.8,
        configuration: 'radial'
      },
      body_diameter_mm: 18,
      body_length_mm: 44,
      lead_exit: 'axial'
    } as any,
    x: 20,
    y: 20,
    rotation: 0,
    flipVertical: false
  },
  
  // Capacitor 2 - Top center
  {
    id: 'demo-cap-2',
    component: {
      brand: 'AUDYN',
      series: 'CAP Plus',
      part_type: 'capacitor',
      value: '10µF',
      voltage: '100 VDC',
      dimensions: {
        length: 25,
        width: 25,
        height: 50,
        diameter: 25
      },
      lead_config: {
        spacing: 15,
        diameter: 0.8,
        configuration: 'radial'
      },
      body_diameter_mm: 25,
      body_length_mm: 50,
      lead_exit: 'axial'
    } as any,
    x: 50,
    y: 20,
    rotation: 0,
    flipVertical: false
  },

  // Resistor 1 - Middle left
  {
    id: 'demo-res-1',
    component: {
      brand: 'Mundorf',
      series: 'MResist Supreme',
      part_type: 'resistor',
      value: '4.7Ω',
      voltage: '20W',
      dimensions: {
        length: 35,
        width: 10,
        height: 10
      },
      lead_config: {
        spacing: 35,
        diameter: 0.8,
        configuration: 'axial'
      },
      body_length_mm: 35,
      lead_exit: 'axial'
    } as any,
    x: 15,
    y: 45,
    rotation: 0,
    flipVertical: false
  },

  // Resistor 2 - Middle right
  {
    id: 'demo-res-2',
    component: {
      brand: 'Intertechnik',
      series: 'MOX',
      part_type: 'resistor',
      value: '10Ω',
      voltage: '10W',
      dimensions: {
        length: 25,
        width: 8,
        height: 8
      },
      lead_config: {
        spacing: 25,
        diameter: 0.8,
        configuration: 'axial'
      },
      body_length_mm: 25,
      lead_exit: 'axial'
    } as any,
    x: 60,
    y: 50,
    rotation: 90,
    flipVertical: false
  },

  // Inductor 1 - Bottom left (toroidal)
  {
    id: 'demo-ind-1',
    component: {
      brand: 'Jantzen Audio',
      series: 'Iron Core Toroidal',
      part_type: 'inductor',
      value: '1.0mH',
      dimensions: {
        diameter: 30,
        width: 30,
        length: 30,
        height: 15
      },
      lead_config: {
        spacing: 15,
        diameter: 1.0,
        configuration: 'radial'
      },
      outer_diameter_mm: 30,
      inner_diameter_mm: 15,
      height_mm: 15,
      body_shape: 'ring',
      lead_exit: 'tangential'
    } as any,
    x: 25,
    y: 65,
    rotation: 0,
    flipVertical: false
  },

  // Inductor 2 - Bottom right (cylindrical)
  {
    id: 'demo-ind-2',
    component: {
      brand: 'Intertechnik',
      series: 'Ferrite Core',
      part_type: 'inductor', 
      value: '0.47mH',
      dimensions: {
        diameter: 20,
        width: 20,
        length: 20,
        height: 25
      },
      lead_config: {
        spacing: 12,
        diameter: 0.8,
        configuration: 'radial'
      },
      body_diameter_mm: 20,
      body_length_mm: 25,
      body_shape: 'cylinder',
      lead_exit: 'axial'
    } as any,
    x: 65,
    y: 70,
    rotation: 45,
    flipVertical: false
  }
]

export const demoDesign = {
  version: '1.0',
  board: {
    width: 100,
    height: 100,
    thickness: 1.6
  },
  components: demoLayout,
  createdAt: new Date().toISOString(),
  name: 'Example Crossover Layout'
}