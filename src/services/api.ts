import axios, { AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import {
  User, EventType, Booking, AvailabilityRule, DateOverrideRule, BlockedTime,
  RecurringBlockedTime, BufferTime, CalendarIntegration, VideoConferenceIntegration,
  WebhookIntegration, IntegrationLog, Workflow, WorkflowAction, WorkflowExecution,
  NotificationTemplate, NotificationLog, NotificationPreference, Contact,
  ContactGroup, ContactInteraction, Invitation, AuditLog, UserSession,
  MFADevice, LoginRequest, LoginResponse, RegisterRequest, ChangePasswordRequest,
  BookingCreateRequest, AvailabilityResponse, DashboardStats, BookingAnalytics,
  AvailabilityStats, ContactStats, NotificationStats, WorkflowStats,
  PaginatedResponse, ApiResponse
} from '../types/api';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      toast.error('Session expired. Please log in again.');
      window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/users/login/', data);
    return response.data;
  },
  
  register: async (data: RegisterRequest): Promise<ApiResponse<{ user: User; token: string; message: string }>> => {
    const response = await api.post('/users/register/', data);
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    await api.post('/users/logout/');
  },
  
  requestPasswordReset: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/users/request-password-reset/', { email });
    return response.data;
  },
  
  confirmPasswordReset: async (token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/users/confirm-password-reset/', {
      token,
      new_password: newPassword,
      new_password_confirm: newPassword,
    });
    return response.data;
  },
  
  verifyEmail: async (token: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/users/verify-email/', { token });
    return response.data;
  },
  
  resendVerification: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/users/resend-verification/', { email });
    return response.data;
  },
  
  changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse<{ message: string; token: string }>> => {
    const response = await api.post('/users/change-password/', data);
    return response.data;
  },
  
  forcePasswordChange: async (newPassword: string): Promise<ApiResponse<{ message: string; token: string }>> => {
    const response = await api.post('/users/force-password-change/', {
      new_password: newPassword,
      new_password_confirm: newPassword,
    });
    return response.data;
  },
};

// Profile API
export const profileApi = {
  get: async (): Promise<User> => {
    const response = await api.get<User>('/users/profile/');
    return response.data;
  },
  
  update: async (data: Partial<User['profile']>): Promise<User> => {
    const response = await api.patch<User>('/users/profile/', data);
    return response.data;
  },
};

