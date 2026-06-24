import {
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  PlayCircle
} from 'lucide-react';

import {
  Link,
  useNavigate,
  useParams
} from 'react-router-dom';

import {
  useAuth
} from '../context/AuthContext.jsx';

import {
  getFeatureBySlug
} from '../data/features.js';

function FeatureDetails() {
  const { slug } = useParams();

  const navigate =
    useNavigate();

  const { user } = useAuth();

  const feature =
    getFeatureBySlug(slug);

  if (!feature) {
    return (
      <section className="page-hero">
        <div className="container">
          <h1>
            Feature Not Found
          </h1>

          <Link
            to="/"
            className="primary-button"
          >
            Return Home
          </Link>
        </div>
      </section>
    );
  }

  const Icon = feature.icon;

  function openFeature() {
    const protectedPath =
      `/app/features/${feature.slug}`;

    if (!user) {
      navigate('/login', {
        state: {
          from: protectedPath
        }
      });

      return;
    }

    navigate(protectedPath);
  }

  return (
    <>
      <section className="feature-page-hero">
        <div className="container">
          <Link
            to="/"
            className="back-link"
          >
            <ArrowLeft size={17} />
            Back to Home
          </Link>

          <div className="feature-page-icon">
            <Icon size={39} />
          </div>

          <span className="section-tag">
            AEGIS Feature
          </span>

          <h1>{feature.title}</h1>

          <p>
            {feature.shortDescription}
          </p>

          <button
            type="button"
            className="primary-button feature-access-button"
            onClick={openFeature}
          >
            {user ? (
              <PlayCircle size={18} />
            ) : (
              <LockKeyhole size={18} />
            )}

            {user
              ? 'Open Feature'
              : 'Login to Use Feature'}
          </button>
        </div>
      </section>

      <section className="website-section">
        <div className="container feature-information-grid">
          <div>
            <span className="section-tag">
              Feature Overview
            </span>

            <h2>
              How {feature.title}
              Supports the Platform
            </h2>

            <p>
              {feature.description}
            </p>
          </div>

          <div className="feature-highlight-card">
            <h3>
              Key Capabilities
            </h3>

            <ul>
              {feature.highlights.map(
                highlight => (
                  <li key={highlight}>
                    <CheckCircle2
                      size={19}
                    />

                    <span>
                      {highlight}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

export default FeatureDetails;