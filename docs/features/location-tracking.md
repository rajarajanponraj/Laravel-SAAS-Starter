# Location Tracking & Dispatch Map

## Overview
The **Location Tracking & Dispatch Map** module provides real-time GPS telemetry and field service dispatch coordination with strict multi-tenant workspace isolation.

It allows field technicians on mobile devices to easily transmit location updates (check-ins, en-route telemetry, and on-site job presence), while dispatchers, managers, and owners can monitor team distribution and active job sites on an interactive dispatch map.

---

## Architectural Principles

1. **Strict Workspace Isolation**:
   - All location pings are stored with a foreign key to `workspace_id` in `worker_locations`.
   - Technicians in Workspace A can never be viewed or tracked by members of Workspace B.
   - All queries filter by the authenticated user's active workspace.

2. **Battery & Telemetry Friendly**:
   - Location pings capture latitude, longitude, accuracy (in meters), heading, speed, battery percentage, and activity type (`on_shift`, `en_route`, `on_site`, `idle`, `completed_job`).
   - Browser Geolocation API uses optimal accuracy timeouts and graceful fallbacks.

3. **Mapped Service Locations & Job Sites**:
   - `service_locations` table includes optional `latitude` and `longitude` fields.
   - The dispatch map plots both active technicians and customer job sites, allowing dispatchers to spot nearby technicians for urgent calls.

4. **Zero-API-Key Interactive Mapping**:
   - Built on OpenStreetMap tiles via dynamic Leaflet rendering with custom interactive pins, pulsing activity beacons, and historical breadcrumb route polylines.

---

## Database Schema

### `worker_locations` Table
- `id`: Primary key
- `workspace_id`: Foreign key `workspaces(id)` cascade on delete
- `user_id`: Foreign key `users(id)` cascade on delete
- `work_order_id`: Nullable foreign key `work_orders(id)` null on delete
- `latitude`: `decimal(10, 7)`
- `longitude`: `decimal(10, 7)`
- `accuracy`: Float (in meters)
- `heading`: Float (degrees 0–360)
- `speed`: Float (m/s)
- `battery_level`: Unsigned tinyint (0–100%)
- `activity_type`: String (default `on_shift`)
- `captured_at`: Timestamp
- `timestamps`

---

## Key Endpoints

| Method | Endpoint | Description | Access Control |
|---|---|---|---|
| `GET` | `/locations/map` | Renders the Dispatch Map view | Workspace Member |
| `POST` | `/locations/ping` | Records a GPS telemetry ping | Workspace Member |
| `GET` | `/locations/live` | JSON endpoint for live polling | Workspace Member |
| `GET` | `/locations/history/{user}` | Historical breadcrumb coordinates | Owner/Admin or self |

---

## Testing
Comprehensive automated tests are located at [`tests/Feature/WorkerLocationTest.php`](file:///c:/Users/raja/Music/crm/tests/Feature/WorkerLocationTest.php):
- Workspace member location ping persistence with valid coordinates
- Cross-tenant multi-workspace isolation validation
- Strict boundary validation (-90 to 90 lat, -180 to 180 lng)
- Foreign workspace work order link rejection
- Dispatch map page rendering with service locations & active jobs
- Live JSON polling endpoint validation
- Technician historical breadcrumb route retrieval
