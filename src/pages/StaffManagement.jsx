import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup, Badge, Tabs, Tab } from 'react-bootstrap';
import { 
    FaUserPlus, FaCalendarAlt, FaEdit, FaTrash, FaSearch, FaTimes, FaUser, 
    FaIdBadge, FaInfoCircle, FaFilter, FaSync, FaClock, FaChartBar, 
    FaUserCheck, FaUserTimes, FaList, FaPlus, FaHistory 
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/styles/staff-management.css';
import CustomToast from '../components/CustomToast';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

// Delete Confirmation Dialog Component
const DeleteConfirmationDialog = ({
    isOpen,
    onClose,
    onConfirm,
    staffName,
    dutyDate,
    shiftName
}) => {
    if (!isOpen) return null;

    const formattedDate = new Date(dutyDate).toLocaleDateString();

    return (
        <div className="ppb-dialog__overlay" onClick={onClose}>
            <div className="ppb-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="ppb-dialog__header">
                    <h3 className="ppb-dialog__title">Confirm Duty Deletion</h3>
                </div>
                <div className="ppb-dialog__body">
                    <p>Are you sure you want to delete the duty for <strong>"{staffName}"</strong> on <strong>{formattedDate}</strong> for the <strong>{shiftName}</strong> shift?</p>
                    <p className="ppb-dialog__warning">This action cannot be undone.</p>
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
                        Delete Duty
                    </button>
                </div>
            </div>
        </div>
    );
};

// Enhanced Staff Members Management Component
const StaffMembersTab = () => {
    const [staffMembers, setStaffMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        fullname: '',
        phone_number: '',
        email: '',
        gender: '',
        date_of_birth: '',
        position: '',
        department: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        is_active: true
    });
    const [editingId, setEditingId] = useState(null);

    const genderOptions = ['Male', 'Female', 'Other'];
    const departmentOptions = ['Sales', 'Baker', 'Admin', 'Delivery', 'Management', 'Other'];

    const fetchStaffMembers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/staff/members`);
            setStaffMembers(response.data);
        } catch (error) {
            toast(<CustomToast type="error" message="Failed to load staff members." />);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaffMembers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`${API_BASE_URL}/staff/members/${editingId}`, formData);
                toast(<CustomToast type="success" message="Staff member updated successfully!" />);
            } else {
                await axios.post(`${API_BASE_URL}/staff/members`, formData);
                toast(<CustomToast type="success" message="Staff member added successfully!" />);
            }
            setShowForm(false);
            setFormData({
                fullname: '',
                phone_number: '',
                email: '',
                gender: '',
                date_of_birth: '',
                position: '',
                department: '',
                address: '',
                emergency_contact_name: '',
                emergency_contact_phone: '',
                is_active: true
            });
            setEditingId(null);
            fetchStaffMembers();
        } catch (error) {
            toast(<CustomToast type="error" message="Failed to save staff member." />);
        }
    };

    const handleEdit = (staff) => {
        setFormData({
            fullname: staff.fullname || '',
            phone_number: staff.phone_number || '',
            email: staff.email || '',
            gender: staff.gender || '',
            date_of_birth: staff.date_of_birth ? staff.date_of_birth.split('T')[0] : '',
            position: staff.position || '',
            department: staff.department || '',
            address: staff.address || '',
            emergency_contact_name: staff.emergency_contact_name || '',
            emergency_contact_phone: staff.emergency_contact_phone || '',
            is_active: staff.is_active !== false
        });
        setEditingId(staff.id);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setFormData({
            fullname: '',
            phone_number: '',
            email: '',
            gender: '',
            date_of_birth: '',
            position: '',
            department: '',
            address: '',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            is_active: true
        });
        setEditingId(null);
    };

    return (
        <div>
            {/* Quick Actions */}
            <div className="quick-actions">
                <button 
                    className="quick-action-btn primary"
                    onClick={() => setShowForm(true)}
                >
                    <FaUserPlus className="me-2" />
                    Add New Staff Member
                </button>
            </div>

            {/* Staff Members Table */}
            <Card className="table-card">
                <Card.Header className="card-header-custom">
                    <FaUser className="me-2" />
                    Staff Members (Non-System Users)
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                            <p className="mt-2">Loading staff members...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table striped bordered hover className="staff-members-table">
                                <thead>
                                    <tr>
                                        <th className="col-sn">S/N</th>
                                        <th>Name</th>
                                        <th>Contact</th>
                                        <th>Personal Info</th>
                                        <th>Position</th>
                                        <th>Department</th>
                                        <th>Emergency Contact</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffMembers.map((staff, index) => (
                                        <tr key={staff.id}>
                                            <td className="col-sn">{index + 1}</td>
                                            <td>
                                                <div>
                                                    <strong>{staff.fullname}</strong>
                                                    {staff.email && <div className="small text-muted">{staff.email}</div>}
                                                </div>
                                            </td>
                                            <td>
                                                {staff.phone_number && (
                                                    <div className="small">{staff.phone_number}</div>
                                                )}
                                                {staff.address && (
                                                    <div className="small text-muted" title={staff.address}>
                                                        {staff.address.length > 30 ? staff.address.substring(0, 30) + '...' : staff.address}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {staff.gender && <div className="small">Gender: {staff.gender}</div>}
                                                {staff.date_of_birth && (
                                                    <div className="small">
                                                        DOB: {new Date(staff.date_of_birth).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{staff.position || 'N/A'}</td>
                                            <td>
                                                {staff.department && (
                                                    <Badge bg="info">{staff.department}</Badge>
                                                )}
                                            </td>
                                            <td>
                                                {staff.emergency_contact_name && (
                                                    <div className="small">
                                                        <div>{staff.emergency_contact_name}</div>
                                                        {staff.emergency_contact_phone && (
                                                            <div className="text-muted">{staff.emergency_contact_phone}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <Badge bg={staff.is_active ? 'badge-active' : 'badge-inactive'}>
                                                    {staff.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={() => handleEdit(staff)}
                                                    title="Edit Staff Member"
                                                    className="btn-action edit"
                                                >
                                                    <FaEdit />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Staff Member Form Dialog */}
            {showForm && (
                <div className="ppb-dialog__overlay" onClick={() => setShowForm(false)}>
                    <div className="ppb-dialog form-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="ppb-dialog__header">
                            <h3 className="ppb-dialog__title">
                                {editingId ? 'Edit Staff Member' : 'Add New Staff Member'}
                            </h3>
                        </div>
                        <div className="form-dialog-content">
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Full Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.fullname}
                                                onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                                                required
                                                placeholder="Enter full name"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email Address</Form.Label>
                                            <Form.Control
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                placeholder="Enter email address"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Phone Number</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.phone_number}
                                                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                                                placeholder="Enter phone number"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Gender</Form.Label>
                                            <Form.Control
                                                as="select"
                                                value={formData.gender}
                                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                            >
                                                <option value="">Select Gender</option>
                                                {genderOptions.map(gender => (
                                                    <option key={gender} value={gender}>{gender}</option>
                                                ))}
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date of Birth</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={formData.date_of_birth}
                                                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Position/Job Title</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.position}
                                                onChange={(e) => setFormData({...formData, position: e.target.value})}
                                                placeholder="e.g., Sales Representative, Baker, Driver"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Department</Form.Label>
                                            <Form.Control
                                                as="select"
                                                value={formData.department}
                                                onChange={(e) => setFormData({...formData, department: e.target.value})}
                                            >
                                                <option value="">Select Department</option>
                                                {departmentOptions.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Status</Form.Label>
                                            <Form.Control
                                                as="select"
                                                value={formData.is_active}
                                                onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                                            >
                                                <option value="true">Active</option>
                                                <option value="false">Inactive</option>
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Address</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                value={formData.address}
                                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                                placeholder="Enter full address"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Emergency Contact Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.emergency_contact_name}
                                                onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                                                placeholder="Emergency contact person name"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Emergency Contact Phone</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.emergency_contact_phone}
                                                onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                                                placeholder="Emergency contact phone number"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <div className="ppb-dialog__footer">
                                    <button
                                        type="button"
                                        className="ppb-btn ppb-btn--ghost"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="ppb-btn"
                                        style={{background: 'var(--ppb-purple)', color: 'white'}}
                                    >
                                        {editingId ? 'Update' : 'Add'} Staff Member
                                    </button>
                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Attendance Management Component
const AttendanceTab = () => {
    const [attendance, setAttendance] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAttendanceForm, setShowAttendanceForm] = useState(false);
    const [attendanceForm, setAttendanceForm] = useState({
        user_id: '',
        staff_member_id: '',
        attendance_date: '',
        sign_in_time: '',
        status: 'Present',
        notes: ''
    });
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        department: '',
        status: '',
        showPunctual: false
    });
    const [staffLoading, setStaffLoading] = useState(false);

    // Nigeria Timezone Utilities
    const getCurrentNigeriaDateTime = () => {
        const now = new Date();
        // Nigeria is GMT+1, so we need to adjust the time
        const nigeriaTime = new Date(now.getTime() + (60 * 60 * 1000)); // Add 1 hour
        
        const year = nigeriaTime.getFullYear();
        const month = String(nigeriaTime.getMonth() + 1).padStart(2, '0');
        const day = String(nigeriaTime.getDate()).padStart(2, '0');
        const hours = String(nigeriaTime.getHours()).padStart(2, '0');
        const minutes = String(nigeriaTime.getMinutes()).padStart(2, '0');
        
        return {
            date: `${year}-${month}-${day}`,
            time: `${year}-${month}-${day}T${hours}:${minutes}`
        };
    };

    const getCurrentNigeriaTimeDisplay = () => {
        return new Date().toLocaleTimeString('en-NG', {
            timeZone: 'Africa/Lagos',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatTimeForDisplay = (isoString) => {
        if (!isoString) return 'N/A';
        
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString('en-NG', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Africa/Lagos'
            });
        } catch (error) {
            return 'Invalid Time';
        }
    };

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const queryParams = new URLSearchParams(filters).toString();
            const response = await axios.get(`${API_BASE_URL}/staff/attendance?${queryParams}`, { headers });
            setAttendance(response.data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast(<CustomToast type="error" message="Failed to load attendance records." />);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaffList = async () => {
        setStaffLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const [usersRes, staffRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/users`, { headers }),
                axios.get(`${API_BASE_URL}/staff/members?isActive=true`, { headers })
            ]);
            
            const combined = [
                ...usersRes.data.map(user => ({ 
                    id: user.id, 
                    name: user.fullname || user.username, 
                    type: 'system_user',
                    role: user.role 
                })),
                ...staffRes.data.map(staff => ({ 
                    id: staff.id, 
                    name: staff.fullname, 
                    type: 'staff_member',
                    role: staff.position || 'Staff Member'
                }))
            ];
            
            setStaffList(combined);
        } catch (error) {
            console.error('Error loading staff list:', error);
            toast(<CustomToast type="error" message="Failed to load staff list." />);
        } finally {
            setStaffLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
        fetchStaffList();
    }, [filters]);

    // Initialize form with current Nigeria time when showing form
    useEffect(() => {
        if (showAttendanceForm) {
            const nigeriaTime = getCurrentNigeriaDateTime();
            setAttendanceForm(prev => ({
                ...prev,
                attendance_date: nigeriaTime.date,
                sign_in_time: nigeriaTime.time
            }));
        }
    }, [showAttendanceForm]);

    const handleAttendanceSubmit = async (e) => {
        e.preventDefault();

        // Validate that a staff member is selected
        if (!attendanceForm.user_id && !attendanceForm.staff_member_id) {
            toast(<CustomToast type="error" message="Please select a staff member." />);
            return;
        }

        // Validate required fields
        if (!attendanceForm.attendance_date || !attendanceForm.sign_in_time) {
            toast(<CustomToast type="error" message="Please fill in all required fields." />);
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast(<CustomToast type="error" message="You must be logged in to record attendance." />);
                return;
            }

            // Prepare data with proper null values for integers
            const attendanceData = {
                ...attendanceForm,
                user_id: attendanceForm.user_id || null,
                staff_member_id: attendanceForm.staff_member_id || null,
                // Ensure sign_in_time is properly formatted
                sign_in_time: attendanceForm.sign_in_time ? attendanceForm.sign_in_time.replace('T', ' ') + ':00' : null
            };

            await axios.post(`${API_BASE_URL}/staff/attendance`, attendanceData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            toast(<CustomToast type="success" message="Attendance recorded successfully!" />);
            setShowAttendanceForm(false);
            // Reset form
            setAttendanceForm({
                user_id: '',
                staff_member_id: '',
                attendance_date: '',
                sign_in_time: '',
                status: 'Present',
                notes: ''
            });
            fetchAttendance();
        } catch (error) {
            console.error('Error recording attendance:', error);
            if (error.response?.status === 401) {
                toast(<CustomToast type="error" message="Authentication failed. Please log in again." />);
            } else if (error.response?.status === 500) {
                toast(<CustomToast type="error" message="Server error. Please check the data and try again." />);
            } else {
                toast(<CustomToast type="error" message="Failed to record attendance." />);
            }
        }
    };

    const handleSignOut = async (attendanceId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast(<CustomToast type="error" message="You must be logged in to record sign-out." />);
                return;
            }

            const nigeriaTime = getCurrentNigeriaDateTime();
            const signOutTime = nigeriaTime.time.replace('T', ' ') + ':00';
            
            await axios.put(`${API_BASE_URL}/staff/attendance/${attendanceId}/sign-out`, {
                sign_out_time: signOutTime
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            toast(<CustomToast type="success" message="Sign-out recorded successfully!" />);
            fetchAttendance();
        } catch (error) {
            if (error.response?.status === 401) {
                toast(<CustomToast type="error" message="Authentication failed. Please log in again." />);
            } else {
                toast(<CustomToast type="error" message="Failed to record sign-out." />);
            }
        }
    };

    const getStaffName = (record) => {
        return record.user_fullname || record.staff_member_fullname || 'Unknown';
    };

    const getStaffRole = (record) => {
        return record.user_role || record.staff_member_position || 'N/A';
    };

    return (
        <div>
            {/* Quick Actions */}
            <div className="quick-actions">
                <button 
                    className="quick-action-btn primary"
                    onClick={() => setShowAttendanceForm(true)}
                >
                    <FaUserCheck className="me-2" />
                    Record New Attendance
                </button>
            </div>

            {/* Attendance Filters */}
            <Card className="filter-card mb-4">
                <Card.Header className="card-header-custom-f">
                    <FaFilter className="me-2" />
                    Attendance Filters
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Department</Form.Label>
                                <Form.Control
                                    as="select"
                                    value={filters.department}
                                    onChange={(e) => setFilters({...filters, department: e.target.value})}
                                >
                                    <option value="">All Departments</option>
                                    <option value="sales">Sales</option>
                                    <option value="baker">Baker</option>
                                    <option value="admin">Admin</option>
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Control
                                    as="select"
                                    value={filters.status}
                                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                                >
                                    <option value="">All Status</option>
                                    <option value="Present">Present</option>
                                    <option value="Late">Late</option>
                                    <option value="Absent">Absent</option>
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Check
                                type="checkbox"
                                label="Show Only Punctual Staff (Signed in before 8:00 AM)"
                                checked={filters.showPunctual}
                                onChange={(e) => setFilters({...filters, showPunctual: e.target.checked})}
                            />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Attendance History */}
            <Card className="table-card">
                <Card.Header className="card-header-custom">
                    <FaHistory className="me-2" />
                    Attendance History
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table striped bordered hover className="attendance-table">
                                <thead>
                                    <tr>
                                        <th className="col-sn">S/N</th>
                                        <th>Staff Name</th>
                                        <th>Role/Position</th>
                                        <th>Date</th>
                                        <th>Sign In</th>
                                        <th>Sign Out</th>
                                        <th>Status</th>
                                        <th>Hours Worked</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.map((record, index) => {
                                        const signIn = record.sign_in_time ? new Date(record.sign_in_time) : null;
                                        const signOut = record.sign_out_time ? new Date(record.sign_out_time) : null;
                                        const hoursWorked = signIn && signOut ? 
                                            ((signOut - signIn) / (1000 * 60 * 60)).toFixed(2) : 'N/A';

                                        return (
                                            <tr key={`attendance-${record.id}-${index}`}>
                                                <td className="col-sn">{index + 1}</td>
                                                <td>{getStaffName(record)}</td>
                                                <td>{getStaffRole(record)}</td>
                                                <td>{new Date(record.attendance_date).toLocaleDateString('en-NG')}</td>
                                                <td>
                                                    {signIn ? formatTimeForDisplay(record.sign_in_time) : 'N/A'}
                                                    {signIn && (
                                                        <div className="small text-muted">
                                                            {new Date(record.sign_in_time).toLocaleDateString('en-NG')}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    {signOut ? (
                                                        <>
                                                            {formatTimeForDisplay(record.sign_out_time)}
                                                            <div className="small text-muted">
                                                                {new Date(record.sign_out_time).toLocaleDateString('en-NG')}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        'Not Signed Out'
                                                    )}
                                                </td>
                                                <td>
                                                    <Badge bg={
                                                        record.status === 'Present' ? 'badge-present' :
                                                        record.status === 'Late' ? 'badge-late' :
                                                        record.status === 'Absent' ? 'badge-absent' : 'secondary'
                                                    }>
                                                        {record.status}
                                                    </Badge>
                                                </td>
                                                <td>{hoursWorked}</td>
                                                <td>
                                                    {!record.sign_out_time && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline-primary"
                                                            onClick={() => handleSignOut(record.id)}
                                                            className="btn-action"
                                                        >
                                                            Sign Out
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Attendance Form Dialog */}
            {showAttendanceForm && (
                <div className="ppb-dialog__overlay" onClick={() => setShowAttendanceForm(false)}>
                    <div className="ppb-dialog form-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="ppb-dialog__header">
                            <h3 className="ppb-dialog__title">
                                Record New Attendance
                            </h3>
                        </div>
                        <div className="form-dialog-content">
                            <Form onSubmit={handleAttendanceSubmit}>
                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Staff Member *</Form.Label>
                                            {staffLoading ? (
                                                <div className="text-center">
                                                    <Spinner size="sm" animation="border" className="me-2" />
                                                    Loading staff list...
                                                </div>
                                            ) : (
                                                <Form.Control
                                                    as="select"
                                                    value={attendanceForm.user_id || attendanceForm.staff_member_id ? 
                                                        (attendanceForm.user_id ? `user_${attendanceForm.user_id}` : `staff_${attendanceForm.staff_member_id}`) : ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        
                                                        if (value.startsWith('user_')) {
                                                            const userId = value.replace('user_', '');
                                                            setAttendanceForm({
                                                                ...attendanceForm,
                                                                user_id: userId ? parseInt(userId) : null,
                                                                staff_member_id: null
                                                            });
                                                        } else if (value.startsWith('staff_')) {
                                                            const staffId = value.replace('staff_', '');
                                                            setAttendanceForm({
                                                                ...attendanceForm,
                                                                staff_member_id: staffId ? parseInt(staffId) : null,
                                                                user_id: null
                                                            });
                                                        } else {
                                                            setAttendanceForm({
                                                                ...attendanceForm,
                                                                user_id: null,
                                                                staff_member_id: null
                                                            });
                                                        }
                                                    }}
                                                    required
                                                >
                                                    <option value="">Select Staff Member</option>
                                                    <optgroup label="System Users">
                                                        {staffList.filter(s => s.type === 'system_user').map(staff => (
                                                            <option key={`user_${staff.id}`} value={`user_${staff.id}`}>
                                                                {staff.name} ({staff.role})
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                    <optgroup label="Staff Members (Non-System)">
                                                        {staffList.filter(s => s.type === 'staff_member').map(staff => (
                                                            <option key={`staff_${staff.id}`} value={`staff_${staff.id}`}>
                                                                {staff.name} ({staff.role || 'Staff Member'})
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                </Form.Control>
                                            )}
                                            {staffList.length === 0 && !staffLoading && (
                                                <Form.Text className="text-muted">
                                                    No staff members available. Please add staff members first.
                                                </Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Attendance Date *</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={attendanceForm.attendance_date}
                                                onChange={(e) => setAttendanceForm({...attendanceForm, attendance_date: e.target.value})}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Sign-in Time *</Form.Label>
                                            <Form.Control
                                                type="datetime-local"
                                                value={attendanceForm.sign_in_time}
                                                onChange={(e) => setAttendanceForm({...attendanceForm, sign_in_time: e.target.value})}
                                                required
                                            />
                                            <Form.Text className="text-muted">
                                                Current Nigeria time: {getCurrentNigeriaTimeDisplay()}
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Status</Form.Label>
                                            <Form.Control
                                                as="select"
                                                value={attendanceForm.status}
                                                onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
                                            >
                                                <option value="Present">Present</option>
                                                <option value="Late">Late</option>
                                                <option value="Absent">Absent</option>
                                                <option value="Half-day">Half Day</option>
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Notes</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                value={attendanceForm.notes}
                                                onChange={(e) => setAttendanceForm({...attendanceForm, notes: e.target.value})}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <div className="ppb-dialog__footer">
                                    <button
                                        type="button"
                                        className="ppb-btn ppb-btn--ghost"
                                        onClick={() => setShowAttendanceForm(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="ppb-btn"
                                        style={{background: 'var(--ppb-purple)', color: 'white'}}
                                    >
                                        Record Attendance
                                    </button>
                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Main Staff Management Component
const StaffManagement = () => {
    const [users, setUsers] = useState([]);
    const [duties, setDuties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('duties');

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

    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        dutyId: null,
        staffName: "",
        dutyDate: "",
        shiftName: ""
    });

    const [showDutyDialog, setShowDutyDialog] = useState(false);

    // --- Data Fetching ---
    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/users/for-duties`);
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users for duty assignment.');
            toast(<CustomToast type="error" message="Failed to load users for duty assignment." />);
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
            toast(<CustomToast type="error" message="Failed to load duty assignments." />);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (activeTab === 'duties') {
            fetchDuties();
        }
    }, [filters, fetchDuties, activeTab]);

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
            toast(<CustomToast type="error" message="Please fill in all required fields." />);
            setSubmitting(false);
            return;
        }

        try {
            if (isEditing) {
                await axios.put(`${API_BASE_URL}/staff/duties/${dutyFormData.id}`, dutyFormData, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setSuccessMessage('Duty assignment updated successfully!');
                toast(<CustomToast type="success" message="Duty assignment updated successfully!" />);
            } else {
                await axios.post(`${API_BASE_URL}/staff/duties`, dutyFormData, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setSuccessMessage('Duty assignment created successfully!');
                toast(<CustomToast type="success" message="Duty assignment created successfully!" />);
            }
            fetchDuties();
            handleCancelEdit();
            setShowDutyDialog(false);
        } catch (err) {
            console.error('Error saving duty assignment:', err.response?.data || err.message);
            setError('Failed to save duty assignment. ' + (err.response?.data?.error || err.message));
            toast(<CustomToast type="error" message="Failed to save duty assignment." />);
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

    const handleDeleteDuty = async (dutyId, staffName, dutyDate, shiftName) => {
        try {
            await axios.delete(`${API_BASE_URL}/staff/duties/${dutyId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSuccessMessage('Duty assignment deleted successfully!');
            toast(<CustomToast type="success" message="Duty assignment deleted successfully!" />);
            fetchDuties();
        } catch (err) {
            console.error('Error deleting duty assignment:', err.response?.data || err.message);
            setError('Failed to delete duty assignment. ' + (err.response?.data?.details || err.message));
            toast(<CustomToast type="error" message="Failed to delete duty assignment." />);
        } finally {
            setDeleteDialog({
                isOpen: false,
                dutyId: null,
                staffName: "",
                dutyDate: "",
                shiftName: ""
            });
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
        toast(<CustomToast type="info" message="Filters cleared" />);
    };

    const handleRefresh = () => {
        if (activeTab === 'duties') {
            fetchDuties();
        }
        fetchUsers();
        toast(<CustomToast type="info" message="Data refreshed" />);
    };

    const getShiftBadgeVariant = (shift) => {
        switch (shift) {
            case 'Morning': return 'success';
            case 'Afternoon': return 'warning';
            case 'Night': return 'primary';
            default: return 'secondary';
        }
    };

    // Duties Tab Content
    const DutiesTabContent = () => (
        <div>
            {error && <Alert variant="danger" className="alert-custom">{error}</Alert>}
            {successMessage && <Alert variant="success" className="alert-custom">{successMessage}</Alert>}

            {/* Quick Actions */}
            <div className="quick-actions">
                <button 
                    className="quick-action-btn primary"
                    onClick={() => setShowDutyDialog(true)}
                >
                    <FaUserPlus className="me-2" />
                    Assign New Duty
                </button>
                <button 
                    className="quick-action-btn"
                    onClick={handleRefresh}
                >
                    <FaSync className="me-2" />
                    Refresh Data
                </button>
            </div>

            {/* Duty Assignment Filters */}
            <Card className="filter-card mb-4">
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
                                        <th className="col-sn">S/N</th>
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
                                    {duties.map((duty, index) => (
                                        <tr key={`duty-${duty.id}-${index}`}>
                                            <td className="col-sn">{index + 1}</td>
                                            <td className="col-id">{duty.id}</td>
                                            <td className="col-staff">
                                                <div className="table-cell-content">
                                                    <FaUser className="icon" />
                                                    <strong>{duty.user_fullname}</strong>
                                                </div>
                                            </td>
                                            <td className="col-role">{duty.user_role}</td>
                                            <td className="col-date">
                                                <div className="table-cell-content">
                                                    <FaCalendarAlt className="icon" />
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
                                                        onClick={() => {
                                                            handleEditDuty(duty);
                                                            setShowDutyDialog(true);
                                                        }}
                                                        title="Edit Duty"
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="btn-action delete"
                                                        onClick={() => setDeleteDialog({
                                                            isOpen: true,
                                                            dutyId: duty.id,
                                                            staffName: duty.user_fullname,
                                                            dutyDate: duty.duty_date,
                                                            shiftName: duty.shift_name
                                                        })}
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

            {/* Duty Assignment Dialog */}
            {showDutyDialog && (
                <div className="ppb-dialog__overlay" onClick={() => {
                    setShowDutyDialog(false);
                    handleCancelEdit();
                }}>
                    <div className="ppb-dialog form-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="ppb-dialog__header">
                            <h3 className="ppb-dialog__title">
                                {isEditing ? 'Edit Duty Assignment' : 'Assign New Duty'}
                            </h3>
                        </div>
                        <div className="form-dialog-content">
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
                                                    <option key={user.id} value={user.id}>
                                                        {user.fullname} ({user.role}) {user.type === 'staff_member' ? '(Staff Member)' : ''}
                                                    </option>
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
                                <div className="ppb-dialog__footer">
                                    <button
                                        type="button"
                                        className="ppb-btn ppb-btn--ghost"
                                        onClick={() => {
                                            setShowDutyDialog(false);
                                            handleCancelEdit();
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="ppb-btn"
                                        style={{background: 'var(--ppb-purple)', color: 'white'}}
                                        disabled={submitting}
                                    >
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
                                    </button>
                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

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
                    Staff Management
                </h1>
                <p>Manage staff duties, attendance, and members</p>
            </div>

            <Tabs 
                activeKey={activeTab} 
                onSelect={setActiveTab} 
                className="staff-management-tabs"
                fill
            >
                <Tab eventKey="duties" title={
                    <span>
                        <FaCalendarAlt className="me-1" />
                        Duty Assignments
                    </span>
                }>
                    <DutiesTabContent />
                </Tab>
                <Tab eventKey="attendance" title={
                    <span>
                        <FaUserCheck className="me-1" />
                        Attendance
                    </span>
                }>
                    <AttendanceTab />
                </Tab>
                <Tab eventKey="staff-members" title={
                    <span>
                        <FaUser className="me-1" />
                        Staff Members
                    </span>
                }>
                    <StaffMembersTab />
                </Tab>
            </Tabs>

            <DeleteConfirmationDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({
                    isOpen: false,
                    dutyId: null,
                    staffName: "",
                    dutyDate: "",
                    shiftName: ""
                })}
                onConfirm={() => handleDeleteDuty(
                    deleteDialog.dutyId,
                    deleteDialog.staffName,
                    deleteDialog.dutyDate,
                    deleteDialog.shiftName
                )}
                staffName={deleteDialog.staffName}
                dutyDate={deleteDialog.dutyDate}
                shiftName={deleteDialog.shiftName}
            />
        </div>
    );
};

export default StaffManagement;