import {
  LockKeyhole,
  Mail,
  ShieldPlus,
  UserRound
} from 'lucide-react';

import {
  useState
} from 'react';

import {
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';

import {
  useAuth
} from '../context/AuthContext.jsx';

function Register() {
  const { register } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [formData, setFormData] =
    useState({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });

  const [error, setError] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  function handleChange(event) {
    const {
      name,
      value
    } = event.target;

    setFormData(previous => ({
      ...previous,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError(
        'Passwords do not match.'
      );

      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      const destination =
        location.state?.from ||
        '/dashboard';

      navigate(destination, {
        replace: true
      });
    } catch (requestError) {
      setError(
        requestError.message
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="login-section">
      <div className="login-card">
        <div className="login-logo">
          <ShieldPlus size={34} />
        </div>

        <span className="section-tag">
          Create Account
        </span>

        <h1>Register for AEGIS</h1>

        <p>
          Create an account to access
          protected health features,
          emergency controls, and your
          activity dashboard.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Full Name

            <div className="input-with-icon">
              <UserRound size={18} />

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
          </label>

          <label>
            Email Address

            <div className="input-with-icon">
              <Mail size={18} />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
              />
            </div>
          </label>

          <label>
            Password

            <div className="input-with-icon">
              <LockKeyhole size={18} />

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                minLength="8"
                required
              />
            </div>
          </label>

          <label>
            Confirm Password

            <div className="input-with-icon">
              <LockKeyhole size={18} />

              <input
                type="password"
                name="confirmPassword"
                value={
                  formData.confirmPassword
                }
                onChange={handleChange}
                placeholder="Confirm your password"
                minLength="8"
                required
              />
            </div>
          </label>

          {error && (
            <div className="auth-error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-button login-submit"
            disabled={submitting}
          >
            {submitting
              ? 'Creating Account...'
              : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch-text">
          Already have an account?

          <Link to="/login">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Register;