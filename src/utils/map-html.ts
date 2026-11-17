/**
 * FreshG / PresidentKu – Leaflet Map HTML Template Generator
 * Menghasilkan markup peta interaktif berbasis OpenStreetMap & Leaflet.js
 * dengan Marker Pengguna, Radius Geofence, Marker Kampus, dan Kontrol Kamera.
 */

export interface MapHtmlProps {
  userLocation: { latitude: number; longitude: number; accuracy?: number | null } | null;
  geofence: { latitude: number; longitude: number; radius: number; name: string };
  zoom?: number;
  isInsideGeofence?: boolean;
}

export function generateMapHtml({
  userLocation,
  geofence,
  zoom = 15,
  isInsideGeofence = false,
}: MapHtmlProps): string {
  const centerLat = userLocation ? userLocation.latitude : geofence.latitude;
  const centerLng = userLocation ? userLocation.longitude : geofence.longitude;
  const hasUser = !!userLocation;

  const userLat = userLocation?.latitude ?? 0;
  const userLng = userLocation?.longitude ?? 0;
  const userAccuracy = userLocation?.accuracy ?? 10;

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #eef2f6; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    
    /* User pulsing marker */
    .user-pulse-marker {
      position: relative;
      width: 22px;
      height: 22px;
    }
    .user-pulse-dot {
      width: 14px;
      height: 14px;
      background: #0284c7;
      border: 3px solid #ffffff;
      border-radius: 50%;
      position: absolute;
      top: 4px;
      left: 4px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      z-index: 2;
    }
    .user-pulse-ring {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(2, 132, 199, 0.35);
      position: absolute;
      top: -2px;
      left: -2px;
      animation: pulse 2s infinite ease-out;
      z-index: 1;
    }
    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    /* Target Campus Marker */
    .campus-marker {
      background: #dc2626;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.35);
      border: 2px solid #fff;
    }
    .campus-marker-inner {
      transform: rotate(45deg);
      font-size: 15px;
      line-height: 1;
    }

    /* Leaflet popup styling */
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
      padding: 2px 6px;
    }
    .popup-title {
      font-size: 13px;
      font-weight: 700;
      color: #0b1c30;
      margin-bottom: 2px;
    }
    .popup-sub {
      font-size: 11px;
      color: #64748b;
    }
    .popup-badge {
      display: inline-block;
      margin-top: 4px;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
    }
    .popup-badge.inside { background: #dcfce7; color: #166534; }
    .popup-badge.outside { background: #ffedd5; color: #9a3412; }
  </style>
</head>
<body>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function() {
      var map = L.map('map', {
        zoomControl: false,
        attributionControl: false
      }).setView([${centerLat}, ${centerLng}], ${zoom});

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Geofence Circle
      var geofenceCircle = L.circle([${geofence.latitude}, ${geofence.longitude}], {
        color: '${isInsideGeofence ? '#10b981' : '#6366f1'}',
        fillColor: '${isInsideGeofence ? '#34d399' : '#818cf8'}',
        fillOpacity: 0.18,
        weight: 2,
        dashArray: '6, 6',
        radius: ${geofence.radius}
      }).addTo(map);

      // Campus Center Marker
      var campusIcon = L.divIcon({
        className: 'custom-campus-icon',
        html: '<div class="campus-marker"><div class="campus-marker-inner">🏫</div></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -30]
      });

      var campusMarker = L.marker([${geofence.latitude}, ${geofence.longitude}], { icon: campusIcon }).addTo(map);
      campusMarker.bindPopup(
        '<div class="popup-title">${geofence.name}</div>' +
        '<div class="popup-sub">Radius: ${geofence.radius} meter</div>'
      );

      // User Marker
      var userMarker = null;
      var userAccuracyCircle = null;

      if (${hasUser}) {
        var userIcon = L.divIcon({
          className: 'custom-user-icon',
          html: '<div class="user-pulse-marker"><div class="user-pulse-ring"></div><div class="user-pulse-dot"></div></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          popupAnchor: [0, -12]
        });

        userMarker = L.marker([${userLat}, ${userLng}], { icon: userIcon }).addTo(map);
        userMarker.bindPopup(
          '<div class="popup-title">📍 Lokasi Saya</div>' +
          '<div class="popup-sub">Lat: ${userLat.toFixed(5)}, Lng: ${userLng.toFixed(5)}</div>' +
          '<div class="popup-badge ${isInsideGeofence ? 'inside' : 'outside'}">' +
          '${isInsideGeofence ? '✅ Di Dalam Geofence' : '⚠️ Di Luar Geofence'}' +
          '</div>'
        );

        // Accuracy aura
        userAccuracyCircle = L.circle([${userLat}, ${userLng}], {
          radius: ${userAccuracy},
          color: '#38bdf8',
          fillColor: '#38bdf8',
          fillOpacity: 0.15,
          weight: 1
        }).addTo(map);
      }

      // Handle message events from React Native
      window.addEventListener('message', function(event) {
        try {
          var payload = JSON.parse(event.data);
          if (payload.action === 'centerUser' && payload.lat && payload.lng) {
            map.flyTo([payload.lat, payload.lng], 16, { animate: true, duration: 1 });
            if (userMarker) userMarker.openPopup();
          } else if (payload.action === 'centerCampus') {
            map.flyTo([${geofence.latitude}, ${geofence.longitude}], 15, { animate: true, duration: 1 });
            campusMarker.openPopup();
          } else if (payload.action === 'zoomIn') {
            map.zoomIn();
          } else if (payload.action === 'zoomOut') {
            map.zoomOut();
          }
        } catch(e) {}
      });
    })();
  </script>
</body>
</html>
  `;
}

