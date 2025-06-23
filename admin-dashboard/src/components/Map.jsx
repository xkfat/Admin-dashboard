import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, Eye, RotateCcw, Users, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import API from '../api';

export default function Map() {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const componentMountedRef = useRef(true);
  const mapInitializedRef = useRef(false);
  const scriptLoadedRef = useRef(false);
  
  const [activeFilter, setActiveFilter] = useState('');
  
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    foundCases: 0,
    investigatingCases: 0,
    recentReports: 0
  });
  
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Search functionality states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Hover tooltip state
  const [hoveredCase, setHoveredCase] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Get marker color based on case status
  const getMarkerColor = useCallback((status) => {
    switch (status) {
      case 'missing':
        return '#ef4444'; // red
      case 'found':
        return '#10b981'; // green
      case 'under_investigation':
        return '#f59e0b'; // yellow/orange
      default:
        return '#6b7280'; // gray for unknown status
    }
  }, []);

  // Create custom photo marker without status dots
  const createPhotoMarker = useCallback((caseItem, position) => {
    return new Promise((resolve) => {
      console.log(`🎨 Creating clean marker for ${caseItem.first_name} ${caseItem.last_name}`);
      
      const markerColor = getMarkerColor(caseItem.status);
      
      // Create the main container
      const markerContainer = document.createElement('div');
      markerContainer.className = `custom-photo-marker marker-${caseItem.status}`;
      markerContainer.setAttribute('data-case-id', caseItem.id);
      markerContainer.setAttribute('data-status', caseItem.status);
      markerContainer.style.cssText = `
        position: relative;
        width: 60px;
        height: 80px;
        cursor: pointer;
        transform: translate(-50%, -100%);
        z-index: ${caseItem.status === 'missing' ? '1002' : '1001'};
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      `;

      // Create the pin background (teardrop shape) - clean version
      const pinBackground = document.createElement('div');
      pinBackground.className = 'pin-background';
      pinBackground.style.cssText = `
        position: absolute;
        width: 60px;
        height: 60px;
        background: ${markerColor} !important;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        top: 0;
        left: 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid white;
        display: block !important;
        visibility: visible !important;
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
        display: block !important;
        visibility: visible !important;
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
        display: block !important;
      `;

      // Handle image load error
      photoImg.onerror = () => {
        photoImg.src = '/default-avatar.png';
      };

      // Add CSS styles for clean markers
      if (!document.querySelector('#clean-marker-styles')) {
        const style = document.createElement('style');
        style.id = 'clean-marker-styles';
        style.textContent = `
          .custom-photo-marker:hover .pin-background {
            transform: rotate(-45deg) scale(1.1) !important;
            transition: transform 0.2s ease;
            box-shadow: 0 6px 16px rgba(0,0,0,0.4) !important;
          }
          .custom-photo-marker:hover .photo-container {
            transform: rotate(45deg) scale(1.05) !important;
            transition: transform 0.2s ease;
          }
          .custom-photo-marker {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          .marker-found .pin-background {
            background: #10b981 !important;
          }
          .marker-under_investigation .pin-background {
            background: #f59e0b !important;
          }
          .marker-missing .pin-background {
            background: #ef4444 !important;
          }
        `;
        document.head.appendChild(style);
      }

      // Assemble the marker (no status dot)
      photoContainer.appendChild(photoImg);
      markerContainer.appendChild(pinBackground);
      markerContainer.appendChild(photoContainer);

      // Add click event to navigate to case detail
      markerContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🖱️ Photo marker clicked:', caseItem.first_name, caseItem.last_name);
        navigate(`/cases/${caseItem.id}`);
      });

      // Add hover effects for tooltip
      markerContainer.addEventListener('mouseenter', (e) => {
        const rect = markerContainer.getBoundingClientRect();
        setTooltipPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
        setHoveredCase(caseItem);
        
        // Visual hover effect
        markerContainer.style.zIndex = '2000';
        markerContainer.style.transform = 'translate(-50%, -100%) scale(1.1)';
        markerContainer.style.transition = 'transform 0.2s ease';
      });

      markerContainer.addEventListener('mouseleave', () => {
        setHoveredCase(null);
        markerContainer.style.zIndex = caseItem.status === 'missing' ? '1002' : '1001';
        markerContainer.style.transform = 'translate(-50%, -100%) scale(1)';
      });

      console.log(`✅ Clean marker created for: ${caseItem.full_name}`);
      resolve(markerContainer);
    });
  }, [getMarkerColor, navigate]);

  // Safe cleanup function
  const cleanupMarkers = useCallback(() => {
    if (markersRef.current && markersRef.current.length > 0) {
      markersRef.current.forEach(marker => {
        try {
          if (marker && typeof marker.setMap === 'function') {
            marker.setMap(null);
          } else if (marker && typeof marker.onRemove === 'function') {
            marker.onRemove();
          }
        } catch (e) {
          console.warn('Error cleaning up marker:', e);
        }
      });
    }
    markersRef.current = [];
  }, []);

  // Add markers to map
  const addMarkersToMap = useCallback(async (casesData) => {
    console.log('🏷️ Starting to add clean photo markers to map...');
    
    if (!mapInstanceRef.current || !window.google?.maps || !componentMountedRef.current) {
      console.log('❌ Cannot add markers - missing requirements');
      return;
    }

    // Clean up existing markers
    cleanupMarkers();

    let markersCreated = 0;

    for (const caseItem of casesData) {
      if (!caseItem.latitude || !caseItem.longitude || !componentMountedRef.current) {
        continue;
      }

      try {
        const position = { 
          lat: parseFloat(caseItem.latitude), 
          lng: parseFloat(caseItem.longitude) 
        };

        const markerElement = await createPhotoMarker(caseItem, position);
        let marker;
        
        if (window.google.maps.marker?.AdvancedMarkerElement) {
          marker = new window.google.maps.marker.AdvancedMarkerElement({
            map: mapInstanceRef.current,
            position: position,
            content: markerElement,
            title: `${caseItem.first_name} ${caseItem.last_name}`,
            zIndex: caseItem.status === 'missing' ? 1002 : 1001,
            gmpClickable: true
          });
        } else {
          // Fallback overlay implementation
          class PhotoMarkerOverlay extends window.google.maps.OverlayView {
            constructor(position, content, map, caseData) {
              super();
              this.position = position;
              this.content = content;
              this.caseData = caseData;
              this.div = null;
              this.setMap(map);
            }

            onAdd() {
              this.div = document.createElement('div');
              this.div.style.position = 'absolute';
              this.div.appendChild(this.content);
              const panes = this.getPanes();
              if (panes && panes.overlayMouseTarget) {
                panes.overlayMouseTarget.appendChild(this.div);
              }
            }

            draw() {
              if (!this.div) return;
              const overlayProjection = this.getProjection();
              if (!overlayProjection) return;
              const point = overlayProjection.fromLatLngToDivPixel(
                new window.google.maps.LatLng(this.position.lat, this.position.lng)
              );
              if (point) {
                this.div.style.left = point.x + 'px';
                this.div.style.top = point.y + 'px';
              }
            }

            onRemove() {
              if (this.div && this.div.parentNode) {
                this.div.parentNode.removeChild(this.div);
                this.div = null;
              }
            }
          }
          marker = new PhotoMarkerOverlay(position, markerElement, mapInstanceRef.current, caseItem);
        }

        if (componentMountedRef.current && marker) {
          markersRef.current.push(marker);
          markersCreated++;
        }

      } catch (error) {
        console.error(`❌ Error creating marker for case ${caseItem.id}:`, error);
      }
    }

    console.log(`✅ Clean markers completed: ${markersCreated} created`);
    
    // Fit markers in view
    if (markersCreated > 0 && mapInstanceRef.current) {
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
      
      if (markersCreated === 1) {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            const currentZoom = mapInstanceRef.current.getZoom();
            if (currentZoom > 16) {
              mapInstanceRef.current.setZoom(16);
            }
          }
        }, 100);
      }
    }
  }, [createPhotoMarker, cleanupMarkers]);

  // Apply status filter
  const applyStatusFilter = useCallback(async (status) => {
    setLoading(true);
    setActiveFilter(status);
    
    try {
      let filteredCases = cases;
      
      if (status) {
        filteredCases = cases.filter(c => c.status === status);
      }
      
      // Update markers on map
      await addMarkersToMap(filteredCases);
      
      console.log(`Applied ${status || 'all'} filter: ${filteredCases.length} cases shown`);
    } catch (error) {
      console.error('Error applying filter:', error);
    } finally {
      setLoading(false);
    }
  }, [cases, addMarkersToMap]);

  // Search functionality
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const localResults = cases.filter(caseItem =>
        caseItem.first_name.toLowerCase().includes(query.toLowerCase()) ||
        caseItem.last_name.toLowerCase().includes(query.toLowerCase()) ||
        caseItem.full_name.toLowerCase().includes(query.toLowerCase()) ||
        caseItem.last_seen_location.toLowerCase().includes(query.toLowerCase()) ||
        caseItem.id.toString().includes(query)
      );

      if (localResults.length > 0) {
        setSearchResults(localResults);
        setShowSearchResults(true);
      } else {
        const searchData = await API.cases.fetchAll(1, { 
          name_or_location: query 
        });
        
        const allResults = searchData.results || [];
        const resultsWithCoordinates = allResults.filter(c => c.latitude && c.longitude);
        
        setSearchResults(resultsWithCoordinates);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  }, [cases]);

  // Handle search input changes with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, handleSearch]);

  // Zoom to case location
  const zoomToCase = useCallback((caseItem) => {
    if (!mapInstanceRef.current || !caseItem.latitude || !caseItem.longitude) {
      return;
    }

    const position = {
      lat: parseFloat(caseItem.latitude),
      lng: parseFloat(caseItem.longitude)
    };

    mapInstanceRef.current.setCenter(position);
    mapInstanceRef.current.setZoom(16);
    
    setShowSearchResults(false);
    setSearchTerm(caseItem.full_name);
    setSelectedCase(caseItem);
  }, []);

  // Load map data
  const loadMapData = useCallback(async () => {
    if (!componentMountedRef.current) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const casesData = await API.cases.fetchAll(1, {});
      
      if (!componentMountedRef.current) {
        return;
      }
      
      const casesArray = casesData.results || casesData || [];
      const casesWithCoordinates = casesArray.filter(caseItem => 
        caseItem.latitude && caseItem.longitude
      );
      
      setCases(casesWithCoordinates);
      
      // Calculate stats
      const totalCases = casesData.count || casesArray.length || 0;
      const activeCases = casesArray.filter(c => c.status === 'missing').length;
      const foundCases = casesArray.filter(c => c.status === 'found').length;
      const investigatingCases = casesArray.filter(c => c.status === 'under_investigation').length;
      
      setStats({
        totalCases,
        activeCases,
        foundCases,
        investigatingCases,
        recentReports: 23
      });

      if (mapInstanceRef.current) {
        await addMarkersToMap(casesWithCoordinates);
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
  }, [addMarkersToMap]);

  // Initialize the map
  const initializeMap = useCallback(() => {
    if (!componentMountedRef.current || !window.google?.maps || !mapContainerRef.current || mapInitializedRef.current) {
      return;
    }

    try {
      mapInitializedRef.current = true;
      
      const mapOptions = {
        center: { lat: 18.0735, lng: -15.9582 }, // Nouakchott coordinates
        zoom: 13,
        mapTypeId: 'roadmap',
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
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
      
      if (componentMountedRef.current) {
        setMapReady(true);
        setLoading(false);
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

      scriptLoadedRef.current = true;
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (componentMountedRef.current) {
          const checkReady = () => {
            if (window.google?.maps?.Map) {
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

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedCase(null);
  };

  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'missing':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Missing' };
      case 'found':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Found' };
      case 'under_investigation':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Investigating' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' };
    }
  };

  return (
    <>
     

      {/* Controls Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center space-x-4">
          {/* Search Bar - Takes most width */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, or last seen location..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {searchLoading && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {searchResults.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => zoomToCase(caseItem)}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={caseItem.photo || '/default-avatar.png'}
                        alt={caseItem.full_name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{caseItem.full_name}</h4>
                            <p className="text-sm text-gray-600">Case • {caseItem.last_seen_location}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              caseItem.status === 'missing' ? 'bg-red-100 text-red-800' :
                              caseItem.status === 'found' ? 'bg-green-100 text-green-800' :
                              caseItem.status === 'under_investigation' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {caseItem.status.replace('_', ' ')}
                            </span>
                            <Eye className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Button */}
          <button 
            className="flex items-center px-4 py-2.5 bg-findthem-teal text-white rounded-lg hover:bg-findthem-darkGreen transition-colors disabled:opacity-50 flex-shrink-0"
            onClick={loadMapData}
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Error:</span>
            <span className="ml-2">{error}</span>
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
        </div>
      )}

      {/* Main Content - Map now takes full width */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Map Container - Takes full width when no selected case */}
        <div className={selectedCase ? "xl:col-span-3" : "xl:col-span-4"}>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* Interactive Map Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <button
                    onClick={() => applyStatusFilter('')}
                    className={`text-left hover:bg-gray-100 rounded-lg p-2 -m-2 transition-colors ${
                      activeFilter === '' ? 'bg-findthem-lighter' : ''
                    }`}
                  >
                    <h2 className="text-lg font-semibold text-gray-900">Map View</h2>
                    <p className="text-sm text-gray-600">{cases.length} cases with location data</p>
                  </button>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <button
                    onClick={() => applyStatusFilter('missing')}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors hover:bg-red-50 ${
                      activeFilter === 'missing' ? 'bg-red-100 border border-red-200' : ''
                    }`}
                  >
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-gray-700 font-medium">Missing ({cases.filter(c => c.status === 'missing').length})</span>
                  </button>
                  <button
                    onClick={() => applyStatusFilter('found')}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors hover:bg-green-50 ${
                      activeFilter === 'found' ? 'bg-green-100 border border-green-200' : ''
                    }`}
                  >
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-700 font-medium">Found ({cases.filter(c => c.status === 'found').length})</span>
                  </button>
                  <button
                    onClick={() => applyStatusFilter('under_investigation')}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors hover:bg-yellow-50 ${
                      activeFilter === 'under_investigation' ? 'bg-yellow-100 border border-yellow-200' : ''
                    }`}
                  >
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-gray-700 font-medium">Investigating ({cases.filter(c => c.status === 'under_investigation').length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="relative">
              <div
                ref={mapContainerRef}
                className="w-full h-[700px] bg-gray-100"
                style={{ minHeight: '700px' }}
              />
              
              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Only shows when case is selected */}
        {selectedCase && (
          <div className="space-y-6">
            {/* Selected Case Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Selected Case</h3>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{selectedCase.full_name}</h4>
                  <p className="text-sm text-gray-600">Case #{selectedCase.id}</p>
                  <div className="mt-2">
                    {(() => {
                      const statusInfo = getStatusInfo(selectedCase.status);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Last Seen Location</p>
                    <p className="text-sm text-gray-600">{selectedCase.last_seen_location}</p>
                  </div>
                </div>
                
                {selectedCase.last_seen_date && (
                  <div className="flex items-start space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Last Seen Date</p>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedCase.last_seen_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => navigate(`/cases/${selectedCase.id}`)}
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Full Details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hover Tooltip */}
      {hoveredCase && (
        <div
          className="fixed z-[9999] bg-white rounded-lg shadow-xl border p-4 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 100}px`,
            transform: 'translateX(-50%)',
            maxWidth: '280px'
          }}
        >
          <div className="flex items-center space-x-3">
        
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-sm">{hoveredCase.full_name}</h4>
              <div className="flex items-center space-x-2 mt-1">
                {(() => {
                  const statusInfo = getStatusInfo(hoveredCase.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
          
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        </div>
      )}
    </>
  );
}