import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { FaUserPlus, FaCalendarAlt, FaEdit, FaTrash, FaSearch, FaTimes, FaUser, FaIdBadge, FaInfoCircle, FaFilter, FaSync } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/styles/staff-management.css';

const API_BASE_URL = 'https://purple-premium-bread-backend.onrender.com/api';

const StaffManagement = () => {
    const [users, setUsers] = useState([]);
    const [duties, setDuties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Form data for adding/editing duties
    const [dutyFormData, setDutyFormData] = useState({
        id: null,
        user_id: '',
        duty_date: '',
        shift_name: 'Morning',
        duty_description: '',
    });
    const [isEditing, setIsEditing] = useState(false);

    // Filter states for duty assignments
    const [filters, setFilters] = useState({
        userId: '',
        startDate: '',
        endDate: '',
        shiftName: '',
    });

    const shiftOptions = ['Morning', 'Afternoon', 'Night'];

    // --- Data Fetching ---
    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/users`);
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users for duty assignment.');
            // toast.error('Failed to load users for duty assignment.');
            // toast(<CustomToast id="123" type="error" message="Failed to load users for duty assignmenty." />);
            toast(<CustomToast id={`error-duty-${Date.now()}`} type="error" message="Failed to load users for duty assignmenty." />, {
                toastId: 'duty-error'
            });
        }
    };

    const fetchDuties = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await axios.get(`${API_BASE_URL}/staff/duties?${queryParams}`);
            setDuties(response.data);
        } catch (err) {
            console.error('Error fetching staff duties:', err.response?.data || err.message);
            setError('Failed to load staff duty assignments. ' + (err.response?.data?.details || err.message));
            // toast.error('Failed to load duty assignments.');
            // toast(<CustomToast id="123" type="error" message="Failed to load duty assignments." />);
            toast(<CustomToast id={`error-load-${Date.now()}`} type="error" message="Failed to load duty assignments." />, {
                toastId: 'load-error'
            });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchDuties();
    }, [filters, fetchDuties]);

    // --- Form Handlers ---
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setDutyFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setSubmitting(true);

        if (!dutyFormData.user_id || !dutyFormData.duty_date || !dutyFormData.shift_name) {
            setError('Please fill in all required fields (Staff, Date, Shift).');
            // toast.error('Please fill in all required fields.');
            // toast(<CustomToast id="123" type="error" message="Please fill in all required fields." />);
            toast(<CustomToast id={`error-require-${Date.now()}`} type="error" message="Please fill in all required fields." />, {
                toastId: 'require-error'
            });
            setSubmitting(false);
            return;
        }

        try {
            if (isEditing) {
                await axios.put(`${API_BASE_URL}/staff/duties/${dutyFormData.id}`, dutyFormData, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setSuccessMessage('Duty assignment updated successfully!');
                // toast.success('Duty assignment updated successfully!');
                // toast(<CustomToast id="123" type="success" message="Duty assignment updated successfully!" />);
                toast(<CustomToast id={`success-update-${Date.now()}`} type="success" message="Duty assignment updated successfully!" />, {
                    toastId: 'update-success'
                });
            } else {
                await axios.post(`${API_BASE_URL}/staff/duties`, dutyFormData, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setSuccessMessage('Duty assignment created successfully!');
                // toast.success('Duty assignment created successfully!');
                // toast(<CustomToast id="123" type="success" message="Duty assignment created successfully!" />);
                toast(<CustomToast id={`success-created-${Date.now()}`} type="success" message="Duty assignment created successfully!" />, {
                    toastId: 'created-success'
                });
            }
            fetchDuties();
            handleCancelEdit();
        } catch (err) {
            console.error('Error saving duty assignment:', err.response?.data || err.message);
            setError('Failed to save duty assignment. ' + (err.response?.data?.error || err.message));
            // toast.error('Failed to save duty assignment.');
            // toast(<CustomToast id="123" type="error" message="Failed to save duty assignment." />);
            toast(<CustomToast id={`error-duty-${Date.now()}`} type="error" message="Failed to save duty assignment." />, {
                toastId: 'duty-error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditDuty = (duty) => {
        setDutyFormData({
            id: duty.id,
            user_id: duty.user_id,
            duty_date: duty.duty_date.split('T')[0],
            shift_name: duty.shift_name,
            duty_description: duty.duty_description || '',
        });
        setIsEditing(true);
        setError('');
        setSuccessMessage('');
    };

    const handleDeleteDuty = async (dutyId, userName, dutyDate, shiftName) => {
        if (window.confirm(`Are you sure you want to delete the duty for "${userName}" on ${new Date(dutyDate).toLocaleDateString()} for the ${shiftName} shift? This action cannot be undone.`)) {
            setError('');
            setSuccessMessage('');
            try {
                await axios.delete(`${API_BASE_URL}/staff/duties/${dutyId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setSuccessMessage('Duty assignment deleted successfully!');
                // toast.success('Duty assignment deleted successfully!');
                // toast(<CustomToast id="123" type="success" message="Duty assignment deleted successfully!" />);
                toast(<CustomToast id={`success-delete-${Date.now()}`} type="success" message="Duty assignment deleted successfully!" />, {
                    toastId: 'delete-success'
                });
                fetchDuties();
            } catch (err) {
                console.error('Error deleting duty assignment:', err.response?.data || err.message);
                setError('Failed to delete duty assignment. ' + (err.response?.data?.details || err.message));
                // toast.error('Failed to delete duty assignment.');
                // toast(<CustomToast id="123" type="error" message="Failed to delete duty assignment." />);
                toast(<CustomToast id={`error-delete-${Date.now()}`} type="error" message="Failed to delete duty assignment." />, {
                    toastId: 'delete-error'
                });
            }
        }
    };

    const handleCancelEdit = () => {
        setDutyFormData({
            id: null,
            user_id: '',
            duty_date: '',
            shift_name: 'Morning',
            duty_description: '',
        });
        setIsEditing(false);
        setError('');
        setSuccessMessage('');
    };

    // --- Filter Handlers ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            userId: '',
            startDate: '',
            endDate: '',
            shiftName: '',
        });
        // toast.info('Filters cleared');
        // toast(<CustomToast id="123" type="info" message="Filters cleared" />);
        toast(<CustomToast id={`info-cleared-${Date.now()}`} type="info" message="Filters cleared" />, {
            toastId: 'cleared-info'
        });
    };

    const handleRefresh = () => {
        fetchDuties();
        fetchUsers();
        // toast.info('Data refreshed');
        // toast(<CustomToast id="123" type="info" message="Data refreshed" />);
        toast(<CustomToast id={`info-refresh-${Date.now()}`} type="info" message="Data refreshed" />, {
            toastId: 'refresh-info'
        });
    };

    const getShiftBadgeVariant = (shift) => {
        switch (shift) {
            case 'Morning': return 'success';
            case 'Afternoon': return 'warning';
            case 'Night': return 'primary';
            default: return 'secondary';
        }
    };

    return (
        <div className="staff-management-container">
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
                    <FaCalendarAlt className="me-2" />
                    Staff Duty Management
                </h1>
                <p>Manage and assign duties to your staff members</p>
            </div>

            {error && <Alert variant="danger" className="alert-custom">{error}</Alert>}
            {successMessage && <Alert variant="success" className="alert-custom">{successMessage}</Alert>}

            {/* Add/Edit Duty Assignment Form */}
            <Card className="form-card">
                <Card.Header className="card-header-custom">
                    <FaUserPlus className="me-2" />
                    {isEditing ? 'Edit Duty Assignment' : 'Assign New Duty'}
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleFormSubmit}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaUser className="me-1" />
                                        Staff Member
                                    </Form.Label>
                                    <Form.Control as="select" name="user_id" value={dutyFormData.user_id} onChange={handleFormChange} required>
                                        <option value="">-- Select Staff --</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.fullname} ({user.role})</option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaCalendarAlt className="me-1" />
                                        Duty Date
                                    </Form.Label>
                                    <Form.Control type="date" name="duty_date" value={dutyFormData.duty_date} onChange={handleFormChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Shift</Form.Label>
                                    <Form.Control as="select" name="shift_name" value={dutyFormData.shift_name} onChange={handleFormChange} required>
                                        {shiftOptions.map(shift => (
                                            <option key={shift} value={shift}>{shift}</option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaInfoCircle className="me-1" />
                                        Duty Description (Optional)
                                    </Form.Label>
                                    <Form.Control as="textarea" name="duty_description" value={dutyFormData.duty_description} onChange={handleFormChange} rows="2" />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end mt-4">
                            {isEditing && (
                                <Button variant="outline-secondary" onClick={handleCancelEdit} className="me-2">
                                    <FaTimes className="me-1" /> Cancel Edit
                                </Button>
                            )}
                            <Button variant="outline-primary" type="submit" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        {isEditing ? 'Updating...' : 'Assigning...'}
                                    </>
                                ) : (
                                    <>
                                        <FaUserPlus className="me-1" /> {isEditing ? 'Update Assignment' : 'Assign Duty'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            {/* Duty Assignment Filters */}
            <Card className="filter-card">
                <Card.Header className="card-header-custom-f">
                    <FaFilter className="me-2" />
                    Filter Duty Assignments
                </Card.Header>
                <Card.Body>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    <FaUser className="me-1" />
                                    Staff Member
                                </Form.Label>
                                <Form.Control as="select" name="userId" value={filters.userId} onChange={handleFilterChange}>
                                    <option value="">All Staff</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.fullname} ({user.role})</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Shift</Form.Label>
                                <Form.Control as="select" name="shiftName" value={filters.shiftName} onChange={handleFilterChange}>
                                    <option value="">All Shifts</option>
                                    {shiftOptions.map(shift => (
                                        <option key={shift} value={shift}>{shift}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={8} className="d-flex align-items-end justify-content-end">
                            <Button variant="outline-secondary" onClick={handleClearFilters} className="me-2 filter-btn">
                                <FaTimes className="me-1" /> Clear Filters
                            </Button>
                            <Button variant="outline-primary" onClick={handleRefresh} className="filter-btn">
                                <FaSync className="me-1" /> Refresh
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Duty Assignments Table */}
            <Card className="table-card">
                <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
                    <div>
                        <FaIdBadge className="me-2" />
                        All Duty Assignments
                    </div>
                    <Badge bg="light" text="dark" className="assignment-count">
                        {duties.length} assignments
                    </Badge>
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="loading-container">
                            <Spinner animation="border" variant="primary" />
                            <p>Loading duty assignments...</p>
                        </div>
                    ) : duties.length === 0 ? (
                        <div className="empty-state">
                            <FaCalendarAlt className="empty-icon" />
                            <h4>No Duty Assignments Found</h4>
                            <p>No duty assignments found matching the filters. Assign some duties above!</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <Table striped bordered hover className="staff-duties-table">
                                <thead>
                                    <tr>
                                        <th className="col-id">ID</th>
                                        <th className="col-staff">Staff Member</th>
                                        <th className="col-role">Role</th>
                                        <th className="col-date">Date</th>
                                        <th className="col-shift">Shift</th>
                                        <th className="col-desc">Description</th>
                                        <th className="col-assigned">Assigned By</th>
                                        <th className="col-actions">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {duties.map(duty => (
                                        <tr key={duty.id}>
                                            <td className="col-id">{duty.id}</td>
                                            <td className="col-staff">
                                                <div className="d-flex align-items-center">
                                                    <FaUser className="me-2 text-muted" />
                                                    <strong>{duty.user_fullname}</strong>
                                                </div>
                                            </td>
                                            <td className="col-role">{duty.user_role}</td>
                                            <td className="col-date">
                                                <div className="d-flex align-items-center">
                                                    <FaCalendarAlt className="me-2 text-muted" />
                                                    {new Date(duty.duty_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="col-shift">
                                                <Badge bg={getShiftBadgeVariant(duty.shift_name)}>
                                                    {duty.shift_name}
                                                </Badge>
                                            </td>
                                            <td className="col-desc">{duty.duty_description || 'N/A'}</td>
                                            <td className="col-assigned">{duty.assigned_by_fullname || 'N/A'}</td>
                                            <td className="col-actions">
                                                <div className="action-buttons">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="me-1 btn-action edit"
                                                        onClick={() => handleEditDuty(duty)}
                                                        title="Edit Duty"
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="btn-action delete"
                                                        onClick={() => handleDeleteDuty(duty.id, duty.user_fullname, duty.duty_date, duty.shift_name)}
                                                        title="Delete Duty"
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
        </div>
    );
};

export default StaffManagement;