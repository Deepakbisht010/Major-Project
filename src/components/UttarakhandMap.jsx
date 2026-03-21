import uttarakhandMapImg from '../assets/uttarakhand-map.png'

export default function UttarakhandMap() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <img
                src={uttarakhandMapImg}
                alt="Uttarakhand District Map"
                style={{
                    width: '100%',
                    maxWidth: 560,
                    height: 'auto',
                    borderRadius: 16,
                    filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))',
                    objectFit: 'contain',
                }}
            />
        </div>
    )
}
