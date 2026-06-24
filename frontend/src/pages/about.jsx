import {
  BrainCircuit,
  HeartHandshake,
  ShieldCheck,
  Users
} from 'lucide-react';

const teamMembers = [
  'Neha Khatri',
  'Namra Javed',
  'Rida Syed',
  'Syed Jaweriya'
];

function About() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="section-tag">
            About Us
          </span>

          <h1>
            Building Intelligent Technology for Better
            Health Awareness
          </h1>

          <p>
            AEGIS is a connected emergency health
            assistant that brings artificial
            intelligence, hardware, health monitoring,
            and smart environments together.
          </p>
        </div>
      </section>

      <section className="website-section">
        <div className="container split-section">
          <div>
            <span className="section-tag">
              Our Mission
            </span>

            <h2>
              Make Health Awareness Faster, Smarter,
              and More Accessible
            </h2>
          </div>

          <div>
            <p>
              The mission of AEGIS is to explore how
              connected technology can help people
              understand changes in their health and
              environment.
            </p>

            <p>
              The platform combines voice analysis,
              smart sensors, emergency alerts, and
              personalized health history in one
              accessible system.
            </p>
          </div>
        </div>
      </section>

      <section className="website-section light-section">
        <div className="container">
          <div className="section-heading centered-heading">
            <span className="section-tag">
              Our Values
            </span>

            <h2>
              Principles Behind the AEGIS Platform
            </h2>
          </div>

          <div className="value-grid">
            <article>
              <HeartHandshake size={30} />
              <h3>Accessible Support</h3>
              <p>
                Design technology that is clear,
                understandable, and easy to use.
              </p>
            </article>

            <article>
              <ShieldCheck size={30} />
              <h3>Privacy and Safety</h3>
              <p>
                Protect user information and clearly
                communicate system limitations.
              </p>
            </article>

            <article>
              <BrainCircuit size={30} />
              <h3>Responsible AI</h3>
              <p>
                Use artificial intelligence for health
                awareness without presenting it as a
                medical diagnosis.
              </p>
            </article>

            <article>
              <Users size={30} />
              <h3>Human Focused Design</h3>
              <p>
                Build features around real user needs,
                accessibility, and emergency awareness.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="website-section">
        <div className="container">
          <div className="section-heading centered-heading">
            <span className="section-tag">
              Our Team
            </span>

            <h2>
              The Team Behind AEGIS
            </h2>

            <p>
              A collaborative team working across
              artificial intelligence, frontend
              development, backend systems, and
              connected hardware.
            </p>
          </div>

          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <article
                className="team-card"
                key={member}
              >
                <div className="team-avatar">
                  {member
                    .split(' ')
                    .map(name => name.charAt(0))
                    .join('')
                    .slice(0, 2)}
                </div>

                <h3>{member}</h3>

                <p>Core Team Member</p>

                <span>Member {index + 1}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default About;