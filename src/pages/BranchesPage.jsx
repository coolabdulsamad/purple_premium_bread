// BranchesPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Form, Button, Table, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import { FaStore, FaUser, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaPlus, FaSync, FaBuilding, FaRegBuilding, FaEdit, FaTrash, FaTimes, FaSave } from 'react-icons/fa';
import { format } from 'date-fns';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/styles/branches.css';
import CustomToast from '../components/CustomToast';

const BranchesPage = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        contact_person: '',
        phone: '',
        address: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // API base URL - adjust this to match your backend
    const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/branches`);
            setBranches(response.data);
            // toast.success('Branches loaded successfully');
            // toast(
            //     <CustomToast
            //         type="success"
            //         message="Branches loaded successfully"
            //     />
            // );
            toast(<CustomToast id={`success-branches-${Date.now()}`} type="success" message="Branches loaded successfully" />, {
                toastId: 'branches-success'
            });
        } catch (err) {
            const errorMsg = 'Failed to fetch branches. Please make sure the backend server is running.';
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(
            //     <CustomToast
            //         type="error"
            //         message={errorMsg}
            //     />
            // );
            toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'e-error'
            });
            console.error('Error fetching branches:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            id: '',
            name: '',
            contact_person: '',
            phone: '',
            address: '',
        });
        setIsEditing(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            if (isEditing) {
                // Update existing branch
                await axios.put(`${API_BASE_URL}/branches/${formData.id}`, formData);
                const successMsg = 'Branch updated successfully!';
                setSuccess(successMsg);
                // toast.success(successMsg);
                // toast(
                //     <CustomToast
                //         type="success"
                //         message={successMsg}
                //     />
                // );
                toast(<CustomToast id={`success-s-${Date.now()}`} type="success" message={successMsg} />, {
                    toastId: 's-success'
                });
            } else {
                // Create new branch
                await axios.post(`${API_BASE_URL}/branches`, formData);
                const successMsg = 'Branch registered successfully!';
                setSuccess(successMsg);
                // toast.success(successMsg);
                // toast(
                //     <CustomToast
                //         type="success"
                //         message={successMsg}
                //     />
                // );
                toast(<CustomToast id={`success-s-${Date.now()}`} type="success" message={successMsg} />, {
                    toastId: 's-success'
                });
            }

            resetForm();
            fetchBranches();
        } catch (err) {
            const errorMsg = err.response?.data?.error ||
                (isEditing ? 'Failed to update branch.' : 'Failed to register branch.') +
                ' Please check your backend connection.';
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(
            //     <CustomToast
            //         type="error"
            //         message={errorMsg}
            //     />
            // );
            toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'e-error'
            });
            console.error('Error saving branch:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (branch) => {
        setFormData({ ...branch });
        setIsEditing(true);
    };

    const handleDelete = async (branchId, branchName) => {
        if (window.confirm(`Are you sure you want to delete "${branchName}"? This action cannot be undone.`)) {
            setDeleting(true);
            try {
                await axios.delete(`${API_BASE_URL}/branches/${branchId}`);
                // toast.success('Branch deleted successfully!');
                // toast(
                //     <CustomToast
                //         type="success"
                //         message="Branch deleted successfully!"
                //     />
                // );
                toast(<CustomToast id={`success-deleted-${Date.now()}`} type="success" message="Branch deleted successfully!" />, {
                    toastId: 'deleted-success'
                });
                fetchBranches();
            } catch (err) {
                const errorMsg = err.response?.data?.error || 'Failed to delete branch. Please check your backend connection.';
                // toast.error(errorMsg);
                // toast(
                //     <CustomToast
                //         type="error"
                //         message={errorMsg}
                //     />
                // );
                toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                    toastId: 'e-error'
                });
                console.error('Error deleting branch:', err);
            } finally {
                setDeleting(false);
            }
        }
    };

    const handleRefresh = () => {
        fetchBranches();
        // toast.info('Refreshing branches list...');
        // toast(
        //     <CustomToast
        //         type="info"
        //         message="Refreshing branches list..."
        //     />
        // );
        toast(<CustomToast id={`info-refresh-${Date.now()}`} type="info" message="Refreshing branches list..." />, {
            toastId: 'refresh-info'
        });
    };

    return (
        <div className="branches-container">
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

            <div className="branches-header">
                <h2>
                    <FaBuilding className="me-2" />
                    Manage Branches
                </h2>
                <p className="mb-0">Register and manage all your business branches</p>
            </div>

            {error && <Alert variant="danger" className="alert-custom">{error}</Alert>}
            {success && <Alert variant="success" className="alert-custom">{success}</Alert>}

            <Row>
                <Col lg={5}>
                    <Card className="branch-card">
                        <Card.Header className="card-header-custom">
                            {isEditing ? (
                                <>
                                    <FaEdit className="me-2" />
                                    Edit Branch
                                </>
                            ) : (
                                <>
                                    <FaPlus className="me-2" />
                                    Register New Branch
                                </>
                            )}
                        </Card.Header>
                        <Card.Body className="branch-form">
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaStore className="me-1" />
                                        Branch Name
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter branch name"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaUser className="me-1" />
                                        Contact Person
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="contact_person"
                                        value={formData.contact_person}
                                        onChange={handleChange}
                                        placeholder="Enter contact person's name"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FaPhone className="me-1" />
                                        Phone Number
                                    </Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        <FaMapMarkerAlt className="me-1" />
                                        Address
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Enter full address"
                                    />
                                </Form.Group>

                                <div className="d-flex gap-3 flex-wrap">
                                    <Button
                                        variant="outline-primary"
                                        type="submit"
                                        className="btn-primary-custom"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                {isEditing ? 'Updating...' : 'Registering...'}
                                            </>
                                        ) : (
                                            <>
                                                {isEditing ? (
                                                    <>
                                                        <FaSave className="me-1" />
                                                        Update Branch
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaPlus className="me-1" />
                                                        Register Branch
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </Button>

                                    {isEditing && (
                                        <Button
                                            variant="outline-secondary"
                                            onClick={resetForm}
                                            disabled={submitting}
                                        >
                                            <FaTimes className="me-1" />
                                            Cancel Edit
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline-secondary"
                                        onClick={handleRefresh}
                                        disabled={loading}
                                    >
                                        <FaSync className="me-1" />
                                        Refresh
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={7}>
                    <Card className="branch-card">
                        <Card.Header className="card-header-custom">
                            <FaRegBuilding className="me-2" />
                            Registered Branches
                            <Badge bg="light" text="dark" className="ms-2">
                                {branches.length}
                            </Badge>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="loading-container">
                                    <div className="loading-spinner"></div>
                                    <p>Loading branches...</p>
                                </div>
                            ) : branches.length === 0 ? (
                                <div className="empty-state">
                                    <FaRegBuilding className="empty-state-icon" />
                                    <h4>No Branches Found</h4>
                                    <p>Register your first branch to get started</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table striped bordered hover className="branches-table">
                                        <thead>
                                            <tr>
                                                <th className="serial-number">S/N</th>
                                                <th>Name</th>
                                                <th>Contact Person</th>
                                                <th>Phone</th>
                                                <th>Address</th>
                                                <th>Created At</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {branches.map((branch, index) => (
                                                <tr key={branch.id}>
                                                    <td className="serial-number">{index + 1}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <FaStore className="me-2 text-primary" />
                                                            <strong>{branch.name}</strong>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {branch.contact_person ? (
                                                            <div className="d-flex align-items-center">
                                                                <FaUser className="me-2 text-muted" />
                                                                <span>{branch.contact_person}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">Not specified</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {branch.phone ? (
                                                            <div className="d-flex align-items-center">
                                                                <FaPhone className="me-2 text-muted" />
                                                                {branch.phone}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">Not specified</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {branch.address ? (
                                                            <div className="d-flex align-items-center">
                                                                <FaMapMarkerAlt className="me-2 text-muted" />
                                                                <span className="address-cell">
                                                                    {branch.address}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">Not specified</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <FaCalendarAlt className="me-2 text-muted" />
                                                            {format(new Date(branch.created_at), 'MMM dd, yyyy')}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <Button
                                                                variant='outline-secondary'
                                                                className="btn-action edit"
                                                                onClick={() => handleEdit(branch)}
                                                                title="Edit Branch"
                                                            >
                                                                <FaEdit />
                                                            </Button>
                                                            <Button
                                                                className="btn-action delete"
                                                                onClick={() => handleDelete(branch.id, branch.name)}
                                                                title="Delete Branch"
                                                                disabled={deleting}
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
                </Col>
            </Row>
        </div>
    );
};

export default BranchesPage;