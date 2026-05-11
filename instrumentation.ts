import { initOpenTelemetry } from '@/lib/observability/otel';

export async function register() {
  initOpenTelemetry();
}
