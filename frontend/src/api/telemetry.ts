import client from './client';
import { buildDemoTelemetrySchema, requestWithDemoFallback } from '../mock/demoData';

export interface TelemetrySchema {
  schemaId: string;
  topicPattern: string;
  mqttTopics: string[];
  kafkaTopics: string[];
  requiredFields: string[];
  fieldDefinitions: { field: string; type: string; description: string }[];
  samplePayload: Record<string, unknown>;
  qualityRules: string[];
}

export const telemetryApi = {
  getSchema: () =>
    requestWithDemoFallback(
      () => client.get<never, TelemetrySchema>('/telemetry/schema'),
      () => buildDemoTelemetrySchema(),
      (schema) => !schema || !schema.schemaId
    ),
};
