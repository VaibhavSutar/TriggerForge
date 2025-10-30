export var API_ENDPOINTS;
(function (API_ENDPOINTS) {
    API_ENDPOINTS["LOGIN"] = "/auth/login";
    API_ENDPOINTS["SIGNUP"] = "/auth/signup";
    API_ENDPOINTS["ME"] = "/auth/me";
    API_ENDPOINTS["WORKFLOWS"] = "/workflows";
    API_ENDPOINTS["CONNECTORS"] = "/connectors";
})(API_ENDPOINTS || (API_ENDPOINTS = {}));
export var ROUTES;
(function (ROUTES) {
    ROUTES["HOME"] = "/";
    ROUTES["LOGIN"] = "/login";
    ROUTES["SIGNUP"] = "/signup";
    ROUTES["DASHBOARD"] = "/dashboard";
    ROUTES["WORKFLOWS"] = "/workflows";
    ROUTES["SETTINGS"] = "/settings";
})(ROUTES || (ROUTES = {}));
export var HTTP_STATUS;
(function (HTTP_STATUS) {
    HTTP_STATUS[HTTP_STATUS["OK"] = 200] = "OK";
    HTTP_STATUS[HTTP_STATUS["CREATED"] = 201] = "CREATED";
    HTTP_STATUS[HTTP_STATUS["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HTTP_STATUS[HTTP_STATUS["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HTTP_STATUS[HTTP_STATUS["FORBIDDEN"] = 403] = "FORBIDDEN";
    HTTP_STATUS[HTTP_STATUS["NOT_FOUND"] = 404] = "NOT_FOUND";
    HTTP_STATUS[HTTP_STATUS["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
})(HTTP_STATUS || (HTTP_STATUS = {}));
export var LOCAL_STORAGE_KEYS;
(function (LOCAL_STORAGE_KEYS) {
    LOCAL_STORAGE_KEYS["TOKEN"] = "token";
    LOCAL_STORAGE_KEYS["USER"] = "user";
    LOCAL_STORAGE_KEYS["THEME"] = "theme";
})(LOCAL_STORAGE_KEYS || (LOCAL_STORAGE_KEYS = {}));
export var ERROR_MESSAGES;
(function (ERROR_MESSAGES) {
    ERROR_MESSAGES["NETWORK_ERROR"] = "Network error occurred";
    ERROR_MESSAGES["INVALID_CREDENTIALS"] = "Invalid credentials";
    ERROR_MESSAGES["USER_EXISTS"] = "User already exists";
    ERROR_MESSAGES["MISSING_TOKEN"] = "Authentication token missing";
    ERROR_MESSAGES["INTERNAL_ERROR"] = "Internal server error";
})(ERROR_MESSAGES || (ERROR_MESSAGES = {}));
export var SUCCESS_MESSAGES;
(function (SUCCESS_MESSAGES) {
    SUCCESS_MESSAGES["LOGIN_SUCCESS"] = "Successfully logged in";
    SUCCESS_MESSAGES["SIGNUP_SUCCESS"] = "Account created successfully";
    SUCCESS_MESSAGES["LOGOUT_SUCCESS"] = "Successfully logged out";
})(SUCCESS_MESSAGES || (SUCCESS_MESSAGES = {}));
// Configuration object
export const CONFIG = {
    API: {
        BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
        TIMEOUT: 10000
    },
    JWT: {
        EXPIRES_IN: '7d'
    },
    APP: {
        NAME: 'TriggerForge',
        VERSION: '1.0.0'
    }
};
// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
    return `${CONFIG.API.BASE_URL}${endpoint}`;
};
// Helper function to get full route paths
export const getRoute = (route) => {
    return route;
};
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
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
};
export const WORKFLOW_STATUS = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
};
