export interface Analog {
  id: string;
  stationId: string;
  analogCode: string;
  cellId: string;
  description: string;
  unit: string;
  dataType: 'voltage' | 'current' | 'temperature' | 'soc';
}
