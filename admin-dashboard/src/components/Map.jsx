import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, Eye } from 'lucide-react';
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

  // Debug: Log all cases and their statuses
  useEffect(() => {
    console.log('📊 Current cases state:', cases);
    console.log('📊 Cases by status:', {
      missing: cases.filter(c => c.status === 'missing').length,
      found: cases.filter(c => c.status === 'found').length,
      under_investigation: cases.filter(c => c.status === 'under_investigation').length,
      total: cases.length
    });
  }, [cases]);

  // Get marker color based on case status
  const getMarkerColor = useCallback((status) => {
    console.log('🎨 Getting color for status:', status);
    switch (status) {
      case 'missing':
        return '#ef4444'; // red
      case 'found':
        return '#10b981'; // green
      case 'under_investigation':
        return '#f59e0b'; // yellow/orange
      default:
        console.warn('⚠️ Unknown status:', status);
        return '#6b7280'; // gray for unknown status
    }
  }, []);

  // Create custom photo marker with improved styling and forced visibility
  const createPhotoMarker = useCallback((caseItem, position) => {
    return new Promise((resolve) => {
      console.log(`🎨 Creating marker for ${caseItem.first_name} ${caseItem.last_name} with status: ${caseItem.status}`);
      
      const markerColor = getMarkerColor(caseItem.status);
      console.log(`🎨 Marker color for ${caseItem.status}: ${markerColor}`);
      
      // Create the main container with forced visibility
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

      // Create the pin background (teardrop shape) with status-specific styling
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
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        border: 3px solid white;
        display: block !important;
        visibility: visible !important;
      `;

      // Add special styling for non-missing cases to make them more visible
      if (caseItem.status !== 'missing') {
        pinBackground.style.boxShadow = `0 6px 16px rgba(0,0,0,0.5), 0 0 0 2px ${markerColor}`;
        pinBackground.style.border = '4px solid white';
      }

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
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
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

      // Create status indicator dot with enhanced visibility
      const statusDot = document.createElement('div');
      statusDot.className = `status-indicator status-${caseItem.status}`;
      statusDot.style.cssText = `
        position: absolute;
        width: 18px;
        height: 18px;
        background: ${markerColor} !important;
        border: 3px solid white;
        border-radius: 50%;
        top: -3px;
        right: 1px;
        transform: rotate(45deg);
        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        z-index: 1002;
        display: block !important;
        visibility: visible !important;
      `;

      // Add status-specific enhancements
      if (caseItem.status === 'missing') {
        // Remove animation for missing cases
        // statusDot.style.animation = 'pulse 2s infinite';
      } else if (caseItem.status === 'found') {
        // Make found cases more prominent
        statusDot.style.boxShadow = `0 3px 6px rgba(0,0,0,0.4), 0 0 0 2px ${markerColor}`;
        statusDot.innerHTML = '✓';
        statusDot.style.color = 'white';
        statusDot.style.fontSize = '10px';
        statusDot.style.display = 'flex';
        statusDot.style.alignItems = 'center';
        statusDot.style.justifyContent = 'center';
        statusDot.style.transform = 'rotate(45deg) scale(1.1)';
      } else if (caseItem.status === 'under_investigation') {
        // Make investigating cases more prominent
        statusDot.style.boxShadow = `0 3px 6px rgba(0,0,0,0.4), 0 0 0 2px ${markerColor}`;
        statusDot.innerHTML = '?';
        statusDot.style.color = 'white';
        statusDot.style.fontSize = '12px';
        statusDot.style.fontWeight = 'bold';
        statusDot.style.display = 'flex';
        statusDot.style.alignItems = 'center';
        statusDot.style.justifyContent = 'center';
        statusDot.style.transform = 'rotate(45deg) scale(1.1)';
      }

      // Add CSS styles without animations
      if (!document.querySelector('#marker-animations')) {
        const style = document.createElement('style');
        style.id = 'marker-animations';
        style.textContent = `
          .custom-photo-marker:hover .pin-background {
            transform: rotate(-45deg) scale(1.1) !important;
            transition: transform 0.2s ease;
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

      // Assemble the marker
      photoContainer.appendChild(photoImg);
      markerContainer.appendChild(pinBackground);
      markerContainer.appendChild(photoContainer);
      markerContainer.appendChild(statusDot);

      // Add click event to navigate to case detail
      markerContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🖱️ Photo marker clicked:', caseItem.first_name, caseItem.last_name, `(${caseItem.status})`);
        
        // Set selected case for info panel
        setSelectedCase(caseItem);
        
        // Navigate to case detail
        navigate(`/cases/${caseItem.id}`);
      });

      // Add hover effects with enhanced visibility
      markerContainer.addEventListener('mouseenter', () => {
        markerContainer.style.zIndex = '2000';
        markerContainer.style.transform = 'translate(-50%, -100%) scale(1.15)';
        markerContainer.style.transition = 'transform 0.2s ease';
        markerContainer.style.filter = 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))';
      });

      markerContainer.addEventListener('mouseleave', () => {
        markerContainer.style.zIndex = caseItem.status === 'missing' ? '1002' : '1001';
        markerContainer.style.transform = 'translate(-50%, -100%) scale(1)';
        markerContainer.style.filter = 'none';
      });

      // Force final visibility
      setTimeout(() => {
        markerContainer.style.display = 'block';
        markerContainer.style.visibility = 'visible';
        markerContainer.style.opacity = '1';
      }, 0);

      console.log(`✅ Marker element created for ${caseItem.status} case: ${caseItem.full_name}`);
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
          } else if (marker && typeof marker.onRemove === 'function') {
            // For custom overlay markers
            marker.onRemove();
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
    console.log('📊 Cases data for markers:', casesData);
    
    // Debug: Log the breakdown by status
    const statusBreakdown = casesData.reduce((acc, caseItem) => {
      acc[caseItem.status] = (acc[caseItem.status] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Cases breakdown by status:', statusBreakdown);
    
    if (!mapInstanceRef.current || !window.google?.maps || !componentMountedRef.current) {
      console.log('❌ Cannot add markers - missing requirements');
      return;
    }

    // Clean up existing markers
    cleanupMarkers();

    let markersCreated = 0;
    let markersSkipped = 0;
    const markersByStatus = { missing: 0, found: 0, under_investigation: 0 };

    for (const caseItem of casesData) {
      console.log(`🔍 Processing case: ${caseItem.first_name} ${caseItem.last_name} (Status: ${caseItem.status})`);

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

        console.log(`📍 Creating photo marker for ${caseItem.status} case at:`, position);

        // Create custom photo marker element
        const markerElement = await createPhotoMarker(caseItem, position);

        // Force marker visibility with explicit styles
        markerElement.style.display = 'block';
        markerElement.style.visibility = 'visible';
        markerElement.style.opacity = '1';

        // Use AdvancedMarkerElement if available, otherwise fallback
        let marker;
        
        if (window.google.maps.marker?.AdvancedMarkerElement) {
          console.log(`🆕 Using AdvancedMarkerElement for ${caseItem.status} marker`);
          marker = new window.google.maps.marker.AdvancedMarkerElement({
            map: mapInstanceRef.current,
            position: position,
            content: markerElement,
            title: `${caseItem.first_name} ${caseItem.last_name} - ${caseItem.status}`,
            zIndex: caseItem.status === 'missing' ? 1002 : 1001, // Higher z-index for missing cases
            gmpClickable: true
          });
          
          // Force marker to be visible
          marker.content.style.display = 'block';
          marker.content.style.visibility = 'visible';
          
        } else {
          console.log(`🔄 Using Overlay for ${caseItem.status} marker (fallback)`);
          
          // Enhanced PhotoMarkerOverlay class
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
              this.div.style.cssText = `
                position: absolute;
                pointer-events: auto;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                z-index: ${this.caseData.status === 'missing' ? '1002' : '1001'};
              `;
              this.div.appendChild(this.content);

              // Force content visibility
              this.content.style.display = 'block';
              this.content.style.visibility = 'visible';
              this.content.style.opacity = '1';

              const panes = this.getPanes();
              if (panes && panes.overlayMouseTarget) {
                panes.overlayMouseTarget.appendChild(this.div);
                console.log(`✅ Overlay marker added to DOM for ${this.caseData.status} case`);
              } else {
                console.error('❌ Could not find overlay panes');
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
                this.div.style.display = 'block';
                this.div.style.visibility = 'visible';
              }
            }

            onRemove() {
              if (this.div && this.div.parentNode) {
                this.div.parentNode.removeChild(this.div);
                this.div = null;
              }
            }

            setMap(map) {
              super.setMap(map);
            }
          }

          marker = new PhotoMarkerOverlay(position, markerElement, mapInstanceRef.current, caseItem);
        }

        console.log(`✅ ${caseItem.status.toUpperCase()} marker created for ${caseItem.first_name} ${caseItem.last_name}`);

        if (componentMountedRef.current && marker) {
          markersRef.current.push(marker);
          markersCreated++;
          markersByStatus[caseItem.status] = (markersByStatus[caseItem.status] || 0) + 1;
        }

      } catch (error) {
        console.error(`❌ Error creating photo marker for case ${caseItem.id}:`, error);
        markersSkipped++;
      }
    }

    console.log(`✅ Photo markers completed: ${markersCreated} created, ${markersSkipped} skipped`);
    console.log(`📊 Markers created by status:`, markersByStatus);
    
    // Additional debug: Check DOM for markers
    setTimeout(() => {
      const allMarkers = document.querySelectorAll('.custom-photo-marker');
      console.log(`🔍 Found ${allMarkers.length} markers in DOM after creation`);
      
      allMarkers.forEach((markerEl, index) => {
        const computedStyle = window.getComputedStyle(markerEl);
        console.log(`Marker ${index + 1}:`, {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          zIndex: computedStyle.zIndex
        });
      });
    }, 1000);
    
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
      
      // Add some padding to the bounds
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const padding = 0.01; // Adjust this value as needed
      
      bounds.extend({
        lat: ne.lat() + padding,
        lng: ne.lng() + padding
      });
      bounds.extend({
        lat: sw.lat() - padding,
        lng: sw.lng() - padding
      });
      
      mapInstanceRef.current.fitBounds(bounds);
      
      // Don't zoom too close if there's only one marker
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

  // Search functionality
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      // Search through current cases first
      const localResults = cases.filter(caseItem =>
        caseItem.first_name.toLowerCase().includes(query.toLowerCase()) ||
        caseItem.last_name.toLowerCase().includes(query.toLowerCase()) ||
        caseItem.full_name.toLowerCase().includes(query.toLowerCase()) ||
        caseItem.last_seen_location.toLowerCase().includes(query.toLowerCase()) ||
        caseItem.id.toString().includes(query)
      );

      // If we have local results, use them
      if (localResults.length > 0) {
        setSearchResults(localResults);
        setShowSearchResults(true);
      } else {
        // Search in the database for cases not currently loaded
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
    
    // Close search results
    setShowSearchResults(false);
    setSearchTerm(caseItem.full_name);
    
    // Set as selected case
    setSelectedCase(caseItem);
    
    console.log(`🎯 Zoomed to case: ${caseItem.full_name} at`, position);
  }, []);

  // Load map data with improved logging
  const loadMapData = useCallback(async () => {
    if (!componentMountedRef.current) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching all cases data...');
      
      // Fetch all cases without filters to show everything on the map
      const casesData = await API.cases.fetchAll(1, {});
      
      if (!componentMountedRef.current) {
        return;
      }
      
      console.log('✅ Cases data received:', casesData);
      const casesArray = casesData.results || casesData || [];
      
      // Debug: Log all cases and their statuses
      console.log('📊 All cases from API:', casesArray.map(c => ({
        id: c.id,
        name: c.full_name,
        status: c.status,
        hasCoords: !!(c.latitude && c.longitude)
      })));
      
      // Filter cases that have coordinates
      const casesWithCoordinates = casesArray.filter(caseItem => 
        caseItem.latitude && caseItem.longitude
      );
      
      console.log(`📊 Cases with coordinates: ${casesWithCoordinates.length}/${casesArray.length}`);
      console.log('📊 Cases by status (with coordinates):', {
        missing: casesWithCoordinates.filter(c => c.status === 'missing').length,
        found: casesWithCoordinates.filter(c => c.status === 'found').length,
        under_investigation: casesWithCoordinates.filter(c => c.status === 'under_investigation').length,
      });
      
      setCases(casesWithCoordinates);
      
      // Calculate stats
      const totalCases = casesData.count || casesArray.length || 0;
      const activeCases = casesArray.filter(c => c.status === 'missing').length;
      const foundCases = casesArray.filter(c => c.status === 'found').length;
      const investigatingCases = casesArray.filter(c => c.status === 'under_investigation').length;
      
      const newStats = {
        totalCases,
        activeCases,
        foundCases,
        investigatingCases,
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
  }, [addMarkersToMap]); // Removed filters dependency

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

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedCase(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Map Header with Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900"> Map View of Cases</h1>
          </div>
          <div className="flex space-x-3">
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={centerMap}
              disabled={!mapReady || loading}
            >
              <MapPin className="h-4 w-4 inline mr-2" />
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

        {/* Enhanced Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, case ID, or location..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          </div>

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
                          <p className="text-sm text-gray-600">Case #{caseItem.id} • {caseItem.last_seen_location}</p>
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

          {/* No Results Message */}
          {showSearchResults && searchResults.length === 0 && !searchLoading && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500">
              No cases found matching "{searchTerm}"
            </div>
          )}
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

          {/* Selected Case Info Panel */}
          {selectedCase && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Selected Case</h3>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <img
                  src={selectedCase.photo || '/default-avatar.png'}
                  alt={selectedCase.full_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{selectedCase.full_name}</h4>
                  <p className="text-sm text-gray-600">Case #{selectedCase.id}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                    selectedCase.status === 'missing' ? 'bg-red-100 text-red-800' :
                    selectedCase.status === 'found' ? 'bg-green-100 text-green-800' :
                    selectedCase.status === 'under_investigation' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedCase.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-600">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {selectedCase.last_seen_location}
                </p>
                <button
                  onClick={() => navigate(`/cases/${selectedCase.id}`)}
                  className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  View Full Details
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar with Stats */}
        <div className="space-y-6">
          {/* Map Statistics */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-3">Cases on Map</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Missing</span>
                </div>
                <span className="font-semibold text-red-600">
                  {cases.filter(c => c.status === 'missing').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Found</span>
                </div>
                <span className="font-semibold text-green-600">
                  {cases.filter(c => c.status === 'found').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Investigating</span>
                </div>
                <span className="font-semibold text-yellow-600">
                  {cases.filter(c => c.status === 'under_investigation').length}
                </span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total on Map</span>
                  <span className="font-bold text-gray-900 text-lg">{cases.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}