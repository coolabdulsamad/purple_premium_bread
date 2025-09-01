import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimes } from 'react-icons/fa'; // Import icons
import '../assets/styles/admin.css'; // Ensure this CSS file exists and is styled appropriately

const API_BASE_URL = 'http://localhost:5000/api';

const roles = ['admin', 'manager', 'sales', 'baker']; // Define available roles

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        id: null, // For editing existing users
        fullname: '',
        username: '',
        email: '',
        password: '', // Password field for new users and optional update for existing
        phone_number: '',
        gender: '',
        role: 'sales', // Default role for new users
    });

    const [isEditing, setIsEditing] = useState(false); // State to track if we are editing

    // Filter states
    const [filterRole, setFilterRole] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // --- Data Fetching ---
    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (filterRole) params.role = filterRole;
            if (searchTerm) params.searchTerm = searchTerm;

            const response = await axios.get(`${API_BASE_URL}/users`, { params });
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err.response?.data || err.message);
            setError('Failed to load users. ' + (err.response?.data?.details || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filterRole, searchTerm]); // Re-fetch users when filters or search term change

    // --- Form Handlers ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            if (isEditing) {
                // Update user
                const payload = { ...formData };
                if (!payload.password) { // Don't send empty password if not changed
                    delete payload.password;
                }
                const response = await axios.put(`${API_BASE_URL}/users/${formData.id}`, payload);
                setSuccessMessage(`User "${response.data.fullname}" updated successfully!`);
            } else {
                // Create new user
                const response = await axios.post(`${API_BASE_URL}/users`, formData);
                setSuccessMessage(`User "${response.data.fullname}" created successfully!`);
            }
            fetchUsers(); // Refresh the user list
            handleCancelEdit(); // Clear form and reset state
        } catch (err) {
            console.error('Error submitting user data:', err.response?.data || err.message);
            setError('Failed to save user. ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEdit = (user) => {
        setFormData({
            id: user.id,
            fullname: user.fullname,
            username: user.username,
            email: user.email,
            password: '', // Clear password for security, user will re-enter if changing
            phone_number: user.phone_number,
            gender: user.gender,
            role: user.role,
        });
        setIsEditing(true);
        setError('');
        setSuccessMessage('');
    };

    const handleDelete = async (userId, userFullname) => {
        if (window.confirm(`Are you sure you want to delete user "${userFullname}"? This action cannot be undone.`)) {
            setError('');
            setSuccessMessage('');
            try {
                await axios.delete(`${API_BASE_URL}/users/${userId}`);
                setSuccessMessage(`User "${userFullname}" deleted successfully!`);
                fetchUsers(); // Refresh the user list
            } catch (err) {
                console.error('Error deleting user:', err.response?.data || err.message);
                setError('Failed to delete user. ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleCancelEdit = () => {
        setFormData({
            id: null,
            fullname: '',
            username: '',
            email: '',
            password: '',
            phone_number: '',
            gender: '',
            role: 'sales',
        });
        setIsEditing(false);
        setError('');
        setSuccessMessage('');
    };

    // --- Render ---
    return (
        <div className="admin-container">
            <h1 className="admin-header">User Management</h1>

            {error && <Alert variant="danger" className="my-3">{error}</Alert>}
            {successMessage && <Alert variant="success" className="my-3">{successMessage}</Alert>}

            {/* User Creation/Edit Form */}
            <Card className="admin-card user-form-card mb-4">
                <h2 className="card-title">{isEditing ? 'Edit User' : 'Create New User'}</h2>
                <Form onSubmit={handleSubmit} className="user-form">
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Full Name</Form.Label>
                                <Form.Control type="text" name="fullname" placeholder="Full Name" value={formData.fullname} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Email Address</Form.Label>
                                <Form.Control type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control type="tel" name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Gender</Form.Label>
                                <Form.Control as="select" name="gender" value={formData.gender} onChange={handleChange}>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Username</Form.Label>
                                <Form.Control type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>{isEditing ? 'New Password (optional)' : 'Password'}</Form.Label>
                                <Form.Control type="password" name="password" placeholder={isEditing ? 'Leave blank to keep current' : 'Password'} value={formData.password} onChange={handleChange} { ...(!isEditing && {required: true}) } />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Role</Form.Label>
                                <Form.Control as="select" name="role" value={formData.role} onChange={handleChange} required>
                                    {roles.map(role => (
                                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-end mt-4">
                        {isEditing && (
                            <Button variant="secondary" onClick={handleCancelEdit} className="me-2">
                                <FaTimes className="me-1" /> Cancel Edit
                            </Button>
                        )}
                        <Button variant="primary" type="submit">
                            <FaPlus className="me-1" /> {isEditing ? 'Update User' : 'Create User'}
                        </Button>
                    </div>
                </Form>
            </Card>

            {/* User Search and Filter */}
            <Card className="admin-card filter-card mb-4">
                <h2 className="card-title">Search & Filter Users</h2>
                <Form>
                    <Row className="g-3 align-items-end">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Search Term</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by name, username, or email"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                                        <FaTimes />
                                    </Button>
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Filter by Role</Form.Label>
                                <Form.Control as="select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                                    <option value="">All Roles</option>
                                    {roles.map(role => (
                                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {/* User Table */}
            <Card className="admin-card user-table-card">
                <h2 className="card-title">Existing Users</h2>
                {loading ? (
                    <div className="text-center my-5"><Spinner animation="border" /><p>Loading users...</p></div>
                ) : users.length === 0 ? (
                    <Alert variant="info">No users found matching the filters.</Alert>
                ) : (
                    <div className="table-responsive">
                        <Table striped bordered hover className="user-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Full Name</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Gender</th>
                                    <th>Role</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.fullname}</td>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>{user.phone_number || 'N/A'}</td>
                                        <td>{user.gender || 'N/A'}</td>
                                        <td><span className={`badge bg-${user.role === 'admin' ? 'danger' : user.role === 'manager' ? 'warning' : user.role === 'baker' ? 'info' : 'primary'}`}>{user.role}</span></td>
                                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <Button variant="info" size="sm" className="me-1" onClick={() => handleEdit(user)}>
                                                <FaEdit /> Edit
                                            </Button>
                                            <Button variant="danger" size="sm" onClick={() => handleDelete(user.id, user.fullname)}>
                                                <FaTrash /> Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AdminPage;
