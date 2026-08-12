// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { Form, Card, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaPhone, FaVenusMars, FaLock, FaSave, FaIdBadge, FaUserShield, FaCalendarAlt } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../api/axiosInstance';
import CustomToast from '../components/CustomToast';

const ProfilePage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phone_number: '',
        gender: ''
    });
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users/me');
            setProfile(response.data);
            setFormData({
                fullname: response.data.fullname || '',
                email: response.data.email || '',
                phone_number: response.data.phone_number || '',
                gender: response.data.gender || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast(<CustomToast type="error" message="Failed to load your profile." />);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!formData.fullname.trim()) {
            toast(<CustomToast type="error" message="Full name is required." />);
            return;
        }

        // Password change validation (only if the user is attempting one)
        const wantsPasswordChange = passwordForm.new_password || passwordForm.current_password || passwordForm.confirm_password;
        if (wantsPasswordChange) {
            if (!passwordForm.current_password) {
                toast(<CustomToast type="error" message="Enter your current password to change it." />);
                return;
            }
            if (passwordForm.new_password.length < 6) {
                toast(<CustomToast type="error" message="New password must be at least 6 characters." />);
                return;
            }
            if (passwordForm.new_password !== passwordForm.confirm_password) {
                toast(<CustomToast type="error" message="New passwords do not match." />);
                return;
            }
        }

        setSaving(true);
        try {
            const payload = { ...formData };
            if (wantsPasswordChange) {
                payload.current_password = passwordForm.current_password;
                payload.new_password = passwordForm.new_password;
            }
            const response = await api.put('/users/me', payload);
            setProfile(response.data);
            setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
            toast(<CustomToast type="success" message="Profile updated successfully!" />);
        } catch (error) {
            console.error('Error updating profile:', error);
            const msg = error.response?.data?.error || 'Failed to update profile.';
            toast(<CustomToast type="error" message={msg} />);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="staff-management-container">
                <div className="text-center" style={{ padding: '60px 0' }}>
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="staff-management-container">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="page-header">
                <h1>
                    <FaUser className="me-2" />
                    My Profile
                </h1>
                <p>View and update your personal information</p>
            </div>

            {/* Account summary card */}
            {profile && (
                <Card className="table-card mb-4">
                    <Card.Header className="card-header-custom">
                        <FaIdBadge className="me-2" />
                        Account Information
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={3} className="mb-2">
                                <strong>Username:</strong> {profile.username}
                            </Col>
                            <Col md={3} className="mb-2">
                                <strong>Role:</strong>{' '}
                                <Badge bg="info"><FaUserShield className="me-1" />{profile.role}</Badge>
                            </Col>
                            <Col md={3} className="mb-2">
                                <FaCalendarAlt className="me-1" />
                                <strong>Joined:</strong>{' '}
                                {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                            </Col>
                            <Col md={3} className="mb-2">
                                <strong>Last Updated:</strong>{' '}
                                {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Edit profile form */}
            <Card className="table-card">
                <Card.Header className="card-header-custom">
                    <FaUser className="me-2" />
                    Edit Profile
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSave}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label><FaUser className="me-1" /> Full Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="fullname"
                                        value={formData.fullname}
                                        onChange={handleProfileChange}
                                        required
                                        placeholder="Your full name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label><FaEnvelope className="me-1" /> Email Address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleProfileChange}
                                        placeholder="Your email address"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label><FaPhone className="me-1" /> Phone Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleProfileChange}
                                        placeholder="Your phone number"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label><FaVenusMars className="me-1" /> Gender</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleProfileChange}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr />
                        <h5 className="mb-3"><FaLock className="me-1" /> Change Password (optional)</h5>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Current Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="current_password"
                                        value={passwordForm.current_password}
                                        onChange={handlePasswordChange}
                                        placeholder="Current password"
                                        autoComplete="current-password"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>New Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="new_password"
                                        value={passwordForm.new_password}
                                        onChange={handlePasswordChange}
                                        placeholder="At least 6 characters"
                                        autoComplete="new-password"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Confirm New Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="confirm_password"
                                        value={passwordForm.confirm_password}
                                        onChange={handlePasswordChange}
                                        placeholder="Repeat new password"
                                        autoComplete="new-password"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Text className="text-muted d-block mb-3">
                            Leave the password fields empty if you do not want to change your password.
                        </Form.Text>

                        <button
                            type="submit"
                            className="ppb-btn"
                            style={{ background: 'var(--ppb-purple)', color: 'white' }}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FaSave className="me-1" /> Save Changes
                                </>
                            )}
                        </button>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ProfilePage;
