import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimes, FaUser, FaEnvelope, FaPhone, FaVenusMars, FaUserTag, FaKey, FaFilter, FaSync, FaCalendarAlt } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/styles/admin.css';
import CustomToast from '../components/CustomToast';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const roles = ['admin', 'manager', 'sales', 'baker'];

// Delete Confirmation Dialog Component
const DeleteConfirmationDialog = ({
    isOpen,
    onClose,
    onConfirm,
    userName
}) => {
    if (!isOpen) return null;

    return (
        <div className="ppb-dialog__overlay" onClick={onClose}>
            <div className="ppb-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="ppb-dialog__header">
                    <h3 className="ppb-dialog__title">Confirm User Deletion</h3>
                </div>
                <div className="ppb-dialog__body">
                    <p>Are you sure you want to delete user <strong>"{userName}"</strong>? This action cannot be undone.</p>
                </div>
                <div className="ppb-dialog__footer">
                    <button
                        className="ppb-btn ppb-btn--ghost"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="ppb-btn ppb-btn--danger"
                        onClick={onConfirm}
                    >
                        Delete User
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        id: null,
        fullname: '',
        username: '',
        email: '',
        password: '',
        phone_number: '',
        gender: '',
        role: 'sales',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [filterRole, setFilterRole] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        userId: null,
        userName: ""
    });

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
            // toast.error('Failed to load users.');
            // toast(<CustomToast id="123" type="error" message="Failed to load users." />);
            toast(<CustomToast id={`error-fetching-${Date.now()}`} type="error" message="Failed to load users." />, {
                toastId: 'fetching-error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filterRole, searchTerm]);

    // --- Form Handlers ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setSubmitting(true);

        try {
            if (isEditing) {
                const payload = { ...formData };
                if (!payload.password) {
                    delete payload.password;
                }
                const response = await axios.put(`${API_BASE_URL}/users/${formData.id}`, payload);
                setSuccessMessage(`User "${response.data.fullname}" updated successfully!`);
                // toast.success(`User "${response.data.fullname}" updated successfully!`);
                // toast(<CustomToast id="123" type="success" message={`User "${response.data.fullname}" updated successfully!`} />);
                toast(<CustomToast id={`success-update-${Date.now()}`} type="success" message="update successfully!" />, {
                    toastId: 'update-success'
                });
            } else {
                const response = await axios.post(`${API_BASE_URL}/users`, formData);
                setSuccessMessage(`User "${response.data.fullname}" created successfully!`);
                // toast.success(`User "${response.data.fullname}" created successfully!`);
                // toast(<CustomToast id="123" type="success" message={`User "${response.data.fullname}" created successfully!`} />);
                toast(<CustomToast id={`success-created-${Date.now()}`} type="success" message="created successfully!" />, {
                    toastId: 'created-success'
                });
            }
            fetchUsers();
            handleCancelEdit();
        } catch (err) {
            console.error('Error submitting user data:', err.response?.data || err.message);
            setError('Failed to save user. ' + (err.response?.data?.error || err.message));
            // toast.error('Failed to save user.');
            // toast(<CustomToast id="123" type="error" message="Failed to save user." />);
            toast(<CustomToast id={`error-save-${Date.now()}`} type="error" message="Failed to save user." />, {
                toastId: 'save-error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (user) => {
        setFormData({
            id: user.id,
            fullname: user.fullname,
            username: user.username,
            email: user.email,
            password: '',
            phone_number: user.phone_number,
            gender: user.gender,
            role: user.role,
        });
        setIsEditing(true);
        setError('');
        setSuccessMessage('');
    };

    const handleDelete = async (id, name) => {
        try {
            await axios.delete(`${API_BASE_URL}/users/${id}`);
            setSuccessMessage(`User "${name}" deleted successfully!`);
            toast(<CustomToast id={`success-delete-${Date.now()}`} type="success" message={`User "${name}" deleted successfully!`} />, {
                toastId: 'delete-success'
            });
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err.response?.data || err.message);
            setError('Failed to delete user. ' + (err.response?.data?.message || err.message));
            toast(<CustomToast id={`error-delete-${Date.now()}`} type="error" message="Failed to delete user." />, {
                toastId: 'delete-error'
            });
        } finally {
            // Close the dialog
            setDeleteDialog({
                isOpen: false,
                userId: null,
                userName: ""
            });
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

    const handleClearFilters = () => {
        setFilterRole('');
        setSearchTerm('');
        // toast.info('Filters cleared');
        // toast(<CustomToast id="123" type="info" message="Filters cleared" />);
        toast(<CustomToast id={`info-cleared-${Date.now()}`} type="info" message="Filters cleared" />, {
            toastId: 'cleared-info'
        });
    };

    const handleRefresh = () => {
        fetchUsers();
        // toast.info('Users list refreshed');
        // toast(<CustomToast id="123" type="info" message="Users list refreshed" />);
        toast(<CustomToast id={`info-refresh-${Date.now()}`} type="info" message="Users list refreshed" />, {
            toastId: 'refresh-info'
        });
    };

    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'admin': return 'danger';
            case 'manager': return 'warning';
            case 'baker': return 'info';
            case 'sales': return 'primary';
            default: return 'secondary';
        }
    };

    return (
        <div className="admin-container">
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            <div className="page-header">
                <h1>
                    <FaUser className="me-2" />
                    User Management
                </h1>
                <p>Manage system users and their permissions</p>
            </div>

            {error && <Alert variant="danger" className="alert-custom">{error}</Alert>}
            {successMessage && <Alert variant="success" className="alert-custom">{successMessage}</Alert>}

            {/* User Creation/Edit Form */}
            <Card className="form-card">
                <Card.Header className="card-header-custom">
                    {isEditing ? (
                        <>
                            <FaEdit className="me-2" />
                            Edit User
                        </>
                    ) : (
                        <>
                            <FaPlus className="me-2" />
                            Create New User
                        </>
                    )}
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaUser className="me-1" />
                                        Full Name
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="fullname"
                                        placeholder="Full Name"
                                        value={formData.fullname}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaEnvelope className="me-1" />
                                        Email Address
                                    </Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaPhone className="me-1" />
                                        Phone Number
                                    </Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="phone_number"
                                        placeholder="Phone Number"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaVenusMars className="me-1" />
                                        Gender
                                    </Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaUserTag className="me-1" />
                                        Username
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="username"
                                        placeholder="Username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaKey className="me-1" />
                                        {isEditing ? 'New Password (optional)' : 'Password'}
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        placeholder={isEditing ? 'Leave blank to keep current' : 'Password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        {...(!isEditing && { required: true })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaUserTag className="me-1" />
                                        Role
                                    </Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        required
                                    >
                                        {roles.map(role => (
                                            <option key={role} value={role}>
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end mt-4">
                            {isEditing && (
                                <Button
                                    variant="outline-secondary"
                                    onClick={handleCancelEdit}
                                    className="me-2"
                                    disabled={submitting}
                                >
                                    <FaTimes className="me-1" /> Cancel Edit
                                </Button>
                            )}
                            <Button
                                variant="outline-primary"
                                type="submit"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        {isEditing ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        {isEditing ? <FaEdit className="me-1" /> : <FaPlus className="me-1" />}
                                        {isEditing ? 'Update User' : 'Create User'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            {/* User Search and Filter - Fixed Layout */}
            <Card className="filter-card">
                <Card.Header className="card-header-custom-f">
                    <FaFilter className="me-2" />
                    Search & Filter Users
                </Card.Header>
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={5}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    <FaSearch className="me-1" />
                                    Search Term
                                </Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by name, username, or email"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    {/* {searchTerm && (
                                        <Button 
                                            variant="outline-secondary" 
                                            onClick={() => setSearchTerm('')}
                                            title="Clear search"
                                        >
                                            <FaTimes />
                                        </Button>
                                    )} */}
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Filter by Role</Form.Label>
                                <Form.Control
                                    as="select"
                                    value={filterRole}
                                    onChange={e => setFilterRole(e.target.value)}
                                >
                                    <option value="">All Roles</option>
                                    {roles.map(role => (
                                        <option key={role} value={role}>
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={4} className="d-flexs align-items-end justify-content-end">
                            <Button
                                variant="outline-secondary"
                                onClick={handleClearFilters}
                                className="me-2 filter-btns"
                                disabled={!filterRole && !searchTerm}
                            >
                                <FaTimes className="me-1" /> Clear Filters
                            </Button>
                            <Button
                                variant="outline-primary"
                                onClick={handleRefresh}
                                className="filter-btns"
                            >
                                <FaSync className="me-1" /> Refresh
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* User Table - Increased width and fixed layout */}
            <Card className="table-card">
                <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
                    <div>
                        <FaUser className="me-2" />
                        Existing Users
                    </div>
                    <Badge bg="light" text="dark" className="user-count">
                        {users.length} users
                    </Badge>
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="loading-container">
                            <Spinner animation="border" variant="primary" />
                            <p>Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="empty-state">
                            <FaUser className="empty-icon" />
                            <h4>No Users Found</h4>
                            <p>No users found matching the filters. Create a new user above!</p>
                        </div>
                    ) : (
                        <div className="table-container-wide">
                            <Table striped bordered hover className="user-table-wide">
                                <thead>
                                    <tr>
                                        <th className="col-sn">S/N</th>
                                        <th className="col-name">Full Name</th>
                                        <th className="col-username">Username</th>
                                        <th className="col-email">Email</th>
                                        <th className="col-phone">Phone</th>
                                        <th className="col-gender">Gender</th>
                                        <th className="col-role">Role</th>
                                        <th className="col-created">Created At</th>
                                        <th className="col-actions">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, index) => (
                                        <tr key={user.id}>
                                            <td className="col-sn text-center">{index + 1}</td>
                                            <td className="col-name">
                                                <div className="d-flex align-items-center">
                                                    <FaUser className="me-2 text-muted" />
                                                    <strong>{user.fullname}</strong>
                                                </div>
                                            </td>
                                            <td className="col-username">{user.username}</td>
                                            <td className="col-email">
                                                <div className="d-flex align-items-center">
                                                    <FaEnvelope className="me-2 text-muted" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="col-phone">
                                                {user.phone_number ? (
                                                    <div className="d-flex align-items-center">
                                                        <FaPhone className="me-2 text-muted" />
                                                        {user.phone_number}
                                                    </div>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="col-gender">{user.gender || 'N/A'}</td>
                                            <td className="col-role">
                                                <Badge bg={getRoleBadgeVariant(user.role)}>
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="col-created">
                                                <div className="d-flex align-items-center">
                                                    <FaCalendarAlt className="me-2 text-muted" />
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="col-actions">
                                                <div className="action-buttons">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="me-1 btn-action edit"
                                                        onClick={() => handleEdit(user)}
                                                        title="Edit User"
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="btn-action delete"
                                                        onClick={() => setDeleteDialog({
                                                            isOpen: true,
                                                            userId: user.id,
                                                            userName: user.fullname
                                                        })}
                                                        title="Delete User"
                                                    >
                                                        <FaTrash />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>
                        {/* Add the Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({
                    isOpen: false,
                    userId: null,
                    userName: ""
                })}
                onConfirm={() => handleDelete(deleteDialog.userId, deleteDialog.userName)}
                userName={deleteDialog.userName}
            />
        </div>
    );
};

export default AdminPage;