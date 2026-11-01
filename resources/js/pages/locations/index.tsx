import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Activity,
    AlertCircle,
    Battery,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Compass,
    ExternalLink,
    HardHat,
    Loader2,
    MapPin,
    Navigation,
    Radio,
    RefreshCw,
    Search,
    Shield,
    Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface WorkerUser {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
}

interface AssociatedWorkOrder {
    id: number;
    order_number: string;
    title: string;
    status: string;
}

interface WorkerLocationItem {
    id: number;
    workspace_id: number;
    user_id: number;
    work_order_id: number | null;
    latitude: number;
    longitude: number;
    accuracy: number | null;
    heading: number | null;
    speed: number | null;
    battery_level: number | null;
    activity_type: string;
    captured_at: string;
    user?: WorkerUser;
    work_order?: AssociatedWorkOrder;
}

interface ServiceLocationItem {
    id: number;
    customer_id: number;
    name: string;
    address_line1: string;
    city: string;
    state: string | null;
    postal_code: string | null;
    latitude: number;
    longitude: number;
    access_notes: string | null;
    customer?: {
        id: number;
        name: string;
    };
}

interface ActiveWorkOrderItem {
    id: number;
    order_number: string;
    title: string;
    status: string;
    customer: {
        id: number;
        name: string;
        phone: string | null;
    };
    service_location: {
        id: number;
        name: string;
        address_line1: string;
        city: string;
        state: string | null;
        latitude: number | null;
        longitude: number | null;
    } | null;
    assigned_worker: {
        id: number;
        name: string;
        avatar_url: string | null;
    } | null;
}

interface Props {
    workspace: {
        id: number;
        name: string;
        slug: string;
    };
    latestLocations: WorkerLocationItem[];
    serviceLocations: ServiceLocationItem[];
    activeWorkOrders: ActiveWorkOrderItem[];
    teamMembers: WorkerUser[];
    selectedWorkerId: number | null;
    selectedWorkerTrail: WorkerLocationItem[];
    canManage: boolean;
    userRole: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Live Map', href: '/locations/map' },
];

