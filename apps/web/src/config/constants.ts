export enum API_ENDPOINTS {
  LOGIN = '/auth/login',     // Added /auth prefix
  SIGNUP = '/auth/signup',   // Added /auth prefix
  ME = '/auth/me',          // Added /auth prefix
  WORKFLOWS = '/workflows',
  CONNECTORS = '/connectors',

  WORKFLOW_SAVE = "/workflow/save",            // upsert (create/update)
  WORKFLOW_BY_ID = '/workflow/:id',
  WORKFLOW_RUN = '/workflow/:id/run',
}

export const getWorkflowById = (id: string) => API_ENDPOINTS.WORKFLOW_BY_ID.replace(':id', id);
export const getWorkflowRun = (id: string) => API_ENDPOINTS.WORKFLOW_RUN.replace(':id', id);

export enum ROUTES {
  HOME = '/',
  LOGIN = '/login',
  SIGNUP = '/signup',
  DASHBOARD = '/dashboard',
  WORKFLOWS = '/workflows',
  SETTINGS = '/settings'
}

export enum HTTP_STATUS {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}

export enum LOCAL_STORAGE_KEYS {
  TOKEN = 'token',
  USER = 'user',
  THEME = 'theme'
}

export enum ERROR_MESSAGES {
  NETWORK_ERROR = 'Network error occurred',
  INVALID_CREDENTIALS = 'Invalid credentials',
  USER_EXISTS = 'User already exists',
  MISSING_TOKEN = 'Authentication token missing',
  INTERNAL_ERROR = 'Internal server error'
}

export enum SUCCESS_MESSAGES {
  LOGIN_SUCCESS = 'Successfully logged in',
  SIGNUP_SUCCESS = 'Account created successfully',
  LOGOUT_SUCCESS = 'Successfully logged out'
}

// Configuration object
export const CONFIG = {
  API: {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000',
    TIMEOUT: 10000
  },
  JWT: {
    EXPIRES_IN: '7d'
  },
  APP: {
    NAME: 'TriggerForge',
    VERSION: '1.0.0'
  }
} as const;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${CONFIG.API.BASE_URL}${endpoint}`;
};

// Helper function to get full route paths
export const getRoute = (route: ROUTES): string => {
  return route;
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export const WORKFLOW_NODE_TYPES = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  TIMER: 'timer',
  EMAIL: 'email',
  WEBHOOK: 'webhook',
  DATABASE: 'database',
  CODE: 'code',
  FILTER: 'filter',
} as const;

export const WORKFLOW_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;