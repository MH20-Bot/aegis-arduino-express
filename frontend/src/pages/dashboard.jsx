import {
  Activity,
  Clock3,
  History,
  UserRound
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  useAuth
} from '../context/AuthContext.jsx';

import {
  features
} from '../data/features.js';

import {
  apiRequest
} from '../services/api.js';

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Not completed';
  }

  return new Date(
    dateValue
  ).toLocaleString();
}

function formatDuration(seconds) {
  const totalSeconds =
    Number(seconds || 0);

  if (totalSeconds < 60) {
    return `${totalSeconds} seconds`;
  }

  const minutes = Math.floor(
    totalSeconds / 60
  );

  const remainingSeconds =
    totalSeconds % 60;

  return `${minutes} minutes ${remainingSeconds} seconds`;
}

function Dashboard() {
  const { user } = useAuth();

  const [
    usageHistory,
    setUsageHistory
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const loadHistory =
    useCallback(async () => {
      setLoading(true);

      try {
        const result =
          await apiRequest(
            '/api/feature-usage'
          );

        setUsageHistory(
          result.usageHistory || []
        );

        setError('');
      } catch (requestError) {
        setError(
          requestError.message
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <>
      <section className="dashboard-hero">
        <div className="container">
          <span className="section-tag">
            User Dashboard
          </span>

          <h1>
            Welcome, {user.name}
          </h1>

          <p>
            Review your feature activity,
            session duration, timestamps,
            and saved results.
          </p>

          <div className="dashboard-profile-row">
            <span>
              <UserRound size={18} />
              {user.email}
            </span>

            <span>
              <Clock3 size={18} />
              Last login{' '}
              {formatDate(
                user.lastLoginAt
              )}
            </span>
          </div>
        </div>
      </section>

      <section className="website-section">
        <div className="container">
          <div className="section-heading">
            <span className="section-tag">
              Available Features
            </span>

            <h2>
              Start a Protected Feature
            </h2>
          </div>

          <div className="dashboard-feature-grid">
            {features.map(feature => {
              const Icon =
                feature.icon;

              return (
                <Link
                  key={feature.slug}
                  to={`/app/features/${feature.slug}`}
                  className="dashboard-feature-card"
                >
                  <Icon size={25} />

                  <div>
                    <strong>
                      {feature.title}
                    </strong>

                    <span>
                      Open authenticated
                      feature
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="website-section light-section">
        <div className="container">
          <div className="dashboard-table-header">
            <div>
              <span className="section-tag">
                <History size={16} />
                Usage History
              </span>

              <h2>
                Feature Activity
              </h2>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={loadHistory}
            >
              Refresh History
            </button>
          </div>

          {loading ? (
            <div className="dashboard-state">
              Loading feature history...
            </div>
          ) : error ? (
            <div className="auth-error-message">
              {error}
            </div>
          ) : usageHistory.length === 0 ? (
            <div className="dashboard-state">
              <Activity size={36} />

              <h3>
                No Feature Activity Yet
              </h3>

              <p>
                Start a feature session
                to create your first
                dashboard record.
              </p>
            </div>
          ) : (
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Started</th>
                    <th>Completed</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Result Level</th>
                    <th>Result</th>
                  </tr>
                </thead>

                <tbody>
                  {usageHistory.map(
                    usage => (
                      <tr key={usage._id}>
                        <td>
                          <strong>
                            {
                              usage.featureName
                            }
                          </strong>
                        </td>

                        <td>
                          {formatDate(
                            usage.startedAt
                          )}
                        </td>

                        <td>
                          {formatDate(
                            usage.endedAt
                          )}
                        </td>

                        <td>
                          {formatDuration(
                            usage.durationSeconds
                          )}
                        </td>

                        <td>
                          <span
                            className={`table-status ${usage.status.toLowerCase()}`}
                          >
                            {usage.status}
                          </span>
                        </td>

                        <td>
                          {usage.result
                            ?.level ||
                            'Not available'}
                        </td>

                        <td>
                          {usage.result
                            ?.summary ||
                            'No result recorded'}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Dashboard;