// Event Types API
export const eventTypesApi = {
  list: async (): Promise<EventType[]> => {
    const response = await api.get<EventType[]>('/events/event-types/');
    return response.data;
  },
  
  get: async (id: string): Promise<EventType> => {
    const response = await api.get<EventType>(`/events/event-types/${id}/`);
    return response.data;
  },
  
  create: async (data: Partial<EventType>): Promise<EventType> => {
    const response = await api.post<EventType>('/events/event-types/', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<EventType>): Promise<EventType> => {
    const response = await api.patch<EventType>(`/events/event-types/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/event-types/${id}/`);
  },
};

// Bookings API
export const bookingsApi = {
  list: async (params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Booking[]> => {
    const response = await api.get<Booking[]>('/events/bookings/', { params });
    return response.data;
  },
  
  get: async (id: string): Promise<Booking> => {
    const response = await api.get<Booking>(`/events/bookings/${id}/`);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Booking>): Promise<Booking> => {
    const response = await api.patch<Booking>(`/events/bookings/${id}/`, data);
    return response.data;
  },
  
  create: async (data: BookingCreateRequest): Promise<Booking> => {
    const response = await api.post<Booking>('/events/bookings/create/', data);
    return response.data;
  },
  
  cancel: async (id: string, reason?: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/events/bookings/${id}/cancel/`, { reason });
    return response.data;
  },
  
  addAttendee: async (bookingId: string, attendeeData: {
    name: string;
    email: string;
    phone?: string;
    custom_answers?: Record<string, any>;
  }): Promise<any> => {
    const response = await api.post(`/events/bookings/${bookingId}/attendees/add/`, attendeeData);
    return response.data;
  },
  
  removeAttendee: async (bookingId: string, attendeeId: string, reason?: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/events/bookings/${bookingId}/attendees/${attendeeId}/remove/`, { reason });
    return response.data;
  },
  
  getAnalytics: async (): Promise<BookingAnalytics> => {
    const response = await api.get<BookingAnalytics>('/events/analytics/');
    return response.data;
  },
  
  getAuditLogs: async (bookingId: string): Promise<any> => {
    const response = await api.get(`/events/bookings/${bookingId}/audit/`);
    return response.data;
  },
};

// Public API (no auth required)
export const publicApi = {
  getOrganizerPage: async (organizerSlug: string): Promise<any> => {
    const response = await api.get(`/events/public/${organizerSlug}/`);
    return response.data;
  },
  
  getEventTypePage: async (organizerSlug: string, eventTypeSlug: string, params?: {
    start_date?: string;
    end_date?: string;
    timezone?: string;
    attendee_count?: number;
  }): Promise<any> => {
    const response = await api.get(`/events/public/${organizerSlug}/${eventTypeSlug}/`, { params });
    return response.data;
  },
  
  getAvailableSlots: async (organizerSlug: string, eventTypeSlug: string, params: {
    start_date: string;
    end_date: string;
    timezone: string;
    attendee_count?: number;
  }): Promise<AvailabilityResponse> => {
    const response = await api.get<AvailabilityResponse>(`/events/slots/${organizerSlug}/${eventTypeSlug}/`, { params });
    return response.data;
  },
  
  createBooking: async (data: BookingCreateRequest): Promise<Booking> => {
    const response = await api.post<Booking>('/events/bookings/create/', data);
    return response.data;
  },
  
  getBookingManagement: async (accessToken: string): Promise<any> => {
    const response = await api.get(`/events/booking/${accessToken}/manage/`);
    return response.data;
  },
  
  manageBooking: async (accessToken: string, action: string, data?: any): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/events/booking/${accessToken}/manage/`, { action, ...data });
    return response.data;
  },
};

// Availability API
export const availabilityApi = {
  getRules: async (): Promise<AvailabilityRule[]> => {
    const response = await api.get<AvailabilityRule[]>('/availability/rules/');
    return response.data;
  },
  
  createRule: async (data: Partial<AvailabilityRule>): Promise<AvailabilityRule> => {
    const response = await api.post<AvailabilityRule>('/availability/rules/', data);
    return response.data;
  },
  
  updateRule: async (id: string, data: Partial<AvailabilityRule>): Promise<AvailabilityRule> => {
    const response = await api.patch<AvailabilityRule>(`/availability/rules/${id}/`, data);
    return response.data;
  },
  
  deleteRule: async (id: string): Promise<void> => {
    await api.delete(`/availability/rules/${id}/`);
  },
  
  getOverrides: async (): Promise<DateOverrideRule[]> => {
    const response = await api.get<DateOverrideRule[]>('/availability/overrides/');
    return response.data;
  },
  
  createOverride: async (data: Partial<DateOverrideRule>): Promise<DateOverrideRule> => {
    const response = await api.post<DateOverrideRule>('/availability/overrides/', data);
    return response.data;
  },
  
  updateOverride: async (id: string, data: Partial<DateOverrideRule>): Promise<DateOverrideRule> => {
    const response = await api.patch<DateOverrideRule>(`/availability/overrides/${id}/`, data);
    return response.data;
  },
  
  deleteOverride: async (id: string): Promise<void> => {
    await api.delete(`/availability/overrides/${id}/`);
  },
  
  getBlockedTimes: async (): Promise<BlockedTime[]> => {
    const response = await api.get<BlockedTime[]>('/availability/blocked/');
    return response.data;
  },
  
  createBlockedTime: async (data: Partial<BlockedTime>): Promise<BlockedTime> => {
    const response = await api.post<BlockedTime>('/availability/blocked/', data);
    return response.data;
  },
  
  updateBlockedTime: async (id: string, data: Partial<BlockedTime>): Promise<BlockedTime> => {
    const response = await api.patch<BlockedTime>(`/availability/blocked/${id}/`, data);
    return response.data;
  },
  
  deleteBlockedTime: async (id: string): Promise<void> => {
    await api.delete(`/availability/blocked/${id}/`);
  },
  
  getRecurringBlocks: async (): Promise<RecurringBlockedTime[]> => {
    const response = await api.get<RecurringBlockedTime[]>('/availability/recurring-blocks/');
    return response.data;
  },
  
  createRecurringBlock: async (data: Partial<RecurringBlockedTime>): Promise<RecurringBlockedTime> => {
    const response = await api.post<RecurringBlockedTime>('/availability/recurring-blocks/', data);
    return response.data;
  },
  
  updateRecurringBlock: async (id: string, data: Partial<RecurringBlockedTime>): Promise<RecurringBlockedTime> => {
    const response = await api.patch<RecurringBlockedTime>(`/availability/recurring-blocks/${id}/`, data);
    return response.data;
  },
  
  deleteRecurringBlock: async (id: string): Promise<void> => {
    await api.delete(`/availability/recurring-blocks/${id}/`);
  },
  
  getBufferSettings: async (): Promise<BufferTime> => {
    const response = await api.get<BufferTime>('/availability/buffer/');
    return response.data;
  },
  
  updateBufferSettings: async (data: Partial<BufferTime>): Promise<BufferTime> => {
    const response = await api.patch<BufferTime>('/availability/buffer/', data);
    return response.data;
  },
  
  getStats: async (): Promise<AvailabilityStats> => {
    const response = await api.get<AvailabilityStats>('/availability/stats/');
    return response.data;
  },
  
  clearCache: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/availability/cache/clear/');
    return response.data;
  },
  
  precomputeCache: async (daysAhead?: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/availability/cache/precompute/', { days_ahead: daysAhead });
    return response.data;
  },
};

// Integrations API
export const integrationsApi = {
  getCalendarIntegrations: async (): Promise<CalendarIntegration[]> => {
    const response = await api.get<CalendarIntegration[]>('/integrations/calendar/');
    return response.data;
  },
  
  getVideoIntegrations: async (): Promise<VideoConferenceIntegration[]> => {
    const response = await api.get<VideoConferenceIntegration[]>('/integrations/video/');
    return response.data;
  },
  
  getWebhooks: async (): Promise<WebhookIntegration[]> => {
    const response = await api.get<WebhookIntegration[]>('/integrations/webhooks/');
    return response.data;
  },
  
  createWebhook: async (data: Partial<WebhookIntegration>): Promise<WebhookIntegration> => {
    const response = await api.post<WebhookIntegration>('/integrations/webhooks/', data);
    return response.data;
  },
  
  updateWebhook: async (id: string, data: Partial<WebhookIntegration>): Promise<WebhookIntegration> => {
    const response = await api.patch<WebhookIntegration>(`/integrations/webhooks/${id}/`, data);
    return response.data;
  },
  
  deleteWebhook: async (id: string): Promise<void> => {
    await api.delete(`/integrations/webhooks/${id}/`);
  },
  
  testWebhook: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/integrations/webhooks/${id}/test/`);
    return response.data;
  },
  
  getLogs: async (): Promise<IntegrationLog[]> => {
    const response = await api.get<IntegrationLog[]>('/integrations/logs/');
    return response.data;
  },
  
  initiateOAuth: async (provider: string, integrationType: string, redirectUri: string): Promise<any> => {
    const response = await api.post('/integrations/oauth/initiate/', {
      provider,
      integration_type: integrationType,
      redirect_uri: redirectUri,
    });
    return response.data;
  },
  
  getHealth: async (): Promise<any> => {
    const response = await api.get('/integrations/health/');
    return response.data;
  },
  
  refreshCalendarSync: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/integrations/calendar/${id}/refresh/`);
    return response.data;
  },
  
  forceCalendarSync: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/integrations/calendar/${id}/force-sync/`);
    return response.data;
  },
  
  getCalendarConflicts: async (): Promise<any> => {
    const response = await api.get('/integrations/calendar/conflicts/');
    return response.data;
  },
};

