import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, useMap, Circle, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Leaflet icon fix for Vite ───────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ── District registry ───────────────────────────────────────────────────────
const DISTRICTS = {
    kashipur: { name: 'Kashipur', district: 'Udham Singh Nagar', coords: [29.2115, 78.9629], zoom: 13, block: 'Jaspur Block' },
    udhamsinghnagar: { name: 'Udham Singh Nagar', district: 'Udham Singh Nagar', coords: [29.0, 79.1], zoom: 10, block: 'Kichha Block' },
    dehradun: { name: 'Dehradun', district: 'Dehradun', coords: [30.3165, 78.0322], zoom: 12, block: 'Doiwala Block' },
    haridwar: { name: 'Haridwar', district: 'Haridwar', coords: [29.9457, 78.1642], zoom: 12, block: 'Roorkee Block' },
    nainital: { name: 'Nainital', district: 'Nainital', coords: [29.3919, 79.4542], zoom: 11, block: 'Bhimtal Block' },
    almora: { name: 'Almora', district: 'Almora', coords: [29.5972, 79.6593], zoom: 12, block: 'Hawalbagh Block' },
    chamoli: { name: 'Chamoli', district: 'Chamoli', coords: [30.40, 79.33], zoom: 11, block: 'Joshimath Block' },
    pithoragarh: { name: 'Pithoragarh', district: 'Pithoragarh', coords: [29.58, 80.21], zoom: 12, block: 'Munsiari Block' },
    haldwani: { name: 'Haldwani', district: 'Nainital', coords: [29.2189, 79.5130], zoom: 13, block: 'Haldwani Block' },
}

// Timeline (ms) — faster, tighter 2–3 s feel
const TIMELINE = [
    { delay: 150, key: 'mapReady' },
    { delay: 700, key: 'stage1' },  // India view starts
    { delay: 1500, key: 'stage2' },  // Fly → Uttarakhand (~2 s)
    { delay: 4200, key: 'stage3' },  // Fly → district    (~2 s)
    { delay: 6400, key: 'marker' },
    { delay: 6900, key: 'panel' },
    { delay: 9800, key: 'exit' },
    { delay: 10500, key: 'done' },
]

// ── Map animation controller ────────────────────────────────────────────────
function MapAnimator({ stage, district }) {
    const map = useMap()

    useEffect(() => {
        if (stage === 1) {
            map.setView([22.5, 80.5], 4, { animate: false })
        } else if (stage === 2) {
            map.flyTo([30.10, 79.20], 7.2, { animate: true, duration: 2.4, easeLinearity: 0.35 })
        } else if (stage === 3) {
            map.flyTo(district.coords, district.zoom, { animate: true, duration: 2.2, easeLinearity: 0.3 })
        }
    }, [stage, map, district])

    return null
}

