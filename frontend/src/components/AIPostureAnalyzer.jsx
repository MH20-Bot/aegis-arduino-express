
import {
  DrawingUtils,
  FilesetResolver,
  PoseLandmarker
} from '@mediapipe/tasks-vision';

import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  apiRequest
} from '../services/api.js';

const MEDIAPIPE_VERSION =
  '0.10.35';

const WASM_PATH =
  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;

const MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

const CALIBRATION_SECONDS = 5;
const SCAN_SECONDS = 10;

function clamp(
  value,
  minimum = 0,
  maximum = 100
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      Number(value) || 0
    )
  );
}

function midpoint(
  first,
  second
) {
  return {
    x:
      (
        first.x +
        second.x
      ) / 2,

    y:
      (
        first.y +
        second.y
      ) / 2
  };
}

function horizontalAngle(
  first,
  second
) {
  const deltaX =
    second.x -
    first.x;

  const deltaY =
    second.y -
    first.y;

  return Math.abs(
    Math.atan2(
      deltaY,
      deltaX
    ) *
      180 /
      Math.PI
  );
}

function verticalLeanAngle(
  lowerPoint,
  upperPoint
) {
  const deltaX =
    upperPoint.x -
    lowerPoint.x;

  const deltaY =
    lowerPoint.y -
    upperPoint.y;

  return Math.abs(
    Math.atan2(
      deltaX,
      Math.max(
        0.0001,
        deltaY
      )
    ) *
      180 /
      Math.PI
  );
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return (
    values.reduce(
      (
        total,
        value
      ) =>
        total + value,
      0
    ) / values.length
  );
}

function standardDeviation(
  values
) {
  if (
    values.length < 2
  ) {
    return 0;
  }

  const mean =
    average(values);

  const variance =
    average(
      values.map(
        value =>
          (
            value -
            mean
          ) ** 2
      )
    );

  return Math.sqrt(
    variance
  );
}

function roundMetric(value) {
  return Math.round(
    value * 10
  ) / 10;
}

function visibilityOf(
  landmark
) {
  return Number(
    landmark?.visibility ??
    landmark?.presence ??
    0
  );
}

function calculateFrameMetrics(
  landmarks
) {
  if (
    !landmarks ||
    landmarks.length < 25
  ) {
    return null;
  }

  const leftEye =
    landmarks[2];

  const rightEye =
    landmarks[5];

  const leftEar =
    landmarks[7];

  const rightEar =
    landmarks[8];

  const leftShoulder =
    landmarks[11];

  const rightShoulder =
    landmarks[12];

  const leftHip =
    landmarks[23];

  const rightHip =
    landmarks[24];

  const requiredPoints = [
    leftShoulder,
    rightShoulder,
    leftHip,
    rightHip
  ];

  const bodyVisibility =
    average(
      requiredPoints.map(
        visibilityOf
      )
    );

  if (
    bodyVisibility < 0.45
  ) {
    return null;
  }

  const earVisibility =
    average([
      visibilityOf(leftEar),
      visibilityOf(rightEar)
    ]);

  const eyeVisibility =
    average([
      visibilityOf(leftEye),
      visibilityOf(rightEye)
    ]);

  const headLeft =
    earVisibility >= 0.45
      ? leftEar
      : leftEye;

  const headRight =
    earVisibility >= 0.45
      ? rightEar
      : rightEye;

  const shoulderCentre =
    midpoint(
      leftShoulder,
      rightShoulder
    );

  const hipCentre =
    midpoint(
      leftHip,
      rightHip
    );

  const headVisibility =
    earVisibility >= 0.45
      ? earVisibility
      : eyeVisibility;

  return {
    shoulderTilt:
      roundMetric(
        horizontalAngle(
          leftShoulder,
          rightShoulder
        )
      ),

    headTilt:
      roundMetric(
        horizontalAngle(
          headLeft,
          headRight
        )
      ),

    torsoLean:
      roundMetric(
        verticalLeanAngle(
          hipCentre,
          shoulderCentre
        )
      ),

    hipTilt:
      roundMetric(
        horizontalAngle(
          leftHip,
          rightHip
        )
      ),

    visibility:
      clamp(
        average([
          bodyVisibility,
          headVisibility
        ]),
        0,
        1
      )
  };
}

