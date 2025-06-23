import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { VenueService, type VenueData } from '../../services/venueService';
import { ROLE_OPTIONS, getDefaultRole, type RoleValue } from '../../utils/roleUtils';
import type { Tables } from '../../types/database.types';
import Sidebar from '../../components/layout/Sidebar';

type VerificationStep = 'create' | 'complete';

const Verification = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<VerificationStep>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<RoleValue>(getDefaultRole());
  const [newVenueData, setNewVenueData] = useState<VenueData>({
    name: '',
    location: '',
    address: '',
    capacity: undefined,
    contact_email: '',
    contact_phone: '',
    description: '',
  });

  useEffect(() => {
    console.log('Verification: useEffect triggered', { user: user?.email, user_id: user?.id });
    // Only redirect if we're not loading and definitely have no user
    if (!user && !loading) {
      console.log('Verification: No user and not loading, navigating to login');
      navigate('/login');
    } else if (user) {
      console.log('Verification: User found, staying on verification page');
    } else {
      console.log('Verification: Still loading or user undefined, waiting...');
    }
  }, [user, loading, navigate]);

  const handleCreateVenue = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Create the venue
      const venueResult = await VenueService.createVenue(newVenueData);
      
      if (venueResult.success && venueResult.venueId) {
        // Associate user with the new venue
        const associateResult = await VenueService.associateUserWithVenue({
          user_id: user.id,
          venue_id: venueResult.venueId,
          role: userRole,
        });

        if (associateResult.success) {
          setCurrentStep('complete');
        } else {
          alert(`Error associating with venue: ${associateResult.error}`);
        }
      } else {
        alert(`Error creating venue: ${venueResult.error}`);
      }
    } catch (error) {
      console.error('Error creating venue:', error);
      alert('Failed to create venue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const renderCreateStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Create Your Venue
        </h3>
        <p className="text-gray-600">
          Add your venue to our database so you can start reporting events and contributing to the music community.
        </p>
      </div>

      <div className="card p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Name *
              </label>
              <input
                type="text"
                value={newVenueData.name}
                onChange={(e) => setNewVenueData(prev => ({ ...prev, name: e.target.value }))}
                className="form-input w-full"
                placeholder="Enter venue name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (City, State) *
              </label>
              <input
                type="text"
                value={newVenueData.location}
                onChange={(e) => setNewVenueData(prev => ({ ...prev, location: e.target.value }))}
                className="form-input w-full"
                placeholder="e.g., New York, NY"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <input
              type="text"
              value={newVenueData.address}
              onChange={(e) => setNewVenueData(prev => ({ ...prev, address: e.target.value }))}
              className="form-input w-full"
              placeholder="Enter full address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity
              </label>
              <input
                type="number"
                min="1"
                value={newVenueData.capacity || ''}
                onChange={(e) => setNewVenueData(prev => ({ ...prev, capacity: parseInt(e.target.value) || undefined }))}
                className="form-input w-full"
                placeholder="Maximum capacity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Role *
              </label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as RoleValue)}
                className="form-select w-full"
              >
                {ROLE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={newVenueData.contact_email || ''}
                onChange={(e) => setNewVenueData(prev => ({ ...prev, contact_email: e.target.value }))}
                className="form-input w-full"
                placeholder="venue@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={newVenueData.contact_phone || ''}
                onChange={(e) => setNewVenueData(prev => ({ ...prev, contact_phone: e.target.value }))}
                className="form-input w-full"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={newVenueData.description || ''}
              onChange={(e) => setNewVenueData(prev => ({ ...prev, description: e.target.value }))}
              className="form-textarea w-full"
              rows={3}
              placeholder="Brief description of the venue..."
            />
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleCreateVenue}
            disabled={isLoading || !newVenueData.name || !newVenueData.location || !newVenueData.address}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Venue'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Venue Created Successfully!
      </h3>
      
      <p className="text-gray-600 mb-8">
        Your venue has been added to our database and you're now associated with it. 
        You can start adding events and contributing to the music community.
      </p>
      
      <button
        onClick={handleComplete}
        className="btn-primary"
      >
        Go to Dashboard
      </button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'create':
        return renderCreateStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading verification...</p>
              </div>
            </div>
          ) : (
            renderCurrentStep()
          )}
        </div>
      </main>
    </div>
  );
};

export default Verification; 