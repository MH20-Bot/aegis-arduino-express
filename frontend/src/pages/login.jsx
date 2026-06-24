import {
  LockKeyhole,
  Mail,
  ShieldPlus
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

function Login() {
  const { login } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [formData, setFormData] =
    useState({
      email: '',
      password: ''
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
    setSubmitting(true);

    try {
      await login(formData);

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
          Secure Access
        </span>

        <h1>Login to AEGIS</h1>

        <p>
          Access your dashboard,
          feature history, connected
          devices, and emergency controls.
        </p>

        <form onSubmit={handleSubmit}>
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
                placeholder="Enter your password"
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
              ? 'Logging In...'
              : 'Login'}
          </button>
        </form>

        <p className="auth-switch-text">
          Do not have an account?

          <Link
            to="/register"
            state={{
              from:
                location.state?.from
            }}
          >
            Register
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Login;