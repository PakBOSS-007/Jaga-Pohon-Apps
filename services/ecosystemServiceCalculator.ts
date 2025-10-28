
import type { EcosystemServices, ProximityToBuilding } from '../types';
import { calculateCarbonMetrics } from './carbonCalculator';

// --- MODEL PARAMETERS AND ASSUMPTIONS ---
// These values are simplified and generalized for this application.
// In a real-world scenario, these would be region-and-species-specific.

const USD_TO_IDR_RATE = 16000; // Approximate exchange rate

// Monetary Valuation (per year) in IDR
const SOCIAL_COST_OF_CARBON_PER_KG_CO2_IDR = 0.05 * USD_TO_IDR_RATE; // Based on ~ $50/ton CO2
const STORMWATER_MANAGEMENT_COST_PER_LITER_IDR = 0.002 * USD_TO_IDR_RATE; // Value of managing stormwater runoff
const AIR_POLLUTION_HEALTH_SAVINGS_PER_GRAM_IDR = 0.08 * USD_TO_IDR_RATE; // Value of removing criteria air pollutants (PM2.5, O3, etc.)

// Biophysical Models
// Leaf Area Estimation based on DBH. Formula: Leaf Area (m^2) = exp(a + b * ln(DBH_cm))
const LEAF_AREA_PARAM_A = -2.2;
const LEAF_AREA_PARAM_B = 1.8;

// Annual rainfall interception per square meter of leaf area
const RAINFALL_INTERCEPTION_LITERS_PER_M2_LEAF_AREA = 180; // Assumes ~900mm annual rain, 20% interception

// Annual air pollution removal per square meter of leaf area
const POLLUTION_REMOVAL_GRAMS_PER_M2_LEAF_AREA = 1.5; // g of (O3, NO2, SO2, PM2.5) removed

/**
 * Calculates various ecosystem services provided by a single tree.
 * @param dbh - Diameter at Breast Height in centimeters.
 * @param proximityToBuilding - The tree's proximity to a building, for energy savings.
 * @returns An EcosystemServices object with calculated benefits.
 */
export const calculateEcosystemServices = (dbh: number, proximityToBuilding: ProximityToBuilding): EcosystemServices => {
  if (dbh <= 0) {
    return {
      stormwaterInterceptedLiters: 0,
      airPollutionRemovedGrams: 0,
      energySavingsIDR: 0,
      annualMonetaryValue: { total: 0, carbon: 0, stormwater: 0, airQuality: 0, energy: 0 },
    };
  }
  
  // 1. Calculate Leaf Area
  const leafArea = Math.exp(LEAF_AREA_PARAM_A + LEAF_AREA_PARAM_B * Math.log(dbh));

  // 2. Calculate Biophysical Benefits
  const stormwaterInterceptedLiters = leafArea * RAINFALL_INTERCEPTION_LITERS_PER_M2_LEAF_AREA;
  const airPollutionRemovedGrams = leafArea * POLLUTION_REMOVAL_GRAMS_PER_M2_LEAF_AREA;
  
  // 3. Estimate Energy Savings (simplified)
  // This is a very rough estimation. Real models are complex.
  let energySavingsIDR = 0;
  if (proximityToBuilding === 'Near') {
    // Assume larger trees near buildings provide more cooling savings
    // Base value ($10) + DBH dependent value, all converted to IDR
    const energySavingsUSD = 10 + (dbh * 0.25);
    energySavingsIDR = energySavingsUSD * USD_TO_IDR_RATE;
  }

  // 4. Calculate Monetary Value of each service in IDR
  // Note: For carbon, we need CO2 sequestrated. The main carbon calculation is separate,
  // but we can re-calculate a dummy value here for the monetary part or pass it in.
  // For simplicity, let's assume a generic tree for this part.
  const tempCarbonMetrics = calculateCarbonMetrics(dbh, dbh * 0.5); // height is roughly estimated for value
  const valueFromCarbon = tempCarbonMetrics.co2Sequestrated * SOCIAL_COST_OF_CARBON_PER_KG_CO2_IDR;

  const valueFromStormwater = stormwaterInterceptedLiters * STORMWATER_MANAGEMENT_COST_PER_LITER_IDR;
  const valueFromAirQuality = airPollutionRemovedGrams * AIR_POLLUTION_HEALTH_SAVINGS_PER_GRAM_IDR;
  const valueFromEnergy = energySavingsIDR;

  const totalValue = valueFromCarbon + valueFromStormwater + valueFromAirQuality + valueFromEnergy;

  return {
    stormwaterInterceptedLiters,
    airPollutionRemovedGrams,
    energySavingsIDR,
    annualMonetaryValue: {
      total: totalValue,
      carbon: valueFromCarbon,
      stormwater: valueFromStormwater,
      airQuality: valueFromAirQuality,
      energy: valueFromEnergy,
    },
  };
};