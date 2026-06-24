
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import alertRoutes from './routes/alertRoutes.js';
import arAssistantRoutes from './routes/arAssistantRoutes.js';
import authRoutes from './routes/authRoutes.js';
import blockchainRecordsRoutes from './routes/blockchainRecordsRoutes.js';
import digitalTwinRoutes from './routes/digitalTwinRoutes.js';
import emergencyNetworkRoutes from './routes/emergencyNetworkRoutes.js';
import emergencyResponseRoutes from './routes/emergencyResponseRoutes.js';
import environmentalMonitorRoutes from './routes/environmentalMonitorRoutes.js';
import featureUsageRoutes from './routes/featureUsageRoutes.js';
import healthAssistantRoutes from './routes/healthAssistantRoutes.js';
import postureAnalysisRoutes from './routes/postureAnalysisRoutes.js';
import voiceAnalysisRoutes from './routes/voiceAnalysisRoutes.js';

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      'http://localhost:5173',

    credentials:
      true
  })
);

app.use(
  express.json({
    limit:
      '1mb'
  })
);

app.use(
  express.urlencoded({
    extended:
      true,

    limit:
      '1mb'
  })
);

app.use(
  cookieParser()
);

app.get(
  '/',
  (
    request,
    response
  ) => {
    response.json({
      success:
        true,

      message:
        'AEGIS Emergency Health Assistant API is running.'
    });
  }
);

app.get(
  '/api/health',
  (
    request,
    response
  ) => {
    response.json({
      success:
        true,

      serverStatus:
        'online',

      timestamp:
        new Date().toISOString()
    });
  }
);

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/feature-usage',
  featureUsageRoutes
);

app.use(
  '/api/voice-analysis',
  voiceAnalysisRoutes
);

app.use(
  '/api/emergency-network',
  emergencyNetworkRoutes
);

app.use(
  '/api/emergency-response',
  emergencyResponseRoutes
);

app.use(
  '/api/digital-twin',
  digitalTwinRoutes
);

app.use(
  '/api/posture-analysis',
  postureAnalysisRoutes
);

app.use(
  '/api/environmental-monitor',
  environmentalMonitorRoutes
);

app.use(
  '/api/blockchain-records',
  blockchainRecordsRoutes
);

app.use(
  '/api/ar-assistant',
  arAssistantRoutes
);

app.use(
  '/api/ai-health-assistant',
  healthAssistantRoutes
);

app.use(
  '/api',
  alertRoutes
);

app.use(
  (
    request,
    response
  ) => {
    response.status(404).json({
      success:
        false,

      message:
        'Route not found.'
    });
  }
);

app.use(
  (
    error,
    request,
    response,
    next
  ) => {
    console.error(
      'Unhandled application error:',
      error
    );

    if (
      response.headersSent
    ) {
      next(error);
      return;
    }

    response.status(
      error.status ||
      500
    ).json({
      success:
        false,

      message:
        error.message ||
        'An unexpected server error occurred.'
    });
  }
);

export default app;

