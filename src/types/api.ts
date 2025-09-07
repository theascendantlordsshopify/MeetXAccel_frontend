// Complete API type definitions for all backend models

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_organizer: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_mfa_enabled: boolean;
  account_status: 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'password_expired' | 'password_expired_grace_period';
  roles: Role[];
  profile: Profile;
  last_login: string;
  date_joined: string;
}

export interface Profile {
  organizer_slug: string;
  display_name: string;
  bio: string;
  profile_picture?: string;
  phone: string;
  website: string;
  company: string;
  job_title: string;
  timezone_name: string;
  language: string;
  date_format: string;
  time_format: string;
  brand_color: string;
  brand_logo?: string;
  public_profile: boolean;
  show_phone: boolean;
  show_email: boolean;
  reasonable_hours_start: number;
  reasonable_hours_end: number;
}

export interface Role {
  id: string;
  name: string;
  role_type: 'admin' | 'organizer' | 'team_member' | 'billing_manager' | 'viewer';
  description: string;
  parent?: string;
  parent_name?: string;
  children_count: number;
  role_permissions: Permission[];
  total_permissions: number;
  is_system_role: boolean;
}

export interface Permission {
  id: string;
  codename: string;
  name: string;
  description: string;
  category: string;
}

export interface EventType {
  id: string;
  organizer: User;
  name: string;
  event_type_slug: string;
  description: string;
  duration: number;
  max_attendees: number;
  enable_waitlist: boolean;
  is_active: boolean;
  is_private: boolean;
  min_scheduling_notice: number;
  max_scheduling_horizon: number;
  buffer_time_before: number;
  buffer_time_after: number;
  max_bookings_per_day?: number;
  slot_interval_minutes: number;
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrence_rule: string;
  max_occurrences?: number;
  recurrence_end_date?: string;
  location_type: 'video_call' | 'phone_call' | 'in_person' | 'custom';
  location_details: string;
  redirect_url_after_booking: string;
  confirmation_workflow?: string;
  reminder_workflow?: string;
  cancellation_workflow?: string;
  custom_questions: any[];
  questions: CustomQuestion[];
  is_group_event: boolean;
  total_duration_with_buffers: number;
  created_at: string;
  updated_at: string;
}

export interface CustomQuestion {
  id: string;
  question_text: string;
  question_type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'email' | 'phone' | 'number' | 'date' | 'time' | 'url';
  question_type_display: string;
  is_required: boolean;
  order: number;
  options: string[];
  conditions: any[];
  validation_rules: Record<string, any>;
}

