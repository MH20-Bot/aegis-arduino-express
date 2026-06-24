import {
  useCallback,
  useEffect,
  useState
} from 'react';

import {
  apiRequest
} from '../services/api.js';

const defaultReadings = {
  temperatureC: 24,
  humidityPercent: 45,
  smokeLevel: 8,
  airQualitySignal: 18
};

const demoPresets = {
  GOOD: {
    temperatureC: 24,
    humidityPercent: 45,
    smokeLevel: 8,
    airQualitySignal: 18
  },

  MODERATE: {
    temperatureC: 31,
    humidityPercent: 70,
    smokeLevel: 32,
    airQualitySignal: 52
  },

  HIGH: {
    temperatureC: 34,
    humidityPercent: 78,
    smokeLevel: 85,
    airQualitySignal: 82
  }
};

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  return new Date(
    value
  ).toLocaleString();
}

function EnvironmentalHealthMonitor() {
  const [
    readings,
    setReadings
  ] = useState(
    defaultReadings
  );

  const [
    source,
    setSource
  ] = useState('MANUAL');

  const [
    result,
    setResult
  ] = useState(null);

  const [
    history,
    setHistory
  ] = useState([]);

  const [
    busy,
    setBusy
  ] = useState(false);

  const [
    message,
    setMessage
  ] = useState('');

  const [
    error,
    setError
  ] = useState('');

  const loadHistory =
    useCallback(
      async () => {
        try {
          const response =
            await apiRequest(
              '/api/environmental-monitor/history'
            );

          setHistory(
            response.readings || []
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

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function updateReading(
    field,
    value
  ) {
    setSource('MANUAL');

    setReadings(
      previous => ({
        ...previous,
        [field]:
          Number(value)
      })
    );
  }

  function applyPreset(
    presetName
  ) {
    setReadings({
      ...demoPresets[
        presetName
      ]
    });

    setSource('DEMO');
    setResult(null);
    setMessage(
      `${presetName} demonstration values loaded.`
    );
    setError('');
  }

  async function runAnalysis() {
    setBusy(true);
    setMessage('');
    setError('');

    try {
      const response =
        await apiRequest(
          '/api/environmental-monitor/analyze',
          {
            method: 'POST',

            body:
              JSON.stringify({
                ...readings,
                source
              })
          }
        );

      setResult(
        response.reading
      );

      setMessage(
        response.message
      );

      await loadHistory();
    } catch (
      requestError
    ) {
      setError(
        requestError.message
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="environment-hero">
        <div className="environment-container">
          <span className="environment-kicker">
            AI and IoT Health Feature
          </span>

          <h1>
            AI Environmental Health Monitor
          </h1>

          <p>
            Analyze room temperature,
            humidity, smoke signals, and
            air quality signals. The system
            calculates an environmental
            warning level, saves the result,
            and activates the connected
            Arduino alert.
          </p>
        </div>
      </section>

      <section className="environment-section">
        <div className="environment-container">
          <div className="environment-layout">
            <section className="environment-card">
              <span className="environment-kicker">
                Environmental Input
              </span>

              <h2>
                Current Room Readings
              </h2>

              <div className="environment-input-grid">
                <ReadingInput
                  label="Temperature"
                  suffix="°C"
                  value={
                    readings.temperatureC
                  }
                  minimum={-20}
                  maximum={80}
                  onChange={
                    value =>
                      updateReading(
                        'temperatureC',
                        value
                      )
                  }
                />

                <ReadingInput
                  label="Humidity"
                  suffix="%"
                  value={
                    readings.humidityPercent
                  }
                  minimum={0}
                  maximum={100}
                  onChange={
                    value =>
                      updateReading(
                        'humidityPercent',
                        value
                      )
                  }
                />

                <ReadingInput
                  label="Smoke Signal"
                  suffix="/100"
                  value={
                    readings.smokeLevel
                  }
                  minimum={0}
                  maximum={100}
                  onChange={
                    value =>
                      updateReading(
                        'smokeLevel',
                        value
                      )
                  }
                />

                <ReadingInput
                  label="Air Quality Signal"
                  suffix="/100"
                  value={
                    readings.airQualitySignal
                  }
                  minimum={0}
                  maximum={100}
                  onChange={
                    value =>
                      updateReading(
                        'airQualitySignal',
                        value
                      )
                  }
                />
              </div>

              <div className="environment-source">
                Reading Source:
                <strong>
                  {source}
                </strong>
              </div>

              <button
                type="button"
                className="environment-primary-button environment-full-button"
                disabled={busy}
                onClick={
                  runAnalysis
                }
              >
                {busy
                  ? 'Analyzing Environment...'
                  : 'Run Environmental Check'}
              </button>
            </section>

            <aside className="environment-card">
              <span className="environment-kicker">
                Safe Hackathon Testing
              </span>

              <h2>
                Demonstration Presets
              </h2>

              <p>
                Use these presets to
                demonstrate every hardware
                alert level without using
                real smoke, fire, or unsafe
                room conditions.
              </p>

              <div className="environment-preset-list">
                <button
                  type="button"
                  className="environment-preset good"
                  onClick={() =>
                    applyPreset(
                      'GOOD'
                    )
                  }
                >
                  <strong>
                    Safe Room
                  </strong>

                  <span>
                    Trigger GOOD
                  </span>
                </button>

                <button
                  type="button"
                  className="environment-preset moderate"
                  onClick={() =>
                    applyPreset(
                      'MODERATE'
                    )
                  }
                >
                  <strong>
                    Poor Air
                  </strong>

                  <span>
                    Trigger MODERATE
                  </span>
                </button>

                <button
                  type="button"
                  className="environment-preset high"
                  onClick={() =>
                    applyPreset(
                      'HIGH'
                    )
                  }
                >
                  <strong>
                    Smoke Alert
                  </strong>

                  <span>
                    Trigger HIGH
                  </span>
                </button>
              </div>

              <div className="environment-demo-warning">
                The HIGH preset is a
                software demonstration.
                Do not create real smoke or
                fire for testing.
              </div>
            </aside>
          </div>

          {result && (
            <section
              className={`environment-result-card ${result.level.toLowerCase()}`}
            >
              <div className="environment-result-heading">
                <div>
                  <span className="environment-kicker">
                    Analysis Complete
                  </span>

                  <h2>
                    Environmental Result
                  </h2>
                </div>

                <span className="environment-result-level">
                  {result.level}
                </span>
              </div>

              <div className="environment-result-grid">
                <ResultMetric
                  label="Risk Score"
                  value={`${result.riskScore}/100`}
                />

                <ResultMetric
                  label="Temperature"
                  value={`${result.readings.temperatureC}°C`}
                />

                <ResultMetric
                  label="Humidity"
                  value={`${result.readings.humidityPercent}%`}
                />

                <ResultMetric
                  label="Smoke"
                  value={`${result.readings.smokeLevel}/100`}
                />

                <ResultMetric
                  label="Air Quality"
                  value={`${result.readings.airQualitySignal}/100`}
                />

                <ResultMetric
                  label="Arduino"
                  value={
                    result.hardware
                      .acknowledged
                      ? `${result.hardware.command} confirmed`
                      : 'Not confirmed'
                  }
                />
              </div>

              <p>
                {result.summary}
              </p>

              <div className="environment-guidance-list">
                <h3>
                  Recommended Actions
                </h3>

                {result.guidance.map(
                  item => (
                    <div key={item}>
                      {item}
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          <section className="environment-card">
            <div className="environment-result-heading">
              <div>
                <span className="environment-kicker">
                  MongoDB Records
                </span>

                <h2>
                  Environmental History
                </h2>
              </div>

              <span>
                {history.length} records
              </span>
            </div>

            {history.length === 0 ? (
              <div className="environment-empty">
                No environmental readings
                have been saved.
              </div>
            ) : (
              <div className="environment-table-wrapper">
                <table className="environment-table">
                  <thead>
                    <tr>
                      <th>
                        Date
                      </th>

                      <th>
                        Source
                      </th>

                      <th>
                        Temperature
                      </th>

                      <th>
                        Humidity
                      </th>

                      <th>
                        Smoke
                      </th>

                      <th>
                        Air Quality
                      </th>

                      <th>
                        Result
                      </th>

                      <th>
                        Arduino
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map(
                      item => (
                        <tr
                          key={
                            item._id
                          }
                        >
                          <td>
                            {formatDate(
                              item.createdAt
                            )}
                          </td>

                          <td>
                            {item.source}
                          </td>

                          <td>
                            {item.readings.temperatureC}°C
                          </td>

                          <td>
                            {item.readings.humidityPercent}%
                          </td>

                          <td>
                            {item.readings.smokeLevel}
                          </td>

                          <td>
                            {item.readings.airQualitySignal}
                          </td>

                          <td>
                            {item.level}
                          </td>

                          <td>
                            {item.hardware
                              .acknowledged
                              ? item.hardware.command
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

          {message && (
            <div className="environment-message success">
              {message}
            </div>
          )}

          {error && (
            <div className="environment-message error">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="environment-warning">
        <div className="environment-container">
          This prototype provides an
          environmental warning indicator.
          Manual and demonstration readings
          are not certified sensor
          measurements. Real sensors require
          proper calibration.
        </div>
      </section>
    </>
  );
}

function ReadingInput({
  label,
  suffix,
  value,
  minimum,
  maximum,
  onChange
}) {
  return (
    <label className="environment-reading-input">
      <span>
        {label}
      </span>

      <div>
        <input
          type="number"
          min={minimum}
          max={maximum}
          value={value}
          onChange={
            event =>
              onChange(
                event.target.value
              )
          }
        />

        <strong>
          {suffix}
        </strong>
      </div>
    </label>
  );
}

function ResultMetric({
  label,
  value
}) {
  return (
    <article className="environment-result-metric">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </article>
  );
}

export default EnvironmentalHealthMonitor;