// Workflows API
export const workflowsApi = {
  list: async (): Promise<Workflow[]> => {
    const response = await api.get<Workflow[]>('/workflows/');
    return response.data;
  },
  
  get: async (id: string): Promise<Workflow> => {
    const response = await api.get<Workflow>(`/workflows/${id}/`);
    return response.data;
  },
  
  create: async (data: Partial<Workflow>): Promise<Workflow> => {
    const response = await api.post<Workflow>('/workflows/', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Workflow>): Promise<Workflow> => {
    const response = await api.patch<Workflow>(`/workflows/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/workflows/${id}/`);
  },
  
  test: async (id: string, testData: any): Promise<any> => {
    const response = await api.post(`/workflows/${id}/test/`, testData);
    return response.data;
  },
  
  validate: async (id: string): Promise<any> => {
    const response = await api.post(`/workflows/${id}/validate/`);
    return response.data;
  },
  
  getExecutionSummary: async (id: string): Promise<any> => {
    const response = await api.get(`/workflows/${id}/execution-summary/`);
    return response.data;
  },
  
  duplicate: async (id: string): Promise<Workflow> => {
    const response = await api.post<Workflow>(`/workflows/${id}/duplicate/`);
    return response.data;
  },
  
  getActions: async (workflowId: string): Promise<WorkflowAction[]> => {
    const response = await api.get<WorkflowAction[]>(`/workflows/${workflowId}/actions/`);
    return response.data;
  },
  
  createAction: async (workflowId: string, data: Partial<WorkflowAction>): Promise<WorkflowAction> => {
    const response = await api.post<WorkflowAction>(`/workflows/${workflowId}/actions/`, data);
    return response.data;
  },
  
  updateAction: async (id: string, data: Partial<WorkflowAction>): Promise<WorkflowAction> => {
    const response = await api.patch<WorkflowAction>(`/workflows/actions/${id}/`, data);
    return response.data;
  },
  
  deleteAction: async (id: string): Promise<void> => {
    await api.delete(`/workflows/actions/${id}/`);
  },
  
  getExecutions: async (): Promise<WorkflowExecution[]> => {
    const response = await api.get<WorkflowExecution[]>('/workflows/executions/');
    return response.data;
  },
  
  getPerformanceStats: async (): Promise<WorkflowStats> => {
    const response = await api.get<WorkflowStats>('/workflows/performance-stats/');
    return response.data;
  },
};

// Notifications API
export const notificationsApi = {
  getTemplates: async (): Promise<NotificationTemplate[]> => {
    const response = await api.get<NotificationTemplate[]>('/notifications/templates/');
    return response.data;
  },
  
  createTemplate: async (data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const response = await api.post<NotificationTemplate>('/notifications/templates/', data);
    return response.data;
  },
  
  updateTemplate: async (id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const response = await api.patch<NotificationTemplate>(`/notifications/templates/${id}/`, data);
    return response.data;
  },
  
  deleteTemplate: async (id: string): Promise<void> => {
    await api.delete(`/notifications/templates/${id}/`);
  },
  
  testTemplate: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/notifications/templates/${id}/test/`);
    return response.data;
  },
  
  getLogs: async (): Promise<NotificationLog[]> => {
    const response = await api.get<NotificationLog[]>('/notifications/logs/');
    return response.data;
  },
  
  getPreferences: async (): Promise<NotificationPreference> => {
    const response = await api.get<NotificationPreference>('/notifications/preferences/');
    return response.data;
  },
  
  updatePreferences: async (data: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    const response = await api.patch<NotificationPreference>('/notifications/preferences/', data);
    return response.data;
  },
  
  getStats: async (): Promise<NotificationStats> => {
    const response = await api.get<NotificationStats>('/notifications/stats/');
    return response.data;
  },
  
  getHealth: async (): Promise<any> => {
    const response = await api.get('/notifications/health/');
    return response.data;
  },
  
  sendNotification: async (data: any): Promise<ApiResponse<{ message: string; notification_id: string }>> => {
    const response = await api.post('/notifications/send/', data);
    return response.data;
  },
  
  resendNotification: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/notifications/${id}/resend/`);
    return response.data;
  },
};

