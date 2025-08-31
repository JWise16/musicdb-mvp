import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useVenue } from '../../contexts/VenueContext';
import { 
  useCreateVenueMutation,
  useAssociateUserWithVenueMutation 
} from '../../store/api/venuesApi';
import Sidebar from '../../components/layout/Sidebar';
import { isValidRole, ROLE_OPTIONS } from '../../utils/roleUtils';

interface VenueFormData {
  name: string;
  location: string;
  address: string;
  capacity: number | '';
  contact_email: string;
  contact_phone: string;
  description: string;
  role: string;
}

const AddVenue = () => {
  const { user } = useAuth();
  const { refreshVenues } = useVenue();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // RTK mutation hooks
  const [createVenue] = useCreateVenueMutation();
  const [associateUserWithVenue] = useAssociateUserWithVenueMutation();
  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    location: '',
    address: '',
    capacity: '',
    contact_email: '',
    contact_phone: '',
    description: '',
    role: ''
  });

  // Available roles - using the same roles as onboarding profile setup
  const availableRoles = ROLE_OPTIONS;

  const handleInputChange = (field: keyof VenueFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate role
    if (!isValidRole(formData.role)) {
      alert('Please select a valid role.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Destructure role from formData and create venue data
      const { role, ...venueData } = formData;
      
      console.log('AddVenue: Creating venue with RTK mutation');
      const venueResult = await createVenue({
        ...venueData,
        capacity: venueData.capacity ? parseInt(venueData.capacity.toString()) : undefined
      }).unwrap();

      if (venueResult.success && venueResult.venueId) {
        console.log('AddVenue: Venue created, associating with user');
        await associateUserWithVenue({
          user_id: user.id,
          venue_id: venueResult.venueId,
          role: role
        }).unwrap();

        // Refresh venue context (RTK mutations should have invalidated cache)
        await refreshVenues();

        console.log('AddVenue: Venue creation and association successful');
        // Navigate back to dashboard
        navigate('/dashboard');
      } else {
        alert(`Error creating venue: ${venueResult.error}`);
      }
    } catch (error: any) {
      console.error('Error creating venue:', error);
      alert(error.message || 'Failed to create venue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="rounded-3xl bg-white shadow-soft p-4 lg:p-8 min-h-[90vh] max-w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Add Another Venue</h2>
            <p className="text-gray-600">
              Add more venues to your account to manage multiple locations
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
            {/* Venue Information */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Venue Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="form-input w-full"
                    placeholder="e.g., The Grand Hall"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="form-input w-full"
                    placeholder="e.g., New York, NY"
                    required
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="form-input w-full"
                  placeholder="e.g., 123 Main Street"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    className="form-input w-full"
                    placeholder="e.g., 500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    className="form-input w-full"
                    placeholder="contact@venue.com"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  className="form-input w-full"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="form-textarea w-full"
                  rows={3}
                  placeholder="Brief description of your venue..."
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Role</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select your role at this venue *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="form-select w-full"
                  required
                >
                  <option value="">Select your role</option>
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary px-8 py-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding Venue...' : 'Add Venue'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddVenue; 