function calculateBaseline(
  samples
) {
  return {
    shoulderTilt:
      roundMetric(
        average(
          samples.map(
            sample =>
              sample.shoulderTilt
          )
        )
      ),

    headTilt:
      roundMetric(
        average(
          samples.map(
            sample =>
              sample.headTilt
          )
        )
      ),

    torsoLean:
      roundMetric(
        average(
          samples.map(
            sample =>
              sample.torsoLean
          )
        )
      ),

    hipTilt:
      roundMetric(
        average(
          samples.map(
            sample =>
              sample.hipTilt
          )
        )
      )
  };
}

function aggregateScan(
  samples
) {
  const shoulderValues =
    samples.map(
      sample =>
        sample.shoulderTilt
    );

  const headValues =
    samples.map(
      sample =>
        sample.headTilt
    );

  const torsoValues =
    samples.map(
      sample =>
        sample.torsoLean
    );

  const hipValues =
    samples.map(
      sample =>
        sample.hipTilt
    );

  const instability =
    standardDeviation(
      shoulderValues
    ) * 4 +
    standardDeviation(
      headValues
    ) * 3 +
    standardDeviation(
      torsoValues
    ) * 5 +
    standardDeviation(
      hipValues
    ) * 2;

  return {
    average: {
      shoulderTilt:
        roundMetric(
          average(
            shoulderValues
          )
        ),

      headTilt:
        roundMetric(
          average(
            headValues
          )
        ),

      torsoLean:
        roundMetric(
          average(
            torsoValues
          )
        ),

      hipTilt:
        roundMetric(
          average(
            hipValues
          )
        )
    },

    maximum: {
      shoulderTilt:
        roundMetric(
          Math.max(
            ...shoulderValues
          )
        ),

      headTilt:
        roundMetric(
          Math.max(
            ...headValues
          )
        ),

      torsoLean:
        roundMetric(
          Math.max(
            ...torsoValues
          )
        ),

      hipTilt:
        roundMetric(
          Math.max(
            ...hipValues
          )
        )
    },

    stabilityScore:
      roundMetric(
        clamp(
          100 -
            instability
        )
      ),

    poseConfidence:
      clamp(
        average(
          samples.map(
            sample =>
              sample.visibility
          )
        ),
        0,
        1
      )
  };
}

function getLiveGuidance(
  metrics,
  baseline
) {
  if (!metrics) {
    return (
      'Move back until your head, shoulders, and hips are visible.'
    );
  }

  if (!baseline) {
    return (
      'Sit or stand in a comfortable upright position.'
    );
  }

  const shoulderDifference =
    Math.abs(
      metrics.shoulderTilt -
        baseline.shoulderTilt
    );

  const headDifference =
    Math.abs(
      metrics.headTilt -
        baseline.headTilt
    );

  const torsoDifference =
    Math.abs(
      metrics.torsoLean -
        baseline.torsoLean
    );

  if (
    shoulderDifference >= 6
  ) {
    return (
      'Level your shoulders and avoid leaning toward one side.'
    );
  }

  if (
    headDifference >= 7
  ) {
    return (
      'Bring your head back toward the centre.'
    );
  }

  if (
    torsoDifference >= 7
  ) {
    return (
      'Straighten your upper body toward the calibrated position.'
    );
  }

  return (
    'Your current posture is close to the calibrated baseline.'
  );
}

