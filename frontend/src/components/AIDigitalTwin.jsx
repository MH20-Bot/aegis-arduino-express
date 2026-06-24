import {
  useCallback,
  useEffect,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  apiRequest
} from '../services/api.js';

const scenarioOrder = [
  'REST_RECOVERY',
  'CLEANER_AIR',
  'HYDRATION_ROUTINE',
  'LIGHT_ACTIVITY',
  'HIGH_STRESS',
  'POOR_SLEEP',
  'POLLUTION_EXPOSURE'
];

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  return new Date(
    value
  ).toLocaleString();
}

function formatRefreshWindow(
  value
) {
  const labels = {
    '30_MINUTES':
      'Create another data snapshot within 30 minutes',

    '6_HOURS':
      'Create another data snapshot within 6 hours',

    '24_HOURS':
      'Create another data snapshot within 24 hours'
  };

  return (
    labels[value] ||
    'Routine monitoring'
  );
}

function AIDigitalTwin() {
  const [
    profile,
    setProfile
  ] = useState(null);

  const [
    latestSnapshot,
    setLatestSnapshot
  ] = useState(null);

  const [
    snapshots,
    setSnapshots
  ] = useState([]);

  const [
    scenarios,
    setScenarios
  ] = useState({});

  const [
    simulation,
    setSimulation
  ] = useState(null);

  const [
    hardware,
    setHardware
  ] = useState(null);

  const [
    busyAction,
    setBusyAction
  ] = useState('');

  const [
    message,
    setMessage
  ] = useState('');

  const [
    error,
    setError
  ] = useState('');

  const loadTwin =
    useCallback(
      async () => {
        try {
          const [
            profileResult,
            historyResult
          ] =
            await Promise.all([
              apiRequest(
                '/api/digital-twin/profile'
              ),

              apiRequest(
                '/api/digital-twin/history'
              )
            ]);

          setProfile(
            profileResult.profile
          );

          setLatestSnapshot(
            profileResult
              .latestSnapshot
          );

          setScenarios(
            profileResult
              .scenarios ||
              {}
          );

          setHardware(
            profileResult.hardware
          );

          setSnapshots(
            historyResult
              .snapshots ||
              []
          );

          setError('');
        } catch (
          requestError
        ) {
          setError(
            requestError.message
          );
        }
      },
      []
    );

  useEffect(() => {
    loadTwin();
  }, [loadTwin]);

  async function buildTwin() {
    setBusyAction('BUILD');
    setMessage('');
    setError('');

    try {
      const result =
        await apiRequest(
          '/api/digital-twin/build',
          {
            method: 'POST',

            body:
              JSON.stringify({
                disclaimerAccepted:
                  true
              })
          }
        );

      setProfile(
        result.profile
      );

      setMessage(
        result.message
      );

      await loadTwin();
    } catch (
      requestError
    ) {
      setError(
        requestError.message
      );
    } finally {
      setBusyAction('');
    }
  }

  async function createSnapshot() {
    setBusyAction(
      'SNAPSHOT'
    );

    setMessage('');
    setError('');
    setSimulation(null);

    try {
      const result =
        await apiRequest(
          '/api/digital-twin/snapshot',
          {
            method: 'POST'
          }
        );

      setLatestSnapshot(
        result.snapshot
      );

      setMessage(
        result.message
      );

      await loadTwin();
    } catch (
      requestError
    ) {
      setError(
        requestError.message
      );
    } finally {
      setBusyAction('');
    }
  }

  async function runScenario(
    scenario
  ) {
    setBusyAction(
      scenario
    );

    setMessage('');
    setError('');

    try {
      const result =
        await apiRequest(
          '/api/digital-twin/simulate',
          {
            method: 'POST',

            body:
              JSON.stringify({
                scenario
              })
          }
        );

      setSimulation(
        result.simulation
      );
    } catch (
      requestError
    ) {
      setError(
        requestError.message
      );
    } finally {
      setBusyAction('');
    }
  }

  return (
    <>
      <section className="twin-hero">
        <div className="twin-container">
          <span className="twin-kicker">
            Protected AI Feature
          </span>

          <h1>
            Adaptive AI Digital Twin
          </h1>

          <p>
            Build a personal health
            baseline, detect changes from
            normal patterns, identify
            missing information, test
            future scenarios, and connect
            the final twin level with
            Arduino hardware.
          </p>

          <div className="twin-button-row">
            <Link
              to="/dashboard"
              className="twin-secondary-button"
            >
              Open Dashboard
            </Link>

            <Link
              to="/app/features/voice-analysis"
              className="twin-secondary-button"
            >
              Complete Voice Analysis
            </Link>
          </div>
        </div>
      </section>

      <section className="twin-section">
        <div className="twin-container">
          {!profile ? (
            <div className="twin-card twin-start-card">
              <span className="twin-kicker">
                Step One
              </span>

              <h2>
                Build Your Personal Baseline
              </h2>

              <p>
                The twin will study your
                existing Voice Analysis,
                Emergency Alerts, session
                duration, and feature
                history.
              </p>

              <button
                type="button"
                className="twin-primary-button"
                disabled={
                  busyAction ===
                  'BUILD'
                }
                onClick={
                  buildTwin
                }
              >
                {busyAction ===
                'BUILD'
                  ? 'Building Twin...'
                  : 'Build My Digital Twin'}
              </button>
            </div>
          ) : (
            <>
              <div className="twin-status-grid">
                <StatusCard
                  label="Twin Status"
                  value={
                    profile.status
                  }
                />

                <StatusCard
                  label="Confidence"
                  value={
                    profile
                      .dataCoverage
                      .confidence
                  }
                />

                <StatusCard
                  label="Records"
                  value={String(
                    profile
                      .dataCoverage
                      .totalRecords
                  )}
                />

                <StatusCard
                  label="Voice Samples"
                  value={String(
                    profile
                      .dataCoverage
                      .voiceSamples
                  )}
                />

                <StatusCard
                  label="Arduino"
                  value={
                    hardware
                      ?.arduinoReady
                      ? 'Connected'
                      : 'Not Ready'
                  }
                />

                <StatusCard
                  label="Last Built"
                  value={formatDate(
                    profile
                      .lastBuiltAt
                  )}
                />
              </div>

              <div className="twin-main-grid">
                <div className="twin-card">
                  <div className="twin-heading-row">
                    <div>
                      <span className="twin-kicker">
                        Personal Baseline
                      </span>

                      <h2>
                        Your Normal Pattern
                      </h2>
                    </div>

                    <button
                      type="button"
                      className="twin-secondary-button"
                      disabled={
                        busyAction ===
                        'BUILD'
                      }
                      onClick={
                        buildTwin
                      }
                    >
                      Rebuild Baseline
                    </button>
                  </div>

                  <div className="twin-baseline-grid">
                    <MetricCard
                      label="Voice Irregularity"
                      value={
                        profile
                          .baseline
                          .voiceIrregularity
                      }
                      suffix="/100"
                    />

                    <MetricCard
                      label="Emergency Pressure"
                      value={
                        profile
                          .baseline
                          .emergencyPressure
                      }
                      suffix="/100"
                    />

                    <MetricCard
                      label="Average Duration"
                      value={
                        profile
                          .baseline
                          .averageSessionDuration
                      }
                      suffix=" seconds"
                    />

                    <MetricCard
                      label="Stability Score"
                      value={
                        profile
                          .baseline
                          .stabilityScore
                      }
                      suffix="/100"
                    />
                  </div>

                  <button
                    type="button"
                    className="twin-primary-button twin-full-button"
                    disabled={
                      busyAction ===
                      'SNAPSHOT'
                    }
                    onClick={
                      createSnapshot
                    }
                  >
                    {busyAction ===
                    'SNAPSHOT'
                      ? 'Creating Snapshot...'
                      : 'Create Current Twin Snapshot'}
                  </button>
                </div>

                <aside className="twin-card">
                  <span className="twin-kicker">
                    Missing Data Radar
                  </span>

                  <h2>
                    Next Best Data Action
                  </h2>

                  {latestSnapshot ? (
                    <>
                      <div
                        className={`twin-priority ${
                          latestSnapshot
                            .nextDataAction
                            .priority
                        }`}
                      >
                        {
                          latestSnapshot
                            .nextDataAction
                            .priority
                        }{' '}
                        Priority
                      </div>

                      <h3>
                        {
                          latestSnapshot
                            .nextDataAction
                            .title
                        }
                      </h3>

                      <p>
                        {
                          latestSnapshot
                            .nextDataAction
                            .reason
                        }
                      </p>

                      {latestSnapshot
                        .nextDataAction
                        .featureSlug &&
                        latestSnapshot
                          .nextDataAction
                          .featureSlug !==
                          'wearable-integration' && (
                          <Link
                            to={`/app/features/${latestSnapshot.nextDataAction.featureSlug}`}
                            className="twin-secondary-button"
                          >
                            Open Recommended Feature
                          </Link>
                        )}
                    </>
                  ) : (
                    <p>
                      Create your first
                      snapshot to identify
                      the most useful next
                      data source.
                    </p>
                  )}
                </aside>
              </div>

              {latestSnapshot && (
                <section className="twin-card twin-result-card">
                  <div className="twin-heading-row">
                    <div>
                      <span className="twin-kicker">
                        Current Twin State
                      </span>

                      <h2>
                        Personal Drift Result
                      </h2>
                    </div>

                    <div
                      className={`twin-level ${latestSnapshot.level.toLowerCase()}`}
                    >
                      {
                        latestSnapshot.level
                      }
                    </div>
                  </div>

                  <div className="twin-score-layout">
                    <div className="twin-score-circle">
                      <strong>
                        {
                          latestSnapshot
                            .driftScore
                        }
                      </strong>

                      <span>
                        Drift Score
                      </span>
                    </div>

                    <div className="twin-result-information">
                      <dl>
                        <div>
                          <dt>
                            Confidence
                          </dt>

                          <dd>
                            {
                              latestSnapshot
                                .confidence
                            }
                          </dd>
                        </div>

                        <div>
                          <dt>
                            Direction
                          </dt>

                          <dd>
                            {
                              latestSnapshot
                                .direction
                            }
                          </dd>
                        </div>

                        <div>
                          <dt>
                            Arduino Command
                          </dt>

                          <dd>
                            {
                              latestSnapshot
                                .hardware
                                .sentCommand
                            }
                          </dd>
                        </div>

                        <div>
                          <dt>
                            Arduino Confirmed
                          </dt>

                          <dd>
                            {latestSnapshot
                              .hardware
                              .acknowledged
                              ? 'Yes'
                              : 'No'}
                          </dd>
                        </div>
                      </dl>

                      <div className="twin-refresh-window">
                        <strong>
                          Next Data Refresh
                        </strong>

                        <span>
                          {formatRefreshWindow(
                            latestSnapshot
                              .nextRefreshWindow
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="twin-driver-list">
                    <h3>
                      Main Pattern Drivers
                    </h3>

                    {latestSnapshot
                      .drivers
                      .map(driver => (
                        <div key={driver}>
                          {driver}
                        </div>
                      ))}
                  </div>
                </section>
              )}

              <section className="twin-card">
                <span className="twin-kicker">
                  Counterfactual Future Lab
                </span>

                <h2>
                  Test What If Scenarios
                </h2>

                <p>
                  These simulations do not
                  change your real twin or
                  activate Arduino hardware.
                </p>

                <div className="twin-scenario-grid">
                  {scenarioOrder.map(
                    scenario => {
                      const definition =
                        scenarios[
                          scenario
                        ];

                      if (!definition) {
                        return null;
                      }

                      return (
                        <button
                          type="button"
                          key={scenario}
                          className="twin-scenario-button"
                          disabled={
                            !latestSnapshot ||
                            Boolean(
                              busyAction
                            )
                          }
                          onClick={() =>
                            runScenario(
                              scenario
                            )
                          }
                        >
                          <strong>
                            {
                              definition.title
                            }
                          </strong>

                          <span>
                            {
                              definition.description
                            }
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                {simulation && (
                  <div className="twin-simulation-result">
                    <div>
                      <span>
                        Scenario
                      </span>

                      <strong>
                        {
                          simulation.title
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Current Score
                      </span>

                      <strong>
                        {
                          simulation.baseScore
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Projected Score
                      </span>

                      <strong>
                        {
                          simulation.projectedScore
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Projected Level
                      </span>

                      <strong>
                        {
                          simulation.projectedLevel
                        }
                      </strong>
                    </div>

                    <p>
                      {simulation.note}
                    </p>
                  </div>
                )}
              </section>

              <section className="twin-card">
                <div className="twin-heading-row">
                  <div>
                    <span className="twin-kicker">
                      Twin Memory
                    </span>

                    <h2>
                      Snapshot History
                    </h2>
                  </div>

                  <span>
                    {snapshots.length}{' '}
                    records
                  </span>
                </div>

                {snapshots.length ===
                0 ? (
                  <div className="twin-empty">
                    No digital twin
                    snapshots have been
                    created.
                  </div>
                ) : (
                  <div className="twin-table-wrapper">
                    <table className="twin-table">
                      <thead>
                        <tr>
                          <th>
                            Created
                          </th>

                          <th>
                            Score
                          </th>

                          <th>
                            Level
                          </th>

                          <th>
                            Confidence
                          </th>

                          <th>
                            Direction
                          </th>

                          <th>
                            Arduino
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {snapshots.map(
                          snapshot => (
                            <tr
                              key={
                                snapshot._id
                              }
                            >
                              <td>
                                {formatDate(
                                  snapshot
                                    .createdAt
                                )}
                              </td>

                              <td>
                                {
                                  snapshot
                                    .driftScore
                                }
                              </td>

                              <td>
                                {
                                  snapshot.level
                                }
                              </td>

                              <td>
                                {
                                  snapshot
                                    .confidence
                                }
                              </td>

                              <td>
                                {
                                  snapshot
                                    .direction
                                }
                              </td>

                              <td>
                                {snapshot
                                  .hardware
                                  .acknowledged
                                  ? snapshot
                                      .hardware
                                      .sentCommand
                                  : 'Not confirmed'}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {message && (
            <div className="twin-message success">
              {message}
            </div>
          )}

          {error && (
            <div className="twin-message error">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="twin-warning">
        <div className="twin-container">
          The AI Digital Twin is a
          non-clinical prototype. It does
          not diagnose illness, predict a
          confirmed medical emergency, or
          replace healthcare professionals.
          The refresh window refers only
          to collecting another data
          snapshot.
        </div>
      </section>
    </>
  );
}

function StatusCard({
  label,
  value
}) {
  return (
    <article className="twin-status-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function MetricCard({
  label,
  value,
  suffix
}) {
  return (
    <article className="twin-metric-card">
      <span>{label}</span>

      <strong>
        {value}
        {suffix}
      </strong>
    </article>
  );
}

export default AIDigitalTwin;