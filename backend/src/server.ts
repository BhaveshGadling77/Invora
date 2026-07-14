import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { config } from './config/config';
import { logger, morganStream } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { auditMiddleware } from './middleware/audit';
import routesV1 from './routes/v1';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Logging
app.use(morgan('combined', { stream: morganStream }));

// Audit helper
app.use(auditMiddleware);

// API Routes
app.use('/api/v1', routesV1);

// Static files for health check or public assets if any
app.get('/', (req, res) => {
  res.send('Inventra API is running');
});

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port || 5000;

app.listen(PORT, () => {
  logger.info(`Server running in ${config.env} mode on port ${PORT}`);
});
