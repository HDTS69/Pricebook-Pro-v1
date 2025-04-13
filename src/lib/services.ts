export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  unit: 'fixed' | 'hourly' | 'per-meter';
  estimatedDuration?: string;
  materials?: string[];
  isFavorite?: boolean;
}

export const services: Service[] = [
  // Favourites will be user-specific and populated dynamically
  
  // Service
  {
    id: 'general-service',
    categoryId: 'service',
    name: 'General Service Call',
    description: 'Initial service call and inspection',
    price: 99,
    unit: 'fixed',
    estimatedDuration: '30-60 mins',
  },
  
  // Hot Water
  {
    id: 'hw-system-replacement',
    categoryId: 'hot-water',
    name: 'Hot Water System Replacement',
    description: 'Complete replacement of hot water system',
    price: 2200,
    unit: 'fixed',
    estimatedDuration: '4-6 hours',
    materials: ['Hot water unit', 'Valves', 'Piping'],
  },
  {
    id: 'hw-service',
    categoryId: 'hot-water',
    name: 'Hot Water Service',
    description: 'Service and maintenance of hot water system',
    price: 180,
    unit: 'fixed',
    estimatedDuration: '1-2 hours',
  },
  
  // Plumbing
  {
    id: 'tap-replacement',
    categoryId: 'plumbing',
    name: 'Tap Replacement',
    description: 'Replace faulty or old tap',
    price: 150,
    unit: 'fixed',
    estimatedDuration: '30-60 mins',
    materials: ['New tap', 'Fittings'],
  },
  {
    id: 'toilet-repair',
    categoryId: 'plumbing',
    name: 'Toilet Repair',
    description: 'Fix leaking or malfunctioning toilet',
    price: 160,
    unit: 'fixed',
    estimatedDuration: '1-2 hours',
  },
  
  // Drains
  {
    id: 'drain-cleaning',
    categoryId: 'drains',
    name: 'Drain Cleaning',
    description: 'High-pressure water jetting of blocked drains',
    price: 180,
    unit: 'fixed',
    estimatedDuration: '1-2 hours',
  },
  {
    id: 'cctv-inspection',
    categoryId: 'drains',
    name: 'CCTV Drain Inspection',
    description: 'Camera inspection of drain lines',
    price: 220,
    unit: 'fixed',
    estimatedDuration: '1-2 hours',
  },
  
  // Air Conditioning
  {
    id: 'ac-installation',
    categoryId: 'air-conditioning',
    name: 'Split System Installation',
    description: 'Installation of new split system air conditioner',
    price: 1800,
    unit: 'fixed',
    estimatedDuration: '4-6 hours',
    materials: ['Mounting bracket', 'Pipe cover', 'Drainage'],
  },
  {
    id: 'ac-service',
    categoryId: 'air-conditioning',
    name: 'AC Service',
    description: 'Full service and clean of air conditioning unit',
    price: 220,
    unit: 'fixed',
    estimatedDuration: '1-2 hours',
  },
  
  // Gas
  {
    id: 'gas-appliance-install',
    categoryId: 'gas',
    name: 'Gas Appliance Installation',
    description: 'Installation of gas appliance with certification',
    price: 280,
    unit: 'fixed',
    estimatedDuration: '2-3 hours',
    materials: ['Gas fittings', 'Flexible hose'],
  },
  {
    id: 'gas-leak-detection',
    categoryId: 'gas',
    name: 'Gas Leak Detection',
    description: 'Professional gas leak detection service',
    price: 160,
    unit: 'fixed',
    estimatedDuration: '1-2 hours',
  },
  
  // Roofing & Rainwater
  {
    id: 'gutter-cleaning',
    categoryId: 'roofing',
    name: 'Gutter Cleaning',
    description: 'Clean and flush gutters and downpipes',
    price: 180,
    unit: 'fixed',
    estimatedDuration: '1-2 hours',
  },
  {
    id: 'roof-leak-repair',
    categoryId: 'roofing',
    name: 'Roof Leak Repair',
    description: 'Locate and repair roof leaks',
    price: 350,
    unit: 'fixed',
    estimatedDuration: '2-4 hours',
    materials: ['Sealant', 'Tiles/Sheets if needed'],
  },
  
  // Electrical
  {
    id: 'electrical-inspection',
    categoryId: 'electrical',
    name: 'Electrical Safety Inspection',
    description: 'Complete electrical safety inspection',
    price: 180,
    unit: 'fixed',
    estimatedDuration: '1-2 hours',
  },
  {
    id: 'power-point-install',
    categoryId: 'electrical',
    name: 'Power Point Installation',
    description: 'Install new power point',
    price: 150,
    unit: 'fixed',
    estimatedDuration: '1 hour',
    materials: ['Power point', 'Cables if needed'],
  },
]; 