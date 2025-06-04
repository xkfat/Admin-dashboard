import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function Map() {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const componentMountedRef = useRef(true);
  const mapInitializedRef = useRef(false);
  const scriptLoadedRef = useRef(false);
  
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

  // Create custom photo marker
  const createPhotoMarker = useCallback((caseItem, position) => {
    return new Promise((resolve) => {
      // Create the main container
      const markerContainer = document.createElement('div');
      markerContainer.className = 'custom-photo-marker';
      markerContainer.style.cssText = `
        position: relative;
        width: 60px;
        height: 80px;
        cursor: pointer;
        transform: translate(-50%, -100%);
        z-index: 1000;
      `;

      // Create the pin background (teardrop shape)
      const pinBackground = document.createElement('div');
      pinBackground.className = 'pin-background';
      pinBackground.style.cssText = `
        position: absolute;
        width: 60px;
        height: 60px;
        background: ${getMarkerColor(caseItem.status)};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        top: 0;
        left: 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid white;
      `;

      // Create the photo container
      const photoContainer = document.createElement('div');
      photoContainer.className = 'photo-container';
      photoContainer.style.cssText = `
        position: absolute;
        width: 46px;
        height: 46px;
        border-radius: 50%;
        overflow: hidden;
        top: 7px;
        left: 7px;
        transform: rotate(45deg);
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        z-index: 1001;
      `;

      // Create the photo image
      const photoImg = document.createElement('img');
      photoImg.src = caseItem.photo || '/default-avatar.png';
      photoImg.alt = `${caseItem.first_name} ${caseItem.last_name}`;
      photoImg.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: rotate(-45deg) scale(1.1);
        display: block;
      `;

      // Handle image load error
      photoImg.onerror = () => {
        photoImg.src = '/default-avatar.png';
      };

      // Create status indicator dot
      const statusDot = document.createElement('div');
      statusDot.className = 'status-indicator';
      statusDot.style.cssText = `
        position: absolute;
        width: 16px;
        height: 16px;
        background: ${getMarkerColor(caseItem.status)};
        border: 2px solid white;
        border-radius: 50%;
        top: -2px;
        right: 2px;
        transform: rotate(45deg);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        z-index: 1002;
      `;

      // Add pulse animation for missing cases
      if (caseItem.status === 'missing') {
        statusDot.style.animation = 'pulse 2s infinite';
        
        // Add CSS animation if not already added
        if (!document.querySelector('#marker-animations')) {
          const style = document.createElement('style');
          style.id = 'marker-animations';
          style.textContent = `
            @keyframes pulse {
              0% { transform: rotate(45deg) scale(1); opacity: 1; }
              50% { transform: rotate(45deg) scale(1.3); opacity: 0.7; }
              100% { transform: rotate(45deg) scale(1); opacity: 1; }
            }
            .custom-photo-marker:hover .pin-background {
              transform: rotate(-45deg) scale(1.1);
              transition: transform 0.2s ease;
            }
            .custom-photo-marker:hover .photo-container {
              transform: rotate(45deg) scale(1.05);
              transition: transform 0.2s ease;
            }
          `;
          document.head.appendChild(style);
        }
      }

      // Assemble the marker
      photoContainer.appendChild(photoImg);
      markerContainer.appendChild(pinBackground);
      markerContainer.appendChild(photoContainer);
      markerContainer.appendChild(statusDot);

      // Add click event to navigate to case detail
      markerContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🖱️ Photo marker clicked:', caseItem.first_name, caseItem.last_name);
        
        // Set selected case for info panel
        setSelectedCase(caseItem);
        
        // Navigate to case detail
        navigate(`/cases/${caseItem.id}`);
      });

      // Add hover effects
      markerContainer.addEventListener('mouseenter', () => {
        markerContainer.style.zIndex = '2000';
        markerContainer.style.transform = 'translate(-50%, -100%) scale(1.1)';
        markerContainer.style.transition = 'transform 0.2s ease';
      });

      markerContainer.addEventListener('mouseleave', () => {
        markerContainer.style.zIndex = '1000';
        markerContainer.style.transform = 'translate(-50%, -100%) scale(1)';
      });

      resolve(markerContainer);
    });
  }, [getMarkerColor, navigate, setSelectedCase]);

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
          console.warn('Error cleaning up marker:', e);
        }
      });
    }
    markersRef.current = [];
  }, []);

  // Add markers to map with custom photo design
  const addMarkersToMap = useCallback(async (casesData) => {
    console.log('🏷️ Starting to add custom photo markers to map...');
    console.log('📊 Cases data:', casesData);
    
    if (!mapInstanceRef.current || !window.google?.maps || !componentMountedRef.current) {
      console.log('❌ Cannot add markers - missing requirements');
      return;
    }

    // Clean up existing markers
    cleanupMarkers();

    let markersCreated = 0;
    let markersSkipped = 0;

    for (const caseItem of casesData) {
      console.log(`🔍 Processing case: ${caseItem.first_name} ${caseItem.last_name}`);

      if (!caseItem.latitude || !caseItem.longitude || !componentMountedRef.current) {
        console.log(`⚠️ Skipping case ${caseItem.id}: missing coordinates`);
        markersSkipped++;
        continue;
      }

      try {
        const position = { 
          lat: parseFloat(caseItem.latitude), 
          lng: parseFloat(caseItem.longitude) 
        };

        console.log(`📍 Creating photo marker at:`, position);

        // Create custom photo marker element
        const markerElement = await createPhotoMarker(caseItem, position);

        // Use AdvancedMarkerElement if available, otherwise fallback
        let marker;
        
        if (window.google.maps.marker?.AdvancedMarkerElement) {
          console.log('🆕 Using AdvancedMarkerElement for photo marker');
          marker = new window.google.maps.marker.AdvancedMarkerElement({
            map: mapInstanceRef.current,
            position: position,
            content: markerElement,
            title: `${caseItem.first_name} ${caseItem.last_name} - ${caseItem.status}`,
            zIndex: 1000
          });
        } else {
          console.log('🔄 Using Overlay for photo marker (fallback)');
          // Create custom overlay class for fallback
          class PhotoMarkerOverlay extends window.google.maps.OverlayView {
            constructor(position, content, map) {
              super();
              this.position = position;
              this.content = content;
              this.setMap(map);
            }

            onAdd() {
              this.div = document.createElement('div');
              this.div.style.cssText = `
                position: absolute;
                pointer-events: auto;
              `;
              this.div.appendChild(this.content);

              const panes = this.getPanes();
              panes.overlayMouseTarget.appendChild(this.div);
            }

            draw() {
              const overlayProjection = this.getProjection();
              const point = overlayProjection.fromLatLngToDivPixel(
                new window.google.maps.LatLng(this.position.lat, this.position.lng)
              );

              if (point) {
                this.div.style.left = point.x + 'px';
                this.div.style.top = point.y + 'px';
              }
            }

            onRemove() {
              if (this.div) {
                this.div.parentNode.removeChild(this.div);
                this.div = null;
              }
            }

            setMap(map) {
              super.setMap(map);
            }
          }

          marker = new PhotoMarkerOverlay(position, markerElement, mapInstanceRef.current);
        }

        console.log(`✅ Photo marker created for ${caseItem.first_name} ${caseItem.last_name}`);

        if (componentMountedRef.current && marker) {
          markersRef.current.push(marker);
          markersCreated++;
        }

      } catch (error) {
        console.error(`❌ Error creating photo marker for case ${caseItem.id}:`, error);
        markersSkipped++;
      }
    }

    console.log(`✅ Photo markers completed: ${markersCreated} created, ${markersSkipped} skipped`);
    
    // Fit all markers in view if we have any
    if (markersCreated > 0 && mapInstanceRef.current) {
      console.log('🎯 Fitting markers to view...');
      const bounds = new window.google.maps.LatLngBounds();
      casesData.forEach(caseItem => {
        if (caseItem.latitude && caseItem.longitude) {
          bounds.extend({
            lat: parseFloat(caseItem.latitude),
            lng: parseFloat(caseItem.longitude)
          });
        }
      });
      mapInstanceRef.current.fitBounds(bounds);
      
      // Don't zoom too close if there's only one marker
      if (markersCreated === 1) {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setZoom(Math.min(mapInstanceRef.current.getZoom(), 16));
          }
        }, 100);
      }
    }
  }, [createPhotoMarker, cleanupMarkers]);

  // Load map data
  const loadMapData = useCallback(async () => {
    if (!componentMountedRef.current) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching cases data with filters:', filters);
      
      const casesData = await API.cases.fetchAll(1, filters);
      
      if (!componentMountedRef.current) {
        return;
      }
      
      console.log('✅ Cases data received:', casesData);
      const casesArray = casesData.results || casesData || [];
      
      // Filter cases that have coordinates
      const casesWithCoordinates = casesArray.filter(caseItem => 
        caseItem.latitude && caseItem.longitude
      );
      
      console.log(`📊 Cases with coordinates: ${casesWithCoordinates.length}/${casesArray.length}`);
      
      setCases(casesWithCoordinates);
      
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
      setStats(newStats);

      // Add markers if map is ready
      if (mapInstanceRef.current) {
        console.log('🗺️ Map ready, adding photo markers...');
        await addMarkersToMap(casesWithCoordinates);
      } else {
        console.log('❌ No map instance available');
      }
      
    } catch (err) {
      console.error('❌ Error loading map data:', err);
      if (componentMountedRef.current) {
        setError('Failed to load map data. Please try again.');
      }
    } finally {
      if (componentMountedRef.current) {
        setLoading(false);
      }
    }
  }, [filters, addMarkersToMap]);

  // Initialize the map
  const initializeMap = useCallback(() => {
    if (!componentMountedRef.current || !window.google?.maps || !mapContainerRef.current || mapInitializedRef.current) {
      return;
    }

    try {
      mapInitializedRef.current = true;
      console.log('🏗️ Creating new Google Map instance...');
      
      const mapOptions = {
        center: { lat: 18.0735, lng: -15.9582 }, // Nouakchott coordinates
        zoom: 13,
        mapTypeId: 'roadmap',
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID, // Add Map ID for Advanced Markers
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        gestureHandling: 'cooperative',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };
      
      const map = new window.google.maps.Map(mapContainerRef.current, mapOptions);
      mapInstanceRef.current = map;
      
      console.log('✅ Google Map instance created successfully!');
      
      // Set map ready and load data
      if (componentMountedRef.current) {
        setMapReady(true);
        setLoading(false);
        console.log('🎯 Map ready, loading data...');
        loadMapData();
      }
      
    } catch (error) {
      console.error('❌ Error during map initialization:', error);
      if (componentMountedRef.current) {
        setError('Failed to initialize map. Please refresh the page.');
        mapInitializedRef.current = false;
        setLoading(false);
      }
    }
  }, [loadMapData]);

  // Load Google Maps script
  useEffect(() => {
    componentMountedRef.current = true;

    const loadGoogleMapsScript = () => {
      if (scriptLoadedRef.current) {
        return;
      }

      if (window.google?.maps) {
        console.log('✅ Google Maps already loaded, initializing...');
        scriptLoadedRef.current = true;
        setTimeout(() => {
          if (componentMountedRef.current) {
            initializeMap();
          }
        }, 100);
        return;
      }

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('📝 Google Maps script already exists, waiting for load...');
        scriptLoadedRef.current = true;
        existingScript.addEventListener('load', () => {
          if (componentMountedRef.current) {
            setTimeout(initializeMap, 100);
          }
        });
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('❌ Google Maps API key missing');
        setError('Google Maps API key is missing. Check your .env file for VITE_GOOGLE_MAPS_API_KEY');
        setLoading(false);
        return;
      }

      console.log('📝 Creating Google Maps script...');
      scriptLoadedRef.current = true;
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('✅ Google Maps script loaded successfully!');
        if (componentMountedRef.current) {
          const checkReady = () => {
            if (window.google?.maps?.Map) {
              console.log('🎉 Google Maps API ready!');
              initializeMap();
            } else if (componentMountedRef.current) {
              setTimeout(checkReady, 100);
            }
          };
          setTimeout(checkReady, 100);
        }
      };

      script.onerror = (error) => {
        console.error('❌ Error loading Google Maps script:', error);
        scriptLoadedRef.current = false;
        if (componentMountedRef.current) {
          setError('Failed to load Google Maps. Check console for details.');
          setLoading(false);
        }
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsScript();

    return () => {
      componentMountedRef.current = false;
      cleanupMarkers();
      mapInitializedRef.current = false;
      mapInstanceRef.current = null;
    };
  }, [initializeMap, cleanupMarkers]);

  // Center map function
  const centerMap = useCallback(() => {
    if (mapInstanceRef.current && componentMountedRef.current) {
      mapInstanceRef.current.setCenter({ lat: 18.0735, lng: -15.9582 });
      mapInstanceRef.current.setZoom(13);
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
            <p className="text-gray-600 mt-1">Visualize missing person cases with photo markers (Click to view case details)</p>
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
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={loadMapData}
              disabled={loading}
            >
              <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Reload Markers
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
          <div
            ref={mapContainerRef}
            className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg bg-gray-100 border"
            style={{ minHeight: '600px' }}
          />
          
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading photo markers...</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar with Legend, Stats, and Filters */}
        <div className="space-y-6">
          {/* Map Legend */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-3">Photo Markers Legend</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-8 h-8 relative mr-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-sm" style={{borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)'}}></div>
                  <div className="absolute top-1 left-1 w-6 h-6 bg-gray-200 rounded-full border border-white" style={{transform: 'rotate(45deg)'}}></div>
                </div>
                <span className="text-sm">Missing Persons</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 relative mr-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-sm" style={{borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)'}}></div>
                  <div className="absolute top-1 left-1 w-6 h-6 bg-gray-200 rounded-full border border-white" style={{transform: 'rotate(45deg)'}}></div>
                </div>
                <span className="text-sm">Found Persons</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 relative mr-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full border-2 border-white shadow-sm" style={{borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)'}}></div>
                  <div className="absolute top-1 left-1 w-6 h-6 bg-gray-200 rounded-full border border-white" style={{transform: 'rotate(45deg)'}}></div>
                </div>
                <span className="text-sm">Under Investigation</span>
              </div>
              <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                💡 <strong>Tip:</strong> Click photo markers to view case details
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
                <span className="text-sm text-gray-600">On Map</span>
                <span className="font-semibold text-blue-600">{cases.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Cases</span>
                <span className="font-semibold text-red-600">{stats.activeCases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Found Cases</span>
                <span className="font-semibold text-green-600">{stats.foundCases}</span>
              </div>
            </div>
          </div>

       
        </div>
      </div>
    </div>
  );
}