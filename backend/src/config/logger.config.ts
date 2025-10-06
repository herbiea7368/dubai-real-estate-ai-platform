import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    const contextStr = context ? `[${context}] ` : '';
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${contextStr}${message} ${metaStr}`;
  }),
);

export const createLogger = () => {
  const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    }),
  ];

  // File transports for production
  if (process.env.LOG_TO_FILE === 'true' || process.env.NODE_ENV === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 10,
      }),
    );
  }

  return WinstonModule.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/exceptions.log' }),
    ],
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/rejections.log' }),
    ],
  });
};
