import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'member' });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        username: '',
        enrollmentNumber: '',
        email: '',
        contactNumber: '',
        profilePhoto: '',
        password: ''
    });
    const [visibleCount, setVisibleCount] = useState(3);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (termOverride = null) => {
        setIsLoading(true);
        try {
            // If termOverride is a string (e.g. from clear search), use it.
            // Otherwise (null, undefined, or Event object from click), use current state.
            const term = typeof termOverride === 'string' ? termOverride : searchTerm;
            const params = {};
            if (term) params.search = term;

            const response = await axios.get('/api/auth/users', { params });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setMessage({ text: 'Failed to fetch users', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers();
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        fetchUsers('');
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
            username: user.username || '',
            enrollmentNumber: user.enrollmentNumber || '',
            email: user.email || '',
            contactNumber: user.contactNumber || '',
            profilePhoto: user.profilePhoto || '',
            password: ''
        });
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
        <div className="p-2 md:p-6 max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-primary">👥 User Management</h2>

            <div className="card bg-base-100 shadow-xl mb-8">
                <div className="card-body p-4 md:p-6">
                    <h3 className="card-title mb-4 text-lg">➕ Add New User</h3>
                    {message.text && (
                        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-4 text-sm`}>
                            <span>{message.text}</span>
                        </div>
                    )}
                    <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="form-control w-full md:flex-1">
                            <label className="label py-1"><span className="label-text">Username</span></label>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                placeholder="Username"
                                value={newUser.username}
                                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-control w-full md:flex-1">
                            <label className="label py-1"><span className="label-text">Password</span></label>
                            <input
                                type="password"
                                className="input input-bordered w-full"
                                placeholder="Password"
                                value={newUser.password}
                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-control w-full md:flex-initial">
                            <label className="label py-1"><span className="label-text">Role</span></label>
                            <select
                                className="select select-bordered w-full"
                                value={newUser.role}
                                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                required
                            >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary w-full md:w-auto mt-2 md:mt-0">Add User</button>
                    </form>
                </div>
            </div>

            {/* Search Section */}
            <div className="card bg-base-100 shadow-xl mb-8">
                <div className="card-body p-4 md:p-6">
                    <h3 className="card-title mb-4 text-lg">🔍 Search Students</h3>
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Search by Name, Enrollment No, or Phone..."
                            className="input input-bordered w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="btn btn-secondary w-full md:w-auto" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Searching...
                                </>
                            ) : (
                                'Search'
                            )}
                        </button>
                        {searchTerm && !isLoading && (
                            <button type="button" className="btn btn-ghost w-full md:w-auto" onClick={handleClearSearch}>
                                Clear
                            </button>
                        )}
                    </form>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Current Users ({users.length})</h3>
                <button className="btn btn-sm btn-outline gap-2" onClick={() => fetchUsers()} disabled={isLoading}>
                    <span className={isLoading ? "loading loading-spinner loading-xs" : ""}></span>
                    <span className="hidden md:inline">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto bg-base-100 rounded-box shadow">
                        <table className="table w-full">
                            <thead>
                                <tr className="bg-base-200">
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.slice(0, visibleCount).map(user => (
                                    <tr key={user._id} className="hover">
                                        <td className="font-medium text-base">{user.username}</td>
                                        <td>
                                            <div className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'} badge-outline font-bold`}>
                                                {user.role.toUpperCase()}
                                            </div>
                                        </td>
                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="space-x-2">
                                            <button
                                                className="btn btn-sm btn-info btn-outline"
                                                onClick={() => handleEditClick(user)}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                className="btn btn-sm btn-error btn-outline"
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

                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
                        {users.slice(0, visibleCount).map(user => (
                            <div key={user._id} className="card bg-base-100 shadow-md">
                                <div className="card-body p-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="card-title text-lg">{user.username}</h3>
                                        <div className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'} badge-outline`}>
                                            {user.role.toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="text-sm opacity-70 mt-2">
                                        <p>📅 Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="card-actions justify-end mt-4">
                                        <button
                                            className="btn btn-sm btn-info btn-outline flex-1"
                                            onClick={() => handleEditClick(user)}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            className="btn btn-sm btn-error btn-outline flex-1"
                                            onClick={() => handleDeleteUser(user._id)}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {users.length > 3 && (
                        <div className="flex justify-center mt-6 mb-8">
                            {visibleCount < users.length ? (
                                <button className="btn btn-outline btn-primary w-full md:w-auto" onClick={() => setVisibleCount(prev => prev + 3)}>
                                    View More Users
                                </button>
                            ) : (
                                <button className="btn btn-outline w-full md:w-auto" onClick={() => setVisibleCount(3)}>
                                    Show Less
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {!isLoading && users.length === 0 && (
                <div className="text-center py-10 opacity-70">
                    <p>No users found.</p>
                </div>
            )}

            {/* Edit User Modal */}
            <dialog id="edit_user_modal" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Edit User: {editingUser?.username}</h3>
                    <form onSubmit={handleUpdateUser} className="py-4 space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Username (Name)</span>
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={editFormData.username}
                                onChange={handleEditChange}
                                className="input input-bordered w-full"
                                required
                            />
                        </div>
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
                                <span className="label-text">New Password (leave blank to keep current)</span>
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={editFormData.password || ''}
                                onChange={handleEditChange}
                                className="input input-bordered w-full"
                                placeholder="Enter new password to change"
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
                                <div className="mt-2 flex justify-center">
                                    <img src={editFormData.profilePhoto} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
                                </div>
                            )}
                        </div>
                        <div className="modal-action">
                            <button type="submit" className="btn btn-primary">Save Changes</button>
                            <button type="button" className="btn" onClick={() => document.getElementById('edit_user_modal').close()}>Cancel</button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
};

export default UserManagement;
