
import {
  Link,
  useParams
} from 'react-router-dom';

import AIDigitalTwin from '../components/AIDigitalTwin.jsx';
import AIHealthAssistant from '../components/AIHealthAssistant.jsx';
import AIPostureAnalyzer from '../components/AIPostureAnalyzer.jsx';
import ARAssistant from '../components/ARAssistant.jsx';
import BlockchainRecords from '../components/BlockchainRecords.jsx';
import EmergencyAlerts from '../components/EmergencyAlerts.jsx';
import EnvironmentalHealthMonitor from '../components/EnvironmentalHealthMonitor.jsx';
import VoiceAnalysis from '../components/VoiceAnalysis.jsx';

import {
  getFeatureBySlug,
  normalizeFeatureSlug
} from '../data/features.js';

function ProtectedFeature() {
  const {
    slug = ''
  } = useParams();

  const currentSlug =
    normalizeFeatureSlug(
      slug
    );

  const feature =
    getFeatureBySlug(
      currentSlug
    );

  if (!feature) {
    return (
      <section className="protected-feature-hero">
        <div className="container">
          <div className="feature-demo-panel">
            <h1>
              Feature Not Found
            </h1>

            <p>
              The requested feature does not exist.
            </p>

            <Link
              to="/dashboard"
              className="network-primary-button"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (
    currentSlug ===
    'voice-analysis'
  ) {
    return <VoiceAnalysis />;
  }

  if (
    currentSlug ===
    'emergency-alerts'
  ) {
    return <EmergencyAlerts />;
  }

  if (
    currentSlug ===
    'ai-digital-twin'
  ) {
    return <AIDigitalTwin />;
  }

  if (
    currentSlug ===
    'blockchain-records'
  ) {
    return <BlockchainRecords />;
  }

  if (
    currentSlug ===
    'smart-home-sensors'
  ) {
    return (
      <EnvironmentalHealthMonitor />
    );
  }

  if (
    currentSlug ===
    'ar-assistant'
  ) {
    return <ARAssistant />;
  }

  if (
    currentSlug ===
    'ai-posture-pain-analyzer'
  ) {
    return (
      <AIPostureAnalyzer />
    );
  }

  if (
    currentSlug ===
    'ai-health-assistant'
  ) {
    return (
      <AIHealthAssistant />
    );
  }

  const Icon =
    feature.icon;

  return (
    <>
      <section className="protected-feature-hero">
        <div className="container">
          <div className="protected-feature-title">
            {Icon && (
              <span className="feature-page-icon">
                <Icon size={36} />
              </span>
            )}

            <div>
              <span className="section-tag">
                Protected Feature
              </span>

              <h1>
                {feature.title}
              </h1>

              <p>
                This protected feature is currently under development.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default ProtectedFeature;





