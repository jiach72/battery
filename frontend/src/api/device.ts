import client from './client';
import type { Station, TopologyTree, AnalogMappingUpdate, DeviceStation, DeviceAnalog } from '../types/station';
import type { Analog as AnalogType } from '../types/analog';

const mapStation = (station: DeviceStation): Station => ({
  id: station.id,
  name: station.name,
  location: station.location || station.address,
  address: station.address || station.location,
  capacity: station.capacity,
  status: (station.status as Station['status']) || 'online',
  unitCount: station.unitCount,
});

const mapAnalog = (analog: DeviceAnalog): AnalogType => ({
  id: analog.id,
  stationId: '',
  analogCode: analog.analogCode || analog.properties?.analogCode || analog.name || analog.id,
  cellId: analog.cellId || analog.properties?.cellId || '',
  description: analog.description || analog.properties?.description || analog.name || '',
  unit: analog.unit || analog.properties?.unit || '',
  dataType: (analog.dataType || analog.properties?.dataType || 'voltage') as AnalogType['dataType'],
});

export const deviceApi = {
  getStations: () =>
    client.get<never, DeviceStation[]>('/devices/stations').then((stations) => stations.map(mapStation)),
  createStation: (data: Partial<Station>) => client.post<never, DeviceStation>('/devices/stations', {
    name: data.name,
    location: data.location ?? data.address,
    capacity: data.capacity,
    status: data.status,
  }).then(mapStation),
  getTopologyTree: (stationId: string) =>
    client.get<never, TopologyTree>('/devices/tree', { params: { stationId } }),
  createUnit: (data: { stationId: string; name: string; capacity?: number }) =>
    client.post<never, void>('/devices/units', {
      name: data.name,
      capacity: data.capacity,
      stationId: data.stationId,
    }),
  createCluster: (data: { unitId: string; name: string; clusterNo?: number }) =>
    client.post<never, void>('/devices/clusters', {
      name: data.name,
      clusterNo: data.clusterNo,
      unitId: data.unitId,
    }),
  getAnalogs: (stationId: string) =>
    client.get<never, DeviceAnalog[]>('/devices/analogs', { params: { stationId } }).then((analogs) => analogs.map(mapAnalog)),
  updateAnalog: (analogId: string, data: AnalogMappingUpdate) =>
    client.put<never, DeviceAnalog>(`/devices/analogs/${analogId}`, data).then(mapAnalog),
};
