import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Mic,
  RefreshCw,
  ShieldCheck,
  Square,
  Volume2,
  Waves
} from 'lucide-react';

import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  apiRequest
} from '../services/api.js';

const ANALYSIS_DURATION_SECONDS = 10;

function selectRecordingMimeType() {
  if (
    typeof MediaRecorder ===
    'undefined'
  ) {
    return '';
  }

  const supportedTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4'
  ];

  return (
    supportedTypes.find(type =>
      MediaRecorder.isTypeSupported(type)
    ) || ''
  );
}

function calculateStandardDeviation(
  values,
  average
) {
  if (!values.length) {
    return 0;
  }

  const variance =
    values.reduce(
      (total, value) =>
        total +
        Math.pow(
          value - average,
          2
        ),
      0
    ) / values.length;

  return Math.sqrt(variance);
}

function buildMetrics({
  volumeSamples,
  peakVolume,
  silenceFrames,
  clippingFrames,
  totalFrames
}) {
  const sampleCount =
    volumeSamples.length;

  const averageVolume =
    sampleCount > 0
      ? volumeSamples.reduce(
          (total, value) =>
            total + value,
          0
        ) / sampleCount
      : 0;

  const volumeVariation =
    calculateStandardDeviation(
      volumeSamples,
      averageVolume
    );

  return {
    averageVolume:
      Number(
        averageVolume.toFixed(5)
      ),

    peakVolume:
      Number(
        peakVolume.toFixed(5)
      ),

    silenceRatio:
      Number(
        (
          totalFrames > 0
            ? silenceFrames /
              totalFrames
            : 0
        ).toFixed(5)
      ),

    volumeVariation:
      Number(
        volumeVariation.toFixed(5)
      ),

    clippingRatio:
      Number(
        (
          totalFrames > 0
            ? clippingFrames /
              totalFrames
            : 0
        ).toFixed(5)
      ),

    sampleCount
  };
}

