import uttarakhandMapImg from '../assets/uttarakhand-map.png'

export default function UttarakhandMap() {
    return (
        <div className="map-container reveal-scale" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <img
                src={uttarakhandMapImg}
                alt="Uttarakhand District Map"
                className="responsive-map-img"
            />
        </div>
    )
}