export interface Booking {
  id: string;
  event_type: EventType;
  organizer: User;
  invitee_name: string;
  invitee_email: string;
  invitee_phone: string;
  invitee_timezone: string;
  attendee_count: number;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | 'no_show';
  status_display: string;
  recurrence_id?: string;
  is_recurring_exception: boolean;
  recurrence_sequence?: number;
  custom_answers: Record<string, any>;
  meeting_link: string;
  meeting_id: string;
  meeting_password: string;
  calendar_sync_status: 'pending' | 'succeeded' | 'failed' | 'not_required';
  attendees: Attendee[];
  duration_minutes: number;
  can_cancel: boolean;
  can_reschedule: boolean;
  is_access_token_valid: boolean;
  cancelled_at?: string;
  cancelled_by?: 'organizer' | 'invitee' | 'system';
  cancellation_reason: string;
  rescheduled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendee {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'confirmed' | 'cancelled' | 'no_show';
  status_display: string;
  custom_answers: Record<string, any>;
  joined_at: string;
  cancelled_at?: string;
  cancellation_reason: string;
}

export interface WaitlistEntry {
  id: string;
  event_type_name: string;
  desired_start_time: string;
  desired_end_time: string;
  invitee_name: string;
  invitee_email: string;
  invitee_phone: string;
  invitee_timezone: string;
  notify_when_available: boolean;
  expires_at: string;
  status: 'active' | 'notified' | 'converted' | 'expired' | 'cancelled';
  status_display: string;
  is_expired: boolean;
  custom_answers: Record<string, any>;
  notified_at?: string;
  created_at: string;
}

export interface AvailabilityRule {
  id: string;
  day_of_week: number;
  day_of_week_display: string;
  start_time: string;
  end_time: string;
  event_types: string[];
  event_types_count: number;
  spans_midnight: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DateOverrideRule {
  id: string;
  date: string;
  is_available: boolean;
  start_time?: string;
  end_time?: string;
  event_types: string[];
  event_types_count: number;
  spans_midnight: boolean;
  reason: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockedTime {
  id: string;
  start_datetime: string;
  end_datetime: string;
  reason: string;
  source: 'manual' | 'google_calendar' | 'outlook_calendar' | 'apple_calendar' | 'external_sync';
  source_display: string;
  external_id: string;
  external_updated_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringBlockedTime {
  id: string;
  name: string;
  day_of_week: number;
  day_of_week_display: string;
  start_time: string;
  end_time: string;
  start_date?: string;
  end_date?: string;
  spans_midnight: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BufferTime {
  default_buffer_before: number;
  default_buffer_after: number;
  minimum_gap: number;
  slot_interval_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarIntegration {
  id: string;
  provider: 'google' | 'outlook' | 'apple';
  provider_display: string;
  provider_email: string;
  calendar_id: string;
  is_active: boolean;
  sync_enabled: boolean;
  is_token_expired: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoConferenceIntegration {
  id: string;
  provider: 'zoom' | 'google_meet' | 'microsoft_teams' | 'webex';
  provider_display: string;
  provider_email: string;
  is_active: boolean;
  auto_generate_links: boolean;
  is_token_expired: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookIntegration {
  id: string;
  name: string;
  webhook_url: string;
  events: string[];
  is_active: boolean;
  retry_failed: boolean;
  max_retries: number;
  created_at: string;
  updated_at: string;
}

export interface IntegrationLog {
  id: string;
  log_type: string;
  log_type_display: string;
  integration_type: string;
  booking_id?: string;
  message: string;
  details: Record<string, any>;
  success: boolean;
  created_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: 'booking_created' | 'booking_cancelled' | 'booking_completed' | 'before_meeting' | 'after_meeting';
  trigger_display: string;
  event_types_count: number;
  delay_minutes: number;
  is_active: boolean;
  success_rate: number;
  execution_stats: {
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    last_executed_at?: string;
  };
  actions: WorkflowAction[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowAction {
  id: string;
  name: string;
  action_type: 'send_email' | 'send_sms' | 'webhook' | 'update_booking';
  action_type_display: string;
  order: number;
  recipient: 'organizer' | 'invitee' | 'both' | 'custom';
  recipient_display: string;
  custom_email: string;
  subject: string;
  message: string;
  webhook_url: string;
  webhook_data: Record<string, any>;
  conditions: any[];
  update_booking_fields: Record<string, any>;
  is_active: boolean;
  success_rate: number;
  execution_stats: {
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    last_executed_at?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_name: string;
  booking_invitee?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  status_display: string;
  started_at?: string;
  completed_at?: string;
  error_message: string;
  actions_executed: number;
  actions_failed: number;
  execution_log: any[];
  execution_summary: {
    summary: string;
    total_actions: number;
    successful_actions: number;
    failed_actions: number;
    skipped_actions: number;
    success_rate: number;
  };
  execution_time_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  template_type: 'booking_confirmation' | 'booking_reminder' | 'booking_cancellation' | 'booking_rescheduled' | 'follow_up' | 'custom';
  template_type_display: string;
  notification_type: 'email' | 'sms';
  notification_type_display: string;
  subject: string;
  message: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  booking_id?: string;
  template_name?: string;
  notification_type: 'email' | 'sms';
  notification_type_display: string;
  recipient_email: string;
  recipient_phone: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced' | 'delivered' | 'opened' | 'clicked';
  status_display: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  error_message: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  booking_confirmations_email: boolean;
  booking_reminders_email: boolean;
  booking_cancellations_email: boolean;
  daily_agenda_email: boolean;
  booking_confirmations_sms: boolean;
  booking_reminders_sms: boolean;
  booking_cancellations_sms: boolean;
  reminder_minutes_before: number;
  daily_agenda_time: string;
  dnd_enabled: boolean;
  dnd_start_time: string;
  dnd_end_time: string;
  exclude_weekends_reminders: boolean;
  exclude_weekends_agenda: boolean;
  preferred_notification_method: 'email' | 'sms' | 'both';
  max_reminders_per_day: number;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  notes: string;
  tags: string[];
  total_bookings: number;
  last_booking_date?: string;
  groups_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  contact_count: number;
  contacts: Contact[];
  created_at: string;
  updated_at: string;
}

export interface ContactInteraction {
  id: string;
  contact_name: string;
  interaction_type: 'booking_created' | 'booking_completed' | 'booking_cancelled' | 'email_sent' | 'note_added' | 'manual_entry';
  interaction_type_display: string;
  description: string;
  booking_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Invitation {
  id: string;
  invited_email: string;
  role: string;
  role_name: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invited_by_name: string;
  created_at: string;
  expires_at: string;
}

export interface AuditLog {
  id: string;
  user_email?: string;
  action: string;
  action_display: string;
  description: string;
  ip_address?: string;
  user_agent: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface UserSession {
  id: string;
  session_key: string;
  ip_address: string;
  country: string;
  city: string;
  location: string;
  user_agent: string;
  device_info: Record<string, any>;
  created_at: string;
  last_activity: string;
  expires_at: string;
  is_active: boolean;
  is_current: boolean;
  is_expired: boolean;
}

export interface MFADevice {
  id: string;
  device_type: 'totp' | 'sms' | 'backup';
  device_type_display: string;
  name: string;
  phone_number: string;
  is_active: boolean;
  is_primary: boolean;
  last_used_at?: string;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  mfa_required?: boolean;
  mfa_devices?: MFADevice[];
}

export interface RegisterRequest {
  email: string;
  username?: string;
  first_name: string;
  last_name?: string;
  password: string;
  password_confirm: string;
  terms_accepted?: boolean;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface BookingCreateRequest {
  organizer_slug: string;
  event_type_slug: string;
  invitee_name: string;
  invitee_email: string;
  invitee_phone?: string;
  invitee_timezone: string;
  attendee_count: number;
  start_time: string;
  custom_answers: Record<string, any>;
  attendees_data?: Array<{
    name: string;
    email: string;
    phone?: string;
    custom_answers?: Record<string, any>;
  }>;
}

export interface AvailableSlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
  local_start_time?: string;
  local_end_time?: string;
  available_spots?: number;
  invitee_times?: Record<string, {
    start_time: string;
    end_time: string;
    start_hour: number;
    end_hour: number;
  }>;
  fairness_score?: number;
}

export interface AvailabilityResponse {
  organizer_slug: string;
  event_type_slug: string;
  start_date: string;
  end_date: string;
  invitee_timezone: string;
  attendee_count: number;
  available_slots: AvailableSlot[];
  cache_hit: boolean;
  total_slots: number;
  computation_time_ms: number;
  multi_invitee_mode?: boolean;
  invitee_timezones?: string[];
}

// Statistics types
export interface DashboardStats {
  total_event_types: number;
  active_event_types: number;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  completed_bookings: number;
  upcoming_bookings: number;
  calendar_integrations: number;
  video_integrations: number;
  active_workflows: number;
  recent_bookings: Booking[];
}

export interface BookingAnalytics {
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  completed_bookings: number;
  no_show_bookings: number;
  calendar_sync_success: number;
  calendar_sync_failed: number;
  calendar_sync_pending: number;
  bookings_by_event_type: Array<{
    event_type__name: string;
    count: number;
  }>;
  cancellations_by_actor: Array<{
    cancelled_by: string;
    count: number;
  }>;
  group_event_stats: {
    total_group_bookings: number;
    average_attendees: number;
  };
}

export interface AvailabilityStats {
  total_rules: number;
  active_rules: number;
  total_overrides: number;
  total_blocks: number;
  total_recurring_blocks: number;
  average_weekly_hours: number;
  busiest_day: string;
  daily_hours: Record<string, number>;
  cache_hit_rate: number;
}

export interface ContactStats {
  total_contacts: number;
  active_contacts: number;
  total_groups: number;
  recent_interactions: number;
  top_companies: Array<{
    company: string;
    count: number;
  }>;
  booking_frequency: {
    this_month: number;
    last_month: number;
    this_year: number;
  };
}

export interface NotificationStats {
  total_notifications: number;
  total_sent: number;
  total_failed: number;
  total_pending: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  email_count: number;
  sms_count: number;
  email_delivery_rate: number;
  email_open_rate: number;
  email_click_rate: number;
  sms_delivery_rate: number;
  recent_activity: {
    total: number;
    sent: number;
    failed: number;
  };
  top_templates: Array<{
    template__name: string;
    usage_count: number;
  }>;
  preferences: {
    daily_reminder_count: number;
    daily_reminder_limit: number;
    can_send_more_reminders: boolean;
    preferred_method: string;
    dnd_enabled: boolean;
  };
}

export interface WorkflowStats {
  total_workflows: number;
  active_workflows: number;
  inactive_workflows: number;
  execution_stats_30_days: {
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    success_rate: number;
  };
  top_performing_workflows: Array<{
    workflow_id: string;
    workflow_name: string;
    total_executions: number;
    successful_executions: number;
    success_rate: number;
    last_executed?: string;
  }>;
  problematic_workflows: Array<{
    workflow_id: string;
    workflow_name: string;
    total_executions: number;
    successful_executions: number;
    success_rate: number;
    last_executed?: string;
  }>;
}