import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { FaUserPlus, FaCalendarAlt, FaEdit, FaTrash, FaSearch, FaTimes } from 'react-icons/fa';
import '../styles/forms.css'; // Reusing forms.css for general styling

const API_BASE_URL = 'http://localhost:5000/api';

const StaffManagement = () => {
    const [users, setUsers] = useState([]); // All users to select for duties
    const [duties, setDuties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Form data for adding/editing duties
    const [dutyFormData, setDutyFormData] = useState({
        id: null, // For editing
        user_id: '',
        duty_date: '', // YYYY-MM-DD format
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
            // Assuming /api/users fetches all users (staff included)
            const response = await axios.get(`${API_BASE_URL}/users`);
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users for duty assignment.');
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

        if (!dutyFormData.user_id || !dutyFormData.duty_date || !dutyFormData.shift_name) {
            setError('Please fill in all required fields (Staff, Date, Shift).');
            return;
        }

        try {
            if (isEditing) {
                await axios.put(`${API_BASE_URL}/staff/duties/${dutyFormData.id}`, dutyFormData, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setSuccessMessage('Duty assignment updated successfully!');
            } else {
                await axios.post(`${API_BASE_URL}/staff/duties`, dutyFormData, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setSuccessMessage('Duty assignment created successfully!');
            }
            fetchDuties(); // Refresh the list
            handleCancelEdit(); // Clear form
        } catch (err) {
            console.error('Error saving duty assignment:', err.response?.data || err.message);
            setError('Failed to save duty assignment. ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEditDuty = (duty) => {
        setDutyFormData({
            id: duty.id,
            user_id: duty.user_id,
            duty_date: duty.duty_date.split('T')[0], // Format date for input type="date"
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
                fetchDuties();
            } catch (err) {
                console.error('Error deleting duty assignment:', err.response?.data || err.message);
                setError('Failed to delete duty assignment. ' + (err.response?.data?.details || err.message));
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
    };

    return (
        <div className="staff-management-container">
            <h1 className="main-header"><FaCalendarAlt className="me-2" /> Staff Duty Management</h1>

            {error && <Alert variant="danger" className="my-3">{error}</Alert>}
            {successMessage && <Alert variant="success" className="my-3">{successMessage}</Alert>}

            {/* Add/Edit Duty Assignment Form */}
            <Card className="form-card mb-4">
                <h2 className="card-title">{isEditing ? 'Edit Duty Assignment' : 'Assign New Duty'}</h2>
                <Form onSubmit={handleFormSubmit}>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Staff Member</Form.Label>
                                <Form.Control as="select" name="user_id" value={dutyFormData.user_id} onChange={handleFormChange} required>
                                    <option value="">-- Select Staff --</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.fullname} ({user.role})</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Duty Date</Form.Label>
                                <Form.Control type="date" name="duty_date" value={dutyFormData.duty_date} onChange={handleFormChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Shift</Form.Label>
                                <Form.Control as="select" name="shift_name" value={dutyFormData.shift_name} onChange={handleFormChange} required>
                                    {shiftOptions.map(shift => (
                                        <option key={shift} value={shift}>{shift}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Duty Description (Optional)</Form.Label>
                                <Form.Control as="textarea" name="duty_description" value={dutyFormData.duty_description} onChange={handleFormChange} rows="2" />
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
                            <FaUserPlus className="me-1" /> {isEditing ? 'Update Assignment' : 'Assign Duty'}
                        </Button>
                    </div>
                </Form>
            </Card>

            {/* Duty Assignment Filters */}
            <Card className="filter-card mb-4">
                <h2 className="card-title">Filter Duty Assignments</h2>
                <Form>
                    <Row className="g-3 mb-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Staff Member</Form.Label>
                                <Form.Control as="select" name="userId" value={filters.userId} onChange={handleFilterChange}>
                                    <option value="">All Staff</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.fullname} ({user.role})</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Shift</Form.Label>
                                <Form.Control as="select" name="shiftName" value={filters.shiftName} onChange={handleFilterChange}>
                                    <option value="">All Shifts</option>
                                    {shiftOptions.map(shift => (
                                        <option key={shift} value={shift}>{shift}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={4} className="d-flex align-items-end justify-content-end">
                            <Button variant="outline-secondary" onClick={handleClearFilters}>
                                <FaTimes className="me-1" /> Clear Filters
                            </Button>
                        </Col>
                    </Row>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>End Date</Form.Label>
                                <Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {/* Duty Assignments Table */}
            <Card className="table-card mb-4">
                <h2 className="card-title">All Duty Assignments</h2>
                {loading ? (
                    <div className="text-center my-5"><Spinner animation="border" /><p>Loading duties...</p></div>
                ) : duties.length === 0 ? (
                    <Alert variant="info">No duty assignments found matching the filters. Assign some above!</Alert>
                ) : (
                    <div className="table-responsive">
                        <Table striped bordered hover className="staff-duties-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Staff Member</th>
                                    <th>Role</th>
                                    <th>Date</th>
                                    <th>Shift</th>
                                    <th>Description</th>
                                    <th>Assigned By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {duties.map(duty => (
                                    <tr key={duty.id}>
                                        <td>{duty.id}</td>
                                        <td>{duty.user_fullname}</td>
                                        <td>{duty.user_role}</td>
                                        <td>{new Date(duty.duty_date).toLocaleDateString()}</td>
                                        <td>{duty.shift_name}</td>
                                        <td>{duty.duty_description || 'N/A'}</td>
                                        <td>{duty.assigned_by_fullname || 'N/A'}</td>
                                        <td>
                                            <Button variant="info" size="sm" className="me-1" onClick={() => handleEditDuty(duty)}>
                                                <FaEdit /> Edit
                                            </Button>
                                            <Button variant="danger" size="sm" onClick={() => handleDeleteDuty(duty.id, duty.user_fullname, duty.duty_date, duty.shift_name)}>
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

export default StaffManagement;