// Contacts API
export const contactsApi = {
  list: async (params?: {
    search?: string;
    group?: string;
    tags?: string;
    is_active?: boolean;
  }): Promise<Contact[]> => {
    const response = await api.get<Contact[]>('/contacts/', { params });
    return response.data;
  },
  
  get: async (id: string): Promise<Contact> => {
    const response = await api.get<Contact>(`/contacts/${id}/`);
    return response.data;
  },
  
  create: async (data: Partial<Contact>): Promise<Contact> => {
    const response = await api.post<Contact>('/contacts/', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Contact>): Promise<Contact> => {
    const response = await api.patch<Contact>(`/contacts/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/contacts/${id}/`);
  },
  
  getGroups: async (): Promise<ContactGroup[]> => {
    const response = await api.get<ContactGroup[]>('/contacts/groups/');
    return response.data;
  },
  
  createGroup: async (data: Partial<ContactGroup>): Promise<ContactGroup> => {
    const response = await api.post<ContactGroup>('/contacts/groups/', data);
    return response.data;
  },
  
  updateGroup: async (id: string, data: Partial<ContactGroup>): Promise<ContactGroup> => {
    const response = await api.patch<ContactGroup>(`/contacts/groups/${id}/`, data);
    return response.data;
  },
  
  deleteGroup: async (id: string): Promise<void> => {
    await api.delete(`/contacts/groups/${id}/`);
  },
  
  getInteractions: async (contactId?: string): Promise<ContactInteraction[]> => {
    const url = contactId ? `/contacts/${contactId}/interactions/` : '/contacts/interactions/';
    const response = await api.get<ContactInteraction[]>(url);
    return response.data;
  },
  
  addInteraction: async (contactId: string, data: any): Promise<ContactInteraction> => {
    const response = await api.post<ContactInteraction>(`/contacts/${contactId}/interactions/add/`, data);
    return response.data;
  },
  
  getStats: async (): Promise<ContactStats> => {
    const response = await api.get<ContactStats>('/contacts/stats/');
    return response.data;
  },
  
  importContacts: async (file: File, options: any): Promise<ApiResponse<{ message: string; task_id: string }>> => {
    const formData = new FormData();
    formData.append('csv_file', file);
    formData.append('skip_duplicates', options.skip_duplicates);
    formData.append('update_existing', options.update_existing);
    
    const response = await api.post('/contacts/import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  exportContacts: async (): Promise<Blob> => {
    const response = await api.get('/contacts/export/', { responseType: 'blob' });
    return response.data;
  },
  
  mergeContacts: async (primaryContactId: string, duplicateContactIds: string[]): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/contacts/merge/', {
      primary_contact_id: primaryContactId,
      duplicate_contact_ids: duplicateContactIds,
    });
    return response.data;
  },
};

