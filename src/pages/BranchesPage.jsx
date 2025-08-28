// purple-premium-bread-ui/src/pages/BranchesPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Form, Button, Table, Alert } from 'react-bootstrap';
import { format } from 'date-fns'; // for date formatting

const BranchesPage = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        phone: '',
        address: '',
    });

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/branches');
            setBranches(response.data);
        } catch (err) {
            setError('Failed to fetch branches.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/branches', formData);
            setFormData({ name: '', contact_person: '', phone: '', address: '' });
            fetchBranches(); // Refresh the list
        } catch (err) {
            setError('Failed to register branch.');
        }
    };

    if (loading) return <Container>Loading...</Container>;

    return (
        <Container>
            <h2 className="my-4">Manage Branches</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Card className="mb-4">
                <Card.Header as="h5">Register New Branch</Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Branch Name</Form.Label>
                            <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Contact Person</Form.Label>
                            <Form.Control type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Phone</Form.Label>
                            <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control as="textarea" rows={3} name="address" value={formData.address} onChange={handleChange} />
                        </Form.Group>
                        <Button variant="primary" type="submit">Register Branch</Button>
                    </Form>
                </Card.Body>
            </Card>

            <h3 className="my-4">Registered Branches</h3>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Contact Person</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    {branches.map(branch => (
                        <tr key={branch.id}>
                            <td>{branch.name}</td>
                            <td>{branch.contact_person}</td>
                            <td>{branch.phone}</td>
                            <td>{branch.address}</td>
                            <td>{format(new Date(branch.created_at), 'MM/dd/yyyy')}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
};

export default BranchesPage;