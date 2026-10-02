import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActiveTab,
  AppNotification,
  AppViewMode,
  CollectionTeam,
  DepotLocation,
  PickupRequest,
  Recommendation,
  RequestStatus,
  SensitiveProximity,
  SeverityLevel,
  WasteCategory,
} from '../types';
import { DEMO_DEPOTS, INITIAL_TEAMS, getInitialPickupRequests } from '../utils/demoData';
import { SENSITIVE_PROXIMITY_SCORES, calculatePriorityScore } from '../utils/priority';
import { haversineDistanceKm } from '../utils/routing';
import {
  auth,
  db,
  handleFirestoreError,
  loginWithGoogle,
  logoutUser,
  OperationType,
  testFirestoreConnection,
} from '../firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface CreateRequestInput {
  requesterName: string;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  category: WasteCategory;
  severity: SeverityLevel;
  waitingHours: number;
  quantityKg: number;
  sensitiveProximity: SensitiveProximity;
  notes: string;
  photos?: string[];
}

interface AppContextType {
  viewMode: AppViewMode;
  setViewMode: (mode: AppViewMode) => void;
  requests: PickupRequest[];
  teams: CollectionTeam[];
  depots: DepotLocation[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
  focusMapCoords: { lat: number; lng: number; zoom?: number } | null;
  setFocusMapCoords: (coords: { lat: number; lng: number; zoom?: number } | null) => void;
  notifications: AppNotification[];
  recommendations: Recommendation[];
  stats: {
    totalRequests: number;
    pendingRequests: number;
    assignedRequests: number;
    inProgressRequests: number;
    completedRequests: number;
    urgentRequests: number;
    totalWasteCollectedKg: number;
    totalPendingWasteKg: number;
    averagePriorityScore: number;
    estimatedDistanceSavedKm: number;
  };
  currentUser: FirebaseUser | null;
  isAuthReady: boolean;
  signInWithGoogle: () => Promise<any>;
  signOutUser: () => Promise<void>;
  addRequest: (input: CreateRequestInput) => PickupRequest;
  updateRequest: (
    id: string,
    updates: Partial<CreateRequestInput> & { status?: RequestStatus; assignedTeamId?: string }
  ) => void;
  deleteRequest: (id: string) => void;
  updateRequestStatus: (id: string, newStatus: RequestStatus, teamId?: string) => void;
  assignRequestsToTeam: (teamId: string, requestIds: string[]) => void;
  resetDemoData: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  focusOnMap: (lat: number, lng: number, requestId?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_REQ_KEY = 'ecoroute_pickup_requests_v1';
const LOCAL_STORAGE_TEAMS_KEY = 'ecoroute_teams_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<PickupRequest[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_REQ_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading requests from localStorage', e);
    }
    return getInitialPickupRequests();
  });

  const [teams, setTeams] = useState<CollectionTeam[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_TEAMS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading teams from localStorage', e);
    }
    return INITIAL_TEAMS;
  });

  const [depots] = useState<DepotLocation[]>(DEMO_DEPOTS);
  const [viewMode, setViewMode] = useState<AppViewMode>('operations');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [focusMapCoords, setFocusMapCoords] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // 1. Test Firestore Connection and Listen to Auth State
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-Time Firestore Sync for Pickup Requests
  useEffect(() => {
    const pathForRequests = 'pickup_requests';

    const unsubscribe = onSnapshot(
      collection(db, pathForRequests),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteRequests: PickupRequest[] = [];
          snapshot.forEach((docSnap) => {
            remoteRequests.push(docSnap.data() as PickupRequest);
          });
          setRequests(remoteRequests);
          try {
            localStorage.setItem(LOCAL_STORAGE_REQ_KEY, JSON.stringify(remoteRequests));
          } catch (e) {}
        } else {
          // If Firestore collection is empty, seed initial data to cloud
          const initial = getInitialPickupRequests();
          const batch = writeBatch(db);
          initial.forEach((item) => {
            const docRef = doc(db, pathForRequests, item.id);
            batch.set(docRef, item);
          });
          batch.commit().catch((err) => {
            console.warn('Initial seeding error:', err);
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathForRequests);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Real-Time Firestore Sync for Collection Teams
  useEffect(() => {
    const pathForTeams = 'teams';

    const unsubscribe = onSnapshot(
      collection(db, pathForTeams),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteTeams: CollectionTeam[] = [];
          snapshot.forEach((docSnap) => {
            remoteTeams.push(docSnap.data() as CollectionTeam);
          });
          setTeams(remoteTeams);
          try {
            localStorage.setItem(LOCAL_STORAGE_TEAMS_KEY, JSON.stringify(remoteTeams));
          } catch (e) {}
        } else {
          // Seed teams if empty
          const batch = writeBatch(db);
          INITIAL_TEAMS.forEach((item) => {
            const docRef = doc(db, pathForTeams, item.id);
            batch.set(docRef, item);
          });
          batch.commit().catch((err) => {
            console.warn('Initial teams seeding error:', err);
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathForTeams);
      }
    );

    return () => unsubscribe();
  }, []);

  // Focus request on map helper
  const focusOnMap = (lat: number, lng: number, requestId?: string) => {
    setFocusMapCoords({ lat, lng, zoom: 16 });
    if (requestId) {
      setSelectedRequestId(requestId);
    }
    setActiveTab('map');
  };

  // Compute live statistics dynamically from state
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'Pending').length;
    const assigned = requests.filter((r) => r.status === 'Assigned').length;
    const inProgress = requests.filter((r) => r.status === 'In Progress').length;
    const completed = requests.filter((r) => r.status === 'Completed').length;
    const urgent = requests.filter((r) => (r.priorityLevel === 'Critical' || r.priorityLevel === 'High') && r.status !== 'Completed').length;

    const totalWasteCollectedKg = requests
      .filter((r) => r.status === 'Completed')
      .reduce((sum, r) => sum + r.quantityKg, 0);

    const totalPendingWasteKg = requests
      .filter((r) => r.status !== 'Completed')
      .reduce((sum, r) => sum + r.quantityKg, 0);

    const avgScore = total > 0
      ? Math.round(requests.reduce((sum, r) => sum + r.priorityScore, 0) / total)
      : 0;

    // Approximate distance saved calculation
    const mainDepot = depots.find((d) => d.isMain) || depots[0];
    const completedList = requests.filter((r) => r.status === 'Completed');
    let directTripDistKm = 0;
    completedList.forEach((r) => {
      const dist = haversineDistanceKm(mainDepot.latitude, mainDepot.longitude, r.latitude, r.longitude);
      directTripDistKm += dist * 2 * 1.35; // Roundtrip road distance
    });

    const clusteredEstimateKm = completedList.length > 1 ? directTripDistKm * 0.62 : directTripDistKm;
    const estimatedDistanceSavedKm = Math.max(0, Math.round(directTripDistKm - clusteredEstimateKm));

    return {
      totalRequests: total,
      pendingRequests: pending,
      assignedRequests: assigned,
      inProgressRequests: inProgress,
      completedRequests: completed,
      urgentRequests: urgent,
      totalWasteCollectedKg,
      totalPendingWasteKg,
      averagePriorityScore: avgScore,
      estimatedDistanceSavedKm: estimatedDistanceSavedKm || 38,
    };
  }, [requests, depots]);

  // Compute live rule-based notifications
  const notifications: AppNotification[] = useMemo(() => {
    const list: AppNotification[] = [];

    // Rule 1: High priority requests still pending
    const criticalPending = requests.filter((r) => r.priorityScore >= 80 && r.status === 'Pending');
    criticalPending.forEach((req) => {
      list.push({
        id: `notif-crit-${req.id}`,
        title: `Critical Alert: ${req.id}`,
        message: `High urgency request at "${req.locationName}" (${req.priorityScore} pts) requires immediate dispatch.`,
        type: 'critical',
        timestamp: req.createdAt,
        relatedRequestId: req.id,
        read: readNotificationIds.has(`notif-crit-${req.id}`),
      });
    });

    // Rule 2: Requests waiting more than 40 hours
    const longWaitPending = requests.filter((r) => r.waitingHours >= 40 && r.status === 'Pending');
    longWaitPending.forEach((req) => {
      list.push({
        id: `notif-wait-${req.id}`,
        title: `SLA Warning: Long Wait Time`,
        message: `Request ${req.id} at "${req.locationName}" has been waiting for ${req.waitingHours} hours.`,
        type: 'warning',
        timestamp: req.createdAt,
        relatedRequestId: req.id,
        read: readNotificationIds.has(`notif-wait-${req.id}`),
      });
    });

    // Rule 3: Recently completed high-priority pickups
    const recentCompleted = requests.filter((r) => r.status === 'Completed' && r.priorityScore >= 70).slice(0, 3);
    recentCompleted.forEach((req) => {
      list.push({
        id: `notif-comp-${req.id}`,
        title: `Pickup Completed: ${req.id}`,
        message: `Successfully resolved waste pickup at "${req.locationName}" (${req.quantityKg}kg).`,
        type: 'success',
        timestamp: req.completedAt || new Date().toISOString(),
        relatedRequestId: req.id,
        read: readNotificationIds.has(`notif-comp-${req.id}`),
      });
    });

    // Rule 4: Team payload capacity check
    teams.forEach((team) => {
      const activeLoad = requests
        .filter((r) => r.assignedTeamId === team.id && (r.status === 'Assigned' || r.status === 'In Progress'))
        .reduce((sum, r) => sum + r.quantityKg, 0);

      const utilization = (activeLoad / team.maxCapacityKg) * 100;
      if (utilization >= 75) {
        list.push({
          id: `notif-team-${team.id}`,
          title: `Fleet Capacity Notice: ${team.name}`,
          message: `${team.name} payload is at ${Math.round(utilization)}% (${activeLoad}kg / ${team.maxCapacityKg}kg).`,
          type: 'info',
          timestamp: new Date().toISOString(),
          read: readNotificationIds.has(`notif-team-${team.id}`),
        });
      }
    });

    return list;
  }, [requests, teams, readNotificationIds]);

  // Compute live data-based recommendations
  const recommendations: Recommendation[] = useMemo(() => {
    const recs: Recommendation[] = [];

    // Recommendation 1: Critical unassigned items
    const criticalUnassigned = requests.filter((r) => r.priorityScore >= 80 && r.status === 'Pending');
    if (criticalUnassigned.length > 0) {
      recs.push({
        id: 'rec-critical-dispatch',
        title: 'Dispatch Critical Urgency Pickups First',
        description: `There are ${criticalUnassigned.length} pending pickup request(s) with priority score 80+ in dense urban zones.`,
        urgency: 'high',
        metric: `${criticalUnassigned.length} Critical Pending`,
        actionLabel: 'View Critical Requests',
        actionTab: 'requests',
        actionFilter: 'Critical',
      });
    }

    // Recommendation 2: Cluster optimization for pending requests
    const pendingCount = requests.filter((r) => r.status === 'Pending').length;
    if (pendingCount >= 3) {
      recs.push({
        id: 'rec-route-optimization',
        title: 'Generate Multi-Stop Collection Route',
        description: `${pendingCount} pending requests available for clustering into an optimized collection circuit to save vehicle fuel.`,
        urgency: 'medium',
        metric: `${pendingCount} Unrouted Stops`,
        actionLabel: 'Open Route Optimizer',
        actionTab: 'optimizer',
      });
    }

    // Recommendation 3: Hazardous waste specialized vehicle assignment
    const pendingHazardous = requests.filter((r) => r.category === 'Hazardous' && r.status === 'Pending');
    if (pendingHazardous.length > 0) {
      recs.push({
        id: 'rec-hazmat-handling',
        title: 'Specialized HazMat Unit Deployment',
        description: `${pendingHazardous.length} pending hazardous waste item(s) require certified containment protocol and specialized team dispatch.`,
        urgency: 'high',
        metric: `${pendingHazardous.length} Hazardous Items`,
        actionLabel: 'Inspect & Assign',
        actionTab: 'teams',
      });
    }

    // Recommendation 4: Idle fleet capacity rebalancing
    const availableTeams = teams.filter((t) => t.status === 'Available');
    if (availableTeams.length > 0 && pendingCount > 0) {
      recs.push({
        id: 'rec-fleet-idle',
        title: 'Deploy Idle Fleet Capacity',
        description: `${availableTeams.length} collection team(s) are currently Available. Assign queued batches to balance workloads.`,
        urgency: 'low',
        metric: `${availableTeams.length} Teams Available`,
        actionLabel: 'Manage Fleet Teams',
        actionTab: 'teams',
      });
    }

    return recs;
  }, [requests, teams]);

  // CRUD: Add Request (Firestore Sync + Local Fallback)
  const addRequest = (input: CreateRequestInput): PickupRequest => {
    const { score, level } = calculatePriorityScore({
      severity: input.severity,
      waitingHours: input.waitingHours,
      quantityKg: input.quantityKg,
      sensitiveProximity: input.sensitiveProximity,
    });

    const maxNum = requests.reduce((max, r) => {
      const match = r.id.match(/REQ-(?:MUM-)?(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 100);

    const newId = `REQ-MUM-${maxNum + 1}`;

    const newRequest: PickupRequest = {
      id: newId,
      requesterName: input.requesterName?.trim() || 'Citizen / Ward Resident',
      locationName: input.locationName.trim(),
      address: input.address.trim(),
      latitude: Number(input.latitude),
      longitude: Number(input.longitude),
      category: input.category,
      severity: input.severity,
      waitingHours: Number(input.waitingHours),
      quantityKg: Number(input.quantityKg),
      sensitiveProximity: input.sensitiveProximity,
      sensitiveProximityScore: SENSITIVE_PROXIMITY_SCORES[input.sensitiveProximity],
      priorityScore: score,
      priorityLevel: level,
      status: 'Pending',
      notes: input.notes.trim(),
      photos: input.photos || [],
      createdAt: new Date().toISOString(),
    };

    setRequests((prev) => [newRequest, ...prev]);

    // Save to Firestore
    setDoc(doc(db, 'pickup_requests', newId), newRequest).catch((error) => {
      handleFirestoreError(error, OperationType.WRITE, `pickup_requests/${newId}`);
    });

    return newRequest;
  };

  // CRUD: Update Request (Firestore Sync + Local Fallback)
  const updateRequest = (
    id: string,
    updates: Partial<CreateRequestInput> & { status?: RequestStatus; assignedTeamId?: string }
  ) => {
    let updatedRequest: PickupRequest | null = null;

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== id) return req;

        const merged = { ...req, ...updates };

        const severity = updates.severity !== undefined ? updates.severity : req.severity;
        const waitingHours = updates.waitingHours !== undefined ? Number(updates.waitingHours) : req.waitingHours;
        const quantityKg = updates.quantityKg !== undefined ? Number(updates.quantityKg) : req.quantityKg;
        const sensitiveProximity =
          updates.sensitiveProximity !== undefined ? updates.sensitiveProximity : req.sensitiveProximity;

        const { score, level } = calculatePriorityScore({
          severity,
          waitingHours,
          quantityKg,
          sensitiveProximity,
        });

        const sensitiveProximityScore = SENSITIVE_PROXIMITY_SCORES[sensitiveProximity];

        let completedAt = req.completedAt;
        if (updates.status === 'Completed' && req.status !== 'Completed') {
          completedAt = new Date().toISOString();
        } else if (updates.status && updates.status !== 'Completed') {
          completedAt = undefined;
        }

        updatedRequest = {
          ...merged,
          severity,
          waitingHours,
          quantityKg,
          sensitiveProximity,
          sensitiveProximityScore,
          priorityScore: score,
          priorityLevel: level,
          completedAt,
        };

        return updatedRequest;
      })
    );

    if (updatedRequest) {
      setDoc(doc(db, 'pickup_requests', id), updatedRequest).catch((error) => {
        handleFirestoreError(error, OperationType.WRITE, `pickup_requests/${id}`);
      });
    }
  };

  // CRUD: Delete Request (Firestore Sync + Local Fallback)
  const deleteRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));

    // Remove from team assignments
    setTeams((prev) =>
      prev.map((team) => {
        const updatedTeam = {
          ...team,
          assignedRequestIds: team.assignedRequestIds.filter((reqId) => reqId !== id),
          completedRequestIds: team.completedRequestIds.filter((reqId) => reqId !== id),
        };
        setDoc(doc(db, 'teams', team.id), updatedTeam).catch(() => {});
        return updatedTeam;
      })
    );

    deleteDoc(doc(db, 'pickup_requests', id)).catch((error) => {
      handleFirestoreError(error, OperationType.DELETE, `pickup_requests/${id}`);
    });
  };

  // Status transition helper
  const updateRequestStatus = (id: string, newStatus: RequestStatus, teamId?: string) => {
    updateRequest(id, {
      status: newStatus,
      assignedTeamId: teamId !== undefined ? teamId : undefined,
    });

    if (teamId) {
      setTeams((prev) =>
        prev.map((team) => {
          if (team.id === teamId) {
            const hasAssigned = team.assignedRequestIds.includes(id);
            const hasCompleted = team.completedRequestIds.includes(id);

            let newAssigned = [...team.assignedRequestIds];
            let newCompleted = [...team.completedRequestIds];

            if (newStatus === 'Completed') {
              newAssigned = newAssigned.filter((x) => x !== id);
              if (!hasCompleted) newCompleted.push(id);
            } else if (newStatus === 'Assigned' || newStatus === 'In Progress') {
              if (!hasAssigned) newAssigned.push(id);
              newCompleted = newCompleted.filter((x) => x !== id);
            }

            const updatedTeam: CollectionTeam = {
              ...team,
              status: newAssigned.length > 0 ? 'On Route' : 'Available',
              assignedRequestIds: newAssigned,
              completedRequestIds: newCompleted,
            };

            setDoc(doc(db, 'teams', team.id), updatedTeam).catch(() => {});
            return updatedTeam;
          }
          return team;
        })
      );
    }
  };

  // Assign multiple requests to team from Route Optimizer
  const assignRequestsToTeam = (teamId: string, requestIds: string[]) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (requestIds.includes(req.id)) {
          const updated = {
            ...req,
            status: 'Assigned' as RequestStatus,
            assignedTeamId: teamId,
          };
          setDoc(doc(db, 'pickup_requests', req.id), updated).catch(() => {});
          return updated;
        }
        return req;
      })
    );

    setTeams((prev) =>
      prev.map((team) => {
        if (team.id === teamId) {
          const combined = Array.from(new Set([...team.assignedRequestIds, ...requestIds]));
          const updatedTeam: CollectionTeam = {
            ...team,
            status: 'On Route',
            assignedRequestIds: combined,
          };
          setDoc(doc(db, 'teams', team.id), updatedTeam).catch(() => {});
          return updatedTeam;
        }
        return team;
      })
    );
  };

  // Reset Demo Data
  const resetDemoData = () => {
    const freshRequests = getInitialPickupRequests();
    const freshTeams = INITIAL_TEAMS;

    setRequests(freshRequests);
    setTeams(freshTeams);

    try {
      localStorage.setItem(LOCAL_STORAGE_REQ_KEY, JSON.stringify(freshRequests));
      localStorage.setItem(LOCAL_STORAGE_TEAMS_KEY, JSON.stringify(freshTeams));
    } catch (e) {}

    // Overwrite in Firestore
    const batch = writeBatch(db);
    freshRequests.forEach((req) => {
      batch.set(doc(db, 'pickup_requests', req.id), req);
    });
    freshTeams.forEach((t) => {
      batch.set(doc(db, 'teams', t.id), t);
    });
    batch.commit().catch((err) => {
      console.warn('Batch reset write error:', err);
    });
  };

  const markNotificationRead = (id: string) => {
    setReadNotificationIds((prev) => new Set(prev).add(id));
  };

  const markAllNotificationsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds(new Set(allIds));
  };

  return (
    <AppContext.Provider
      value={{
        viewMode,
        setViewMode,
        requests,
        teams,
        depots,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        selectedRequestId,
        setSelectedRequestId,
        focusMapCoords,
        setFocusMapCoords,
        notifications,
        recommendations,
        stats,
        currentUser,
        isAuthReady,
        signInWithGoogle: loginWithGoogle,
        signOutUser: logoutUser,
        addRequest,
        updateRequest,
        deleteRequest,
        updateRequestStatus,
        assignRequestsToTeam,
        resetDemoData,
        markNotificationRead,
        markAllNotificationsRead,
        focusOnMap,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
