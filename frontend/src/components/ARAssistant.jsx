
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  apiRequest
} from '../services/api.js';

const guidanceModes = {
  EMERGENCY_GUIDANCE: {
    title: 'Emergency Guidance',
    targetFeature: 'emergency-alerts',
    targetLabel: 'Open Emergency Alerts',

    steps: [
      'Move to a safe location when possible.',
      'Check the visible area for immediate hazards.',
      'Open Emergency Alerts and confirm the warning level.',
      'Share your location with a trusted contact.'
    ]
  },

  POSTURE_GUIDANCE: {
    title: 'Posture Guidance',
    targetFeature: 'ai-posture-pain-analyzer',
    targetLabel: 'Open Posture Analyzer',

    steps: [
      'Place your face inside the upper guide.',
      'Align both shoulders with the horizontal line.',
      'Keep your upper body centred inside the frame.',
      'Open the posture analyzer for measured results.'
    ]
  },

  ROOM_SAFETY: {
    title: 'Room Safety Guidance',
    targetFeature: 'smart-home-sensors',
    targetLabel: 'Open Environmental Monitor',

    steps: [
      'Point the camera toward the surrounding room.',
      'Check the visible area for possible hazards.',
      'Move away when the environment appears unsafe.',
      'Open the environmental monitor for sensor analysis.'
    ]
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

function ARAssistant() {
  const videoRef =
    useRef(null);

  const streamRef =
    useRef(null);

  const [
    selectedMode,
    setSelectedMode
  ] = useState(
    'POSTURE_GUIDANCE'
  );

  const [
    cameraActive,
    setCameraActive
  ] = useState(false);

  const [
    session,
    setSession
  ] = useState(null);

  const [
    stepIndex,
    setStepIndex
  ] = useState(0);

  const [
    completedSteps,
    setCompletedSteps
  ] = useState([]);

  const [
    history,
    setHistory
  ] = useState([]);

  const [
    busy,
    setBusy
  ] = useState(false);

  const [
    historyLoading,
    setHistoryLoading
  ] = useState(true);

  const [
    message,
    setMessage
  ] = useState('');

  const [
    error,
    setError
  ] = useState('');

  const mode =
    guidanceModes[
      selectedMode
    ];

  const loadHistory =
    useCallback(
      async () => {
        try {
          const result =
            await apiRequest(
              '/api/ar-assistant/history'
            );

          setHistory(
            Array.isArray(
              result.sessions
            )
              ? result.sessions
              : []
          );
        } catch (
          requestError
        ) {
          setError(
            requestError.message ||
            'AR guidance history could not be loaded.'
          );
        } finally {
          setHistoryLoading(false);
        }
      },
      []
    );

  function stopCamera() {
    if (
      streamRef.current
    ) {
      streamRef.current
        .getTracks()
        .forEach(
          track => {
            track.stop();
          }
        );

      streamRef.current =
        null;
    }

    if (
      videoRef.current
    ) {
      videoRef.current.srcObject =
        null;
    }

    setCameraActive(false);
  }

  useEffect(() => {
    loadHistory();

    return () => {
      if (
        streamRef.current
      ) {
        streamRef.current
          .getTracks()
          .forEach(
            track => {
              track.stop();
            }
          );
      }
    };
  }, [loadHistory]);

  async function startCamera() {
    setMessage('');
    setError('');

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          'Camera access is not supported in this browser.'
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',

            width: {
              ideal: 1280
            },

            height: {
              ideal: 720
            }
          },

          audio: false
        });

      streamRef.current =
        stream;

      if (
        videoRef.current
      ) {
        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();
      }

      setCameraActive(true);

      setMessage(
        'Camera started successfully.'
      );
    } catch (
      cameraError
    ) {
      console.error(
        'Camera error:',
        cameraError
      );

      setError(
        cameraError.message ||
        'Camera permission was denied or the camera is unavailable.'
      );
    }
  }

  async function startGuidance() {
    setBusy(true);
    setMessage('');
    setError('');
    setStepIndex(0);
    setCompletedSteps([]);

    try {
      const result =
        await apiRequest(
          '/api/ar-assistant/start',
          {
            method: 'POST',

            body: JSON.stringify({
              mode: selectedMode
            })
          }
        );

      setSession(
        result.session ||
        null
      );

      setMessage(
        result.message ||
        'The AR guidance session started.'
      );
    } catch (
      requestError
    ) {
      setError(
        requestError.message ||
        'The AR guidance session could not be started.'
      );
    } finally {
      setBusy(false);
    }
  }

  function completeCurrentStep() {
    const currentStep =
      mode.steps[
        stepIndex
      ];

    setCompletedSteps(
      previousSteps => {
        if (
          previousSteps.includes(
            currentStep
          )
        ) {
          return previousSteps;
        }

        return [
          ...previousSteps,
          currentStep
        ];
      }
    );

    if (
      stepIndex <
      mode.steps.length - 1
    ) {
      setStepIndex(
        previousIndex =>
          previousIndex + 1
      );
    }
  }

  async function completeGuidance() {
    if (!session?._id) {
      setError(
        'Start an AR guidance session first.'
      );

      return;
    }

    const currentStep =
      mode.steps[
        stepIndex
      ];

    const allSteps =
      Array.from(
        new Set([
          ...completedSteps,
          currentStep
        ])
      );

    setBusy(true);
    setMessage('');
    setError('');

    try {
      const result =
        await apiRequest(
          `/api/ar-assistant/${session._id}/complete`,
          {
            method: 'PATCH',

            body: JSON.stringify({
              completedSteps:
                allSteps
            })
          }
        );

      setSession(null);
      setStepIndex(0);
      setCompletedSteps([]);

      setMessage(
        result.message ||
        'The AR guidance session was completed.'
      );

      await loadHistory();
    } catch (
      requestError
    ) {
      setError(
        requestError.message ||
        'The AR guidance session could not be completed.'
      );
    } finally {
      setBusy(false);
    }
  }

  function changeMode(
    modeKey
  ) {
    if (session) {
      return;
    }

    setSelectedMode(
      modeKey
    );

    setStepIndex(0);
    setCompletedSteps([]);
    setMessage('');
    setError('');
  }

  return (
    <>
      <section className="nextgen-hero ar-theme">
        <div className="nextgen-container">
          <span className="nextgen-kicker">
            Camera Based Visual Guidance
          </span>

          <h1>
            AR Assistant
          </h1>

          <p>
            Display real time visual instructions over a live camera view for emergency guidance, posture positioning, and room safety workflows.
          </p>
        </div>
      </section>

      <section className="nextgen-section">
        <div className="nextgen-container">
          <div className="ar-layout">
            <section className="nextgen-card">
              <div className="nextgen-heading-row">
                <div>
                  <span className="nextgen-kicker">
                    Live AR Workspace
                  </span>

                  <h2>
                    Camera Overlay
                  </h2>
                </div>

                <span
                  className={`nextgen-status ${
                    cameraActive
                      ? 'online'
                      : 'offline'
                  }`}
                >
                  {cameraActive
                    ? 'CAMERA ACTIVE'
                    : 'CAMERA OFF'}
                </span>
              </div>

              <div className="ar-camera">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                />

                {!cameraActive && (
                  <div className="ar-placeholder">
                    <strong>
                      Camera is off
                    </strong>

                    <span>
                      Start the camera to display visual guidance.
                    </span>
                  </div>
                )}

                {cameraActive && (
                  <>
                    <div className="ar-corner top-left" />
                    <div className="ar-corner top-right" />
                    <div className="ar-corner bottom-left" />
                    <div className="ar-corner bottom-right" />

                    <div className="ar-centre-line" />

                    <div className="ar-overlay-message">
                      <span>
                        Step {stepIndex + 1} of {mode.steps.length}
                      </span>

                      <strong>
                        {mode.steps[
                          stepIndex
                        ]}
                      </strong>
                    </div>
                  </>
                )}
              </div>

              <div className="nextgen-button-row">
                {!cameraActive ? (
                  <button
                    type="button"
                    className="nextgen-primary-button"
                    onClick={startCamera}
                  >
                    Start Camera
                  </button>
                ) : (
                  <button
                    type="button"
                    className="nextgen-secondary-button"
                    onClick={stopCamera}
                  >
                    Stop Camera
                  </button>
                )}

                {!session ? (
                  <button
                    type="button"
                    className="nextgen-primary-button"
                    disabled={busy}
                    onClick={startGuidance}
                  >
                    {busy
                      ? 'Starting Session...'
                      : 'Start AR Guidance'}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="nextgen-secondary-button"
                      disabled={busy}
                      onClick={
                        completeCurrentStep
                      }
                    >
                      Complete Current Step
                    </button>

                    <button
                      type="button"
                      className="nextgen-primary-button"
                      disabled={busy}
                      onClick={
                        completeGuidance
                      }
                    >
                      {busy
                        ? 'Saving Session...'
                        : 'Finish Session'}
                    </button>
                  </>
                )}
              </div>
            </section>

            <aside className="nextgen-card">
              <span className="nextgen-kicker">
                Guidance Mode
              </span>

              <h2>
                Select Workflow
              </h2>

              <div className="ar-mode-list">
                {Object.entries(
                  guidanceModes
                ).map(
                  ([
                    modeKey,
                    modeValue
                  ]) => (
                    <button
                      type="button"
                      key={modeKey}
                      className={
                        selectedMode ===
                        modeKey
                          ? 'active'
                          : ''
                      }
                      disabled={
                        Boolean(
                          session
                        )
                      }
                      onClick={() =>
                        changeMode(
                          modeKey
                        )
                      }
                    >
                      <strong>
                        {modeValue.title}
                      </strong>

                      <span>
                        {modeValue.steps.length} steps
                      </span>
                    </button>
                  )
                )}
              </div>

              <div className="ar-step-list">
                {mode.steps.map(
                  (
                    step,
                    index
                  ) => {
                    let stepClass =
                      '';

                    if (
                      completedSteps.includes(
                        step
                      )
                    ) {
                      stepClass =
                        'complete';
                    } else if (
                      index ===
                      stepIndex
                    ) {
                      stepClass =
                        'active';
                    }

                    return (
                      <div
                        key={step}
                        className={
                          stepClass
                        }
                      >
                        <span>
                          {index + 1}
                        </span>

                        <p>
                          {step}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>

              <Link
                to={`/app/features/${mode.targetFeature}`}
                className="nextgen-secondary-button nextgen-full-button"
              >
                {mode.targetLabel}
              </Link>
            </aside>
          </div>

          <section className="nextgen-card">
            <div className="nextgen-heading-row">
              <div>
                <span className="nextgen-kicker">
                  Session Records
                </span>

                <h2>
                  AR History
                </h2>
              </div>

              <span>
                {history.length} sessions
              </span>
            </div>

            {historyLoading ? (
              <div className="nextgen-empty">
                Loading AR guidance history...
              </div>
            ) : history.length === 0 ? (
              <div className="nextgen-empty">
                No AR guidance sessions have been completed.
              </div>
            ) : (
              <div className="nextgen-table-wrapper">
                <table className="nextgen-table">
                  <thead>
                    <tr>
                      <th>
                        Date
                      </th>

                      <th>
                        Mode
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Steps
                      </th>

                      <th>
                        Duration
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map(
                      item => (
                        <tr key={item._id}>
                          <td>
                            {formatDate(
                              item.createdAt
                            )}
                          </td>

                          <td>
                            {item.mode ||
                              'Not available'}
                          </td>

                          <td>
                            {item.status ||
                              'Not available'}
                          </td>

                          <td>
                            {Array.isArray(
                              item.completedSteps
                            )
                              ? item.completedSteps.length
                              : 0}
                          </td>

                          <td>
                            {item.durationSeconds ??
                              0}{' '}
                            seconds
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
            <div className="nextgen-message success">
              {message}
            </div>
          )}

          {error && (
            <div className="nextgen-message error">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="nextgen-warning">
        <div className="nextgen-container">
          This prototype provides visual workflow guidance only. It does not replace emergency services or professional medical instructions.
        </div>
      </section>
    </>
  );
}

export default ARAssistant;

