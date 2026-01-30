/**
 * State-specific financial data for calculators and projections
 * 
 * Sources:
 * - Property tax rates: Tax Foundation, state assessor offices (2024 effective rates)
 * - Income tax rates: Tax Foundation (2024 top marginal rates)
 * - Mortgage rate: Freddie Mac PMMS national average
 * 
 * Last updated: 2026-01-30
 */

export interface StateData {
  name: string;
  abbreviation: string;
  propertyTaxRate: number;      // Effective rate as percentage (e.g., 1.2 = 1.2%)
  incomeTaxRate: number;        // Top marginal rate as percentage (0 = no state income tax)
  hasNoIncomeTax: boolean;
  // Additional data for future use
  salesTaxRate?: number;        // Combined state + avg local
  estateTaxExemption?: number;  // State estate tax exemption if applicable
  notes?: string;
}

// Current national average mortgage rate (30-year fixed)
// Update monthly or fetch from API in the future
export const NATIONAL_MORTGAGE_RATE = 6.75;

// State data indexed by 2-letter code
export const STATE_DATA: Record<string, StateData> = {
  'AL': { name: 'Alabama', abbreviation: 'AL', propertyTaxRate: 0.40, incomeTaxRate: 5.0, hasNoIncomeTax: false },
  'AK': { name: 'Alaska', abbreviation: 'AK', propertyTaxRate: 1.04, incomeTaxRate: 0, hasNoIncomeTax: true, notes: 'No state income tax' },
  'AZ': { name: 'Arizona', abbreviation: 'AZ', propertyTaxRate: 0.62, incomeTaxRate: 2.5, hasNoIncomeTax: false },
  'AR': { name: 'Arkansas', abbreviation: 'AR', propertyTaxRate: 0.62, incomeTaxRate: 4.4, hasNoIncomeTax: false },
  'CA': { name: 'California', abbreviation: 'CA', propertyTaxRate: 0.73, incomeTaxRate: 13.3, hasNoIncomeTax: false, notes: 'Highest state income tax' },
  'CO': { name: 'Colorado', abbreviation: 'CO', propertyTaxRate: 0.51, incomeTaxRate: 4.4, hasNoIncomeTax: false },
  'CT': { name: 'Connecticut', abbreviation: 'CT', propertyTaxRate: 2.14, incomeTaxRate: 6.99, hasNoIncomeTax: false },
  'DE': { name: 'Delaware', abbreviation: 'DE', propertyTaxRate: 0.57, incomeTaxRate: 6.6, hasNoIncomeTax: false },
  'FL': { name: 'Florida', abbreviation: 'FL', propertyTaxRate: 0.86, incomeTaxRate: 0, hasNoIncomeTax: true, notes: 'No state income tax' },
  'GA': { name: 'Georgia', abbreviation: 'GA', propertyTaxRate: 0.87, incomeTaxRate: 5.49, hasNoIncomeTax: false },
  'HI': { name: 'Hawaii', abbreviation: 'HI', propertyTaxRate: 0.29, incomeTaxRate: 11.0, hasNoIncomeTax: false, notes: 'Lowest property tax rate' },
  'ID': { name: 'Idaho', abbreviation: 'ID', propertyTaxRate: 0.63, incomeTaxRate: 5.8, hasNoIncomeTax: false },
  'IL': { name: 'Illinois', abbreviation: 'IL', propertyTaxRate: 2.23, incomeTaxRate: 4.95, hasNoIncomeTax: false, notes: 'Second highest property tax' },
  'IN': { name: 'Indiana', abbreviation: 'IN', propertyTaxRate: 0.83, incomeTaxRate: 3.05, hasNoIncomeTax: false },
  'IA': { name: 'Iowa', abbreviation: 'IA', propertyTaxRate: 1.52, incomeTaxRate: 5.7, hasNoIncomeTax: false },
  'KS': { name: 'Kansas', abbreviation: 'KS', propertyTaxRate: 1.37, incomeTaxRate: 5.7, hasNoIncomeTax: false },
  'KY': { name: 'Kentucky', abbreviation: 'KY', propertyTaxRate: 0.83, incomeTaxRate: 4.0, hasNoIncomeTax: false },
  'LA': { name: 'Louisiana', abbreviation: 'LA', propertyTaxRate: 0.56, incomeTaxRate: 4.25, hasNoIncomeTax: false },
  'ME': { name: 'Maine', abbreviation: 'ME', propertyTaxRate: 1.24, incomeTaxRate: 7.15, hasNoIncomeTax: false },
  'MD': { name: 'Maryland', abbreviation: 'MD', propertyTaxRate: 1.05, incomeTaxRate: 5.75, hasNoIncomeTax: false },
  'MA': { name: 'Massachusetts', abbreviation: 'MA', propertyTaxRate: 1.17, incomeTaxRate: 5.0, hasNoIncomeTax: false },
  'MI': { name: 'Michigan', abbreviation: 'MI', propertyTaxRate: 1.44, incomeTaxRate: 4.25, hasNoIncomeTax: false },
  'MN': { name: 'Minnesota', abbreviation: 'MN', propertyTaxRate: 1.08, incomeTaxRate: 9.85, hasNoIncomeTax: false },
  'MS': { name: 'Mississippi', abbreviation: 'MS', propertyTaxRate: 0.79, incomeTaxRate: 5.0, hasNoIncomeTax: false },
  'MO': { name: 'Missouri', abbreviation: 'MO', propertyTaxRate: 0.97, incomeTaxRate: 4.95, hasNoIncomeTax: false },
  'MT': { name: 'Montana', abbreviation: 'MT', propertyTaxRate: 0.74, incomeTaxRate: 5.9, hasNoIncomeTax: false },
  'NE': { name: 'Nebraska', abbreviation: 'NE', propertyTaxRate: 1.61, incomeTaxRate: 5.84, hasNoIncomeTax: false },
  'NV': { name: 'Nevada', abbreviation: 'NV', propertyTaxRate: 0.55, incomeTaxRate: 0, hasNoIncomeTax: true, notes: 'No state income tax' },
  'NH': { name: 'New Hampshire', abbreviation: 'NH', propertyTaxRate: 2.09, incomeTaxRate: 0, hasNoIncomeTax: true, notes: 'No wage income tax (interest/dividends taxed)' },
  'NJ': { name: 'New Jersey', abbreviation: 'NJ', propertyTaxRate: 2.47, incomeTaxRate: 10.75, hasNoIncomeTax: false, notes: 'Highest property tax rate' },
  'NM': { name: 'New Mexico', abbreviation: 'NM', propertyTaxRate: 0.67, incomeTaxRate: 5.9, hasNoIncomeTax: false },
  'NY': { name: 'New York', abbreviation: 'NY', propertyTaxRate: 1.69, incomeTaxRate: 10.9, hasNoIncomeTax: false, notes: 'NYC has additional local tax' },
  'NC': { name: 'North Carolina', abbreviation: 'NC', propertyTaxRate: 0.78, incomeTaxRate: 4.75, hasNoIncomeTax: false },
  'ND': { name: 'North Dakota', abbreviation: 'ND', propertyTaxRate: 0.98, incomeTaxRate: 2.5, hasNoIncomeTax: false },
  'OH': { name: 'Ohio', abbreviation: 'OH', propertyTaxRate: 1.53, incomeTaxRate: 3.99, hasNoIncomeTax: false },
  'OK': { name: 'Oklahoma', abbreviation: 'OK', propertyTaxRate: 0.87, incomeTaxRate: 4.75, hasNoIncomeTax: false },
  'OR': { name: 'Oregon', abbreviation: 'OR', propertyTaxRate: 0.93, incomeTaxRate: 9.9, hasNoIncomeTax: false },
  'PA': { name: 'Pennsylvania', abbreviation: 'PA', propertyTaxRate: 1.53, incomeTaxRate: 3.07, hasNoIncomeTax: false },
  'RI': { name: 'Rhode Island', abbreviation: 'RI', propertyTaxRate: 1.40, incomeTaxRate: 5.99, hasNoIncomeTax: false },
  'SC': { name: 'South Carolina', abbreviation: 'SC', propertyTaxRate: 0.56, incomeTaxRate: 6.4, hasNoIncomeTax: false },
  'SD': { name: 'South Dakota', abbreviation: 'SD', propertyTaxRate: 1.17, incomeTaxRate: 0, hasNoIncomeTax: true, notes: 'No state income tax' },
  'TN': { name: 'Tennessee', abbreviation: 'TN', propertyTaxRate: 0.64, incomeTaxRate: 0, hasNoIncomeTax: true, notes: 'No state income tax' },
  'TX': { name: 'Texas', abbreviation: 'TX', propertyTaxRate: 1.68, incomeTaxRate: 0, hasNoIncomeTax: true, notes: 'No state income tax, high property tax' },
  'UT': { name: 'Utah', abbreviation: 'UT', propertyTaxRate: 0.55, incomeTaxRate: 4.65, hasNoIncomeTax: false },
  'VT': { name: 'Vermont', abbreviation: 'VT', propertyTaxRate: 1.86, incomeTaxRate: 8.75, hasNoIncomeTax: false },
  'VA': { name: 'Virginia', abbreviation: 'VA', propertyTaxRate: 0.80, incomeTaxRate: 5.75, hasNoIncomeTax: false },
  'WA': { name: 'Washington', abbreviation: 'WA', propertyTaxRate: 0.92, incomeTaxRate: 0, hasNoIncomeTax: true, notes: 'No state income tax, capital gains tax exists' },
  'WV': { name: 'West Virginia', abbreviation: 'WV', propertyTaxRate: 0.57, incomeTaxRate: 5.12, hasNoIncomeTax: false },
  'WI': { name: 'Wisconsin', abbreviation: 'WI', propertyTaxRate: 1.61, incomeTaxRate: 7.65, hasNoIncomeTax: false },
  'WY': { name: 'Wyoming', abbreviation: 'WY', propertyTaxRate: 0.56, incomeTaxRate: 0, hasNoIncomeTax: true, notes: 'No state income tax' },
  'DC': { name: 'District of Columbia', abbreviation: 'DC', propertyTaxRate: 0.55, incomeTaxRate: 10.75, hasNoIncomeTax: false },
};

// Helper functions
export function getStateData(stateCode: string): StateData | undefined {
  return STATE_DATA[stateCode.toUpperCase()];
}

export function getPropertyTaxRate(stateCode: string): number {
  const state = getStateData(stateCode);
  return state?.propertyTaxRate ?? 1.1; // Default to ~national average
}

export function getIncomeTaxRate(stateCode: string): number {
  const state = getStateData(stateCode);
  return state?.incomeTaxRate ?? 5.0; // Default to approximate average
}

export function hasNoIncomeTax(stateCode: string): boolean {
  const state = getStateData(stateCode);
  return state?.hasNoIncomeTax ?? false;
}

// Get all states sorted by name for dropdowns
export function getAllStates(): StateData[] {
  return Object.values(STATE_DATA).sort((a, b) => a.name.localeCompare(b.name));
}

// Get states with no income tax
export function getNoIncomeTaxStates(): StateData[] {
  return Object.values(STATE_DATA).filter(s => s.hasNoIncomeTax);
}

// Get states sorted by property tax (for comparison)
export function getStatesByPropertyTax(): StateData[] {
  return Object.values(STATE_DATA).sort((a, b) => a.propertyTaxRate - b.propertyTaxRate);
}
