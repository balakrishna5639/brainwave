import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AuditLogsTable from '../components/AuditLogsTable';
import UserManagementModal from '../components/UserManagementModal';
import { Users, Shield, FileText, CloudLightning, UserPlus, Edit2, Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [zohoDiag, setZohoDiag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Modal states
  const [modalUser, setModalUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Delete confirmation state
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, diagRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/roles'),
        api.get('/zoho/status')
      ]);
      setUsers(usersRes.data.users || []);
      setRoles(rolesRes.data.roles || []);
      setZohoDiag(diagRes.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      setFeedback({ type: 'success', message: `User "${userToDelete.name}" was successfully deleted.` });
      setUserToDelete(null);
      await fetchAdminData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to delete user.' });
      setUserToDelete(null);
    } finally {
      setIsDeleting(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      
      {/* Admin Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
            Administration
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-subtle)' }}>
            User directory, RBAC role matrix, audit logging, and Zoho service account status.
          </p>
        </div>

        <button onClick={fetchAdminData} disabled={loading} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
          <RefreshCw style={{ width: '0.85rem', height: '0.85rem', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.35rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', borderBottom: 'none', padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
        >
          <Users style={{ width: '0.9rem', height: '0.9rem' }} />
          Users ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`btn ${activeTab === 'roles' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', borderBottom: 'none', padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
        >
          <Shield style={{ width: '0.9rem', height: '0.9rem' }} />
          Roles & Permissions
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', borderBottom: 'none', padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
        >
          <FileText style={{ width: '0.9rem', height: '0.9rem' }} />
          Audit Logs
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`btn ${activeTab === 'diagnostics' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', borderBottom: 'none', padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
        >
          <CloudLightning style={{ width: '0.9rem', height: '0.9rem' }} />
          Zoho OAuth Diagnostics
        </button>
      </div>

      {/* TAB 1: User Management */}
      {activeTab === 'users' && (
        <div className="card" style={{ background: '#FFFFFF' }}>
          {feedback && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: feedback.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
              border: `1px solid ${feedback.type === 'success' ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`,
              color: feedback.type === 'success' ? 'var(--status-success-text)' : 'var(--status-danger-text)',
              fontSize: '0.8125rem',
              marginBottom: '1rem'
            }}>
              {feedback.type === 'success' ? (
                <CheckCircle2 style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
              ) : (
                <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Employee Directory</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                System user accounts stored in PostgreSQL.
              </p>
            </div>
            <button
              onClick={() => { setModalUser(null); setIsModalOpen(true); }}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem', padding: '0.45rem 0.75rem' }}
            >
              <UserPlus style={{ width: '0.9rem', height: '0.9rem' }} />
              Add User
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Department</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleName = Array.isArray(u.roles) && u.roles[0] 
                    ? (typeof u.roles[0] === 'string' ? u.roles[0] : u.roles[0].name) 
                    : 'None';
                  const isSelf = currentUser && (currentUser.id === u.id || currentUser.email === u.email);

                  return (
                    <tr key={u.id} style={{ background: isSelf ? '#F8FAFC' : 'transparent' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</span>
                          {isSelf && (
                            <span style={{
                              fontSize: '0.675rem',
                              fontWeight: 600,
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE',
                              padding: '0.05rem 0.35rem',
                              borderRadius: '4px'
                            }}>
                              You
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{u.email}</div>
                      </td>
                      <td>{u.department}</td>
                      <td>
                        <span className={`badge ${
                          roleName === 'Admin' ? 'badge-admin' :
                          roleName === 'HR' ? 'badge-hr' :
                          roleName === 'Sales' ? 'badge-sales' :
                          roleName === 'Support' ? 'badge-support' :
                          roleName === 'Finance' ? 'badge-finance' : 'badge-secondary'
                        }`}>
                          {roleName}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: u.status === 'ACTIVE' ? 'var(--status-success-text)' : 'var(--status-danger-text)'
                        }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => { setModalUser(u); setIsModalOpen(true); }}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.5rem' }}
                            title="Edit User"
                          >
                            <Edit2 style={{ width: '0.8rem', height: '0.8rem' }} />
                          </button>

                          {isSelf ? (
                            <button
                              disabled
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.5rem', opacity: 0.35, cursor: 'not-allowed' }}
                              title="Cannot delete your own administrator account"
                            >
                              <Trash2 style={{ width: '0.8rem', height: '0.8rem' }} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="btn btn-danger"
                              style={{ padding: '0.3rem 0.5rem' }}
                              title="Delete User"
                            >
                              <Trash2 style={{ width: '0.8rem', height: '0.8rem' }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Roles & Permissions Matrix */}
      {activeTab === 'roles' && (
        <div className="card" style={{ background: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            RBAC Permission Hierarchy & Zoho Application Mapping
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-subtle)', marginBottom: '1.25rem' }}>
            Roles and their assigned permissions stored across junction tables in PostgreSQL.
          </p>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {roles.map((r) => (
              <div key={r.id} style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{r.name}</h4>
                    <span className="badge badge-secondary">{r.permissions?.length || 0} permissions</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Role #{r.id}</span>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                  {r.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {r.permissions?.map((p) => (
                    <span
                      key={p.code}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: '#FFFFFF',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)'
                      }}
                    >
                      {p.name} (<code>{p.code}</code>)
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Audit Logs */}
      {activeTab === 'audit' && (
        <AuditLogsTable />
      )}

      {/* TAB 4: Zoho OAuth Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="card" style={{ background: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Zoho OAuth2 Service Account Status
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-subtle)', marginBottom: '1.25rem' }}>
            Live status of backend service account authentication and token caching.
          </p>

          {zohoDiag ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.2rem' }}>Integration Mode</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 600, color: zohoDiag.isLive ? 'var(--status-success-text)' : 'var(--status-warning-text)' }}>
                  {zohoDiag.mode}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {zohoDiag.isLive
                    ? 'Connected to live Zoho Developer Console service account.'
                    : 'Simulation mode active.'}
                </p>
              </div>

              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.2rem' }}>Access Token Cache</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 600, color: zohoDiag.hasToken ? 'var(--status-success-text)' : 'var(--text-muted)' }}>
                  {zohoDiag.hasToken ? 'Active & Cached' : 'Refreshes on Demand'}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  TTL: {zohoDiag.tokenTtlSeconds}s (refreshes 5 mins before expiry)
                </p>
              </div>

              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.2rem' }}>Accounts URL</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                  {zohoDiag.config?.accountsUrl}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.5rem', marginBottom: '0.2rem' }}>API Domain</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                  {zohoDiag.config?.apiDomain}
                </div>
              </div>
            </div>
          ) : (
            <p>Loading diagnostics...</p>
          )}
        </div>
      )}

      {/* User Modal */}
      {isModalOpen && (
        <UserManagementModal
          user={modalUser}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchAdminData}
        />
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="modal-overlay" onClick={() => !isDeleting && setUserToDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Confirm User Deletion
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Are you sure you want to delete employee <strong>{userToDelete.name}</strong> (<code>{userToDelete.email}</code>)? This will revoke all assigned roles and portal access.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem' }}
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={confirmDeleteUser}
                className="btn btn-danger"
                style={{ padding: '0.45rem 0.85rem' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
