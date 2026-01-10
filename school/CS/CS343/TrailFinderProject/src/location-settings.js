// Location Settings Management

document.addEventListener('DOMContentLoaded', function() {
    const locationToggle = document.getElementById('useCurrentLocation');
    const locationStatus = document.getElementById('locationStatus');
    const locationStatusText = document.getElementById('locationStatusText');

    // Load saved location preference
    const savedLocationPref = localStorage.getItem('useCurrentLocation');
    if (savedLocationPref !== null) {
        locationToggle.checked = savedLocationPref === 'true';
        updateLocationStatus(locationToggle.checked);
    }

    // Handle toggle change
    locationToggle.addEventListener('change', function() {
        const useLocation = this.checked;
        
        if (useLocation) {
            // Request location permission
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async function(position) {
                        // Success - save location preference
                        localStorage.setItem('useCurrentLocation', 'true');
                        localStorage.setItem('userLatitude', position.coords.latitude);
                        localStorage.setItem('userLongitude', position.coords.longitude);
                        
                        // Also save in the format expected by other pages
                        const locationData = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };
                        localStorage.setItem('userLocation', JSON.stringify(locationData));
                        
                        // Fetch and save the location name
                        try {
                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
                            );
                            
                            if (response.ok) {
                                const data = await response.json();
                                const address = data.address;
                                const city = address.city || address.town || address.village || address.county || 'Unknown';
                                const state = address.state || 'Unknown';
                                const locationName = `${city}, ${state}`;
                                localStorage.setItem('userLocationName', locationName);
                                updateLocationStatus(true, `Location enabled: ${locationName}`);
                            } else {
                                updateLocationStatus(true, `Location enabled: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
                            }
                        } catch (error) {
                            console.error('Error fetching location name:', error);
                            updateLocationStatus(true, `Location enabled: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
                        }
                    },
                    function(error) {
                        // Error - disable the toggle
                        locationToggle.checked = false;
                        localStorage.setItem('useCurrentLocation', 'false');
                        let errorMessage = 'Location access denied or unavailable.';
                        if (error.code === error.PERMISSION_DENIED) {
                            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                        }
                        updateLocationStatus(false, errorMessage, true);
                    }
                );
            } else {
                // Geolocation not supported
                locationToggle.checked = false;
                localStorage.setItem('useCurrentLocation', 'false');
                updateLocationStatus(false, 'Geolocation is not supported by your browser.', true);
            }
        } else {
            // Disable location
            localStorage.setItem('useCurrentLocation', 'false');
            localStorage.removeItem('userLatitude');
            localStorage.removeItem('userLongitude');
            localStorage.removeItem('userLocation');
            localStorage.removeItem('userLocationName');
            updateLocationStatus(false, 'Current location disabled.');
        }
    });

    function updateLocationStatus(isEnabled, message = '', isError = false) {
        if (message) {
            locationStatus.style.display = 'block';
            locationStatusText.textContent = message;
            
            // Update alert styling
            locationStatus.className = 'alert';
            if (isError) {
                locationStatus.classList.add('alert-danger');
            } else if (isEnabled) {
                locationStatus.classList.add('alert-success');
            } else {
                locationStatus.classList.add('alert-info');
            }
        } else {
            // Just show current state without specific message
            if (isEnabled) {
                locationStatus.style.display = 'block';
                locationStatus.className = 'alert alert-success';
                locationStatusText.textContent = 'Current location is enabled.';
            } else {
                locationStatus.style.display = 'none';
            }
        }
    }
});