// ── Professional SVG pin marker ─────────────────────────────────────────────
function createProfessionalPin(color = '#2563EB') {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
          <defs>
            <filter id="pin-shadow" x="-40%" y="-20%" width="180%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.28)" />
            </filter>
          </defs>
          <!-- Pin body -->
          <path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 32 12 32S28 21 28 12C28 5.37 22.63 0 16 0z"
                fill="${color}" filter="url(#pin-shadow)" />
          <!-- White inner circle -->
          <circle cx="16" cy="12" r="5.5" fill="white" />
          <!-- Coloured dot centre -->
          <circle cx="16" cy="12" r="3" fill="${color}" />
        </svg>`
    return L.divIcon({
        className: '',
        html: `<div class="gov-pin-wrapper">${svg}</div>`,
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -46],
    })
}

// ── Main component ──────────────────────────────────────────────────────────
export default function AdminLoginSuccess({ adminName, adminDistrict = 'kashipur', onComplete }) {
    const [flags, setFlags] = useState({
        mapReady: false, stage1: false, stage2: false,
        stage3: false, marker: false, panel: false, exit: false,
    })

    const district = DISTRICTS[adminDistrict] || DISTRICTS.kashipur
    const stageNum = flags.stage3 ? 3 : flags.stage2 ? 2 : flags.stage1 ? 1 : 0

    // Current zoom label for breadcrumb
    const zoomLabel = stageNum >= 3
        ? `${district.district} District`
        : stageNum >= 2
            ? 'Uttarakhand, India'
            : 'India Overview'

    useEffect(() => {
        const timers = TIMELINE.map(({ delay, key }) =>
            setTimeout(() => {
                if (key === 'done') { onComplete && onComplete(); return }
                setFlags(f => ({ ...f, [key]: true }))
            }, delay)
        )
        return () => timers.forEach(clearTimeout)
    }, [onComplete])

    return (
        <div className={`gov-als-root ${flags.exit ? 'gov-als-exit' : ''}`}>

            {/* ── LEFT PANEL ─────────────────────────────────────── */}
            <aside className={`gov-als-panel ${flags.mapReady ? 'gov-als-panel-in' : ''}`}>

                {/* Branding */}
                <div className="gov-als-brand">
                    <div className="gov-als-emblem">
                        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="20" cy="20" r="19" stroke="#1e40af" strokeWidth="2" fill="#EEF2FF" />
                            <path d="M20 8 L24 16 H16 Z" fill="#1e40af" />
                            <rect x="14" y="17" width="12" height="10" rx="1" fill="#1e40af" opacity="0.7" />
                            <rect x="17" y="20" width="3" height="7" fill="#fff" />
                            <rect x="20" y="20" width="3" height="7" fill="#fff" opacity="0.6" />
                        </svg>
                    </div>
                    <div>
                        <div className="gov-als-brand-title">e-TaxPay</div>
                        <div className="gov-als-brand-sub">Uttarakhand Zila Panchayat</div>
                    </div>
                </div>

                <div className="gov-als-divider" />

                {/* Status + Welcome */}
                <div className="gov-als-status-row">
                    <span className="gov-als-status-pill">
                        <span className="gov-als-status-led" /> Authenticated
                    </span>
                </div>

                <div className="gov-als-welcome">
                    <p className="gov-als-welcome-label">Welcome back,</p>
                    <h2 className="gov-als-welcome-name">{adminName || 'Admin'}</h2>
                    <p className="gov-als-welcome-role">District Tax Administrator</p>
                </div>

                <div className="gov-als-divider" />

                {/* Navigation breadcrumb steps */}
                <div className="gov-als-steps">
                    <p className="gov-als-steps-heading">LOCATING YOUR ZONE</p>

                    <GovStep
                        num={1} label="India Overview"
                        sub="National level"
                        active={stageNum >= 1} done={stageNum >= 2}
                    />
                    <div className="gov-als-step-connector" />
                    <GovStep
                        num={2} label="Uttarakhand"
                        sub="State level"
                        active={stageNum >= 2} done={stageNum >= 3}
                    />
                    <div className="gov-als-step-connector" />
                    <GovStep
                        num={3} label={district.name}
                        sub={district.district}
                        active={stageNum >= 3} done={flags.marker}
                    />
                </div>

                <div className="gov-als-divider" />

                {/* District info card — slides in after marker */}
                <div className={`gov-als-district-card ${flags.panel ? 'gov-als-district-card-in' : ''}`}>
                    <div className="gov-als-dc-header">
                        <svg className="gov-als-dc-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span>Assigned Jurisdiction</span>
                    </div>
                    <div className="gov-als-dc-body">
                        <div className="gov-als-dc-row">
                            <span className="gov-als-dc-key">District</span>
                            <span className="gov-als-dc-val">{district.district}</span>
                        </div>
                        <div className="gov-als-dc-row">
                            <span className="gov-als-dc-key">City</span>
                            <span className="gov-als-dc-val">{district.name}</span>
                        </div>
                        <div className="gov-als-dc-row">
                            <span className="gov-als-dc-key">Block</span>
                            <span className="gov-als-dc-val">{district.block}</span>
                        </div>
                        <div className="gov-als-dc-row">
                            <span className="gov-als-dc-key">State</span>
                            <span className="gov-als-dc-val">Uttarakhand</span>
                        </div>
                    </div>
                </div>

                {/* Skip */}
                <button className="gov-als-skip" onClick={() => onComplete && onComplete()}>
                    Skip to Dashboard →
                </button>
            </aside>

            {/* ── MAP AREA ────────────────────────────────────────── */}
            <main className="gov-als-map-area">

                {/* Top map toolbar */}
                <div className={`gov-als-toolbar ${flags.mapReady ? 'gov-als-toolbar-in' : ''}`}>
                    <div className="gov-als-breadcrumb">
                        <span className="gov-bcr-root">India</span>
                        {stageNum >= 2 && <><span className="gov-bcr-sep">›</span><span className="gov-bcr-item">Uttarakhand</span></>}
                        {stageNum >= 3 && <><span className="gov-bcr-sep">›</span><span className="gov-bcr-item gov-bcr-active">{district.district}</span></>}
                    </div>
                    <div className="gov-als-zoom-label">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        {zoomLabel}
                    </div>
                </div>

                {/* Leaflet map */}
                <div className={`gov-als-leaflet ${flags.mapReady ? 'gov-als-leaflet-in' : ''}`}>
                    {flags.mapReady && (
                        <MapContainer
                            center={[22.5, 80.5]}
                            zoom={4}
                            zoomControl={false}
                            scrollWheelZoom={false}
                            dragging={false}
                            doubleClickZoom={false}
                            keyboard={false}
                            touchZoom={false}
                            attributionControl={true}
                            style={{ height: '100%', width: '100%' }}
                        >
                            {/* CartoDB Voyager — professional, neutral, not dark */}
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                maxZoom={19}
                            />

                            <MapAnimator stage={stageNum} district={district} />

                            {flags.marker && (
                                <>
                                    {/* Outer glow ring — muted blue */}
                                    <Circle
                                        center={district.coords}
                                        radius={2800}
                                        pathOptions={{
                                            color: '#2563EB',
                                            fillColor: '#2563EB',
                                            fillOpacity: 0.08,
                                            weight: 1.5,
                                            opacity: 0.55,
                                        }}
                                        className="gov-circle-pulse"
                                    />
                                    {/* Middle boundary ring */}
                                    <Circle
                                        center={district.coords}
                                        radius={5500}
                                        pathOptions={{
                                            color: '#2563EB',
                                            fillColor: 'transparent',
                                            fillOpacity: 0,
                                            weight: 1,
                                            opacity: 0.25,
                                            dashArray: '5 6',
                                        }}
                                    />
                                    {/* Professional pin marker */}
                                    <Marker
                                        position={district.coords}
                                        icon={createProfessionalPin('#2563EB')}
                                    />
                                </>
                            )}
                        </MapContainer>
                    )}
                </div>

                {/* Bottom map credit bar */}
                <div className="gov-als-map-footer">
                    Government of Uttarakhand · Tax Administration System · {new Date().getFullYear()}
                </div>
            </main>
        </div>
    )
}

// ── Step sub-component ──────────────────────────────────────────────────────
function GovStep({ num, label, sub, active, done }) {
    return (
        <div className={`gov-als-step ${active ? 'gov-step-active' : ''} ${done ? 'gov-step-done' : ''}`}>
            <div className="gov-als-step-num">
                {done
                    ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 8 7 12 13 4" /></svg>
                    : num
                }
            </div>
            <div className="gov-als-step-text">
                <div className="gov-als-step-label">{label}</div>
                <div className="gov-als-step-sub">{sub}</div>
            </div>
        </div>
    )
}
