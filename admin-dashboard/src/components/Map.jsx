import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api'; // Adjust the import path as needed

export default function Map() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const componentMountedRef = useRef(true);
  const mapInitializedRef = useRef(false);
  
  const [filters, setFilters] = useState({
    status: '',
    timeRange: '',
    ageMin: '',
    ageMax: ''
  });
  
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    foundCases: 0,
    recentReports: 0
  });
  
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // Isolated map container that React won't touch
  const MapContainer = React.memo(() => {
    return (
      <div
        ref={mapContainerRef}
        className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg bg-gray-100"
        style={{ minHeight: '600px' }}
      />
    );
  });

  // Get marker color based on case status
  const getMarkerColor = useCallback((status) => {
    switch (status) {
      case 'missing':
        return '#ef4444'; // red
      case 'found':
        return '#10b981'; // green
      case 'under_investigation':
        return '#f59e0b'; // yellow
      default:
        return '#6b7280'; // gray
    }
  }, []);

  // Safe cleanup function
  const cleanupMarkers = useCallback(() => {
    if (markersRef.current && markersRef.current.length > 0) {
      markersRef.current.forEach(marker => {
        try {
          if (marker && typeof marker.setMap === 'function') {
            marker.setMap(null);
          }
          // Clean up event listeners
          if (marker._clickListener && window.google?.maps?.event) {
            window.google.maps.event.removeListener(marker._clickListener);
          }
        } catch (e) {
          // Silently handle cleanup errors
        }
      });
    }
    markersRef.current = [];
  }, []);

  // Add markers to map
  const addMarkersToMap = useCallback((casesData) => {
    console.log('🏷️ Starting to add markers to map...');
    console.log('🔍 Pre-marker checks:', {
      hasMapInstance: !!mapInstanceRef.current,
      hasGoogleMaps: !!window.google?.maps,
      componentMounted: componentMountedRef.current,
      casesCount: casesData.length
    });

    if (!mapInstanceRef.current || !window.google?.maps || !componentMountedRef.current) {
      console.log('❌ Cannot add markers - missing requirements');
      return;
    }

    // Clean up existing markers
    console.log('🧹 Cleaning up existing markers...');
    cleanupMarkers();

    let markersCreated = 0;
    let markersSkipped = 0;

    casesData.forEach((caseItem, index) => {
      if (!caseItem.latitude || !caseItem.longitude || !componentMountedRef.current) {
        console.log(`⚠️ Skipping case ${index + 1}: missing coordinates`, {
          id: caseItem.id,
          hasLat: !!caseItem.latitude,
          hasLng: !!caseItem.longitude
        });
        markersSkipped++;
        return;
      }

      try {
        const position = { 
          lat: parseFloat(caseItem.latitude), 
          lng: parseFloat(caseItem.longitude) 
        };

        console.log(`📍 Creating marker ${index + 1} for case:`, {
          name: `${caseItem.first_name} ${caseItem.last_name}`,
          status: caseItem.status,
          position
        });

        let marker;

        // Try new AdvancedMarkerElement first
        if (window.google.maps.marker?.AdvancedMarkerElement) {
          console.log('🆕 Using AdvancedMarkerElement');
          const pinElement = document.createElement('div');
          pinElement.className = 'custom-marker';
          pinElement.style.cssText = `
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: ${getMarkerColor(caseItem.status)};
            border: 2px solid #ffffff;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          `;
          pinElement.title = `${caseItem.first_name} ${caseItem.last_name}`;

          marker = new window.google.maps.marker.AdvancedMarkerElement({
            map: mapInstanceRef.current,
            position: position,
            content: pinElement,
            title: `${caseItem.first_name} ${caseItem.last_name}`
          });

          // Add click event to the pin element
          pinElement.addEventListener('click', () => {
            console.log('🖱️ Marker clicked:', caseItem.first_name, caseItem.last_name);
            if (componentMountedRef.current) {
              setSelectedCase(caseItem);
            }
          });

        } else {
          console.log('🔄 Falling back to regular Marker');
          // Fallback to regular Marker
          marker = new window.google.maps.Marker({
            position: position,
            map: mapInstanceRef.current,
            title: `${caseItem.first_name} ${caseItem.last_name}`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: getMarkerColor(caseItem.status),
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });

          // Add click listener for regular markers
          if (marker.addListener) {
            const clickListener = marker.addListener('click', () => {
              console.log('🖱️ Marker clicked:', caseItem.first_name, caseItem.last_name);
              if (componentMountedRef.current) {
                setSelectedCase(caseItem);
              }
            });
            marker._clickListener = clickListener;
          }
        }

        if (componentMountedRef.current && marker) {
          markersRef.current.push(marker);
          markersCreated++;
        }

      } catch (error) {
        console.error(`❌ Error creating marker for case ${caseItem.id}:`, error);
        markersSkipped++;
      }
    });

    console.log(`✅ Marker creation completed:`, {
      created: markersCreated,
      skipped: markersSkipped,
      total: casesData.length
    });
  }, [getMarkerColor, cleanupMarkers]);

  // Load map data
  const loadMapData = useCallback(async () => {
    console.log('📊 Starting to load map data...');
    if (!componentMountedRef.current) {
      console.log('❌ Component not mounted, skipping data load');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Making API call to fetch cases...', { filters });
      
      const casesData = await API.cases.fetchAll(1, filters);
      
      if (!componentMountedRef.current) {
        console.log('❌ Component unmounted during API call, skipping data processing');
        return;
      }
      
      console.log('✅ Cases data received:', casesData);
      const casesArray = casesData.results || casesData || [];
      console.log(`📈 Processing ${casesArray.length} cases`);
      setCases(casesArray);
      
      // Calculate stats
      const totalCases = casesData.count || casesArray.length || 0;
      const activeCases = casesArray.filter(c => c.status === 'missing').length;
      const foundCases = casesArray.filter(c => c.status === 'found').length;
      
      const newStats = {
        totalCases,
        activeCases,
        foundCases,
        recentReports: 23
      };
      console.log('📊 Calculated stats:', newStats);
      setStats(newStats);

      // Add markers if map is ready
      if (mapInstanceRef.current && mapReady) {
        console.log('🗺️ Map is ready, adding markers...');
        addMarkersToMap(casesArray);
      } else {
        console.log('⏳ Map not ready yet, skipping markers', {
          hasMapInstance: !!mapInstanceRef.current,
          mapReady
        });
      }
      
    } catch (err) {
      console.error('❌ Error loading map data:', err);
      console.log('🔍 API call failed, possible causes:');
      console.log('  - API server is down');
      console.log('  - Network connectivity issues');
      console.log('  - Invalid API endpoint or parameters');
      if (componentMountedRef.current) {
        setError('Failed to load map data. Please try again.');
      }
    } finally {
      if (componentMountedRef.current) {
        setLoading(false);
        console.log('✅ Map data loading completed');
      }
    }
  }, [filters, addMarkersToMap, mapReady]);

  // Initialize the map
  const initializeMap = useCallback(() => {
    console.log('🗺️ Starting map initialization...');
    console.log('🔍 Pre-flight checks:', {
      componentMounted: componentMountedRef.current,
      hasGoogle: !!window.google,
      hasMaps: !!window.google?.maps,
      hasMapContainer: !!mapContainerRef.current,
      alreadyInitialized: mapInitializedRef.current
    });

    if (!componentMountedRef.current) {
      console.log('❌ Component not mounted, aborting map initialization');
      return;
    }

    if (!window.google?.maps) {
      console.log('❌ Google Maps API not available, aborting initialization');
      return;
    }

    if (!mapContainerRef.current) {
      console.log('❌ Map container DOM element not found, aborting initialization');
      return;
    }

    if (mapInitializedRef.current) {
      console.log('ℹ️ Map already initialized, skipping');
      return;
    }

    try {
      mapInitializedRef.current = true;
      console.log('🏗️ Creating new Google Map instance...');
      
      const mapOptions = {
        center: { lat: 18.0735, lng: -15.9582 }, // Nouakchott coordinates
        zoom: 13,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
      };
      
      console.log('🌍 Map options:', mapOptions);
      const map = new window.google.maps.Map(mapContainerRef.current, mapOptions);
      mapInstanceRef.current = map;
      
      console.log('✅ Google Map instance created successfully!', map);
      
      if (componentMountedRef.current) {
        setMapReady(true);
        setLoading(false);
        console.log('🎯 Map ready state updated, loading data...');
        
        // Load data after a short delay
        setTimeout(() => {
          if (componentMountedRef.current) {
            console.log('📊 Starting to load map data...');
            loadMapData();
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('❌ Error during map initialization:', error);
      console.log('🔍 This could be caused by:');
      console.log('  - Invalid map container element');
      console.log('  - Google Maps API not fully loaded');
      console.log('  - Browser compatibility issues');
      if (componentMountedRef.current) {
        setError('Failed to initialize map. Please refresh the page.');
        mapInitializedRef.current = false;
        setLoading(false);
      }
    }
  }, [loadMapData]);

  // Load Google Maps script
  useEffect(() => {
    let scriptElement = null;

    const loadGoogleMapsScript = async () => {
      console.log('🚀 Starting Google Maps script loading process...');
      if (!componentMountedRef.current) {
        console.log('❌ Component not mounted, skipping script load');
        return;
      }

      // Check if Google Maps is already loaded in the browser
      if (window.google?.maps) {
        console.log('✅ Google Maps already loaded in browser, initializing...');
        setTimeout(() => {
          if (componentMountedRef.current) {
            initializeMap();
          }
        }, 100);
        return;
      }

      // Check if Google Maps script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('📝 Google Maps script already exists in DOM, waiting for it to load...');
        // Wait for existing script to load
        existingScript.addEventListener('load', () => {
          console.log('✅ Existing Google Maps script finished loading');
          if (componentMountedRef.current) {
            setTimeout(initializeMap, 100);
          }
        });
        return;
      }

      try {
        // Get the Google Maps API key from environment variables
        // Make sure you have VITE_GOOGLE_MAPS_API_KEY in your .env file
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        console.log('🔑 API Key check:', apiKey ? '✅ Found' : '❌ Missing');
        
        if (!apiKey) {
          console.error('❌ Google Maps API key is missing from environment variables');
          console.log('💡 Make sure you have VITE_GOOGLE_MAPS_API_KEY in your .env file');
          if (componentMountedRef.current) {
            setError('Google Maps API key is missing. Check your .env file for VITE_GOOGLE_MAPS_API_KEY');
          }
          return;
        }

        console.log('📝 Creating Google Maps script element...');
        scriptElement = document.createElement('script');
        scriptElement.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
        scriptElement.async = true;
        scriptElement.defer = true;
        console.log('🌐 Script URL:', scriptElement.src.replace(apiKey, 'API_KEY_HIDDEN'));

        scriptElement.onload = () => {
          console.log('✅ Google Maps script loaded successfully!');
          if (componentMountedRef.current) {
            // Wait for Google Maps to be fully ready before initializing
            let attempts = 0;
            const checkReady = () => {
              attempts++;
              console.log(`🔍 Checking Google Maps readiness - Attempt ${attempts}/20`);
              
              if (window.google?.maps?.Map) {
                console.log('🎉 Google Maps API is fully ready! Initializing map...');
                initializeMap();
              } else if (attempts < 20 && componentMountedRef.current) {
                console.log('⏳ Google Maps not ready yet, retrying in 100ms...');
                setTimeout(checkReady, 100);
              } else if (componentMountedRef.current) {
                console.error('❌ Google Maps failed to initialize after 20 attempts (2 seconds)');
                setError('Google Maps failed to initialize properly after loading.');
                setLoading(false);
              }
            };
            setTimeout(checkReady, 100);
          }
        };

        scriptElement.onerror = (error) => {
          console.error('❌ Error loading Google Maps script:', error);
          console.log('🔍 Possible causes:');
          console.log('  - Invalid API key');
          console.log('  - API key restrictions (check Google Cloud Console)');
          console.log('  - Network connectivity issues');
          console.log('  - Ad blocker blocking the script');
          if (componentMountedRef.current) {
            setError('Failed to load Google Maps. Check console for details.');
            setLoading(false);
          }
        };

        console.log('📎 Appending Google Maps script to document head...');
        document.head.appendChild(scriptElement);

      } catch (error) {
        console.error('❌ Error in loadGoogleMapsScript:', error);
        console.log('🔍 This error occurred while setting up the Google Maps script');
        if (componentMountedRef.current) {
          setError('Failed to setup Google Maps script loading.');
          setLoading(false);
        }
      }
    };

    loadGoogleMapsScript();

    // Cleanup function
    return () => {
      componentMountedRef.current = false;
      cleanupMarkers();
      mapInitializedRef.current = false;
      mapInstanceRef.current = null;
      
      // Don't remove the script as it might be used by other components
      // Just clean up our references
    };
  }, [initializeMap, cleanupMarkers]);

  // Handle component mount/unmount
  useEffect(() => {
    componentMountedRef.current = true;
    return () => {
      componentMountedRef.current = false;
    };
  }, []);

  // Center map function
  const centerMap = useCallback(() => {
    if (mapInstanceRef.current && componentMountedRef.current) {
      mapInstanceRef.current.setCenter({ lat: 18.0735, lng: -15.9582 });
      mapInstanceRef.current.setZoom(13);
    }
  }, []);

  // Toggle heatmap placeholder
  const toggleHeatmap = useCallback(() => {
    if (componentMountedRef.current) {
      alert('Heatmap functionality would be implemented here');
    }
  }, []);

  // Apply filters
  const applyMapFilters = useCallback(async () => {
    if (componentMountedRef.current) {
      await loadMapData();
    }
  }, [loadMapData]);

  // Clear filters
  const clearMapFilters = useCallback(() => {
    if (componentMountedRef.current) {
      setFilters({
        status: '',
        timeRange: '',
        ageMin: '',
        ageMax: ''
      });
    }
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((filterName, value) => {
    if (componentMountedRef.current) {
      setFilters(prev => ({
        ...prev,
        [filterName]: value
      }));
    }
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Map Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interactive Map View</h1>
            <p className="text-gray-600 mt-1">Visualize missing person cases and reports on the map</p>
          </div>
          <div className="flex space-x-3">
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={centerMap}
              disabled={!mapReady || loading}
            >
              <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              </svg>
              Center Map
            </button>
            <button 
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={toggleHeatmap}
              disabled={!mapReady || loading}
            >
              <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Toggle Heatmap
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
          <button 
            onClick={() => {
              setError(null);
              loadMapData();
            }}
            className="ml-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Retry'}
          </button>
        </div>
      )}

      {/* Map Controls and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3 relative">
          {/* Isolated Map Container */}
          <MapContainer />
          
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
          
          {/* Case Info Panel */}
          {selectedCase && (
            <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm z-20">
              <div className="flex items-center space-x-3">
                <img 
                  src={selectedCase.photo || '/default-avatar.png'} 
                  alt={`${selectedCase.first_name} ${selectedCase.last_name}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
                <div>
                  <h3 className="font-semibold text-lg">{selectedCase.first_name} {selectedCase.last_name}</h3>
                  <p className="text-sm text-gray-600">Age: {selectedCase.age} • {selectedCase.gender}</p>
                  <p className="text-sm">
                    <strong>Status:</strong> 
                    <span className={`ml-1 capitalize ${
                      selectedCase.status === 'missing' ? 'text-red-600' :
                      selectedCase.status === 'found' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {selectedCase.status.replace('_', ' ')}
                    </span>
                  </p>
                  <p className="text-sm"><strong>Days Missing:</strong> {selectedCase.days_missing}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCase(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                aria-label="Close case info"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar with Legend, Stats, and Filters */}
        <div className="space-y-6">
          {/* Map Legend */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-3">Map Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm">Missing Persons</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">Found Persons</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm">Under Investigation</span>
              </div>
            </div>
          </div>

          {/* Map Statistics */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-3">Map Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Cases</span>
                <span className="font-semibold">{stats.totalCases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Cases</span>
                <span className="font-semibold text-red-600">{stats.activeCases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Found Cases</span>
                <span className="font-semibold text-green-600">{stats.foundCases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Recent Reports</span>
                <span className="font-semibold text-blue-600">{stats.recentReports}</span>
              </div>
            </div>
          </div>

          {/* Map Filters */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-3">Filters</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Status</label>
                <select 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  disabled={loading}
                >
                  <option value="">All Status</option>
                  <option value="missing">Missing</option>
                  <option value="found">Found</option>
                  <option value="under_investigation">Investigating</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                <select 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={filters.timeRange}
                  onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                  disabled={loading}
                >
                  <option value="">All Time</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                <div className="flex space-x-2">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    className="w-1/2 p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={filters.ageMin}
                    onChange={(e) => handleFilterChange('ageMin', e.target.value)}
                    disabled={loading}
                  />
                  <input 
                    type="number" 
                    placeholder="Max" 
                    className="w-1/2 p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={filters.ageMax}
                    onChange={(e) => handleFilterChange('ageMax', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <button 
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={applyMapFilters}
                disabled={loading || !mapReady}
              >
                {loading ? 'Loading...' : 'Apply Filters'}
              </button>
              <button 
                className="w-full bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={clearMapFilters}
                disabled={loading}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}