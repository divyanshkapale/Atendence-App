import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'member' });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        enrollmentNumber: '',
        email: '',
        contactNumber: '',
        profilePhoto: ''
    });
    const [visibleCount, setVisibleCount] = useState(3);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/auth/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/auth/register', newUser);
            setMessage({ text: 'User added successfully!', type: 'success' });
            setNewUser({ username: '', password: '', role: 'member' });
            fetchUsers();
        } catch (error) {
            setMessage({ text: error.response?.data?.error || 'Failed to add user', type: 'error' });
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This will also delete ALL their attendance records.')) {
            return;
        }

        try {
            await axios.delete(`/api/auth/users/${userId}`);
            setMessage({ text: 'User deleted successfully', type: 'success' });
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            setMessage({ text: error.response?.data?.error || 'Failed to delete user', type: 'error' });
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({
            enrollmentNumber: user.enrollmentNumber || '',
            email: user.email || '',
            contactNumber: user.contactNumber || '',
            profilePhoto: user.profilePhoto || ''
        });
        // Open modal logic (using DaisyUI modal)
        document.getElementById('edit_user_modal').showModal();
    };

    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditFormData({ ...editFormData, profilePhoto: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/auth/users/${editingUser._id}`, editFormData);
            setMessage({ text: 'User updated successfully', type: 'success' });
            fetchUsers();
            document.getElementById('edit_user_modal').close();
            setEditingUser(null);
        } catch (error) {
            console.error('Error updating user:', error);
            setMessage({ text: error.response?.data?.error || 'Failed to update user', type: 'error' });
        }
    };

    return (
        <div className="card">
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>👥 User Management</h2>

            <div style={{ marginBottom: '30px' }}>
                <h3>➕ Add New User</h3>
                {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
                <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Username"
                        value={newUser.username}
                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        className="input"
                        placeholder="Password"
                        value={newUser.password}
                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                        required
                    />
                    <select
                        className="input"
                        value={newUser.role}
                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                        required
                    >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button type="submit" className="btn">Add User</button>
                </form>
            </div>

            <button className="btn" onClick={fetchUsers}>🔄 Refresh Users</button>

            <div style={{ marginTop: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Username</th>
                            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Role</th>
                            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Created At</th>
                            <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.slice(0, visibleCount).map(user => (
                            <tr key={user._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                <td style={{ padding: '12px', fontSize: '16px' }}>{user.username}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '5px 10px',
                                        borderRadius: '15px',
                                        background: user.role === 'admin' ? '#e2e3e5' : '#d1ecf1',
                                        color: user.role === 'admin' ? '#383d41' : '#0c5460',
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                    }}>
                                        {user.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', fontSize: '16px' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td style={{ padding: '12px' }}>
                                    <button
                                        className="btn btn-sm btn-primary mr-2 text-sm"
                                        onClick={() => handleEditClick(user)}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        className="btn btn-danger text-sm"
                                        style={{ padding: '5px 10px' }}
                                        onClick={() => handleDeleteUser(user._id)}
                                    >
                                        🗑️ Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {users.length > 3 && (
                <div className="flex justify-center mt-6">
                    {visibleCount < users.length ? (
                        <button className="btn btn-outline btn-primary" onClick={() => setVisibleCount(prev => prev + 3)}>
                            View More
                        </button>
                    ) : (
                        <button className="btn btn-outline" onClick={() => setVisibleCount(3)}>
                            Show Less
                        </button>
                    )}
                </div>
            )}

            {/* Edit User Modal */}
            <dialog id="edit_user_modal" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Edit User: {editingUser?.username}</h3>
                    <form onSubmit={handleUpdateUser} className="py-4 space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Enrollment Number</span>
                            </label>
                            <input
                                type="text"
                                name="enrollmentNumber"
                                value={editFormData.enrollmentNumber}
                                onChange={handleEditChange}
                                className="input input-bordered w-full"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Email</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={editFormData.email}
                                onChange={handleEditChange}
                                className="input input-bordered w-full"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Contact Number</span>
                            </label>
                            <input
                                type="text"
                                name="contactNumber"
                                value={editFormData.contactNumber}
                                onChange={handleEditChange}
                                className="input input-bordered w-full"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Profile Photo</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="file-input file-input-bordered w-full"
                            />
                            {editFormData.profilePhoto && (
                                <div className="mt-2">
                                    <img src={editFormData.profilePhoto} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
                                </div>
                            )}
                        </div>
                        <div className="modal-action">
                            <button type="submit" className="btn btn-primary">Save Changes</button>
                            <button type="button" className="btn" onClick={() => document.getElementById('edit_user_modal').close()}>Cancel</button>
                        </div>
                    </form>
                </div>
            </dialog>
        </div>
    );
};

export default UserManagement;
