import { useEffect, useState } from 'react'  
import { MapContainer, TileLayer, useMap, Circle, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import logo from '../assets/logo.png'

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

const TIMELINE = [
    { delay: 150, key: 'mapReady' },
    { delay: 700, key: 'stage1' },
    { delay: 1500, key: 'stage2' },
    { delay: 4200, key: 'stage3' },
    { delay: 6400, key: 'marker' },
    { delay: 6900, key: 'panel' },
    { delay: 9800, key: 'exit' },
    { delay: 10500, key: 'done' },
]

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

function createProfessionalPin(color = '#2563EB') {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
          <defs><filter id="pin-shadow" x="-40%" y="-20%" width="180%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.28)" /></filter></defs>
          <path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 32 12 32S28 21 28 12C28 5.37 22.63 0 16 0z" fill="${color}" filter="url(#pin-shadow)" />
          <circle cx="16" cy="12" r="5.5" fill="white" /><circle cx="16" cy="12" r="3" fill="${color}" />
        </svg>`
    return L.divIcon({
        className: '',
        html: `<div class="gov-pin-wrapper">${svg}</div>`,
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -46],
    })
}

export default function AdminLoginSuccess({ adminName, adminDistrict = 'kashipur', onComplete }) {
    const [flags, setFlags] = useState({
        mapReady: false, stage1: false, stage2: false,
        stage3: false, marker: false, panel: false, exit: false,
    })

    const district = DISTRICTS[adminDistrict] || DISTRICTS.kashipur
    const stageNum = flags.stage3 ? 3 : flags.stage2 ? 2 : flags.stage1 ? 1 : 0
    const zoomLabel = stageNum >= 3 ? `${district.district} District` : stageNum >= 2 ? 'Uttarakhand, India' : 'India Overview'

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

            {/* Top Branding Section (Persistent) */}
            <div className={`gov-als-top-bar ${flags.mapReady ? 'gov-als-top-bar-in' : ''}`}>
                <div className="gov-als-brand">
                    <div className="gov-als-emblem">
                        <img src={logo} alt="e-TaxPay logo" />
                    </div>
                    <div>
                        <div className="gov-als-brand-title">e-TaxPay</div>
                        <div className="gov-als-brand-sub">Zila Panchayat, UK</div>
                    </div>
                </div>
                <div className="gov-als-status-pill">
                    <span className="gov-als-status-led" /> Authenticated
                </div>
            </div>

            <div className="gov-als-main-content">
                <main className="gov-als-map-area">
                    <div className={`gov-als-toolbar ${flags.mapReady ? 'gov-als-toolbar-in' : ''}`}>
                        <div className="gov-als-breadcrumb">
                            <span>INDIA</span>
                            {stageNum >= 2 && <><span className="gov-bcr-sep">›</span><span>UK</span></>}
                            {stageNum >= 3 && <><span className="gov-bcr-sep">›</span><span className="gov-bcr-active">{district.name}</span></>}
                        </div>
                        <div className="gov-als-zoom-label">{zoomLabel}</div>
                    </div>

                    <div className={`gov-als-leaflet ${flags.mapReady ? 'gov-als-leaflet-in' : ''}`}>
                        {flags.mapReady && (
                            <MapContainer center={[22.5, 80.5]} zoom={4} zoomControl={false} scrollWheelZoom={false} dragging={false} doubleClickZoom={false} keyboard={false} touchZoom={false} attributionControl={true} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OSM contributors' />
                                <MapAnimator stage={stageNum} district={district} />
                                {flags.marker && (
                                    <>
                                        <Circle center={district.coords} radius={2800} pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.08, weight: 1.5, opacity: 0.55 }} className="gov-circle-pulse" />
                                        <Marker position={district.coords} icon={createProfessionalPin('#2563EB')} />
                                    </>
                                )}
                            </MapContainer>
                        )}
                    </div>
                    <div className="gov-als-map-footer">e-TaxPay System · Secure Gateway</div>
                </main>

                <aside className={`gov-als-panel ${flags.mapReady ? 'gov-als-panel-in' : ''}`}>
                    <div className="gov-als-welcome">
                        <p className="gov-als-welcome-label">ADMIN PORTAL</p>
                        <h2 className="gov-als-welcome-name">Hello, {adminName || 'Admin'}</h2>
                        <p className="gov-als-welcome-role">{district.district} District Official</p>
                    </div>

                    <div className="gov-als-divider" />

                    <div className="gov-als-steps">
                        <p className="gov-als-steps-heading">VIRTUAL GEO-LOCATION SCAN</p>
                        <div className="gov-als-steps-list">
                            <GovStep num={1} label="India" active={stageNum >= 1} done={stageNum >= 2} />
                            <div className="gov-als-step-connector" />
                            <GovStep num={2} label="State" active={stageNum >= 2} done={stageNum >= 3} />
                            <div className="gov-als-step-connector" />
                            <GovStep num={3} label="Local" active={stageNum >= 3} done={flags.marker} />
                        </div>
                    </div>

                    <div className="gov-als-divider" />

                    <div className={`gov-als-district-card ${flags.panel ? 'gov-als-district-card-in' : ''}`}>
                        <div className="gov-als-dc-body">
                            <div className="gov-als-dc-row"><span className="gov-als-dc-key">Jurisdiction</span><span className="gov-als-dc-val">{district.name}</span></div>
                            <div className="gov-als-dc-row"><span className="gov-als-dc-key">Block Info</span><span className="gov-als-dc-val">{district.block}</span></div>
                        </div>
                    </div>

                    <button className="gov-als-skip" onClick={() => onComplete && onComplete()}>
                        Proceed to Dashboard →
                    </button>
                </aside>
            </div>

            <style>{`
                .gov-als-top-bar {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 70px;
                    background: white;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 40px;
                    z-index: 100;
                    transform: translateY(-100%);
                    transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .gov-als-top-bar-in { transform: translateY(0); }
                .gov-als-main-content {
                    width: 100%;
                    height: calc(100% - 70px);
                    margin-top: 70px;
                    display: flex;
                }
                .gov-als-emblem img { width: 40px; height: 40px; object-fit: contain; }
                
                @media (max-width: 768px) {
                    .gov-als-top-bar { padding: 0 20px; height: 60px; }
                    .gov-als-main-content { 
                        flex-direction: column; 
                        height: calc(100% - 60px);
                        margin-top: 60px;
                        overflow-y: auto;
                    }
                    .gov-als-brand-title { font-size: 1.1rem; }
                    .gov-als-brand-sub { font-size: 0.65rem; }
                    .gov-als-status-pill { font-size: 0.65rem; padding: 4px 10px; }
                    .gov-als-map-area { min-height: 40vh; height: 40vh; flex-shrink: 0; }
                    .gov-als-panel { height: auto; min-height: 60vh; flex-shrink: 0; }
                }
            `}</style>
        </div>
    )
}

function GovStep({ num, label, active, done }) {
    return (
        <div className={`gov-als-step ${active ? 'gov-step-active' : ''} ${done ? 'gov-step-done' : ''}`}>
            <div className="gov-als-step-num">{done ? '✓' : num}</div>
            <div className="gov-als-step-text"><div className="gov-als-step-label">{label}</div></div>
        </div>
    )
}
