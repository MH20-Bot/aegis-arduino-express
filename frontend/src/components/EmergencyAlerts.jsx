import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  apiRequest
} from '../services/api.js';

const alertLevels = [
  {
    level: 'GOOD',
    title: 'Good',
    description:
      'Blink the green Arduino indicator.'
  },
  {
    level: 'MODERATE',
    title: 'Moderate',
    description:
      'Turn on the yellow Arduino indicator.'
  },
  {
    level: 'HIGH',
    title: 'High Emergency',
    description:
      'Activate the red indicator and buzzer.'
  },
  {
    level: 'OFF',
    title:
      'Turn Hardware Off',
    description:
      'Turn off all indicators and the buzzer.'
  }
];

function formatDate(value) {
  return value
    ? new Date(
        value
      ).toLocaleString()
    : 'Not available';
}

function formatDuration(
  seconds
) {
  const value = Math.max(
    0,
    Number(seconds || 0)
  );

  const minutes = Math.floor(
    value / 60
  );

  const remainingSeconds =
    value % 60;

  return `${String(
    minutes
  ).padStart(
    2,
    '0'
  )}:${String(
    remainingSeconds
  ).padStart(
    2,
    '0'
  )}`;
}

function captureBrowserLocation() {
  return new Promise(
    resolve => {
      if (
        !navigator
          .geolocation
      ) {
        resolve({
          permissionStatus:
            'UNAVAILABLE',

          mapUrl: ''
        });

        return;
      }

      navigator
        .geolocation
        .getCurrentPosition(
          position => {
            const latitude =
              position.coords
                .latitude;

            const longitude =
              position.coords
                .longitude;

            resolve({
              permissionStatus:
                'GRANTED',

              latitude,
              longitude,

              accuracyMeters:
                position.coords
                  .accuracy,

              capturedAt:
                new Date()
                  .toISOString(),

              mapUrl:
                `https://www.google.com/maps?q=${latitude},${longitude}`
            });
          },

          error => {
            resolve({
              permissionStatus:
                error.code === 1
                  ? 'DENIED'
                  : 'UNAVAILABLE',

              mapUrl: ''
            });
          },

          {
            enableHighAccuracy:
              true,

            timeout: 10000,
            maximumAge: 0
          }
        );
    }
  );
}

