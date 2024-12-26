import { ulid as uuidv4 } from 'ulidx'; // Import UUID

export interface Service {
  id: string; // ID of the service
  pk: string;
  sk: string;
  name: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  category: 'all_caps' | 'large_&_mid_cap' | 'mid_&_small_cap';
  subcategory: string;
  price: number;
}

export interface Admin {
  pk: string;
  sk: string;
  email: string;
  password: string;
}

// Helper function to generate a unique ID
export const generateServiceId = (): string => uuidv4(); // Generates a unique UUID for each service
