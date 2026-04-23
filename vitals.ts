import { onCLS, onLCP, onINP, onFCP, onTTFB, type Metric } from 'web-vitals';
import { Sentry } from './sentry.client';

function report(name: string, metric: Metric) {
  // Only log in development to avoid noise
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[Vitals] ${name}`, {
      name: metric.name,
      value: Math.round(metric.value),
      id: metric.id,
    });
  }
  try {
    if ((Sentry as any)?.captureMessage) {
      Sentry.captureMessage(`web-vitals:${name}`, {
        level: 'info',
        extra: { value: metric.value, id: metric.id },
      } as any);
    }
  } catch {}
}

onCLS((m) => report('CLS', m));
onFCP((m) => report('FCP', m));
onLCP((m) => report('LCP', m));
onINP((m) => report('INP', m));
onTTFB((m) => report('TTFB', m));
