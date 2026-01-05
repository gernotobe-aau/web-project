import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import config from './config/config';
import { initDatabase } from './db/init';
import { errorHandler } from './middleware/error.middleware';
import apiRoutes from './api/routes';

const app = express();

// CORS Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes (mit /api Prefix)
app.use('/api', apiRoutes);

// Static File Serving für Angular App (nur in Production)
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// SPA Fallback - alle nicht-API Routes zu Angular weiterleiten
app.get('*', (req: Request, res: Response) => {
  // Nur wenn keine API-Route
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(publicPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(404).json({ error: 'Frontend not found. Run in development mode or build first.' });
      }
    });
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error Handler (muss nach allen anderen Middlewares kommen)
app.use(errorHandler);

// Server starten
async function startServer() {
  try {
    // Initialisiere Datenbank
    await initDatabase();
    
    // Starte Server
    app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════╗
║   Food Delivery Platform - Backend    ║
╚════════════════════════════════════════╝

Server running on: http://localhost:${config.port}
API endpoint:      http://localhost:${config.port}/api
Health check:      http://localhost:${config.port}/api/health

Environment:
  - CORS Origin:   ${config.corsOrigin}
  - Database:      ${config.dbPath}
  - JWT Expiration: ${config.jwtExpiration}

Press Ctrl+C to stop the server
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

startServer();
