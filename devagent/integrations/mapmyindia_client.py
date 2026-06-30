"""MapMyIndia API integration.

Provides geocoding, reverse geocoding, routing, and place search functionality
using the MapMyIndia (Mappls) platform APIs.
"""

from __future__ import annotations

import json
import urllib.parse
from typing import Any, Dict, List, Optional, Tuple

import requests

from ..config import Settings
from ..logging_config import get_logger
from .http import resilient_request

log = get_logger("devagent.mapmyindia")


class MapMyIndiaClient:
    """Client for MapMyIndia (Mappls) API operations."""

    def __init__(self, settings: Settings) -> None:
        """Initialize MapMyIndia client with settings.
        
        Args:
            settings: Application settings containing API credentials
        """
        self.settings = settings
        self.enabled = getattr(settings, 'mapmyindia_enabled', False)
        self._session = requests.Session()
        
        # MapMyIndia API endpoints
        self.base_url = getattr(settings, 'mapmyindia_api_url', 'https://apis.mappls.com')
        self.oauth_url = getattr(settings, 'mapmyindia_oauth_url', 'https://outpost.mappls.com/api/security/oauth/token')
        
        # API credentials
        self.client_id = getattr(settings, 'mapmyindia_client_id', '')
        self.client_secret = getattr(settings, 'mapmyindia_client_secret', '')
        self.rest_key = getattr(settings, 'mapmyindia_rest_key', '')
        
        self._access_token: Optional[str] = None
        self._token_type: str = 'bearer'
        
        if self.enabled:
            self._authenticate()

    def _authenticate(self) -> None:
        """Authenticate with MapMyIndia OAuth2 to get access token."""
        if not self.client_id or not self.client_secret:
            log.warning("MapMyIndia credentials not configured")
            self.enabled = False
            return
            
        try:
            params = {
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret
            }
            
            resp = resilient_request(
                self._session,
                'POST',
                self.oauth_url,
                params=params,
                timeout=10
            )
            resp.raise_for_status()
            
            data = resp.json()
            self._access_token = data.get('access_token')
            self._token_type = data.get('token_type', 'bearer')
            
            if self._access_token:
                self._session.headers['Authorization'] = f"{self._token_type} {self._access_token}"
                log.info("MapMyIndia authentication successful")
            else:
                log.error("Failed to obtain MapMyIndia access token")
                self.enabled = False
                
        except Exception as e:
            log.error(f"MapMyIndia authentication failed: {e}")
            self.enabled = False

    def _send(self, method: str, endpoint: str, **kwargs: Any) -> requests.Response:
        """Send authenticated request to MapMyIndia API.
        
        Args:
            method: HTTP method
            endpoint: API endpoint path
            **kwargs: Additional request parameters
            
        Returns:
            Response object
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        # Add REST key if needed for certain endpoints
        if 'params' not in kwargs:
            kwargs['params'] = {}
        if self.rest_key and 'rest_key' not in kwargs['params']:
            kwargs['params']['rest_key'] = self.rest_key
            
        return resilient_request(self._session, method, url, timeout=30, **kwargs)

    def geocode(self, address: str, region: str = 'IND') -> List[Dict[str, Any]]:
        """Convert address to geographic coordinates.
        
        Args:
            address: Address string to geocode
            region: Region code (default: IND for India)
            
        Returns:
            List of geocoding results with lat/lng coordinates
        """
        if not self.enabled:
            log.debug("MapMyIndia client not enabled")
            return []
            
        try:
            params = {
                'address': address,
                'region': region
            }
            
            resp = self._send('GET', '/api/places/geocode', params=params)
            resp.raise_for_status()
            
            data = resp.json()
            results = data.get('copResults', [])
            
            log.info(f"Geocoded '{address}': {len(results)} results")
            return results
            
        except Exception as e:
            log.error(f"Geocoding failed for '{address}': {e}")
            return []

    def reverse_geocode(self, lat: float, lng: float) -> Dict[str, Any]:
        """Convert coordinates to address.
        
        Args:
            lat: Latitude
            lng: Longitude
            
        Returns:
            Address information for the coordinates
        """
        if not self.enabled:
            log.debug("MapMyIndia client not enabled")
            return {}
            
        try:
            params = {
                'lat': lat,
                'lng': lng
            }
            
            resp = self._send('GET', '/api/places/rev_geocode', params=params)
            resp.raise_for_status()
            
            data = resp.json()
            result = data.get('results', [{}])[0]
            
            log.info(f"Reverse geocoded ({lat}, {lng}): {result.get('formatted_address', 'Unknown')}")
            return result
            
        except Exception as e:
            log.error(f"Reverse geocoding failed for ({lat}, {lng}): {e}")
            return {}

    def search_places(
        self,
        query: str,
        location: Optional[Tuple[float, float]] = None,
        radius: int = 1000
    ) -> List[Dict[str, Any]]:
        """Search for places by query.
        
        Args:
            query: Search query (e.g., "restaurants", "ATMs")
            location: Optional center point as (lat, lng) tuple
            radius: Search radius in meters (default: 1000)
            
        Returns:
            List of place results
        """
        if not self.enabled:
            log.debug("MapMyIndia client not enabled")
            return []
            
        try:
            params = {
                'query': query,
                'radius': radius
            }
            
            if location:
                params['location'] = f"{location[0]},{location[1]}"
                
            resp = self._send('GET', '/api/places/search/json', params=params)
            resp.raise_for_status()
            
            data = resp.json()
            results = data.get('suggestedLocations', [])
            
            log.info(f"Place search for '{query}': {len(results)} results")
            return results
            
        except Exception as e:
            log.error(f"Place search failed for '{query}': {e}")
            return []

    def get_route(
        self,
        start: Tuple[float, float],
        end: Tuple[float, float],
        waypoints: Optional[List[Tuple[float, float]]] = None,
        profile: str = 'driving'
    ) -> Dict[str, Any]:
        """Get routing information between points.
        
        Args:
            start: Starting point as (lat, lng) tuple
            end: Ending point as (lat, lng) tuple
            waypoints: Optional list of waypoints as (lat, lng) tuples
            profile: Routing profile (driving, walking, biking)
            
        Returns:
            Route information including distance, duration, and geometry
        """
        if not self.enabled:
            log.debug("MapMyIndia client not enabled")
            return {}
            
        try:
            # Build coordinates string
            coords = [f"{start[1]},{start[0]}"]
            if waypoints:
                coords.extend([f"{wp[1]},{wp[0]}" for wp in waypoints])
            coords.append(f"{end[1]},{end[0]}")
            coord_string = ';'.join(coords)
            
            # API expects coordinates in URL path
            endpoint = f'/api/directions/route/{profile}/{coord_string}'
            
            params = {
                'overview': 'full',
                'geometries': 'polyline',
                'steps': 'true'
            }
            
            resp = self._send('GET', endpoint, params=params)
            resp.raise_for_status()
            
            data = resp.json()
            if data.get('routes'):
                route = data['routes'][0]
                log.info(f"Route found: {route.get('distance', 0)/1000:.1f}km, "
                        f"{route.get('duration', 0)/60:.1f}min")
                return route
            else:
                log.warning("No route found")
                return {}
                
        except Exception as e:
            log.error(f"Routing failed from {start} to {end}: {e}")
            return {}

    def get_distance_matrix(
        self,
        origins: List[Tuple[float, float]],
        destinations: List[Tuple[float, float]],
        profile: str = 'driving'
    ) -> Dict[str, Any]:
        """Calculate distance matrix between multiple origins and destinations.
        
        Args:
            origins: List of origin points as (lat, lng) tuples
            destinations: List of destination points as (lat, lng) tuples
            profile: Routing profile (driving, walking, biking)
            
        Returns:
            Distance matrix with distances and durations
        """
        if not self.enabled:
            log.debug("MapMyIndia client not enabled")
            return {}
            
        try:
            # Format coordinates
            origin_coords = ';'.join([f"{lng},{lat}" for lat, lng in origins])
            dest_coords = ';'.join([f"{lng},{lat}" for lat, lng in destinations])
            
            params = {
                'origins': origin_coords,
                'destinations': dest_coords,
                'profile': profile
            }
            
            resp = self._send('GET', '/api/distance_matrix/driving', params=params)
            resp.raise_for_status()
            
            data = resp.json()
            log.info(f"Distance matrix calculated: {len(origins)}x{len(destinations)}")
            return data
            
        except Exception as e:
            log.error(f"Distance matrix calculation failed: {e}")
            return {}

    def autosuggest(self, query: str, location: Optional[Tuple[float, float]] = None) -> List[Dict[str, Any]]:
        """Get place suggestions based on partial input.
        
        Args:
            query: Partial search query
            location: Optional reference location as (lat, lng) tuple
            
        Returns:
            List of suggested places
        """
        if not self.enabled:
            log.debug("MapMyIndia client not enabled")
            return []
            
        try:
            params = {'query': query}
            
            if location:
                params['location'] = f"{location[0]},{location[1]}"
                
            resp = self._send('GET', '/api/places/autosuggest', params=params)
            resp.raise_for_status()
            
            data = resp.json()
            suggestions = data.get('suggestedLocations', [])
            
            log.debug(f"Autosuggest for '{query}': {len(suggestions)} suggestions")
            return suggestions
            
        except Exception as e:
            log.error(f"Autosuggest failed for '{query}': {e}")
            return []

    def get_place_details(self, place_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific place.
        
        Args:
            place_id: MapMyIndia place ID (eLoc)
            
        Returns:
            Detailed place information
        """
        if not self.enabled:
            log.debug("MapMyIndia client not enabled")
            return {}
            
        try:
            params = {'place_id': place_id}
            
            resp = self._send('GET', '/api/places/detail', params=params)
            resp.raise_for_status()
            
            data = resp.json()
            log.info(f"Retrieved details for place: {place_id}")
            return data
            
        except Exception as e:
            log.error(f"Failed to get details for place {place_id}: {e}")
            return {}
