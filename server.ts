import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculatePriorityBreakdown } from './src/utils/priority.js';
import { generateOptimizedRoute } from './src/utils/routing.js';
import { DEMO_DEPOTS, INITIAL_TEAMS, getInitialPickupRequests } from './src/utils/demoData.js';
import { DepotLocation, PickupRequest, SensitiveProximity, SeverityLevel, WasteCategory } from './src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for parsing JSON and form payloads (up to 10MB for photos)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory operational cache synced with demo dataset
let serverRequests: PickupRequest[] = getInitialPickupRequests();
let serverTeams = [...INITIAL_TEAMS];

// ==========================================
// BACKEND API ENDPOINTS (/api/*)
// ==========================================

/**
 * 1. Health check & system diagnostics
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'EcoRoute Mumbai Municipal Backend Server',
    region: 'asia-south1 (Mumbai)',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    totalRequests: serverRequests.length,
    activeFleetUnits: serverTeams.length,
  });
});

/**
 * 2. Operational Statistics
 */
app.get('/api/stats', (req: Request, res: Response) => {
  const pending = serverRequests.filter((r) => r.status === 'Pending').length;
  const assigned = serverRequests.filter((r) => r.status === 'Assigned').length;
  const inProgress = serverRequests.filter((r) => r.status === 'In Progress').length;
  const completed = serverRequests.filter((r) => r.status === 'Completed').length;
  const urgent = serverRequests.filter(
    (r) => (r.priorityLevel === 'Critical' || r.priorityLevel === 'High') && r.status !== 'Completed'
  ).length;

  const totalCollectedKg = serverRequests
    .filter((r) => r.status === 'Completed')
    .reduce((sum, r) => sum + r.quantityKg, 0);

  const totalPendingKg = serverRequests
    .filter((r) => r.status !== 'Completed')
    .reduce((sum, r) => sum + r.quantityKg, 0);

  const avgPriority = serverRequests.length > 0
    ? Math.round(serverRequests.reduce((sum, r) => sum + r.priorityScore, 0) / serverRequests.length)
    : 0;

  res.json({
    totalRequests: serverRequests.length,
    pendingRequests: pending,
    assignedRequests: assigned,
    inProgressRequests: inProgress,
    completedRequests: completed,
    urgentRequests: urgent,
    totalWasteCollectedKg: totalCollectedKg,
    totalPendingWasteKg: totalPendingKg,
    averagePriorityScore: avgPriority,
    estimatedDistanceSavedKm: 42,
  });
});

/**
 * 3. Server-side 4-Factor Priority Score Calculator
 */
app.post('/api/priority/calculate', (req: Request, res: Response) => {
  const { severity, waitingHours, quantityKg, sensitiveProximity } = req.body;

  if (!severity || waitingHours === undefined || quantityKg === undefined || !sensitiveProximity) {
    res.status(400).json({
      error: 'Missing required parameters: severity, waitingHours, quantityKg, sensitiveProximity',
    });
    return;
  }

  const breakdown = calculatePriorityBreakdown({
    severity: severity as SeverityLevel,
    waitingHours: Number(waitingHours),
    quantityKg: Number(quantityKg),
    sensitiveProximity: sensitiveProximity as SensitiveProximity,
  });

  res.json({
    success: true,
    breakdown,
  });
});

/**
 * 4. Server-side Route Optimizer (TSP Heuristic)
 */
app.post('/api/routes/optimize', (req: Request, res: Response) => {
  const { depotId, requestIds, roadMultiplier, truckAvgSpeedKmH } = req.body;

  const depot = DEMO_DEPOTS.find((d) => d.id === depotId) || DEMO_DEPOTS[0];

  let selectedRequests: PickupRequest[] = [];
  if (Array.isArray(requestIds) && requestIds.length > 0) {
    selectedRequests = serverRequests.filter((r) => requestIds.includes(r.id));
  } else {
    selectedRequests = serverRequests.filter((r) => r.status === 'Pending').slice(0, 10);
  }

  const route = generateOptimizedRoute({
    depot,
    requests: selectedRequests,
    roadMultiplier: Number(roadMultiplier) || 1.35,
    truckAvgSpeedKmH: Number(truckAvgSpeedKmH) || 25,
    serviceMinutesPerStop: 8,
    prioritizeUrgent: true,
    returnToDepot: true,
  });

  res.json({
    success: true,
    route,
  });
});

/**
 * 5. Pickup Requests CRUD
 */
