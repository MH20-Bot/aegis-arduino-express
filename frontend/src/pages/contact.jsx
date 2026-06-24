import {
  Clock3,
  Mail,
  MapPin,
  MessageSquareText,
  Phone
} from 'lucide-react';

import { useState } from 'react';

function Contact() {
  const [submitted, setSubmitted] =
    useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    event.currentTarget.reset();
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">
            Contact Us
          </span>

          <h1>
            Contact the AEGIS Project Team
          </h1>

          <p>
            Send a message regarding the platform,
            project collaboration, research, hardware
            integration, or technical support.
          </p>
        </div>
      </section>

      <section className="website-section">
        <div className="container contact-grid">
          <div className="contact-information">
            <span className="section-tag">
              Get in Touch
            </span>

            <h2>
              We Are Ready to Discuss Your Questions
            </h2>

            <p>
              Complete the contact form and the team
              will review your message.
            </p>

            <div className="contact-detail">
              <Mail size={21} />

              <div>
                <strong>Email</strong>
                <span>contact@aegishealth.ai</span>
              </div>
            </div>

            <div className="contact-detail">
              <Phone size={21} />

              <div>
                <strong>Phone</strong>
                <span>Available on request</span>
              </div>
            </div>

            <div className="contact-detail">
              <MapPin size={21} />

              <div>
                <strong>Location</strong>
                <span>Saudi Arabia</span>
              </div>
            </div>

            <div className="contact-detail">
              <Clock3 size={21} />

              <div>
                <strong>Availability</strong>
                <span>Monday to Saturday</span>
              </div>
            </div>
          </div>

          <form
            className="contact-form"
            onSubmit={handleSubmit}
          >
            <div className="form-row">
              <label>
                First Name
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter your first name"
                  required
                />
              </label>

              <label>
                Last Name
                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter your last name"
                  required
                />
              </label>
            </div>

            <label>
              Email Address
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
              />
            </label>

            <label>
              Subject
              <input
                type="text"
                name="subject"
                placeholder="Enter the message subject"
                required
              />
            </label>

            <label>
              Message
              <textarea
                name="message"
                rows="6"
                placeholder="Write your message"
                required
              />
            </label>

            <button
              type="submit"
              className="primary-button form-submit-button"
            >
              <MessageSquareText size={18} />
              Send Message
            </button>

            {submitted && (
              <div className="form-success-message">
                Your message has been recorded in the
                interface. Backend email delivery will
                be connected in a later phase.
              </div>
            )}
          </form>
        </div>
      </section>

      <section className="map-section">
        <iframe
          title="AEGIS location map"
          src="https://www.google.com/maps?q=Saudi Arabia&output=embed"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>

      <section
        className="website-section"
        id="faqs"
      >
        <div className="container">
          <div className="section-heading centered-heading">
            <span className="section-tag">
              FAQs
            </span>

            <h2>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="faq-grid">
            <article>
              <h3>
                Does AEGIS provide a medical diagnosis?
              </h3>

              <p>
                No. AEGIS is an educational health
                awareness prototype and does not replace
                professional medical care.
              </p>
            </article>

            <article>
              <h3>
                Is the Arduino hardware connected to the
                website?
              </h3>

              <p>
                Yes. The Express server sends alert
                commands from the website to the
                connected Arduino through the serial
                port.
              </p>
            </article>

            <article>
              <h3>
                Will the system support wearable
                devices?
              </h3>

              <p>
                Wearable integration is included in the
                future development scope.
              </p>
            </article>

            <article>
              <h3>
                Is health information stored securely?
              </h3>

              <p>
                The production version will use secure
                authentication, controlled access, and
                protected MongoDB storage.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}

export default Contact;