function VoiceAnalysis() {
  const [
    recording,
    setRecording
  ] = useState(false);

  const [
    analyzing,
    setAnalyzing
  ] = useState(false);

  const [
    secondsRemaining,
    setSecondsRemaining
  ] = useState(
    ANALYSIS_DURATION_SECONDS
  );

  const [
    liveVolume,
    setLiveVolume
  ] = useState(0);

  const [
    result,
    setResult
  ] = useState(null);

  const [
    successMessage,
    setSuccessMessage
  ] = useState('');

  const [
    errorMessage,
    setErrorMessage
  ] = useState('');

  const [
    audioUrl,
    setAudioUrl
  ] = useState('');

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const audioContextRef =
    useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef =
    useRef(null);

  const countdownIntervalRef =
    useRef(null);
  const stopTimeoutRef =
    useRef(null);

  const audioChunksRef =
    useRef([]);
  const volumeSamplesRef =
    useRef([]);

  const silenceFramesRef =
    useRef(0);
  const clippingFramesRef =
    useRef(0);
  const totalFramesRef =
    useRef(0);
  const peakVolumeRef =
    useRef(0);
  const recordingStartedAtRef =
    useRef(0);

  function clearTimers() {
    if (
      countdownIntervalRef.current
    ) {
      window.clearInterval(
        countdownIntervalRef.current
      );

      countdownIntervalRef.current =
        null;
    }

    if (stopTimeoutRef.current) {
      window.clearTimeout(
        stopTimeoutRef.current
      );

      stopTimeoutRef.current = null;
    }
  }

  function releaseMicrophone() {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(
        animationFrameRef.current
      );

      animationFrameRef.current =
        null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach(track => {
          track.stop();
        });

      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current
        .close()
        .catch(() => {});

      audioContextRef.current =
        null;
    }

    analyserRef.current = null;
    setLiveVolume(0);
  }

  function resetMetricReferences() {
    audioChunksRef.current = [];
    volumeSamplesRef.current = [];

    silenceFramesRef.current = 0;
    clippingFramesRef.current = 0;
    totalFramesRef.current = 0;
    peakVolumeRef.current = 0;
  }

  function analyzeAudioFrame() {
    const analyser =
      analyserRef.current;

    if (!analyser) {
      return;
    }

    const audioData =
      new Float32Array(
        analyser.fftSize
      );

    analyser.getFloatTimeDomainData(
      audioData
    );

    let squaredTotal = 0;
    let framePeak = 0;

    for (
      let index = 0;
      index < audioData.length;
      index += 1
    ) {
      const absoluteValue =
        Math.abs(audioData[index]);

      squaredTotal +=
        audioData[index] *
        audioData[index];

      if (
        absoluteValue > framePeak
      ) {
        framePeak = absoluteValue;
      }
    }

    const rootMeanSquare =
      Math.sqrt(
        squaredTotal /
          audioData.length
      );

    volumeSamplesRef.current.push(
      rootMeanSquare
    );

    totalFramesRef.current += 1;

    if (rootMeanSquare < 0.015) {
      silenceFramesRef.current += 1;
    }

    if (framePeak > 0.98) {
      clippingFramesRef.current += 1;
    }

    if (
      framePeak >
      peakVolumeRef.current
    ) {
      peakVolumeRef.current =
        framePeak;
    }

    setLiveVolume(
      Math.min(
        100,
        Math.round(
          rootMeanSquare * 500
        )
      )
    );

    animationFrameRef.current =
      window.requestAnimationFrame(
        analyzeAudioFrame
      );
  }

  async function submitAnalysis(
    durationSeconds
  ) {
    setAnalyzing(true);

    const metrics = buildMetrics({
      volumeSamples:
        volumeSamplesRef.current,

      peakVolume:
        peakVolumeRef.current,

      silenceFrames:
        silenceFramesRef.current,

      clippingFrames:
        clippingFramesRef.current,

      totalFrames:
        totalFramesRef.current
    });

    try {
      const response =
        await apiRequest(
          '/api/voice-analysis/analyze',
          {
            method: 'POST',

            body: JSON.stringify({
              durationSeconds,
              metrics
            })
          }
        );

      setResult({
        ...response.analysis,
        hardware:
          response.hardware
      });

      setSuccessMessage(
        response.message
      );
    } catch (error) {
      setErrorMessage(
        error.message ||
          'Voice analysis could not be completed.'
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function stopRecording() {
    clearTimers();

    const recorder =
      recorderRef.current;

    if (
      recorder &&
      recorder.state !== 'inactive'
    ) {
      recorder.stop();
    }

    setRecording(false);
  }

  async function startRecording() {
    setErrorMessage('');
    setSuccessMessage('');
    setResult(null);
    setSecondsRemaining(
      ANALYSIS_DURATION_SECONDS
    );

    if (audioUrl) {
      URL.revokeObjectURL(
        audioUrl
      );

      setAudioUrl('');
    }

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices
        .getUserMedia
    ) {
      setErrorMessage(
        'Microphone access is not supported by this browser.'
      );

      return;
    }

    if (
      typeof MediaRecorder ===
      'undefined'
    ) {
      setErrorMessage(
        'Audio recording is not supported by this browser.'
      );

      return;
    }

    resetMetricReferences();

    try {
      const stream =
        await navigator.mediaDevices
          .getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: false,
              channelCount: 1
            },

            video: false
          });

      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      const audioContext =
        new AudioContextClass();

      audioContextRef.current =
        audioContext;

      const source =
        audioContext
          .createMediaStreamSource(
            stream
          );

      const analyser =
        audioContext.createAnalyser();

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant =
        0.65;

      source.connect(analyser);

      analyserRef.current =
        analyser;

      const mimeType =
        selectRecordingMimeType();

      const recorder =
        mimeType
          ? new MediaRecorder(
              stream,
              {
                mimeType
              }
            )
          : new MediaRecorder(
              stream
            );

      recorderRef.current =
        recorder;

      recorder.ondataavailable =
        event => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(
              event.data
            );
          }
        };

      recorder.onerror =
        event => {
          setErrorMessage(
            event.error?.message ||
              'An audio recording error occurred.'
          );

          clearTimers();
          releaseMicrophone();
          setRecording(false);
        };

      recorder.onstop =
        async () => {
          const durationSeconds =
            Math.max(
              1,
              Math.round(
                (
                  Date.now() -
                  recordingStartedAtRef
                    .current
                ) / 1000
              )
            );

          const recordingBlob =
            new Blob(
              audioChunksRef.current,
              {
                type:
                  recorder.mimeType ||
                  'audio/webm'
              }
            );

          if (
            recordingBlob.size > 0
          ) {
            const newAudioUrl =
              URL.createObjectURL(
                recordingBlob
              );

            setAudioUrl(
              newAudioUrl
            );
          }

          releaseMicrophone();

          await submitAnalysis(
            durationSeconds
          );
        };

      recordingStartedAtRef.current =
        Date.now();

      recorder.start(250);

      setRecording(true);

      analyzeAudioFrame();

      countdownIntervalRef.current =
        window.setInterval(() => {
          setSecondsRemaining(
            previous =>
              Math.max(
                0,
                previous - 1
              )
          );
        }, 1000);

      stopTimeoutRef.current =
        window.setTimeout(
          stopRecording,
          ANALYSIS_DURATION_SECONDS *
            1000
        );
    } catch (error) {
      releaseMicrophone();
      clearTimers();

      if (
        error.name ===
        'NotAllowedError'
      ) {
        setErrorMessage(
          'Microphone permission was denied. Allow microphone access and try again.'
        );

        return;
      }

      setErrorMessage(
        error.message ||
          'The microphone could not be started.'
      );
    }
  }

  async function turnOffHardware() {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response =
        await apiRequest(
          '/api/arduino/alert',
          {
            method: 'POST',

            body: JSON.stringify({
              level: 'OFF'
            })
          }
        );

      setSuccessMessage(
        response.message
      );
    } catch (error) {
      setErrorMessage(
        error.message
      );
    }
  }

  useEffect(() => {
    return () => {
      clearTimers();
      releaseMicrophone();

      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl
        );
      }
    };
  }, [audioUrl]);

  const resultLevelClass =
    result
      ? result.level.toLowerCase()
      : '';

  return (
    <>
      <section className="protected-feature-hero">
        <div className="container">
          <div className="protected-feature-title">
            <span className="feature-page-icon">
              <Mic size={36} />
            </span>

            <div>
              <span className="section-tag">
                Protected Feature
              </span>

              <h1>
                Voice Analysis
              </h1>

              <p>
                Record a short voice sample,
                analyze the signal, activate
                the connected Arduino alert,
                and save the result in your
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="website-section">
        <div className="container voice-analysis-layout">
          <div className="voice-analysis-card">
            <div className="voice-card-heading">
              <div>
                <span className="section-tag">
                  Voice Check
                </span>

                <h2>
                  Record a 10 Second Sample
                </h2>
              </div>

              <div
                className={`microphone-status ${
                  recording
                    ? 'recording'
                    : ''
                }`}
              >
                <Mic size={17} />

                {recording
                  ? 'Recording'
                  : 'Ready'}
              </div>
            </div>

            <div className="voice-instructions">
              <ShieldCheck size={22} />

              <div>
                <strong>
                  Recording Instructions
                </strong>

                <p>
                  Sit comfortably, keep the
                  microphone about 20 to 30
                  centimetres away, and speak
                  naturally in a quiet room.
                </p>
              </div>
            </div>

            <div className="sample-sentence">
              <span>
                Read this sentence
              </span>

              <p>
                Today I am completing a
                short voice and breathing
                check for the AEGIS health
                assistant.
              </p>
            </div>

            <div className="voice-meter">
              <div className="voice-meter-header">
                <span>
                  <Volume2 size={17} />
                  Live Input Level
                </span>

                <strong>
                  {liveVolume}%
                </strong>
              </div>

              <div className="voice-meter-track">
                <div
                  className="voice-meter-fill"
                  style={{
                    width:
                      `${liveVolume}%`
                  }}
                />
              </div>
            </div>

            {recording && (
              <div className="voice-countdown">
                <Clock3 size={21} />

                <div>
                  <strong>
                    {secondsRemaining}
                  </strong>

                  <span>
                    seconds remaining
                  </span>
                </div>
              </div>
            )}

            <div className="voice-actions">
              {!recording ? (
                <button
                  type="button"
                  className="primary-button"
                  disabled={analyzing}
                  onClick={startRecording}
                >
                  {analyzing ? (
                    <>
                      <RefreshCw
                        size={18}
                        className="spinning-icon"
                      />
                      Analyzing Signal...
                    </>
                  ) : (
                    <>
                      <Mic size={18} />
                      Start Voice Analysis
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="stop-recording-button"
                  onClick={stopRecording}
                >
                  <Square size={17} />
                  Stop Recording
                </button>
              )}
            </div>

            {audioUrl && (
              <div className="voice-playback">
                <span>
                  Recorded Sample
                </span>

                <audio
                  controls
                  src={audioUrl}
                />
              </div>
            )}

            {errorMessage && (
              <div className="hardware-message error-message">
                <AlertTriangle
                  size={18}
                />

                <span>
                  {errorMessage}
                </span>
              </div>
            )}

            {successMessage && (
              <div className="hardware-message success-message">
                <CheckCircle2
                  size={18}
                />

                <span>
                  {successMessage}
                </span>
              </div>
            )}
          </div>

          <aside className="voice-result-panel">
            {!result ? (
              <div className="voice-empty-result">
                <Waves size={42} />

                <h3>
                  No Analysis Yet
                </h3>

                <p>
                  Complete a recording to
                  view the signal result,
                  Arduino response, and
                  recorded metrics.
                </p>
              </div>
            ) : (
              <div
                className={`voice-result-card ${resultLevelClass}`}
              >
                <span className="section-tag">
                  Analysis Result
                </span>

                <div className="voice-result-level">
                  <Activity size={29} />

                  <strong>
                    {result.level}
                  </strong>
                </div>

                <h3>
                  {result.summary}
                </h3>

                <p>
                  {result.details}
                </p>

                <div className="voice-score">
                  <span>
                    Prototype Irregularity
                    Score
                  </span>

                  <strong>
                    {
                      result
                        .irregularityScore
                    }
                    /100
                  </strong>
                </div>

                <div className="voice-metrics-grid">
                  <div>
                    <span>
                      Signal Quality
                    </span>

                    <strong>
                      {
                        result
                          .signalQuality
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Duration
                    </span>

                    <strong>
                      {
                        result
                          .durationSeconds
                      }
                      s
                    </strong>
                  </div>

                  <div>
                    <span>
                      Average Volume
                    </span>

                    <strong>
                      {result.metrics
                        .averageVolume}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Silence Ratio
                    </span>

                    <strong>
                      {Math.round(
                        result.metrics
                          .silenceRatio *
                          100
                      )}
                      %
                    </strong>
                  </div>
                </div>

                <div className="arduino-analysis-result">
                  <span>
                    Arduino Hardware
                  </span>

                  <strong>
                    {result.hardware
                      .acknowledged
                      ? `${result.hardware.command} confirmed`
                      : 'Not confirmed'}
                  </strong>

                  {result.hardware
                    .error && (
                    <small>
                      {
                        result.hardware
                          .error
                      }
                    </small>
                  )}
                </div>

                <button
                  type="button"
                  className="secondary-button turn-off-hardware-button"
                  onClick={
                    turnOffHardware
                  }
                >
                  Turn Hardware Off
                </button>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="voice-disclaimer-section">
        <div className="container">
          <AlertTriangle size={21} />

          <p>
            This prototype analyzes audio
            signal characteristics only. It
            does not diagnose asthma,
            respiratory distress, panic
            attacks, heart conditions, or
            another medical condition.
          </p>
        </div>
      </section>
    </>
  );
}

export default VoiceAnalysis;