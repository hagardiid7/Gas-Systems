import React, { useEffect, useRef, useState } from 'react';

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  height?: string;
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  selectable?: boolean;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  latitude,
  longitude,
  height = '400px',
  zoom = 15,
  onLocationSelect,
  selectable = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (!window.google || !window.google.maps) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setIsLoaded(true);
          initMap();
        };
        script.onerror = () => {
          setLoadError('Failed to load Google Maps. Please try again later.');
        };
        document.head.appendChild(script);
      } else {
        setIsLoaded(true);
        initMap();
      }
    };

    const initMap = () => {
      if (!mapRef.current || !isLoaded) return;

      const mapOptions: google.maps.MapOptions = {
        center: { lat: latitude, lng: longitude },
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'greedy', // Improves mobile experience
      };

      mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);
      geocoderRef.current = new google.maps.Geocoder();

      markerRef.current = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapInstanceRef.current,
        draggable: selectable,
        animation: google.maps.Animation.DROP,
      });

      if (selectable && onLocationSelect) {
        mapInstanceRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          
          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng });
          }
          
          if (geocoderRef.current) {
            geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                const address = results[0].formatted_address;
                onLocationSelect(lat, lng, address);
              } else {
                onLocationSelect(lat, lng, '');
              }
            });
          }
        });

        if (markerRef.current) {
          markerRef.current.addListener('dragend', () => {
            const position = markerRef.current?.getPosition();
            if (position && geocoderRef.current) {
              const lat = position.lat();
              const lng = position.lng();
              
              geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  const address = results[0].formatted_address;
                  onLocationSelect(lat, lng, address);
                } else {
                  onLocationSelect(lat, lng, '');
                }
              });
            }
          });
        }
      }
    };

    loadGoogleMaps();

    return () => {
      // Cleanup if needed
    };
  }, [latitude, longitude, zoom, selectable, onLocationSelect, isLoaded]);

  // Update map center when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && isLoaded) {
      const newPosition = { lat: latitude, lng: longitude };
      mapInstanceRef.current.setCenter(newPosition);
      markerRef.current.setPosition(newPosition);
    }
  }, [latitude, longitude, isLoaded]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} style={{ height, width: '100%' }} />
      
      {loadError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-red-600">{loadError}</p>
          </div>
        </div>
      )}
      
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {selectable && isLoaded && (
        <div className="absolute bottom-2 right-2">
          <button 
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || zoom) + 1);
              }
            }}
            className="bg-white p-2 rounded-t-md shadow-md hover:bg-gray-100 focus:outline-none"
            aria-label="Zoom in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button 
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || zoom) - 1);
              }
            }}
            className="bg-white p-2 rounded-b-md shadow-md hover:bg-gray-100 focus:outline-none border-t border-gray-100"
            aria-label="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;