function EmergencyAlerts() {
  const [
    hardware,
    setHardware
  ] = useState({
    connectionStatus:
      'checking',

    arduinoReady: false,
    port: 'Unknown',
    baudRate: 0,

    currentAlertLevel:
      'OFF'
  });

  const [
    contacts,
    setContacts
  ] = useState([]);

  const [
    incident,
    setIncident
  ] = useState(null);

  const [
    note,
    setNote
  ] = useState('');

  const [
    location,
    setLocation
  ] = useState({
    permissionStatus:
      'NOT_REQUESTED',

    mapUrl: ''
  });

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

  const [
    elapsedSeconds,
    setElapsedSeconds
  ] = useState(0);

  const [
    contactCountdown,
    setContactCountdown
  ] = useState(null);

  const countdownRef =
    useRef(null);

  const hardwareReady =
    hardware.connectionStatus ===
      'connected' &&
    hardware.arduinoReady;

  const incidentActive =
    incident &&
    [
      'ACTIVE',
      'ACKNOWLEDGED'
    ].includes(
      incident.status
    );

  const loadHardware =
    useCallback(
      async () => {
        try {
          const result =
            await apiRequest(
              '/api/emergency-network/hardware-status'
            );

          setHardware(
            previous => ({
              ...previous,
              ...result
            })
          );
        } catch {
          setHardware(
            previous => ({
              ...previous,

              connectionStatus:
                'disconnected',

              arduinoReady:
                false
            })
          );
        }
      },
      []
    );

  const loadContacts =
    useCallback(
      async () => {
        try {
          const result =
            await apiRequest(
              '/api/emergency-network/contacts'
            );

          setContacts(
            (
              result.contacts ||
              []
            ).filter(
              contact =>
                contact.isActive
            )
          );
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

  const loadActiveIncident =
    useCallback(
      async () => {
        try {
          const result =
            await apiRequest(
              '/api/emergency-network/incidents/active'
            );

          setIncident(
            result.incident ||
            null
          );

          if (
            result.incident
              ?.location
          ) {
            setLocation(
              result.incident
                .location
            );
          }
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
    loadHardware();
    loadContacts();
    loadActiveIncident();

    const hardwareInterval =
      window.setInterval(
        loadHardware,
        2500
      );

    const incidentInterval =
      window.setInterval(
        loadActiveIncident,
        3000
      );

    return () => {
      window.clearInterval(
        hardwareInterval
      );

      window.clearInterval(
        incidentInterval
      );

      if (
        countdownRef.current
      ) {
        window.clearInterval(
          countdownRef.current
        );
      }
    };
  }, [
    loadActiveIncident,
    loadContacts,
    loadHardware
  ]);

  useEffect(() => {
    if (!incidentActive) {
      setElapsedSeconds(0);
      return undefined;
    }

    function updateDuration() {
      setElapsedSeconds(
        Math.max(
          0,

          Math.floor(
            (
              Date.now() -
              new Date(
                incident.startedAt
              ).getTime()
            ) / 1000
          )
        )
      );
    }

    updateDuration();

    const intervalId =
      window.setInterval(
        updateDuration,
        1000
      );

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, [
    incident,
    incidentActive
  ]);

  const contactAlertByContactId =
    useMemo(() => {
      const entries =
        new Map();

      for (
        const alert of
        incident
          ?.contactAlerts ||
        []
      ) {
        entries.set(
          String(alert.contact),
          alert
        );
      }

      return entries;
    }, [incident]);

  async function startIncident() {
    setBusyAction('START');
    setMessage('');
    setError('');

    try {
      const result =
        await apiRequest(
          '/api/emergency-network/incidents/start',
          {
            method: 'POST'
          }
        );

      setIncident(
        result.incident
      );

      setMessage(
        result.message
      );
    } catch (requestError) {
      setError(
        requestError.message
      );
    } finally {
      setBusyAction('');
    }
  }

  async function captureLocationOnly() {
    setBusyAction(
      'LOCATION'
    );

    setMessage('');
    setError('');

    const capturedLocation =
      await captureBrowserLocation();

    setLocation(
      capturedLocation
    );

    if (
      capturedLocation
        .permissionStatus ===
      'GRANTED'
    ) {
      setMessage(
        'Current location captured successfully.'
      );
    } else {
      setError(
        capturedLocation
          .permissionStatus ===
        'DENIED'
          ? 'Location permission was denied.'
          : 'Current location is unavailable.'
      );
    }

    setBusyAction('');

    return capturedLocation;
  }

  function beginContactCountdown() {
    if (
      countdownRef.current
    ) {
      window.clearInterval(
        countdownRef.current
      );
    }

    setContactCountdown(15);

    countdownRef.current =
      window.setInterval(
        () => {
          setContactCountdown(
            previous => {
              if (
                previous ===
                  null ||
                previous <= 1
              ) {
                window.clearInterval(
                  countdownRef.current
                );

                countdownRef.current =
                  null;

                return 0;
              }

              return previous - 1;
            }
          );
        },
        1000
      );
  }

  function cancelContactCountdown() {
    if (
      countdownRef.current
    ) {
      window.clearInterval(
        countdownRef.current
      );

      countdownRef.current =
        null;
    }

    setContactCountdown(null);

    setMessage(
      'Contact sharing countdown cancelled.'
    );
  }

  async function triggerLevel(
    level
  ) {
    if (!incident?._id) {
      setError(
        'Start an emergency incident first.'
      );

      return;
    }

    setBusyAction(level);
    setMessage('');
    setError('');

    let selectedLocation =
      location;

    if (
      level === 'HIGH' &&
      location
        .permissionStatus !==
        'GRANTED'
    ) {
      selectedLocation =
        await captureBrowserLocation();

      setLocation(
        selectedLocation
      );
    }

    try {
      const result =
        await apiRequest(
          `/api/emergency-network/incidents/${incident._id}/trigger`,
          {
            method: 'POST',

            body:
              JSON.stringify({
                level,
                note,

                location:
                  selectedLocation
              })
          }
        );

      setIncident(
        result.incident
      );

      setHardware(
        previous => ({
          ...previous,

          currentAlertLevel:
            level
        })
      );

      setMessage(
        result.message
      );

      if (level === 'HIGH') {
        beginContactCountdown();
      }

      await loadHardware();
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

  async function createAndShareLink(
    contact
  ) {
    if (!incident?._id) {
      setError(
        'Start an emergency incident first.'
      );

      return;
    }

    setBusyAction(
      `SHARE_${contact._id}`
    );

    setMessage('');
    setError('');

    try {
      const result =
        await apiRequest(
          `/api/emergency-network/incidents/${incident._id}/share/${contact._id}`,
          {
            method: 'POST'
          }
        );

      const locationText =
        incident.location
          ?.mapUrl
          ? ` Location: ${incident.location.mapUrl}`
          : '';

      const shareData = {
        title:
          'AEGIS Emergency Alert',

        text:
          `${contact.name}, an AEGIS emergency alert is active. ` +
          `Level: ${incident.level}.${locationText}`,

        url: result.shareUrl
      };

      if (navigator.share) {
        await navigator.share(
          shareData
        );

        setMessage(
          `Emergency information shared with ${contact.name}.`
        );
      } else if (
        navigator.clipboard
      ) {
        await navigator
          .clipboard
          .writeText(
            `${shareData.text} ${shareData.url}`
          );

        setMessage(
          `Emergency response link copied for ${contact.name}.`
        );
      } else {
        window.prompt(
          'Copy this emergency response link:',

          result.shareUrl
        );
      }

      setIncident(
        result.incident
      );
    } catch (
      requestError
    ) {
      if (
        requestError.name ===
        'AbortError'
      ) {
        return;
      }

      setError(
        requestError.message
      );
    } finally {
      setBusyAction('');
    }
  }

  async function resolveIncident() {
    if (!incident?._id) {
      return;
    }

    setBusyAction(
      'RESOLVE'
    );

    setMessage('');
    setError('');

    try {
      const result =
        await apiRequest(
          `/api/emergency-network/incidents/${incident._id}/resolve`,
          {
            method: 'POST'
          }
        );

      setIncident(
        result.incident
      );

      setHardware(
        previous => ({
          ...previous,

          currentAlertLevel:
            'OFF'
        })
      );

      setContactCountdown(
        null
      );

      setMessage(
        result.message
      );

      await loadHardware();
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
      <section className="network-page-hero">
        <div className="network-container">
          <span className="network-kicker">
            Protected Emergency Feature
          </span>

          <h1>
            AEGIS Emergency Circle
          </h1>

          <p>
            Control Arduino warning
            hardware, capture location with
            permission, contact trusted
            people, and record the complete
            incident in MongoDB.
          </p>

          <div className="network-button-row">
            <Link
              to="/dashboard/emergency-contacts"
              className="network-secondary-button"
            >
              Manage Emergency Contacts
            </Link>

            <Link
              to="/dashboard"
              className="network-secondary-button"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="network-section">
        <div className="network-container">
          <div className="network-status-grid">
            <StatusCard
              label="Arduino"
              value={
                hardwareReady
                  ? 'Connected'
                  : 'Disconnected'
              }
              tone={
                hardwareReady
                  ? 'good'
                  : 'high'
              }
            />

            <StatusCard
              label="Serial Port"
              value={
                hardware.port ||
                'Unknown'
              }
            />

            <StatusCard
              label="Current Level"
              value={
                hardware
                  .currentAlertLevel ||
                'OFF'
              }
              tone={
                (
                  hardware
                    .currentAlertLevel ||
                  'off'
                ).toLowerCase()
              }
            />

            <StatusCard
              label="Incident Duration"
              value={formatDuration(
                elapsedSeconds
              )}
            />

            <StatusCard
              label="Location"
              value={
                location
                  .permissionStatus ||
                'NOT_REQUESTED'
              }
            />

            <StatusCard
              label="Contacts"
              value={String(
                contacts.length
              )}
            />
          </div>

          {!incidentActive ? (
            <div className="network-card network-empty network-start-panel">
              <h2>
                Start Emergency Incident
              </h2>

              <p>
                Start an incident before
                sending Arduino commands or
                sharing emergency
                information.
              </p>

              <button
                type="button"
                className="network-primary-button"
                disabled={
                  busyAction ===
                  'START'
                }
                onClick={
                  startIncident
                }
              >
                {busyAction ===
                'START'
                  ? 'Starting...'
                  : 'Start Emergency Incident'}
              </button>
            </div>
          ) : (
            <div className="network-emergency-grid">
              <div className="network-card">
                <div className="network-section-heading">
                  <div>
                    <span className="network-kicker">
                      Arduino Controls
                    </span>

                    <h2>
                      Emergency Level
                    </h2>
                  </div>

                  <span>
                    {incident.status}
                  </span>
                </div>

                <label>
                  Incident Note

                  <textarea
                    rows="3"
                    value={note}
                    maxLength="1000"
                    onChange={
                      event =>
                        setNote(
                          event.target
                            .value
                        )
                    }
                    placeholder="Enter an optional incident note"
                  />
                </label>

                <div className="network-alert-grid">
                  {alertLevels.map(
                    item => (
                      <button
                        type="button"
                        key={
                          item.level
                        }
                        className={`network-alert-button ${item.level.toLowerCase()} ${
                          incident.level ===
                          item.level
                            ? 'active'
                            : ''
                        }`}
                        disabled={
                          !hardwareReady ||
                          Boolean(
                            busyAction
                          )
                        }
                        onClick={() =>
                          triggerLevel(
                            item.level
                          )
                        }
                      >
                        <strong>
                          {busyAction ===
                          item.level
                            ? 'Sending...'
                            : item.title}
                        </strong>

                        <span>
                          {
                            item.description
                          }
                        </span>
                      </button>
                    )
                  )}
                </div>

                <div className="network-location-panel">
                  <div>
                    <strong>
                      Current Location
                    </strong>

                    <span>
                      {location
                        .permissionStatus ===
                      'GRANTED'
                        ? `Captured with approximately ${Math.round(
                            location
                              .accuracyMeters ||
                              0
                          )} metres accuracy`
                        : location
                            .permissionStatus}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="network-secondary-button"
                    disabled={
                      busyAction ===
                      'LOCATION'
                    }
                    onClick={
                      captureLocationOnly
                    }
                  >
                    {busyAction ===
                    'LOCATION'
                      ? 'Capturing...'
                      : 'Capture Location'}
                  </button>

                  {location.mapUrl && (
                    <a
                      className="network-secondary-button"
                      href={
                        location.mapUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Map
                    </a>
                  )}
                </div>

                {contactCountdown !==
                  null && (
                  <div className="network-countdown">
                    <div>
                      <strong>
                        {contactCountdown ===
                        0
                          ? 'Contact sharing is ready'
                          : `${contactCountdown} seconds`}
                      </strong>

                      <span>
                        Share the secure
                        response link with
                        a trusted contact
                        below.
                      </span>
                    </div>

                    {contactCountdown >
                      0 && (
                      <button
                        type="button"
                        className="network-danger-button"
                        onClick={
                          cancelContactCountdown
                        }
                      >
                        Cancel Countdown
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  className="network-danger-button network-full-button"
                  disabled={
                    busyAction ===
                    'RESOLVE'
                  }
                  onClick={
                    resolveIncident
                  }
                >
                  {busyAction ===
                  'RESOLVE'
                    ? 'Resolving...'
                    : 'Resolve Incident and Turn Hardware Off'}
                </button>
              </div>

              <aside className="network-card">
                <div className="network-section-heading">
                  <div>
                    <span className="network-kicker">
                      Trusted Network
                    </span>

                    <h2>
                      Emergency Contacts
                    </h2>
                  </div>

                  <span>
                    {contacts.length}
                  </span>
                </div>

                {contacts.length ===
                0 ? (
                  <div className="network-empty">
                    <p>
                      No trusted contacts
                      are active.
                    </p>

                    <Link
                      to="/dashboard/emergency-contacts"
                      className="network-primary-button"
                    >
                      Add Contact
                    </Link>
                  </div>
                ) : (
                  <div className="network-contact-list">
                    {contacts.map(
                      contact => {
                        const alert =
                          contactAlertByContactId.get(
                            String(
                              contact._id
                            )
                          );

                        return (
                          <article
                            key={
                              contact._id
                            }
                            className="network-contact-card compact"
                          >
                            <div>
                              <span className="network-priority">
                                Priority{' '}
                                {
                                  contact.priority
                                }
                              </span>

                              <h3>
                                {
                                  contact.name
                                }
                              </h3>

                              <p>
                                {
                                  contact.relationship
                                }
                              </p>
                            </div>

                            <div className="network-contact-status">
                              {alert?.status ||
                                'PENDING'}
                            </div>

                            <div className="network-button-row">
                              {contact.phone && (
                                <a
                                  className="network-secondary-button"
                                  href={`tel:${contact.phone}`}
                                >
                                  Call
                                </a>
                              )}

                              {contact.email && (
                                <a
                                  className="network-secondary-button"
                                  href={`mailto:${contact.email}?subject=AEGIS Emergency Alert`}
                                >
                                  Email
                                </a>
                              )}

                              <button
                                type="button"
                                className="network-primary-button"
                                disabled={
                                  busyAction ===
                                  `SHARE_${contact._id}`
                                }
                                onClick={() =>
                                  createAndShareLink(
                                    contact
                                  )
                                }
                              >
                                {busyAction ===
                                `SHARE_${contact._id}`
                                  ? 'Preparing...'
                                  : 'Share Emergency'}
                              </button>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </aside>
            </div>
          )}

          {incident && (
            <section className="network-card network-timeline">
              <div className="network-section-heading">
                <h2>
                  Incident Timeline
                </h2>

                <span>
                  {
                    (
                      incident.timeline ||
                      []
                    ).length
                  }{' '}
                  events
                </span>
              </div>

              {(
                incident.timeline ||
                []
              ).length === 0 ? (
                <div className="network-empty">
                  No timeline events are
                  available.
                </div>
              ) : (
                <div className="network-timeline-list">
                  {[
                    ...(
                      incident.timeline ||
                      []
                    )
                  ]
                    .reverse()
                    .map(
                      event => (
                        <article
                          key={
                            event._id
                          }
                        >
                          <div>
                            <strong>
                              {
                                event.type
                              }
                            </strong>

                            <span>
                              {
                                event.level
                              }
                            </span>
                          </div>

                          <p>
                            {
                              event.message
                            }
                          </p>

                          <small>
                            {formatDate(
                              event.createdAt
                            )}
                          </small>
                        </article>
                      )
                    )}
                </div>
              )}
            </section>
          )}

          {message && (
            <div className="network-message success">
              {message}
            </div>
          )}

          {error && (
            <div className="network-message error">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="network-warning">
        <div className="network-container">
          This prototype does not
          automatically contact official
          emergency services. During a real
          emergency, contact local emergency
          services directly.
        </div>
      </section>
    </>
  );
}

function StatusCard({
  label,
  value,
  tone = ''
}) {
  return (
    <article
      className={`network-status-card ${tone}`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default EmergencyAlerts;