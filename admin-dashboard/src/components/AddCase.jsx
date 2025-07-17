import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleArrowLeft, Search, MapPin } from 'lucide-react';
import API from '../api';

// Google Maps Location Picker Modal Component
const MapLocationPicker = ({ isOpen, onClose, onLocationSelect, initialLocation }) => {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || { lat: 18.0735, lng: -15.9582 } // Nouakchott coordinates
  );

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
      
      // Initialize autocomplete for search
      initializeAutocomplete(mapInstance, markerInstance);
      
      console.log('Map initialized successfully');

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map. Please try again.');
    }
  };

  // Initialize Google Places Autocomplete
  const initializeAutocomplete = (mapInstance, markerInstance) => {
    try {
      const searchInput = document.getElementById('map-search-input');
      if (!searchInput || !window.google?.maps?.places) {
        console.log('Search input or Places API not available');
        return;
      }

      const autocompleteInstance = new window.google.maps.places.Autocomplete(searchInput, {
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'MR' }, // Restrict to Mauritania
        fields: ['place_id', 'geometry', 'name', 'formatted_address']
      });

      // Bind autocomplete to map
      autocompleteInstance.bindTo('bounds', mapInstance);

      // Listen for place selection
      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          console.log('No geometry found for this place');
          return;
        }

        const newPosition = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };

        // Update map and marker
        mapInstance.setCenter(newPosition);
        mapInstance.setZoom(15); // Zoom in for better view
        markerInstance.setPosition(newPosition);
        setSelectedLocation(newPosition);

        console.log('Place selected:', place.name, newPosition);
      });

      setAutocomplete(autocompleteInstance);

    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchValue('');
    const searchInput = document.getElementById('map-search-input');
    if (searchInput) {
      searchInput.value = '';
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
            map.setZoom(15);
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Choose Last Seen Location on Map</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
            <input
              id="map-search-input"
              type="text"
              placeholder="Search places/areas/zones"
              className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={searchValue}
              onChange={handleSearchChange}
              disabled={!mapLoaded}
            />
            {searchValue && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Map Container */}
        <div className="p-6 bg-white dark:bg-gray-800">
          <div className="relative">
            {/* Loading State */}
            {!mapLoaded && !mapError && (
              <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">Loading Google Maps...</p>
                </div>
              </div>
            )}
            
            {/* Error State */}
            {mapError && (
              <div className="absolute inset-0 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center z-10">
                <div className="text-center p-6">
                  <div className="text-red-500 dark:text-red-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                  </div>
                  <p className="text-red-700 dark:text-red-300 mb-4">{mapError}</p>
                  <button
                    onClick={() => {
                      setMapError(null);
                      setMapLoaded(false);
                      // Retry loading
                      setTimeout(() => {
                        initializeMap();
                      }, 100);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            
            {/* Map */}
            <div 
              id="google-map-container" 
              className="w-full h-96 rounded-lg border dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
              style={{ minHeight: '400px' }}
            ></div>
          </div>
          
          {/* Location Info and Controls */}
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={handleCurrentLocation}
              disabled={!mapLoaded}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Current Location
            </button>

            <button
              onClick={handleConfirm}
              disabled={!mapLoaded || mapError}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mini Map Component
const MiniMap = ({ latitude, longitude, onMapClick }) => {
  const mapRef = useState(null);

  useEffect(() => {
    // Only initialize if we have coordinates
    if (!latitude || !longitude) return;

    const initMiniMap = () => {
      if (!window.google || !window.google.maps) return;

      const mapElement = document.getElementById('mini-map');
      if (!mapElement) return;

      const map = new window.google.maps.Map(mapElement, {
        center: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        disableDefaultUI: true,
        gestureHandling: 'none'
      });

      // Add marker
      new window.google.maps.Marker({
        position: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        map: map,
        title: 'Selected location'
      });
    };

    // Load Google Maps if not already loaded
    if (window.google && window.google.maps) {
      initMiniMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.onload = initMiniMap;
      document.head.appendChild(script);
    }
  }, [latitude, longitude]);

  if (!latitude || !longitude) {
    return (
      <div 
        onClick={onMapClick}
        className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center cursor-pointer hover:border-findthem-bg dark:hover:border-findthem-light transition-colors bg-gray-50 dark:bg-gray-800"
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Click to select location on map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        id="mini-map" 
        className="w-full h-32 rounded-xl border border-gray-300 dark:border-gray-600 cursor-pointer"
        onClick={onMapClick}
      ></div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Click to change location
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
    last_seen_date: '',
    last_seen_location: '',
    latitude: '',
    longitude: '',
    photo: null,
    contact_phone: '',
    description: '',
    submission_status: 'active',
    status: 'missing'
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
    const required = ['first_name', 'last_name', 'age', 'gender', 'last_seen_date', 'last_seen_location', 'photo'];
    
    for (let field of required) {
      if (!formData[field]) {
        setError(`${field.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())} is required`);
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
        submission_status: formData.submission_status,
        status: formData.status
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
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> 
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 transition-all duration-200 hover:translate-x-1 group"
            >
              <CircleArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform duration-200" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center flex-1">
              Add Missing Person Case
            </h2>
            
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                disabled={loading}
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                disabled={loading}
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Age *
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="0"
                max="150"
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                disabled={loading}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                disabled={loading}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Last Seen Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Seen Date *
              </label>
              <input
                type="date"
                name="last_seen_date"
                value={formData.last_seen_date}
                onChange={handleInputChange}
                max={today}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                disabled={loading}
              />
            </div>

            {/* Last Seen Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Seen Location *
              </label>
              <input
                type="text"
                name="last_seen_location"
                value={formData.last_seen_location}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Nouakchott-Nord"
                required
                disabled={loading}
              />
            </div>

            {/* Map Location Selector */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Last Seen Location from Map
              </label>
              <MiniMap 
                latitude={formData.latitude}
                longitude={formData.longitude}
                onMapClick={() => setShowMapModal(true)}
              />
            </div>

            {/* Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Photo *
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    name="photo"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="photo-upload"
                    required
                    disabled={loading}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer flex items-center justify-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                  >
                    <svg className="w-6 h-6 mr-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    {formData.photo ? 'Change Photo' : 'Choose Photo'}
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formData.photo ? formData.photo.name : 'No photo chosen'}
                  </p>
                </div>
                {photoPreview && (
                  <div className="flex-shrink-0">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-lg border dark:border-gray-600"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Phone Number
              </label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., +222 12345678"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Additional details about the missing person (clothing, distinctive features, circumstances, etc.)"
                disabled={loading}
              />
            </div>

            {/* Submission Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Submission Status
              </label>
              <select
                name="submission_status"
                value={formData.submission_status}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Case Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Case Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              >
                <option value="missing">Missing</option>
                <option value="investigating">Investigating</option>
                <option value="found">Found</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Submit Buttons */}
            <div className="md:col-span-2">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-findthem-bg hover:bg-findthem-button dark:bg-findthem-bg dark:hover:bg-findthem-teal text-white dark:text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Case'}
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