
import type { CarbonMetrics } from '../types';

// Using the pantropical allometric equation from Chave et al., 2014.
// AGB_est = 0.0673 * (ρ * D^2 * H)^0.976
// AGB is Above-Ground Biomass in kg.
// D is DBH in cm.
// H is height in m.
// ρ is wood specific gravity in g/cm^3.

const WOOD_DENSITY = 0.6; // Average wood density (g/cm^3) for general tropical trees.
const CARBON_CONVERSION_FACTOR = 0.47; // Biomass to Carbon conversion factor.
const CO2_CONVERSION_FACTOR = 3.67; // Carbon to CO2 equivalent conversion factor (M_CO2 / M_C).

/**
 * Calculates biomass, stored carbon, and sequestrated CO2 for a single tree.
 * @param dbh - Diameter at Breast Height in centimeters.
 * @param height - Total tree height in meters.
 * @returns An object with biomass, carbonStored, and co2Sequestrated in kilograms.
 */
export const calculateCarbonMetrics = (dbh: number, height: number): CarbonMetrics => {
  if (dbh <= 0 || height <= 0) {
    return { biomass: 0, carbonStored: 0, co2Sequestrated: 0 };
  }

  // Calculate Above-Ground Biomass (AGB) in kg
  const biomass = 0.0673 * Math.pow(WOOD_DENSITY * Math.pow(dbh, 2) * height, 0.976);
  
  // Calculate stored carbon in kg
  const carbonStored = biomass * CARBON_CONVERSION_FACTOR;

  // Calculate CO2 sequestrated in kg
  const co2Sequestrated = carbonStored * CO2_CONVERSION_FACTOR;

  return {
    biomass,
    carbonStored,
    co2Sequestrated,
  };
};
