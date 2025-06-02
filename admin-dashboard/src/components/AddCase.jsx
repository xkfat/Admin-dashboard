import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { CircleArrowLeft} from 'lucide-react';

import API from '../api';

// Google Maps Location Picker Modal Component
const MapLocationPicker = ({ isOpen, onClose, onLocationSelect, initialLocation }) => {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || { lat: 40.7128, lng: -74.0060 } // Default to NYC
  );

  // Your Google Maps API Key
  const GOOGLE_MAPS_API_KEY = 'AIzaSyC_EsZPIvrGW3TcBuiDhybiltDIokgGEPY';

  // Load Google Maps script when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        initializeMap();
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for existing script to load
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval);
            setMapLoaded(true);
            initializeMap();
          }
        }, 100);
        return;
      }

      // Create and load the script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps script loaded successfully');
        setMapLoaded(true);
        setMapError(null);
        // Small delay to ensure everything is ready
        setTimeout(() => {
          initializeMap();
        }, 100);
      };
      
      script.onerror = (error) => {
        console.error('Failed to load Google Maps script:', error);
        setMapError('Failed to load Google Maps. Please check your internet connection.');
        setMapLoaded(false);
      };
      
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [isOpen]);

  // Initialize the map
  const initializeMap = () => {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps not available');
      setMapError('Google Maps failed to load');
      return;
    }

    try {
      const mapElement = document.getElementById('google-map-container');
      if (!mapElement) {
        console.error('Map container not found');
        return;
      }

      console.log('Initializing map with location:', selectedLocation);

      const mapInstance = new window.google.maps.Map(mapElement, {
        center: selectedLocation,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        mapTypeId: 'roadmap'
      });

      // Create marker
      const markerInstance = new window.google.maps.Marker({
        position: selectedLocation,
        map: mapInstance,
        draggable: true,
        title: 'Last seen location',
        animation: window.google.maps.Animation.DROP
      });

      // Add click listener to map
      mapInstance.addListener('click', (event) => {
        const newPosition = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        markerInstance.setPosition(newPosition);
        setSelectedLocation(newPosition);
        console.log('Map clicked, new position:', newPosition);
      });

      // Add drag listener to marker
      markerInstance.addListener('dragend', (event) => {
        const newPosition = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        setSelectedLocation(newPosition);
        console.log('Marker dragged, new position:', newPosition);
      });

      setMap(mapInstance);
      setMarker(markerInstance);
      setMapError(null);
      console.log('Map initialized successfully');

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map. Please try again.');
    }
  };

  // Handle confirm location
  const handleConfirm = () => {
    console.log('Confirming location:', selectedLocation);
    onLocationSelect(selectedLocation);
    onClose();
  };

  // Get current location
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setSelectedLocation(currentPos);
          if (map && marker) {
            map.setCenter(currentPos);
            marker.setPosition(currentPos);
          }
          console.log('Current location:', currentPos);
        },
        (error) => {
          console.error('Error getting current location:', error);
          alert('Unable to get current location. Please select manually on the map.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Choose Location on Map</h3>
              <p className="text-sm text-gray-600 mt-1">
                Click on the map or drag the marker to select the last seen location
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Map Container */}
        <div className="p-6">
          <div className="relative">
            {/* Loading State */}
            {!mapLoaded && !mapError && (
              <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading Google Maps...</p>
                </div>
              </div>
            )}
            
            {/* Error State */}
            {mapError && (
              <div className="absolute inset-0 bg-red-50 rounded-lg flex items-center justify-center z-10">
                <div className="text-center p-6">
                  <div className="text-red-500 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                  </div>
                  <p className="text-red-700 mb-4">{mapError}</p>
                  <button
                    onClick={() => {
                      setMapError(null);
                      setMapLoaded(false);
                      // Retry loading
                      setTimeout(() => {
                        initializeMap();
                      }, 100);
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            
            {/* Map */}
            <div 
              id="google-map-container" 
              className="w-full h-96 rounded-lg border bg-gray-100"
              style={{ minHeight: '400px' }}
            ></div>
          </div>
          
          {/* Location Info and Controls */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <strong className="text-gray-700">Selected Coordinates:</strong>
                <div className="mt-2 space-y-1 font-mono text-xs">
                  <div>Lat: {selectedLocation.lat.toFixed(6)}</div>
                  <div>Lng: {selectedLocation.lng.toFixed(6)}</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <button
                onClick={handleCurrentLocation}
                disabled={!mapLoaded}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Use Current Location
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!mapLoaded || mapError}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AddCase() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    age: '',
    gender: '',
    photo: null,
    contact_phone: '',
    last_seen_date: '',
    last_seen_location: '',
    description: '',
    latitude: '',
    longitude: ''
  });

  // Photo preview state
  const [photoPreview, setPhotoPreview] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any previous errors when user starts typing
    if (error) setError('');
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  // Handle location selection from map
  const handleLocationSelect = (location) => {
    console.log('Location selected from map:', location);
    setFormData(prev => ({
      ...prev,
      latitude: location.lat.toString(),
      longitude: location.lng.toString()
    }));
  };

  // Validate form data
  const validateForm = () => {
    const required = ['first_name', 'last_name', 'age', 'gender', 'photo', 'last_seen_date', 'last_seen_location'];
    
    for (let field of required) {
      if (!formData[field]) {
        setError(`${field.replace('_', ' ').toUpperCase()} is required`);
        return false;
      }
    }

    // Validate age
    if (formData.age < 0 || formData.age > 150) {
      setError('Please enter a valid age');
      return false;
    }

    // Validate date (can't be in the future)
    const lastSeenDate = new Date(formData.last_seen_date);
    const today = new Date();
    if (lastSeenDate > today) {
      setError('Last seen date cannot be in the future');
      return false;
    }

    // Validate file type
    if (formData.photo && !formData.photo.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return false;
    }

    // Validate file size (5MB limit)
    if (formData.photo && formData.photo.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data for API
      const caseData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        photo: formData.photo,
        contact_phone: formData.contact_phone.trim() || '',
        last_seen_date: formData.last_seen_date,
        last_seen_location: formData.last_seen_location.trim(),
        description: formData.description.trim() || '',
      };

      // Add coordinates if available
      if (formData.latitude && formData.longitude) {
        caseData.latitude = parseFloat(formData.latitude);
        caseData.longitude = parseFloat(formData.longitude);
      }

      console.log('Submitting case data:', caseData);
      const response = await API.cases.create(caseData);
      
      setSuccess('Case submitted successfully!');
      
      // Show success message for 2 seconds, then navigate
      setTimeout(() => {
        navigate('/cases');
      }, 2000);

    } catch (err) {
      console.error('Error creating case:', err);
      setError(err.message || 'Failed to create case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get current date for max date validation
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
  <div className="flex items-center justify-between mb-6">
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
    >
      <CircleArrowLeft />
    </button>

    <h2 className="text-2xl font-bold text-gray-900 text-center flex-1">
      Add New Missing Person Case
    </h2>
  </div>



        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="0"
                max="150"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo *
              </label>
              <input
                type="file"
                name="photo"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
              {photoPreview && (
                <div className="mt-2">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., +1234567890"
                disabled={loading}
              />
            </div>

            {/* Last Seen Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Seen Date *
              </label>
              <input
                type="date"
                name="last_seen_date"
                value={formData.last_seen_date}
                onChange={handleInputChange}
                max={today}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
            </div>

            {/* Last Seen Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Seen Location *
              </label>
              <input
                type="text"
                name="last_seen_location"
                value={formData.last_seen_location}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Central Park, New York"
                required
                disabled={loading}
              />
            </div>

            {/* Location Coordinates with Map Picker */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Coordinates (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  step="any"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Latitude"
                  disabled={loading}
                />
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  step="any"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Longitude"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => {
                    console.log('Opening map modal');
                    setShowMapModal(true);
                  }}
                  className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Choose from Map
                </button>
              </div>
              {formData.latitude && formData.longitude && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-800">
                    ✓ Location selected: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional details about the missing person (clothing, distinctive features, circumstances, etc.)"
                disabled={loading}
              />
            </div>

            {/* Submit Buttons */}
            <div className="md:col-span-2">
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Case'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Map Location Picker Modal */}
        <MapLocationPicker
          isOpen={showMapModal}
          onClose={() => {
            console.log('Closing map modal');
            setShowMapModal(false);
          }}
          onLocationSelect={handleLocationSelect}
          initialLocation={
            formData.latitude && formData.longitude
              ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) }
              : null
          }
        />
      </div>
    </div>
  );
}