export default function DispatchMapPage({
    workspace,
    latestLocations: initialLocations,
    serviceLocations,
    activeWorkOrders,
    teamMembers,
    selectedWorkerId: initialSelectedWorkerId,
    selectedWorkerTrail,
    canManage,
    userRole,
}: Props) {
    const [locations, setLocations] = useState<WorkerLocationItem[]>(initialLocations);
    const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(initialSelectedWorkerId);
    const [searchQuery, setSearchQuery] = useState('');
    const [activityFilter, setActivityFilter] = useState<string>('all');
    const [isLivePolling, setIsLivePolling] = useState(true);
    const [isSharingLocation, setIsSharingLocation] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
    const [leafletReady, setLeafletReady] = useState(false);

    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersLayerRef = useRef<any>(null);
    const trailLayerRef = useRef<any>(null);

    // Dynamically inject Leaflet CSS & JS without bloating package.json
    useEffect(() => {
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        if (!(window as any).L && !document.getElementById('leaflet-js')) {
            const script = document.createElement('script');
            script.id = 'leaflet-js';
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            script.onload = () => setLeafletReady(true);
            document.head.appendChild(script);
        } else if ((window as any).L) {
            setLeafletReady(true);
        }
    }, []);

    // Periodic live polling for coordinates
    useEffect(() => {
        if (!isLivePolling) return;

        const interval = setInterval(async () => {
            try {
                const response = await axios.get('/locations/live');
                if (response.data && response.data.locations) {
                    setLocations(response.data.locations);
                    setLastSyncTime(new Date());
                }
            } catch (err) {
                console.error('Failed to poll live locations', err);
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [isLivePolling]);

    // Initialize Leaflet Map
    useEffect(() => {
        if (!leafletReady || !mapContainerRef.current) return;
        const L = (window as any).L;
        if (!L) return;

        if (!mapInstanceRef.current) {
            // Default center: First location, or first service location, or default US center
            let defaultCenter: [number, number] = [37.7749, -122.4194];
            if (locations.length > 0) {
                defaultCenter = [locations[0].latitude, locations[0].longitude];
            } else if (serviceLocations.length > 0) {
                defaultCenter = [serviceLocations[0].latitude, serviceLocations[0].longitude];
            }

            const map = L.map(mapContainerRef.current).setView(defaultCenter, 12);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);

            markersLayerRef.current = L.layerGroup().addTo(map);
            trailLayerRef.current = L.layerGroup().addTo(map);
            mapInstanceRef.current = map;
        }

        renderMapMarkers();
    }, [leafletReady, locations, serviceLocations, selectedWorkerId]);

    // Render Markers & Trails on the Map
    const renderMapMarkers = () => {
        const L = (window as any).L;
        if (!L || !mapInstanceRef.current || !markersLayerRef.current) return;

        markersLayerRef.current.clearLayers();
        trailLayerRef.current.clearLayers();

        const bounds = L.latLngBounds([]);

        // 1. Plot Service Locations (Orange / Red Map Pins)
        serviceLocations.forEach((loc) => {
            if (!loc.latitude || !loc.longitude) return;

            const markerHtml = `
                <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-orange-600 text-white shadow-lg border-2 border-white ring-2 ring-orange-400/50 cursor-pointer hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
            `;

            const icon = L.divIcon({
                html: markerHtml,
                className: 'custom-service-pin',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32],
            });

            const marker = L.marker([loc.latitude, loc.longitude], { icon })
                .bindPopup(`
                    <div class="text-sm p-1">
                        <div class="font-bold text-gray-900">${loc.name}</div>
                        <div class="text-xs text-gray-600">${loc.customer ? loc.customer.name : 'Job Site'}</div>
                        <div class="text-xs text-gray-500 mt-1">${loc.address_line1}, ${loc.city}</div>
                    </div>
                `);

            markersLayerRef.current.addLayer(marker);
            bounds.extend([loc.latitude, loc.longitude]);
        });

        // 2. Plot Technicians (Blue / Green Pulsing Pointers)
        locations.forEach((loc) => {
            const userName = loc.user?.name || 'Technician';
            const initials = userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

            const isSelected = selectedWorkerId === loc.user_id;
            const activityColor =
                loc.activity_type === 'on_site'
                    ? 'bg-emerald-600 ring-emerald-400'
                    : loc.activity_type === 'en_route'
                    ? 'bg-blue-600 ring-blue-400'
                    : loc.activity_type === 'idle'
                    ? 'bg-amber-600 ring-amber-400'
                    : 'bg-indigo-600 ring-indigo-400';

            const markerHtml = `
                <div class="relative flex items-center justify-center w-10 h-10 rounded-full ${activityColor} text-white font-bold text-xs shadow-xl border-2 border-white ring-4 ${
                isSelected ? 'scale-125 ring-primary' : 'ring-opacity-40'
            } cursor-pointer transition-transform">
                    <span class="absolute -top-1 -right-1 flex h-3 w-3">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    ${initials}
                </div>
            `;

            const icon = L.divIcon({
                html: markerHtml,
                className: 'custom-tech-pin',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                popupAnchor: [0, -20],
            });

            const marker = L.marker([loc.latitude, loc.longitude], { icon })
                .bindPopup(`
                    <div class="text-sm p-1">
                        <div class="font-bold text-gray-900">${userName}</div>
                        <div class="text-xs text-gray-600">Status: <span class="capitalize font-semibold">${loc.activity_type.replace('_', ' ')}</span></div>
                        ${loc.work_order ? `<div class="text-xs text-blue-600 mt-1 font-mono">${loc.work_order.order_number}: ${loc.work_order.title}</div>` : ''}
                        <div class="text-[11px] text-gray-500 mt-1">Battery: ${loc.battery_level !== null ? loc.battery_level + '%' : 'N/A'} | Accuracy: &plusmn;${Math.round(loc.accuracy || 0)}m</div>
                    </div>
                `);

            markersLayerRef.current.addLayer(marker);
            bounds.extend([loc.latitude, loc.longitude]);
        });

        // 3. Draw Trail Polyline if selected
        if (selectedWorkerTrail && selectedWorkerTrail.length > 1) {
            const trailCoords = selectedWorkerTrail.map((p) => [p.latitude, p.longitude]);
            const polyline = L.polyline(trailCoords, {
                color: '#3b82f6',
                weight: 4,
                opacity: 0.75,
                dashArray: '6, 8',
            });
            trailLayerRef.current.addLayer(polyline);
        }

        // Fit map bounds if points exist
        if (bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    };

    // Filtered technicians list
    const filteredWorkers = useMemo(() => {
        return teamMembers.filter((member) => {
            const matchesSearch =
                member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.email.toLowerCase().includes(searchQuery.toLowerCase());

            const loc = locations.find((l) => l.user_id === member.id);
            const matchesActivity =
                activityFilter === 'all' || (loc && loc.activity_type === activityFilter);

            return matchesSearch && matchesActivity;
        });
    }, [teamMembers, locations, searchQuery, activityFilter]);

    // Handle Quick Check-In / Share My Location
    const handleShareLocation = async () => {
        if (!navigator.geolocation) {
            setStatusMessage('Geolocation is not supported by your browser.');
            return;
        }

        setIsSharingLocation(true);
        setStatusMessage('Acquiring high-accuracy GPS coordinates...');

        // Try getting battery level if supported
        let batteryLevel: number | null = null;
        try {
            if ('getBattery' in navigator) {
                const battery: any = await (navigator as any).getBattery();
                batteryLevel = Math.round(battery.level * 100);
            }
        } catch {
            // Battery API optional
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const payload = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        battery_level: batteryLevel,
                        activity_type: 'on_shift',
                    };

                    const res = await axios.post('/locations/ping', payload);

                    if (res.data && res.data.location) {
                        setLocations((prev) => {
                            const withoutCurrent = prev.filter(
                                (l) => l.user_id !== res.data.location.user_id,
                            );
                            return [res.data.location, ...withoutCurrent];
                        });
                    }

                    setStatusMessage('Location shared successfully! Respective workspace updated.');
                    setTimeout(() => setStatusMessage(null), 4000);
                } catch (err: any) {
                    setStatusMessage(
                        err.response?.data?.message || 'Failed to save location ping to workspace.',
                    );
                } finally {
                    setIsSharingLocation(false);
                }
            },
            (error) => {
                setIsSharingLocation(false);
                setStatusMessage(`GPS error: ${error.message}`);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
    };

    // Focus on technician on the map
    const focusWorker = (userId: number) => {
        setSelectedWorkerId(userId);
        router.get(
            '/locations/map',
            { worker_id: userId },
            { preserveState: true, preserveScroll: true },
        );

        const loc = locations.find((l) => l.user_id === userId);
        if (loc && mapInstanceRef.current) {
            mapInstanceRef.current.setView([loc.latitude, loc.longitude], 15, { animate: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Live Map & Location Tracking - ${workspace.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                {/* Header & Workspace Indicator */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Location Tracking & Dispatch Map
                            </h1>
                            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs">
                                <Shield className="mr-1 h-3 w-3" />
                                {workspace.name} Scoped
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Real-time GPS tracking and live field service coordination for {workspace.name}.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsLivePolling((prev) => !prev)}
                            className="gap-1.5"
                        >
                            <Radio
                                className={`h-4 w-4 ${isLivePolling ? 'animate-pulse text-emerald-500' : 'text-muted-foreground'}`}
                            />
                            {isLivePolling ? 'Live Polling Active' : 'Polling Paused'}
                        </Button>

                        <Button
                            variant="default"
                            size="sm"
                            disabled={isSharingLocation}
                            onClick={handleShareLocation}
                            className="gap-1.5 shadow-sm"
                        >
                            {isSharingLocation ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Navigation className="h-4 w-4" />
                            )}
                            Share My Location
                        </Button>
                    </div>
                </div>

                {/* Status banner */}
                {statusMessage && (
                    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm text-primary">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 animate-spin" />
                            <span>{statusMessage}</span>
                        </div>
                        <button
                            onClick={() => setStatusMessage(null)}
                            className="text-xs font-semibold hover:underline"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Quick Metric Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                                Active Techs on Map
                            </CardTitle>
                            <Users className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{locations.length}</div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                of {teamMembers.length} team members registered
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                                On-Site / En Route
                            </CardTitle>
                            <HardHat className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {
                                    locations.filter(
                                        (l) => l.activity_type === 'on_site' || l.activity_type === 'en_route',
                                    ).length
                                }
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                actively assigned or en route to jobs
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                                Mapped Job Sites
                            </CardTitle>
                            <Building2 className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{serviceLocations.length}</div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                locations with GPS coordinates
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                                Last Telemetry Sync
                            </CardTitle>
                            <Clock className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">
                                {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                workspace tenant isolation active
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Split View: Left Map, Right Sidebar */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Map Canvas (2 Columns on large screens) */}
                    <Card className="lg:col-span-2 overflow-hidden border-border/50 shadow-sm flex flex-col">
                        <CardHeader className="p-4 border-b border-border/40 flex flex-row items-center justify-between bg-muted/20">
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    Live Dispatch Overview
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Displays technician positions and service location pins in {workspace.name}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                                    En Route
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
                                    On Site
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-600"></span>
                                    Job Site
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 relative flex-1 min-h-[500px]">
                            {/* Map Container */}
                            <div ref={mapContainerRef} className="h-full w-full min-h-[500px] z-0" />

                            {!leafletReady && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 p-6 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                    <p className="text-sm font-medium">Initializing OpenStreetMap Tiles...</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Loading map coordinates for workspace technicians.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Directory: Technicians & Jobs */}
                    <div className="flex flex-col gap-4">
                        {/* Technicians List Card */}
                        <Card className="border-border/50 shadow-sm flex-1">
                            <CardHeader className="p-4 border-b border-border/40 pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <HardHat className="h-4 w-4 text-primary" />
                                        Technicians ({filteredWorkers.length})
                                    </CardTitle>
                                    <select
                                        value={activityFilter}
                                        onChange={(e) => setActivityFilter(e.target.value)}
                                        className="h-7 text-xs rounded border border-border bg-background px-2"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="on_site">On Site</option>
                                        <option value="en_route">En Route</option>
                                        <option value="on_shift">On Shift</option>
                                        <option value="idle">Idle</option>
                                    </select>
                                </div>
                                <div className="relative mt-2">
                                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search technician..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-8 pl-8 text-xs"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-2 max-h-[340px] overflow-y-auto divide-y divide-border/30">
                                {filteredWorkers.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-muted-foreground">
                                        No technicians found matching criteria.
                                    </div>
                                ) : (
                                    filteredWorkers.map((member) => {
                                        const loc = locations.find((l) => l.user_id === member.id);
                                        const isSelected = selectedWorkerId === member.id;

                                        return (
                                            <div
                                                key={member.id}
                                                onClick={() => focusWorker(member.id)}
                                                className={`p-2.5 rounded-md cursor-pointer transition-colors flex items-start justify-between gap-2 hover:bg-muted/50 ${
                                                    isSelected ? 'bg-primary/10 border border-primary/30' : ''
                                                }`}
                                            >
                                                <div className="flex items-start gap-2.5 min-w-0">
                                                    <div className="relative mt-0.5 flex-shrink-0">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-border">
                                                            {member.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        {loc && (
                                                            <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full ring-2 ring-background bg-emerald-500" />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-xs text-foreground truncate">
                                                            {member.name}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground truncate">
                                                            {member.email}
                                                        </div>

                                                        {loc?.work_order && (
                                                            <div className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium truncate">
                                                                <HardHat className="h-3 w-3 flex-shrink-0" />
                                                                <span className="truncate">
                                                                    {loc.work_order.order_number}: {loc.work_order.title}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                                                    {loc ? (
                                                        <>
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-[10px] capitalize px-1.5 py-0 ${
                                                                    loc.activity_type === 'on_site'
                                                                        ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                                                                        : loc.activity_type === 'en_route'
                                                                        ? 'border-blue-500/30 text-blue-600 bg-blue-500/10'
                                                                        : 'border-muted text-muted-foreground'
                                                                }`}
                                                            >
                                                                {loc.activity_type.replace('_', ' ')}
                                                            </Badge>

                                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                {loc.battery_level !== null && (
                                                                    <span className="flex items-center">
                                                                        <Battery className="h-3 w-3 mr-0.5 text-muted-foreground" />
                                                                        {loc.battery_level}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                                            No Signal
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>

                        {/* Active Work Orders Card */}
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="p-4 border-b border-border/40 pb-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-orange-500" />
                                    Active Dispatches ({activeWorkOrders.length})
                                </CardTitle>
                                <Link
                                    href="/work-orders"
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    View All <ExternalLink className="h-3 w-3" />
                                </Link>
                            </CardHeader>
                            <CardContent className="p-2 max-h-[220px] overflow-y-auto divide-y divide-border/30">
                                {activeWorkOrders.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-muted-foreground">
                                        No active work orders dispatched currently.
                                    </div>
                                ) : (
                                    activeWorkOrders.map((order) => (
                                        <div key={order.id} className="p-2.5 hover:bg-muted/30 rounded text-xs">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-mono font-bold text-primary">
                                                    {order.order_number}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {order.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="font-medium text-foreground truncate">
                                                {order.title}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                                Customer: {order.customer.name}
                                            </div>
                                            {order.service_location && (
                                                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {order.service_location.address_line1}, {order.service_location.city}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
