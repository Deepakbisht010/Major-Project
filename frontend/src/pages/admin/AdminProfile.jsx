import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiSave, FiX, FiCamera, FiShield, FiUser, FiMail, FiPhone, FiMapPin, FiLock } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function AdminProfile() {
    const { user, updateProfile } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '', email: '', mobile: '', district: '', photoUrl: ''
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setFetching(true);
            try {
                const res = await api.get('admin/profile');
                if (res.data.success && res.data.profile) {
                    const p = res.data.profile;
                    setFormData({ name: p.name || '', email: p.email || '', mobile: p.mobile || '', district: p.district || '', photoUrl: p.photoUrl || '' });
                    // Sync with AuthContext so Navbar avatar updates instantly
                    if (updateProfile) {
                        updateProfile({ username: p.name, photoUrl: p.photoUrl || '' });
                    }
                }
            } catch (err) {
                console.error('Failed to fetch admin profile:', err);
            } finally {
                setFetching(false);
            }
        };
        fetchProfile();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const uploadImage = async (file) => {
        try {
            const { supabase } = await import('../../lib/supabaseClient');
            const ext = file.name.split('.').pop();
            const filePath = `profiles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error } = await supabase.storage.from('complaints-docs').upload(filePath, file);
            if (error) throw error;
            const { data } = supabase.storage.from('complaints-docs').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (err) {
            console.error('Image upload failed:', err.message);
            return null;
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let photoUrl = formData.photoUrl;
            if (selectedFile) {
                const uploaded = await uploadImage(selectedFile);
                if (uploaded) photoUrl = uploaded;
            }
            const payload = { name: formData.name.trim(), email: formData.email, mobile: formData.mobile, photoUrl };
            const res = await api.put('admin/profile', payload);
            if (res.data.success) {
                const updated = res.data.profile;
                setFormData(f => ({ ...f, name: updated.name, email: updated.email, mobile: updated.mobile, photoUrl: updated.photoUrl }));
                // Update AuthContext + localStorage so Navbar avatar refreshes instantly
                if (updateProfile) updateProfile({ username: updated.name, photoUrl: updated.photoUrl });
                setIsEditing(false);
                setSelectedFile(null);
                setPreviewUrl(null);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            alert('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const cancelEdit = () => { setIsEditing(false); setSelectedFile(null); setPreviewUrl(null); };

    const avatarSrc = previewUrl || formData.photoUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'A')}&background=821D30&color=fff&size=160&bold=true&font-size=0.4`;

    const districtLabel = formData.district
        ? formData.district.charAt(0).toUpperCase() + formData.district.slice(1)
        : 'N/A';

    if (fetching) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #f1f5f9', borderTopColor: 'var(--color-maroon)', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading profile...</span>
            </div>
        );
    }

    return (
        <div style={{ padding: '32px 16px', maxWidth: 520, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>

            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-maroon)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiShield size={20} color="white" />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>Admin Profile</h2>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage your personal information</p>
                </div>
            </motion.div>

            {/* Saved banner */}
            <AnimatePresence>
                {saved && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ marginBottom: 16, padding: '12px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, color: '#16a34a', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        ✓ Profile updated successfully!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ background: 'white', borderRadius: 24, boxShadow: '0 4px 30px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>

                {/* Card Header Strip */}
                <div style={{ background: 'linear-gradient(135deg, #6b1427 0%, #821D30 60%, #a52438 100%)', padding: '36px 30px 70px', position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: -48, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
                        {/* Avatar */}
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <div
                                onClick={() => isEditing && fileInputRef.current?.click()}
                                style={{
                                    width: 96, height: 96, borderRadius: '50%',
                                    border: '4px solid white', overflow: 'hidden',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                    cursor: isEditing ? 'pointer' : 'default',
                                    position: 'relative'
                                }}>
                                <img src={avatarSrc} alt={formData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {isEditing && (
                                    <div style={{
                                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', gap: 2
                                    }}>
                                        <FiCamera size={22} />
                                        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Change</span>
                                    </div>
                                )}
                            </div>

                            {/* Edit toggle button */}
                            <button onClick={() => isEditing ? cancelEdit() : setIsEditing(true)}
                                style={{
                                    position: 'absolute', bottom: 0, right: -4,
                                    width: 30, height: 30, borderRadius: '50%',
                                    background: isEditing ? '#ef4444' : 'var(--color-saffron)',
                                    border: '2px solid white', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transition: 'background 0.2s'
                                }}
                                title={isEditing ? 'Cancel' : 'Edit Profile'}>
                                {isEditing ? <FiX size={14} color="white" /> : <FiEdit2 size={14} color="white" />}
                            </button>
                        </div>
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                    </div>
                </div>

                {/* Name & Badge */}
                <div style={{ paddingTop: 60, paddingBottom: 28, textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 700, color: '#1a202c' }}>
                        {formData.name || '—'}
                    </h3>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef3e2', color: '#b45309', borderRadius: 20, padding: '4px 14px', fontSize: '0.78rem', fontWeight: 600 }}>
                        <FiShield size={12} />
                        District Admin — {districtLabel}
                    </div>
                </div>

                {/* Divider */}
                <hr style={{ margin: '0 24px', border: 'none', borderTop: '1px solid #f1f5f9' }} />

                {/* Form Fields */}
                <form onSubmit={handleSave} style={{ padding: '24px 28px 28px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Full Name — editable */}
                        <ProfileField icon={<FiUser size={15} color={isEditing ? 'var(--color-maroon)' : '#94a3b8'} />} label="Full Name"
                            value={formData.name}
                            onChange={(v) => setFormData(f => ({ ...f, name: v }))}
                            readOnly={!isEditing} required />

                        {/* Email */}
                        <ProfileField icon={<FiMail size={15} color={isEditing ? 'var(--color-maroon)' : '#94a3b8'} />} label="Email Address"
                            value={formData.email}
                            onChange={(v) => setFormData(f => ({ ...f, email: v }))}
                            readOnly={!isEditing} type="email" />

                        {/* Mobile */}
                        <ProfileField icon={<FiPhone size={15} color={isEditing ? 'var(--color-maroon)' : '#94a3b8'} />} label="Mobile Number"
                            value={formData.mobile}
                            onChange={(v) => setFormData(f => ({ ...f, mobile: v.replace(/\D/g, '').slice(0, 10) }))}
                            readOnly={!isEditing} type="tel" pattern="[0-9]{10}" />

                        {/* District — always locked */}
                        <ProfileField icon={<FiMapPin size={15} color="#94a3b8" />} label="District" value={districtLabel} readOnly
                            badge={<span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}><FiLock size={11} /> Locked</span>} />
                    </div>

                    {/* Action Buttons */}
                    <AnimatePresence>
                        {isEditing && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                style={{ marginTop: 24, display: 'flex', gap: 12, overflow: 'hidden' }}>
                                <button type="button" onClick={cancelEdit}
                                    style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading}
                                    style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--color-maroon)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.8 : 1 }}>
                                    {loading
                                        ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                                        : <><FiSave size={16} /> Save Changes</>}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </motion.div>
        </div>
    );
}

function ProfileField({ icon, label, value, onChange, readOnly, type = 'text', pattern, badge }) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                {badge}
            </div>
            <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>{icon}</span>
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange?.(e.target.value)}
                    readOnly={readOnly}
                    pattern={pattern}
                    style={{
                        width: '100%', padding: '11px 14px 11px 40px',
                        borderRadius: 12, border: '1.5px solid',
                        borderColor: readOnly ? 'transparent' : '#cbd5e1',
                        background: readOnly ? '#f8fafc' : 'white',
                        color: readOnly ? '#64748b' : '#1a202c',
                        fontSize: '0.93rem', fontWeight: 500, outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box',
                        cursor: readOnly ? 'default' : 'text'
                    }}
                    onFocus={e => { if (!readOnly) { e.target.style.borderColor = 'var(--color-maroon)'; e.target.style.boxShadow = '0 0 0 3px rgba(130,29,48,0.1)'; } }}
                    onBlur={e => { e.target.style.borderColor = readOnly ? 'transparent' : '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
            </div>
        </div>
    );
}
