import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  VideoCameraIcon,
  PhoneIcon,
  UserIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { publicApi } from '../../services/api';

export const PublicOrganizerPage: React.FC = () => {
  const { organizerSlug } = useParams<{ organizerSlug: string }>();

  const { data: organizerData, isLoading, error } = useQuery({
    queryKey: ['public-organizer', organizerSlug],
    queryFn: () => publicApi.getOrganizerPage(organizerSlug!),
    enabled: !!organizerSlug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !organizerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Organizer Not Found</h1>
          <p className="text-neutral-600">
            The organizer you're looking for doesn't exist or is not available.
          </p>
        </div>
      </div>
    );
  }

  const { profile, event_types } = organizerData;

  const getLocationIcon = (locationType: string) => {
    switch (locationType) {
      case 'video_call':
        return <VideoCameraIcon className="h-4 w-4" />;
      case 'phone_call':
        return <PhoneIcon className="h-4 w-4" />;
      case 'in_person':
        return <MapPinIcon className="h-4 w-4" />;
      default:
        return <MapPinIcon className="h-4 w-4" />;
    }
  };

  const getLocationLabel = (locationType: string) => {
    switch (locationType) {
      case 'video_call':
        return 'Video Call';
      case 'phone_call':
        return 'Phone Call';
      case 'in_person':
        return 'In Person';
      default:
        return 'Custom';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start space-x-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={profile.display_name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-monkai-100 flex items-center justify-center border-4 border-white shadow-lg">
                  <UserIcon className="h-12 w-12 text-monkai-600" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
                {profile.display_name}
              </h1>
              
              {profile.job_title && (
                <p className="text-lg text-neutral-600 mb-2">{profile.job_title}</p>
              )}
              
              {profile.company && (
                <div className="flex items-center text-neutral-600 mb-3">
                  <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                  <span>{profile.company}</span>
                </div>
              )}

              {profile.bio && (
                <p className="text-neutral-700 mb-4 max-w-2xl">{profile.bio}</p>
              )}

              <div className="flex items-center space-x-4 text-sm text-neutral-600">
                {profile.show_email && profile.user?.email && (
                  <span>{profile.user.email}</span>
                )}
                
                {profile.show_phone && profile.phone && (
                  <span>{profile.phone}</span>
                )}
                
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-monkai-600 hover:text-monkai-700"
                  >
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Types */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
            Book a time with me
          </h2>
          <p className="text-neutral-600">
            Choose from the available meeting types below.
          </p>
        </div>

        {event_types && event_types.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {event_types.map((eventType) => (
              <Card key={eventType.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {eventType.name}
                    </h3>
                    
                    <div className="flex items-center text-neutral-600 mb-3">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      <span>{eventType.duration} minutes</span>
                    </div>

                    <div className="flex items-center text-neutral-600 mb-3">
                      {getLocationIcon(eventType.location_type)}
                      <span className="ml-2">{getLocationLabel(eventType.location_type)}</span>
                    </div>

                    {eventType.is_group_event && (
                      <div className="mb-3">
                        <Badge variant="primary" size="sm">
                          Group Event (Max {eventType.max_attendees})
                        </Badge>
                      </div>
                    )}

                    {eventType.description && (
                      <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                        {eventType.description}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  to={`/${organizerSlug}/${eventType.event_type_slug}`}
                  className="block"
                >
                  <Button variant="primary" className="w-full">
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    Select Time
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-sm font-medium text-neutral-900">
              No available event types
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              This organizer hasn't set up any bookable events yet.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-neutral-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-neutral-500 text-sm">
            <p>
              Powered by{' '}
              <a
                href="/"
                className="text-monkai-600 hover:text-monkai-700 font-medium"
              >
                Calendly Clone
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};