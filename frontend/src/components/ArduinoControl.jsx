import {
  Activity,
  BellOff,
  CircleAlert,
  CircleCheck,
  RefreshCw,
  TriangleAlert
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useState
} from 'react';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

const alertLevels = [
  {
    level: 'GOOD',
    label: 'Good',
    description: 'The green light will blink.',
    icon: CircleCheck
  },
  {
    level: 'MODERATE',
    label: 'Moderate',
    description: 'The yellow light will remain on.',
    icon: TriangleAlert
  },
  {
    level: 'HIGH',
    label: 'High',
    description:
      'The red light and buzzer will activate.',
    icon: CircleAlert
  },
  {
    level: 'OFF',
    label: 'Turn Off',
    description:
      'All lights and the buzzer will turn off.',
    icon: BellOff
  }
];

const initialStatus = {
  connectionStatus: 'checking',
  arduinoReady: false,
  currentAlertLevel: 'OFF',
  port: 'Unknown',
  baudRate: 0,
  lastArduinoMessage: null
};

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function ArduinoControl() {
  const [status, setStatus] =
    useState(initialStatus);

  const [pendingLevel, setPendingLevel] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  const [errorMessage, setErrorMessage] =
    useState('');

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/arduino/status`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json'
          }
        }
      );

      const result =
        await readResponse(response);

      if (!response.ok) {
        throw new Error(
          result.message ||
            'Unable to read Arduino status.'
        );
      }

      setStatus(previousStatus => ({
        ...previousStatus,
        ...result
      }));

      setErrorMessage('');
    } catch (error) {
      setStatus(previousStatus => ({
        ...previousStatus,
        connectionStatus: 'disconnected',
        arduinoReady: false
      }));

      setErrorMessage(
        error.message ||
          'Unable to connect to the Express server.'
      );
    }
  }, []);

  useEffect(() => {
    loadStatus();

    const statusInterval =
      window.setInterval(
        loadStatus,
        2500
      );

    return () => {
      window.clearInterval(
        statusInterval
      );
    };
  }, [loadStatus]);

  async function sendAlert(level) {
    setPendingLevel(level);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch(
        `${API_URL}/api/arduino/alert`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify({
            level
          })
        }
      );

      const result =
        await readResponse(response);

      if (response.status === 401) {
        throw new Error(
          'Your login session has expired. Please log in again.'
        );
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            'Unable to send the alert command.'
        );
      }

      setStatus(previousStatus => ({
        ...previousStatus,
        currentAlertLevel:
          result.level || level
      }));

      setSuccessMessage(
        result.message ||
          `${level} command sent to Arduino.`
      );

      window.setTimeout(() => {
        loadStatus();
      }, 400);
    } catch (error) {
      setErrorMessage(
        error.message ||
          'Unable to send the command to Arduino.'
      );
    } finally {
      setPendingLevel('');
    }
  }

  const isConnected =
    status.connectionStatus ===
    'connected';

  const isReady =
    isConnected &&
    status.arduinoReady;

  const currentLevel =
    status.currentAlertLevel ||
    'OFF';

  return (
    <section className="arduino-panel">
      <div className="arduino-panel-header">
        <div>
          <span className="section-tag">
            Live Hardware
          </span>

          <h2>
            Arduino Emergency Control
          </h2>

          <p>
            Control the connected warning
            lights and buzzer through the
            protected Express API.
          </p>
        </div>

        <button
          type="button"
          className="refresh-status-button"
          onClick={loadStatus}
          disabled={Boolean(pendingLevel)}
        >
          <RefreshCw size={17} />
          Refresh Status
        </button>
      </div>

      <div className="hardware-status-row">
        <div>
          <span>Connection</span>

          <strong
            className={
              isReady
                ? 'connected-text'
                : 'disconnected-text'
            }
          >
            {isReady
              ? 'Connected'
              : status.connectionStatus}
          </strong>
        </div>

        <div>
          <span>Serial Port</span>

          <strong>
            {status.port || 'Unknown'}
          </strong>
        </div>

        <div>
          <span>Baud Rate</span>

          <strong>
            {status.baudRate || 0}
          </strong>
        </div>

        <div>
          <span>Current Level</span>

          <strong
            className={`level-${String(
              currentLevel
            ).toLowerCase()}`}
          >
            {currentLevel}
          </strong>
        </div>
      </div>

      <div className="alert-control-grid">
        {alertLevels.map(item => {
          const Icon = item.icon;

          const isActive =
            currentLevel === item.level;

          const isPending =
            pendingLevel === item.level;

          return (
            <button
              type="button"
              key={item.level}
              className={`alert-control-card ${item.level.toLowerCase()} ${
                isActive ? 'active' : ''
              }`}
              disabled={
                !isReady ||
                Boolean(pendingLevel)
              }
              onClick={() =>
                sendAlert(item.level)
              }
            >
              <Icon size={25} />

              <span>
                <strong>
                  {isPending
                    ? 'Sending...'
                    : item.label}
                </strong>

                <small>
                  {item.description}
                </small>
              </span>

              {isActive && (
                <small className="active-alert-label">
                  Active
                </small>
              )}
            </button>
          );
        })}
      </div>

      {!isReady && (
        <div className="hardware-message error-message">
          <Activity size={18} />

          <span>
            Arduino is not ready. Start
            the Express server, confirm
            COM3, and close the Arduino
            Serial Monitor.
          </span>
        </div>
      )}

      {successMessage && (
        <div className="hardware-message success-message">
          <CircleCheck size={18} />

          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="hardware-message error-message">
          <CircleAlert size={18} />

          <span>{errorMessage}</span>
        </div>
      )}

      <div className="arduino-response-box">
        <span>Last Arduino Response</span>

        <pre>
          {status.lastArduinoMessage
            ? JSON.stringify(
                status.lastArduinoMessage,
                null,
                2
              )
            : 'No Arduino response received yet.'}
        </pre>
      </div>
    </section>
  );
}

export default ArduinoControl;