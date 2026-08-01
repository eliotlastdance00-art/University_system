import client from './client';

// ─── Users CRUD ────────────────────────────────────────────

export const getUsers        = ()           => client.get('/users/');
export const getUserById     = (id)         => client.get(`/users/${id}`);
export const createUser      = (data)       => client.post('/users/', data);
export const updateUser      = (id, data)   => client.patch(`/users/${id}`, data);
export const deleteUser      = (id)         => client.delete(`/users/${id}`);

// ─── Search ────────────────────────────────────────────────

export const searchUsers = (params) => client.get('/users/search', { params });

// ─── Roles ─────────────────────────────────────────────────

export const getUserRoles    = (userId)         => client.get(`/users/${userId}/roles`);
export const assignRole      = (userId, data)   => client.post(`/users/${userId}/roles`, data);
export const removeRole      = (userId, roleId) => client.delete(`/users/${userId}/roles/${roleId}`);

// ─── Section ───────────────────────────────────────────────

export const assignSection   = (userId, sectionId) =>
  client.post(`/users/${userId}/assign-section`, { section_id: sectionId });
