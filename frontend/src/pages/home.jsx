import {
  ArrowRight,
  BrainCircuit,
  Cpu,
  HeartPulse,
  ShieldCheck
} from 'lucide-react';

import { Link } from 'react-router-dom';

import { features } from '../data/features';

function Home() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-background-glow hero-glow-one" />
        <div className="hero-background-glow hero-glow-two" />

        <div className="container hero-grid">
          <div className="hero-content">
            <span className="hero-badge">
              <HeartPulse size={17} />
              Future of Intelligent Health Support
            </span>

            <h1>
              AI Powered Emergency Health Assistance
              Connected With Smart Hardware
            </h1>

            <p>
              Monitor health patterns, activate
              emergency alerts, connect smart sensors,
              and build a personalized digital health
              profile through one intelligent platform.
            </p>

            <div className="hero-actions">
             
              <Link
                to="/app/features/emergency-alerts"
                className="primary-button"
              >
                Explore Emergency Alerts
                <ArrowRight size={18} />
              </Link>



              <Link
                to="/about"
                className="secondary-button"
              >
                Learn About AEGIS
              </Link>
            </div>

            <div className="hero-trust-row">
              <span>
                <ShieldCheck size={18} />
                Secure Architecture
              </span>

              <span>
                <Cpu size={18} />
                Arduino Connected
              </span>

              <span>
                <BrainCircuit size={18} />
                AI Ready
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="health-orbit">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />

              <div className="health-core">
                <HeartPulse size={58} />
              </div>

              <div className="orbit-card orbit-card-one">
                Voice Analysis
              </div>

              <div className="orbit-card orbit-card-two">
                Emergency Alerts
              </div>

              <div className="orbit-card orbit-card-three">
                Digital Twin
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="website-section">
        <div className="container split-section">
          <div>
            <span className="section-tag">
              About AEGIS
            </span>

            <h2>
              A Connected Health Assistant Designed for
              Faster Awareness
            </h2>
          </div>

          <div>
            <p>
              AEGIS combines artificial intelligence,
              connected sensors, voice monitoring,
              emergency hardware, and health history in
              one platform.
            </p>

            <p>
              The project is designed to support early
              awareness and faster communication during
              possible emergency situations.
            </p>

            <Link
              to="/about"
              className="text-link"
            >
              Discover Our Mission
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="website-section light-section">
        <div className="container">
          <div className="section-heading centered-heading">
            <span className="section-tag">
              Core Features
            </span>

            <h2>
              Intelligent Health Technology in One
              Platform
            </h2>

            <p>
              Explore the connected modules designed for
              health monitoring, alerts, environment,
              and educational assistance.
            </p>
          </div>

          
          <div className="feature-card-grid">
            {features.map(feature => {
              const Icon = feature.icon;

              return (
                <article
                  className="feature-card"
                  key={feature.slug}
                >
                  <span className="feature-card-icon">
                    <Icon size={26} />
                  </span>

                  <h3>
                    {feature.title}
                  </h3>

                  <p>
                    {feature.shortDescription ||
                      feature.description}
                  </p>

                  <Link
                    to={`/app/features/${feature.slug}`}
                  >
                    Explore Feature
                    <ArrowRight size={16} />
                  </Link>
                </article>
              );
            })}
          </div>


        </div>
      </section>

      <section className="website-section">
        <div className="container">
          <div className="section-heading centered-heading">
            <span className="section-tag">
              How It Works
            </span>

            <h2>
              From Health Input to Connected Response
            </h2>
          </div>

          <div className="process-grid">
            <article>
              <span>01</span>
              <h3>Collect Health Information</h3>
              <p>
                Receive information from voice,
                connected sensors, user history, and
                environmental monitoring.
              </p>
            </article>

            <article>
              <span>02</span>
              <h3>Analyze Health Patterns</h3>
              <p>
                Evaluate patterns, compare historical
                information, and calculate a health
                awareness level.
              </p>
            </article>

            <article>
              <span>03</span>
              <h3>Activate the Response</h3>
              <p>
                Display guidance, store the event, and
                activate the connected Arduino alert
                system when required.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-container">
          <div>
            <span className="section-tag">
              Connected Emergency Technology
            </span>

            <h2>
              Experience the Live Arduino Alert System
            </h2>

            <p>
              Test the connected green, yellow, and red
              emergency warning levels through the
              website.
            </p>
          </div>

          <Link
            to="/app/features/emergency-alerts"
            className="primary-button"
          >
            Open Alert Controls
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}

export default Home;