// Team Management API
export const teamApi = {
  getInvitations: async (): Promise<Invitation[]> => {
    const response = await api.get<Invitation[]>('/users/invitations/');
    return response.data;
  },
  
  sendInvitation: async (data: {
    invited_email: string;
    role: string;
    message?: string;
  }): Promise<Invitation> => {
    const response = await api.post<Invitation>('/users/invitations/', data);
    return response.data;
  },
  
  respondToInvitation: async (data: any): Promise<ApiResponse<any>> => {
    const response = await api.post('/users/invitations/respond/', data);
    return response.data;
  },
  
  getRoles: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>('/users/roles/');
    return response.data;
  },
  
  getPermissions: async (): Promise<Permission[]> => {
    const response = await api.get<Permission[]>('/users/permissions/');
    return response.data;
  },
};

// Session Management API
export const sessionApi = {
  getSessions: async (): Promise<UserSession[]> => {
    const response = await api.get<UserSession[]>('/users/sessions/');
    return response.data;
  },
  
  revokeSession: async (sessionId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/users/sessions/${sessionId}/revoke/`);
    return response.data;
  },
  
  revokeAllSessions: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/users/sessions/revoke-all/');
    return response.data;
  },
};

// MFA API
export const mfaApi = {
  getDevices: async (): Promise<MFADevice[]> => {
    const response = await api.get<MFADevice[]>('/users/mfa/devices/');
    return response.data;
  },
  
  setupMFA: async (data: {
    device_type: 'totp' | 'sms';
    device_name: string;
    phone_number?: string;
  }): Promise<any> => {
    const response = await api.post('/users/mfa/setup/', data);
    return response.data;
  },
  
  verifyMFASetup: async (token: string): Promise<ApiResponse<{ message: string; backup_codes: string[] }>> => {
    const response = await api.post('/users/mfa/verify/', { token });
    return response.data;
  },
  
  disableMFA: async (password: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/users/mfa/disable/', { password });
    return response.data;
  },
  
  regenerateBackupCodes: async (password: string): Promise<ApiResponse<{ message: string; backup_codes: string[] }>> => {
    const response = await api.post('/users/mfa/backup-codes/regenerate/', { password });
    return response.data;
  },
  
  sendSmsMfaCodeView: async (deviceId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post('/users/mfa/send-sms-code/', { device_id: deviceId });
    return response.data;
  },
  
  verifyMfaLogin: async (token: string, deviceId?: string): Promise<ApiResponse<{ message: string; token: string }>> => {
    const response = await api.post('/users/mfa/verify-login/', { token, device_id: deviceId });
    return response.data;
  },
};

// Audit Logs API
export const auditApi = {
  getUserLogs: async (): Promise<AuditLog[]> => {
    const response = await api.get<AuditLog[]>('/users/audit-logs/');
    return response.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats/');
    return response.data;
  },
};

export default api;