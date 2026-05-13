export interface Station {
  id: string;
  name: string;
  location?: string;
  address?: string;
  capacity?: number;
  status: 'online' | 'offline' | 'maintenance';
  unitCount?: number;
}

export interface EnergyUnit {
  id: string;
  name: string;
  capacity?: number;
}

export interface BatteryUnit {
  id: string;
  energyUnitId: string;
  name: string;
  containerNo: number;
}

export interface BatteryCluster {
  id: string;
  batteryUnitId: string;
  name: string;
  clusterNo: number;
}

export interface Cell {
  id: string;
  clusterId: string;
  cellNo: number;
  voltage: number;
  current: number;
  temperature: number;
  soc: number;
  soh: number;
}

export interface PCS {
  id: string;
  energyUnitId: string;
  name: string;
  cumulativeEfficiency: number;
  dailyEfficiency: number;
}

export interface Transformer {
  id: string;
  energyUnitId: string;
  name: string;
  cumulativeEfficiency: number;
  dailyEfficiency: number;
}

export interface AnalogMappingUpdate {
  analogCode: string;
  cellId: string;
  description?: string;
}

export interface DeviceStation {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance' | string;
  location?: string;
  address?: string;
  capacity?: number;
  unitCount?: number;
}

export interface DeviceAnalog {
  id: string;
  name: string;
  status?: string;
  type?: string;
  analogCode?: string;
  cellId?: string;
  description?: string;
  unit?: string;
  dataType?: string;
  properties?: {
    analogCode?: string;
    cellId?: string;
    unit?: string;
    dataType?: string;
    description?: string;
  };
}

export interface TopologyStation extends Pick<Station, 'id' | 'name' | 'status'> {
  energyUnits: EnergyUnit[];
}

export interface TopologyTree {
  stations: TopologyStation[];
}
