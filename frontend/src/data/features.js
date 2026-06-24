import {
  Activity,
  BellRing,
  Blocks,
  Bot,
  BrainCircuit,
  House,
  Mic2,
  ScanLine
} from 'lucide-react';

export const features = [
  {
    id:
      'voice-analysis',

    title:
      'Voice Analysis',

    slug:
      'voice-analysis',

    path:
      '/app/features/voice-analysis',

    description:
      'Analyze voice and breathing patterns and activate connected Arduino warning levels.',

    icon:
      Mic2,

    available:
      true,

    status:
      'available',

    order:
      1
  },

  {
    id:
      'emergency-alerts',

    title:
      'Emergency Alerts',

    slug:
      'emergency-alerts',

    path:
      '/app/features/emergency-alerts',

    description:
      'Create emergency incidents, capture location, and alert trusted contacts.',

    icon:
      BellRing,

    available:
      true,

    status:
      'available',

    order:
      2
  },

  {
    id:
      'ai-digital-twin',

    title:
      'AI Digital Twin',

    slug:
      'ai-digital-twin',

    path:
      '/app/features/ai-digital-twin',

    description:
      'Create a personal baseline and compare new health signals with normal patterns.',

    icon:
      BrainCircuit,

    available:
      true,

    status:
      'available',

    order:
      3
  },

  {
    id:
      'blockchain-records',

    title:
      'Blockchain Records',

    slug:
      'blockchain-records',

    path:
      '/app/features/blockchain-records',

    description:
      'Create tamper evident cryptographic health audit records.',

    icon:
      Blocks,

    available:
      true,

    status:
      'available',

    order:
      4
  },

  {
    id:
      'smart-home-sensors',

    title:
      'Smart Home Sensors',

    slug:
      'smart-home-sensors',

    path:
      '/app/features/smart-home-sensors',

    description:
      'Monitor environmental signals and connected Arduino warning levels.',

    icon:
      House,

    available:
      true,

    status:
      'available',

    order:
      5
  },

  {
    id:
      'ar-assistant',

    title:
      'AR Assistant',

    slug:
      'ar-assistant',

    path:
      '/app/features/ar-assistant',

    description:
      'Display camera based visual guidance for supported health workflows.',

    icon:
      ScanLine,

    available:
      true,

    status:
      'available',

    order:
      6
  },

  {
    id:
      'ai-posture-pain-analyzer',

    title:
      'AI Posture & Pain Analyzer',

    slug:
      'ai-posture-pain-analyzer',

    path:
      '/app/features/ai-posture-pain-analyzer',

    description:
      'Analyze posture changes using live camera body landmarks.',

    icon:
      Activity,

    available:
      true,

    status:
      'available',

    order:
      7
  },

  {
    id:
      'ai-health-assistant',

    title:
      'AI Health Assistant',

    slug:
      'ai-health-assistant',

    path:
      '/app/features/ai-health-assistant',

    description:
      'Combine all supported feature results into one confidence aware health summary.',

    icon:
      Bot,

    available:
      true,

    status:
      'available',

    order:
      8
  }
];

const featureSlugAliases = {
  'voice-analyzer':
    'voice-analysis',

  'emergency-alert':
    'emergency-alerts',

  'digital-twin':
    'ai-digital-twin',

  'home-sensors':
    'smart-home-sensors',

  'environmental-monitor':
    'smart-home-sensors',

  'posture-analyzer':
    'ai-posture-pain-analyzer',

  'ai-posture-analyzer':
    'ai-posture-pain-analyzer',

  'health-assistant':
    'ai-health-assistant',

  'blockchain':
    'blockchain-records',

  'augmented-reality-assistant':
    'ar-assistant'
};

export function normalizeFeatureSlug(
  value
) {
  const normalizedValue = String(
    value || ''
  )
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return (
    featureSlugAliases[
      normalizedValue
    ] ||
    normalizedValue
  );
}

export function getFeatureBySlug(
  slug
) {
  const normalizedSlug =
    normalizeFeatureSlug(
      slug
    );

  return (
    features.find(
      feature =>
        feature.slug ===
        normalizedSlug
    ) ||
    null
  );
}

export function getAvailableFeatures() {
  return features
    .filter(
      feature =>
        feature.available
    )
    .sort(
      (
        firstFeature,
        secondFeature
      ) =>
        firstFeature.order -
        secondFeature.order
    );
}

export function getAllFeatures() {
  return [
    ...features
  ].sort(
    (
      firstFeature,
      secondFeature
    ) =>
      firstFeature.order -
      secondFeature.order
  );
}

export default features;