app.get('/api/requests', (req: Request, res: Response) => {
  const { status, category, minPriority } = req.query;

  let filtered = [...serverRequests];

  if (status && typeof status === 'string') {
    filtered = filtered.filter((r) => r.status.toLowerCase() === status.toLowerCase());
  }

  if (category && typeof category === 'string') {
    filtered = filtered.filter((r) => r.category.toLowerCase() === category.toLowerCase());
  }

  if (minPriority && !isNaN(Number(minPriority))) {
    filtered = filtered.filter((r) => r.priorityScore >= Number(minPriority));
  }

  res.json({
    total: filtered.length,
    requests: filtered,
  });
});

app.post('/api/requests', (req: Request, res: Response) => {
  const {
    requesterName,
    locationName,
    address,
    latitude,
    longitude,
    category,
    severity,
    waitingHours,
    quantityKg,
    sensitiveProximity,
    notes,
    photos,
  } = req.body;

  if (!locationName || !address || latitude === undefined || longitude === undefined) {
    res.status(400).json({ error: 'locationName, address, latitude, and longitude are required' });
    return;
  }

  const breakdown = calculatePriorityBreakdown({
    severity: (severity as SeverityLevel) || 'Medium',
    waitingHours: Number(waitingHours) || 1,
    quantityKg: Number(quantityKg) || 100,
    sensitiveProximity: (sensitiveProximity as SensitiveProximity) || 'None',
  });

  const nextNum = serverRequests.length + 101;
  const newId = `REQ-MUM-${nextNum}`;

  const newRequest: PickupRequest = {
    id: newId,
    requesterName: requesterName?.trim() || 'Citizen / Ward Resident',
    locationName: locationName.trim(),
    address: address.trim(),
    latitude: Number(latitude),
    longitude: Number(longitude),
    category: (category as WasteCategory) || 'General',
    severity: (severity as SeverityLevel) || 'Medium',
    waitingHours: Number(waitingHours) || 1,
    quantityKg: Number(quantityKg) || 100,
    sensitiveProximity: (sensitiveProximity as SensitiveProximity) || 'None',
    sensitiveProximityScore: breakdown.sensitiveWeighted,
    priorityScore: breakdown.totalScore,
    priorityLevel: breakdown.priorityLevel,
    status: 'Pending',
    notes: notes?.trim() || '',
    photos: Array.isArray(photos) ? photos : [],
    createdAt: new Date().toISOString(),
  };

  serverRequests.unshift(newRequest);

  res.status(201).json({
    success: true,
    message: 'Pickup request registered successfully',
    request: newRequest,
  });
});

app.patch('/api/requests/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, assignedTeamId } = req.body;

  const target = serverRequests.find((r) => r.id === id);
  if (!target) {
    res.status(404).json({ error: `Request ${id} not found` });
    return;
  }

  if (status) target.status = status;
  if (assignedTeamId !== undefined) target.assignedTeamId = assignedTeamId;
  if (status === 'Completed') target.completedAt = new Date().toISOString();

  res.json({
    success: true,
    request: target,
  });
});

/**
 * 6. Depots & Teams
 */
app.get('/api/depots', (req: Request, res: Response) => {
  res.json({
    total: DEMO_DEPOTS.length,
    depots: DEMO_DEPOTS,
  });
});

app.get('/api/teams', (req: Request, res: Response) => {
  res.json({
    total: serverTeams.length,
    teams: serverTeams,
  });
});

/**
 * 7. Public Citizen Complaint Tracker
 */
app.get('/api/citizen/track/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const found = serverRequests.find((r) => r.id.toLowerCase() === id.toLowerCase());

  if (!found) {
    res.status(404).json({
      found: false,
      message: `No grievance found matching ticket ID "${id}"`,
    });
    return;
  }

  const assignedTeam = found.assignedTeamId
    ? serverTeams.find((t) => t.id === found.assignedTeamId)
    : null;

  res.json({
    found: true,
    ticketId: found.id,
    requesterName: found.requesterName,
    locationName: found.locationName,
    address: found.address,
    category: found.category,
    severity: found.severity,
    status: found.status,
    priorityScore: found.priorityScore,
    priorityLevel: found.priorityLevel,
    assignedTeam: assignedTeam
      ? {
          name: assignedTeam.name,
          vehicleNumber: assignedTeam.vehicleNumber,
          vehicleType: assignedTeam.vehicleType,
          lead: assignedTeam.crew[0] || 'Field Driver',
        }
      : null,
    hasPhotos: Boolean(found.photos && found.photos.length > 0),
    createdAt: found.createdAt,
    completedAt: found.completedAt,
  });
});

// ==========================================
// VITE DEV MIDDLEWARE OR STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EcoRoute Mumbai] Full-Stack Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
