import {
  Globe2,
  Mail,
  MessageCircle,
  Share2,
  ShieldPlus
} from 'lucide-react';

import { Link } from 'react-router-dom';

import { features } from '../data/features';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <section className="footer-brand-column">
          <Link
            to="/"
            className="brand-logo footer-logo"
          >
            <span className="brand-icon">
              <ShieldPlus size={26} />
            </span>

            <span>
              <strong>AEGIS</strong>
              <small>Health Assistant</small>
            </span>
          </Link>

          <p>
            AEGIS is an AI powered emergency health
            assistant connecting health monitoring,
            smart sensors, voice analysis, and emergency
            hardware in one platform.
          </p>
        </section>

        <section className="footer-column">
          <h3>Quick Links</h3>

          <Link to="/">Home</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/contact#faqs">FAQs</Link>
        </section>

        <section className="footer-column footer-features">
          <h3>Features</h3>

          {features.map(feature => (
            <Link
              key={feature.slug}
              to={`/features/${feature.slug}`}
            >
              {feature.title}
            </Link>
          ))}
        </section>

        <section className="footer-column">
          <h3>Social Media</h3>

          <p>
            Follow AEGIS for project updates and future
            development.
          </p>

          <div className="social-links">
            <a
              href="#website"
              aria-label="Website"
            >
              <Globe2 size={19} />
            </a>

            <a
              href="#messages"
              aria-label="Messages"
            >
              <MessageCircle size={19} />
            </a>

            <a
              href="#email"
              aria-label="Email"
            >
              <Mail size={19} />
            </a>

            <a
              href="#share"
              aria-label="Share"
            >
              <Share2 size={19} />
            </a>
          </div>
        </section>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>
            © {new Date().getFullYear()} AEGIS Health
            Assistant. All rights reserved.
          </p>

          <p>
            This prototype does not provide a medical
            diagnosis.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;