function AIPostureAnalyzer() {
  const videoRef =
    useRef(null);

  const canvasRef =
    useRef(null);

  const streamRef =
    useRef(null);

  const landmarkerRef =
    useRef(null);

  const animationRef =
    useRef(null);

  const timerRef =
    useRef(null);

  const timeoutRef =
    useRef(null);

  const lastVideoTimeRef =
    useRef(-1);

  const lastInferenceTimeRef =
    useRef(0);

  const modeRef =
    useRef('IDLE');

  const calibrationSamplesRef =
    useRef([]);

  const scanSamplesRef =
    useRef([]);

  const [
    modelStatus,
    setModelStatus
  ] = useState('LOADING');

  const [
    cameraActive,
    setCameraActive
  ] = useState(false);

  const [
    mode,
    setMode
  ] = useState('IDLE');

  const [
    countdown,
    setCountdown
  ] = useState(0);

  const [
    baseline,
    setBaseline
  ] = useState(null);

  const [
    liveMetrics,
    setLiveMetrics
  ] = useState(null);

  const [
    result,
    setResult
  ] = useState(null);

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

  function stopTimers() {
    if (timerRef.current) {
      window.clearInterval(
        timerRef.current
      );

      timerRef.current = null;
    }

    if (timeoutRef.current) {
      window.clearTimeout(
        timeoutRef.current
      );

      timeoutRef.current = null;
    }
  }

  function stopCamera() {
    stopTimers();

    if (
      animationRef.current
    ) {
      window.cancelAnimationFrame(
        animationRef.current
      );

      animationRef.current =
        null;
    }

    if (
      streamRef.current
    ) {
      streamRef.current
        .getTracks()
        .forEach(
          track =>
            track.stop()
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

    modeRef.current =
      'IDLE';

    setMode('IDLE');

    setCameraActive(
      false
    );

    setCountdown(0);
  }

  useEffect(() => {
    let componentIsActive =
      true;

    async function loadPoseModel() {
      try {
        const vision =
          await FilesetResolver.forVisionTasks(
            WASM_PATH
          );

        let poseLandmarker;

        try {
          poseLandmarker =
            await PoseLandmarker.createFromOptions(
              vision,
              {
                baseOptions: {
                  modelAssetPath:
                    MODEL_PATH,

                  delegate: 'GPU'
                },

                runningMode:
                  'VIDEO',

                numPoses: 1,

                minPoseDetectionConfidence:
                  0.55,

                minPosePresenceConfidence:
                  0.55,

                minTrackingConfidence:
                  0.55,

                outputSegmentationMasks:
                  false
              }
            );
        } catch (
          gpuError
        ) {
          console.warn(
            'GPU pose model failed. Using CPU.',
            gpuError
          );

          poseLandmarker =
            await PoseLandmarker.createFromOptions(
              vision,
              {
                baseOptions: {
                  modelAssetPath:
                    MODEL_PATH,

                  delegate: 'CPU'
                },

                runningMode:
                  'VIDEO',

                numPoses: 1,

                minPoseDetectionConfidence:
                  0.55,

                minPosePresenceConfidence:
                  0.55,

                minTrackingConfidence:
                  0.55,

                outputSegmentationMasks:
                  false
              }
            );
        }

        if (
          componentIsActive
        ) {
          landmarkerRef.current =
            poseLandmarker;

          setModelStatus(
            'READY'
          );
        }
      } catch (
        modelError
      ) {
        console.error(
          'Pose model error:',
          modelError
        );

        if (
          componentIsActive
        ) {
          setModelStatus(
            'ERROR'
          );

          setError(
            'The pose detection model could not be loaded.'
          );
        }
      }
    }

    loadPoseModel();

    return () => {
      componentIsActive =
        false;

      stopCamera();

      if (
        landmarkerRef.current
          ?.close
      ) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  function drawPose(
    resultData
  ) {
    const video =
      videoRef.current;

    const canvas =
      canvasRef.current;

    if (
      !video ||
      !canvas
    ) {
      return;
    }

    const width =
      video.videoWidth ||
      1280;

    const height =
      video.videoHeight ||
      720;

    if (
      canvas.width !== width ||
      canvas.height !== height
    ) {
      canvas.width =
        width;

      canvas.height =
        height;
    }

    const context =
      canvas.getContext(
        '2d'
      );

    context.clearRect(
      0,
      0,
      width,
      height
    );

    if (
      !resultData.landmarks
        ?.length
    ) {
      return;
    }

    const drawingUtils =
      new DrawingUtils(
        context
      );

    const landmarks =
      resultData.landmarks[0];

    drawingUtils.drawConnectors(
      landmarks,
      PoseLandmarker.POSE_CONNECTIONS,
      {
        color: '#5eead4',
        lineWidth: 4
      }
    );

    drawingUtils.drawLandmarks(
      landmarks,
      {
        color: '#c4b5fd',
        fillColor: '#7c3aed',
        radius: 4
      }
    );
  }

  function renderLoop(
    timestamp
  ) {
    const video =
      videoRef.current;

    const landmarker =
      landmarkerRef.current;

    if (
      video &&
      landmarker &&
      video.readyState >= 2 &&
      video.currentTime !==
        lastVideoTimeRef.current &&
      timestamp -
        lastInferenceTimeRef.current >=
        80
    ) {
      lastVideoTimeRef.current =
        video.currentTime;

      lastInferenceTimeRef.current =
        timestamp;

      try {
        const detectionResult =
          landmarker.detectForVideo(
            video,
            timestamp
          );

        drawPose(
          detectionResult
        );

        const landmarks =
          detectionResult
            .landmarks?.[0];

        const metrics =
          calculateFrameMetrics(
            landmarks
          );

        setLiveMetrics(
          metrics
        );

        if (
          metrics &&
          modeRef.current ===
            'CALIBRATING'
        ) {
          calibrationSamplesRef
            .current
            .push(metrics);
        }

        if (
          metrics &&
          modeRef.current ===
            'SCANNING'
        ) {
          scanSamplesRef
            .current
            .push(metrics);
        }
      } catch (
        detectionError
      ) {
        console.error(
          'Pose detection error:',
          detectionError
        );
      }
    }

    animationRef.current =
      window.requestAnimationFrame(
        renderLoop
      );
  }

  async function startCamera() {
    setError('');
    setMessage('');
    setResult(null);

    if (
      modelStatus !==
      'READY'
    ) {
      setError(
        'Wait for the pose model to finish loading.'
      );

      return;
    }

    if (
      !navigator.mediaDevices
        ?.getUserMedia
    ) {
      setError(
        'Camera access is not supported by this browser.'
      );

      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode:
              'user',

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

      videoRef.current.srcObject =
        stream;

      await videoRef.current.play();

      setCameraActive(
        true
      );

      modeRef.current =
        'CAMERA_READY';

      setMode(
        'CAMERA_READY'
      );

      animationRef.current =
        window.requestAnimationFrame(
          renderLoop
        );

      setMessage(
        'Camera started. Keep your head, shoulders, and hips visible.'
      );
    } catch (
      cameraError
    ) {
      console.error(
        'Camera error:',
        cameraError
      );

      setError(
        'Camera permission was denied or the camera is unavailable.'
      );
    }
  }

  function runCountdown(
    seconds,
    onComplete
  ) {
    stopTimers();

    setCountdown(
      seconds
    );

    timerRef.current =
      window.setInterval(
        () => {
          setCountdown(
            previous =>
              Math.max(
                0,
                previous - 1
              )
          );
        },
        1000
      );

    timeoutRef.current =
      window.setTimeout(
        () => {
          stopTimers();

          setCountdown(0);

          onComplete();
        },
        seconds * 1000
      );
  }

  function startCalibration() {
    setError('');
    setMessage('');
    setResult(null);

    calibrationSamplesRef.current =
      [];

    modeRef.current =
      'CALIBRATING';

    setMode(
      'CALIBRATING'
    );

    runCountdown(
      CALIBRATION_SECONDS,
      finishCalibration
    );
  }

  function finishCalibration() {
    const samples =
      calibrationSamplesRef.current;

    if (
      samples.length < 20
    ) {
      modeRef.current =
        'CAMERA_READY';

      setMode(
        'CAMERA_READY'
      );

      setError(
        'Calibration failed because the full upper body was not visible.'
      );

      return;
    }

    const newBaseline =
      calculateBaseline(
        samples
      );

    setBaseline(
      newBaseline
    );

    modeRef.current =
      'READY_TO_SCAN';

    setMode(
      'READY_TO_SCAN'
    );

    setMessage(
      'Personal posture baseline created. Start the posture scan.'
    );
  }

  function startScan() {
    setError('');
    setMessage('');
    setResult(null);

    scanSamplesRef.current =
      [];

    modeRef.current =
      'SCANNING';

    setMode(
      'SCANNING'
    );

    runCountdown(
      SCAN_SECONDS,
      finishScan
    );
  }

  async function finishScan() {
    const samples =
      scanSamplesRef.current;

    modeRef.current =
      'PROCESSING';

    setMode(
      'PROCESSING'
    );

    if (
      samples.length < 30
    ) {
      modeRef.current =
        'READY_TO_SCAN';

      setMode(
        'READY_TO_SCAN'
      );

      setError(
        'Not enough visible posture frames were captured. Move back and scan again.'
      );

      return;
    }

    const measurements =
      aggregateScan(
        samples
      );

    setBusy(true);

    try {
      const serverResponse =
        await apiRequest(
          '/api/posture-analysis/analyze',
          {
            method: 'POST',

            body: JSON.stringify({
              durationSeconds:
                SCAN_SECONDS,

              frameCount:
                samples.length,

              poseConfidence:
                measurements
                  .poseConfidence,

              baseline,

              measurements: {
                average:
                  measurements.average,

                maximum:
                  measurements.maximum,

                stabilityScore:
                  measurements
                    .stabilityScore
              }
            })
          }
        );

      setResult(
        serverResponse.analysis
      );

      setMessage(
        serverResponse.message
      );

      modeRef.current =
        'COMPLETE';

      setMode(
        'COMPLETE'
      );
    } catch (
      requestError
    ) {
      setError(
        requestError.message
      );

      modeRef.current =
        'READY_TO_SCAN';

      setMode(
        'READY_TO_SCAN'
      );
    } finally {
      setBusy(false);
    }
  }

  function resetAnalysis() {
    setBaseline(null);
    setResult(null);
    setMessage('');
    setError('');

    calibrationSamplesRef.current =
      [];

    scanSamplesRef.current =
      [];

    modeRef.current =
      cameraActive
        ? 'CAMERA_READY'
        : 'IDLE';

    setMode(
      cameraActive
        ? 'CAMERA_READY'
        : 'IDLE'
    );
  }

  const liveGuidance =
    getLiveGuidance(
      liveMetrics,
      baseline
    );

  return (
    <>
      <section className="posture-hero">
        <div className="posture-container">
          <span className="posture-kicker">
            Protected AI Camera Feature
          </span>

          <h1>
            AI Posture and Pain Analyzer
          </h1>

          <p>
            Create a personal upright baseline,
            detect live posture changes, receive
            correction guidance, save the result,
            and activate the connected Arduino
            alert level.
          </p>
        </div>
      </section>

      <section className="posture-section">
        <div className="posture-container posture-layout">
          <div className="posture-camera-card">
            <div className="posture-camera-header">
              <div>
                <span className="posture-kicker">
                  Live Pose Detection
                </span>

                <h2>
                  Camera Workspace
                </h2>
              </div>

              <span
                className={`posture-model-status ${modelStatus.toLowerCase()}`}
              >
                Model {modelStatus}
              </span>
            </div>

            <div className="posture-video-wrapper">
              <video
                ref={videoRef}
                playsInline
                muted
              />

              <canvas
                ref={canvasRef}
              />

              {!cameraActive && (
                <div className="posture-camera-placeholder">
                  <strong>
                    Camera is off
                  </strong>

                  <span>
                    Start the camera and keep your
                    upper body visible.
                  </span>
                </div>
              )}

              {countdown > 0 && (
                <div className="posture-countdown">
                  <strong>
                    {countdown}
                  </strong>

                  <span>
                    {mode ===
                    'CALIBRATING'
                      ? 'Hold your normal upright posture'
                      : 'Continue your normal sitting posture'}
                  </span>
                </div>
              )}
            </div>

            <div className="posture-guidance">
              <strong>
                Live Guidance
              </strong>

              <span>
                {liveGuidance}
              </span>
            </div>

            <div className="posture-controls">
              {!cameraActive && (
                <button
                  type="button"
                  className="posture-primary-button"
                  disabled={
                    modelStatus !==
                    'READY'
                  }
                  onClick={
                    startCamera
                  }
                >
                  {modelStatus ===
                  'LOADING'
                    ? 'Loading AI Model...'
                    : 'Start Camera'}
                </button>
              )}

              {cameraActive &&
                mode ===
                  'CAMERA_READY' && (
                  <button
                    type="button"
                    className="posture-primary-button"
                    onClick={
                      startCalibration
                    }
                  >
                    Calibrate Normal Posture
                  </button>
                )}

              {cameraActive &&
                mode ===
                  'READY_TO_SCAN' && (
                  <button
                    type="button"
                    className="posture-primary-button"
                    onClick={
                      startScan
                    }
                  >
                    Start 10 Second Scan
                  </button>
                )}

              {cameraActive &&
                mode ===
                  'COMPLETE' && (
                  <button
                    type="button"
                    className="posture-primary-button"
                    onClick={
                      resetAnalysis
                    }
                  >
                    Run New Analysis
                  </button>
                )}

              {cameraActive && (
                <button
                  type="button"
                  className="posture-secondary-button"
                  onClick={
                    stopCamera
                  }
                >
                  Stop Camera
                </button>
              )}
            </div>
          </div>

          <aside className="posture-information-card">
            <span className="posture-kicker">
              Personal Posture Passport
            </span>

            <h2>
              Live Measurements
            </h2>

            <div className="posture-metric-grid">
              <MetricCard
                label="Shoulder Tilt"
                value={
                  liveMetrics?.shoulderTilt
                }
              />

              <MetricCard
                label="Head Tilt"
                value={
                  liveMetrics?.headTilt
                }
              />

              <MetricCard
                label="Torso Lean"
                value={
                  liveMetrics?.torsoLean
                }
              />

              <MetricCard
                label="Hip Tilt"
                value={
                  liveMetrics?.hipTilt
                }
              />
            </div>

            {baseline && (
              <div className="posture-baseline">
                <h3>
                  Calibrated Baseline
                </h3>

                <dl>
                  <div>
                    <dt>
                      Shoulders
                    </dt>

                    <dd>
                      {baseline.shoulderTilt}°
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Head
                    </dt>

                    <dd>
                      {baseline.headTilt}°
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Torso
                    </dt>

                    <dd>
                      {baseline.torsoLean}°
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Hips
                    </dt>

                    <dd>
                      {baseline.hipTilt}°
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {!baseline && (
              <div className="posture-instruction-list">
                <h3>
                  Demo Steps
                </h3>

                <div>
                  1. Start the camera.
                </div>

                <div>
                  2. Calibrate upright posture.
                </div>

                <div>
                  3. Lean or tilt slightly.
                </div>

                <div>
                  4. Run the posture scan.
                </div>

                <div>
                  5. Show the Arduino alert.
                </div>
              </div>
            )}
          </aside>
        </div>

        {result && (
          <div className="posture-container">
            <section
              className={`posture-result-card ${result.level.toLowerCase()}`}
            >
              <div className="posture-result-heading">
                <div>
                  <span className="posture-kicker">
                    Analysis Complete
                  </span>

                  <h2>
                    Personalized Posture Result
                  </h2>
                </div>

                <span className="posture-result-level">
                  {result.level}
                </span>
              </div>

              <div className="posture-result-grid">
                <article>
                  <span>
                    Posture Score
                  </span>

                  <strong>
                    {result.postureScore}/100
                  </strong>
                </article>

                <article>
                  <span>
                    Stability
                  </span>

                  <strong>
                    {result.measurements.stabilityScore}/100
                  </strong>
                </article>

                <article>
                  <span>
                    Pose Confidence
                  </span>

                  <strong>
                    {Math.round(
                      result.poseConfidence *
                        100
                    )}
                    %
                  </strong>
                </article>

                <article>
                  <span>
                    Arduino
                  </span>

                  <strong>
                    {result.hardware.acknowledged
                      ? `${result.hardware.sentCommand} confirmed`
                      : 'Not confirmed'}
                  </strong>
                </article>
              </div>

              <p>
                {result.summary}
              </p>

              <div className="posture-result-details">
                <div>
                  <h3>
                    Change From Baseline
                  </h3>

                  <dl>
                    <div>
                      <dt>
                        Shoulder Change
                      </dt>

                      <dd>
                        {result.differences.shoulderTilt}°
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Head Change
                      </dt>

                      <dd>
                        {result.differences.headTilt}°
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Torso Change
                      </dt>

                      <dd>
                        {result.differences.torsoLean}°
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Hip Change
                      </dt>

                      <dd>
                        {result.differences.hipTilt}°
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3>
                    Live Recommendations
                  </h3>

                  <div className="posture-recommendation-list">
                    {result.guidance.map(
                      guidance => (
                        <div
                          key={guidance}
                        >
                          {guidance}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        <div className="posture-container">
          {message && (
            <div className="posture-message success">
              {message}
            </div>
          )}

          {error && (
            <div className="posture-message error">
              {error}
            </div>
          )}

          {busy && (
            <div className="posture-message">
              Saving posture result and waiting
              for Arduino confirmation...
            </div>
          )}
        </div>
      </section>

      <section className="posture-warning">
        <div className="posture-container">
          Camera video is processed locally.
          Only calculated posture measurements
          are sent to the server. This prototype
          provides a posture strain indicator and
          does not diagnose pain, injury, or a
          medical condition.
        </div>
      </section>
    </>
  );
}

function MetricCard({
  label,
  value
}) {
  return (
    <article className="posture-metric-card">
      <span>
        {label}
      </span>

      <strong>
        {value !== undefined &&
        value !== null
          ? `${value}°`
          : 'Waiting'}
      </strong>
    </article>
  );
}

export default AIPostureAnalyzer;