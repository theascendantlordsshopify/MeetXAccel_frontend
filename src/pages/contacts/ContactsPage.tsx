import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { StatusIndicator } from '../../components/ui/StatusIndicator';
import { contactsApi } from '../../services/api';
import { format } from 'date-fns';

const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_active: z.boolean(),
});

const groupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
});

type ContactFormData = z.infer<typeof contactSchema>;
type GroupFormData = z.infer<typeof groupSchema>;

export const ContactsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('contacts');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { is_active: true, tags: [] },
  });

  const groupForm = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: { color: '#6366f1' },
  });

  // Queries
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts', searchQuery],
    queryFn: () => contactsApi.list({ search: searchQuery }),
  });

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['contact-groups'],
    queryFn: contactsApi.getGroups,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['contact-stats'],
    queryFn: contactsApi.getStats,
  });

  // Mutations
  const createContactMutation = useMutation({
    mutationFn: contactsApi.create,
    onSuccess: () => {
      toast.success('Contact created successfully');
      setShowContactModal(false);
      contactForm.reset();
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => {
      toast.error('Failed to create contact');
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContactFormData> }) =>
      contactsApi.update(id, data),
    onSuccess: () => {
      toast.success('Contact updated successfully');
      setShowContactModal(false);
      setEditingContact(null);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => {
      toast.error('Failed to update contact');
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: contactsApi.delete,
    onSuccess: () => {
      toast.success('Contact deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => {
      toast.error('Failed to delete contact');
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: contactsApi.createGroup,
    onSuccess: () => {
      toast.success('Group created successfully');
      setShowGroupModal(false);
      groupForm.reset();
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
    },
    onError: () => {
      toast.error('Failed to create group');
    },
  });

  const exportContactsMutation = useMutation({
    mutationFn: contactsApi.exportContacts,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Contacts exported successfully');
    },
    onError: () => {
      toast.error('Failed to export contacts');
    },
  });

  const onContactSubmit = (data: ContactFormData) => {
    if (editingContact) {
      updateContactMutation.mutate({ id: editingContact.id, data });
    } else {
      createContactMutation.mutate(data);
    }
  };

  const onGroupSubmit = (data: GroupFormData) => {
    createGroupMutation.mutate(data);
  };

  const openEditContact = (contact: any) => {
    setEditingContact(contact);
    contactForm.reset(contact);
    setShowContactModal(true);
  };

  const tabs = [
    { id: 'contacts', name: 'Contacts', icon: UserGroupIcon },
    { id: 'groups', name: 'Groups', icon: BuildingOfficeIcon },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Contacts</h1>
          <p className="text-neutral-600">Manage your contacts and organize them into groups</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => exportContactsMutation.mutate()}
            loading={exportContactsMutation.isPending}
            icon={<ArrowDownTrayIcon className="h-4 w-4" />}
          >
            Export
          </Button>
          
          <Button
            variant="secondary"
            icon={<ArrowUpTrayIcon className="h-4 w-4" />}
          >
            Import
          </Button>
          
          <Button
            variant="primary"
            onClick={() => setShowContactModal(true)}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-monkai-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-monkai-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Total Contacts</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.total_contacts || 0}
              </p>
              <p className="text-xs text-monkai-600">
                {stats?.active_contacts || 0} active
              </p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-accent-100 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-accent-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Groups</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.total_groups || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-warning-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Recent Activity</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.recent_interactions || 0}
              </p>
              <p className="text-xs text-warning-600">this month</p>
            </div>
          </div>
        </Card>

        <Card variant="monkai" className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-danger-100 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Top Company</p>
              <p className="text-lg font-bold text-neutral-900">
                {stats?.top_companies?.[0]?.company || 'N/A'}
              </p>
              <p className="text-xs text-danger-600">
                {stats?.top_companies?.[0]?.count || 0} contacts
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-monkai-500 text-monkai-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              <tab.icon
                className={`mr-2 h-5 w-5 ${
                  activeTab === tab.id ? 'text-monkai-500' : 'text-neutral-400 group-hover:text-neutral-500'
                }`}
              />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>

          {contactsLoading ? (
            <LoadingSpinner />
          ) : contacts && contacts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Name</TableCell>
                  <TableCell header>Email</TableCell>
                  <TableCell header>Company</TableCell>
                  <TableCell header>Bookings</TableCell>
                  <TableCell header>Last Booking</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-monkai-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-monkai-600 font-medium text-sm">
                            {contact.first_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{contact.full_name}</p>
                          {contact.job_title && (
                            <p className="text-sm text-neutral-500">{contact.job_title}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 text-neutral-400 mr-2" />
                        {contact.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.company ? (
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-4 w-4 text-neutral-400 mr-2" />
                          {contact.company}
                        </div>
                      ) : (
                        <span className="text-neutral-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-neutral-900">
                        {contact.total_bookings}
                      </span>
                    </TableCell>
                    <TableCell>
                      {contact.last_booking_date ? (
                        <div>
                          <p className="text-sm text-neutral-900">
                            {format(new Date(contact.last_booking_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-500">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusIndicator
                        status={contact.is_active ? 'success' : 'inactive'}
                        label={contact.is_active ? 'Active' : 'Inactive'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditContact(contact)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this contact?')) {
                              deleteContactMutation.mutate(contact.id);
                            }
                          }}
                        >
                          <TrashIcon className="h-4 w-4 text-danger-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No contacts found</h3>
              <p className="mt-1 text-sm text-neutral-500">
                {searchQuery ? 'Try adjusting your search terms.' : 'Add your first contact to get started.'}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Contact Groups</h2>
              <p className="text-sm text-neutral-600">Organize your contacts into groups</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowGroupModal(true)}
              icon={<PlusIcon className="h-4 w-4" />}
            >
              Create Group
            </Button>
          </div>

          {groupsLoading ? (
            <LoadingSpinner />
          ) : groups && groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="border border-neutral-200 rounded-lg p-6 hover:border-monkai-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: group.color }}
                      />
                      <h3 className="font-medium text-neutral-900">{group.name}</h3>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {group.contact_count} contacts
                    </Badge>
                  </div>
                  
                  {group.description && (
                    <p className="text-sm text-neutral-600 mb-4">{group.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="flex-1">
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this group?')) {
                          // deleteGroupMutation.mutate(group.id);
                        }
                      }}
                    >
                      <TrashIcon className="h-4 w-4 text-danger-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No groups created</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Create groups to organize your contacts.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Add/Edit Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          setEditingContact(null);
          contactForm.reset();
        }}
        title={editingContact ? 'Edit Contact' : 'Add Contact'}
        size="lg"
      >
        <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              {...contactForm.register('first_name')}
              error={contactForm.formState.errors.first_name?.message}
            />
            
            <Input
              label="Last Name"
              {...contactForm.register('last_name')}
              error={contactForm.formState.errors.last_name?.message}
            />
          </div>

          <Input
            label="Email"
            type="email"
            required
            icon={<EnvelopeIcon className="h-5 w-5" />}
            {...contactForm.register('email')}
            error={contactForm.formState.errors.email?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              icon={<PhoneIcon className="h-5 w-5" />}
              {...contactForm.register('phone')}
              error={contactForm.formState.errors.phone?.message}
            />
            
            <Input
              label="Company"
              icon={<BuildingOfficeIcon className="h-5 w-5" />}
              {...contactForm.register('company')}
              error={contactForm.formState.errors.company?.message}
            />
          </div>

          <Input
            label="Job Title"
            {...contactForm.register('job_title')}
            error={contactForm.formState.errors.job_title?.message}
          />

          <div>
            <label className="form-label">Notes</label>
            <textarea
              {...contactForm.register('notes')}
              rows={3}
              className="input"
              placeholder="Additional notes about this contact..."
            />
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...contactForm.register('is_active')}
              className="rounded border-neutral-300 text-monkai-600 focus:ring-monkai-500"
            />
            <span className="ml-2 text-sm text-neutral-700">Active contact</span>
          </label>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowContactModal(false);
                setEditingContact(null);
                contactForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={editingContact ? updateContactMutation.isPending : createContactMutation.isPending}
            >
              {editingContact ? 'Update' : 'Create'} Contact
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        isOpen={showGroupModal}
        onClose={() => {
          setShowGroupModal(false);
          groupForm.reset();
        }}
        title="Create Contact Group"
      >
        <form onSubmit={groupForm.handleSubmit(onGroupSubmit)} className="space-y-4">
          <Input
            label="Group Name"
            required
            {...groupForm.register('name')}
            error={groupForm.formState.errors.name?.message}
            placeholder="VIP Clients"
          />

          <div>
            <label className="form-label">Description</label>
            <textarea
              {...groupForm.register('description')}
              rows={3}
              className="input"
              placeholder="Description of this group..."
            />
          </div>

          <Input
            label="Color"
            type="color"
            {...groupForm.register('color')}
            error={groupForm.formState.errors.color?.message}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowGroupModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createGroupMutation.isPending}
            >
              Create Group
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};