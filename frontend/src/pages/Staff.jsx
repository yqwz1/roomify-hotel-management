import { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  LockOpen,
  Pencil,
  Power,
  PowerOff,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStaff } from '../hooks/useStaff';
import { useAuth } from '../context/AuthProvider';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';

const tOr = (t, key, fallback, options) => {
  const value = t(key, options);
  return value === key ? fallback : value;
};

function ModalFrame({ title, description, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-black/5 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">{title}</h2>
            {description && (
              <p className="mt-1 text-sm font-medium text-zinc-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-50 hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function StaffFormModal({
  editingId,
  formData,
  validationErrors,
  formError,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}) {
  const inputClassName =
    'h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5';

  return (
    <ModalFrame
      title={editingId ? 'Edit Staff Member' : 'Add Staff Member'}
      description={
        editingId
          ? 'Update the staff profile details that front-desk managers can maintain here.'
          : 'Create a staff account. The backend still generates and emails the password automatically.'
      }
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {formError && (
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {formError}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            Email
          </label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={onChange}
            placeholder="staff@example.com"
            disabled={Boolean(editingId)}
            className={inputClassName}
          />
          {validationErrors.email && (
            <p className="text-sm font-medium text-rose-900">{validationErrors.email}</p>
          )}
          <p className="text-sm font-medium text-zinc-500">
            {editingId
              ? 'Email cannot be changed after account creation.'
              : 'A welcome email with credentials will be sent to this address.'}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            Full Name
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={onChange}
            placeholder="e.g. John Doe"
            className={inputClassName}
          />
          {validationErrors.name && (
            <p className="text-sm font-medium text-rose-900">{validationErrors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            Department
          </label>
          <input
            name="department"
            value={formData.department}
            onChange={onChange}
            placeholder="e.g. Front Desk, Housekeeping"
            className={inputClassName}
          />
          {validationErrors.department && (
            <p className="text-sm font-medium text-rose-900">{validationErrors.department}</p>
          )}
        </div>

        {!editingId && (
          <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-600">
            Password creation remains backend-controlled. This screen creates the account and
            sends the email workflow.
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
          >
            {isSubmitting
              ? editingId
                ? 'Updating...'
                : 'Creating...'
              : editingId
                ? 'Update Staff'
                : 'Create Staff'}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

export default function Staff() {
  const { t } = useTranslation();
  const {
    staff,
    loading,
    error,
    fetchStaff,
    createStaff,
    updateStaff,
    deactivateStaff,
    activateStaff,
    unlockStaff,
  } = useStaff();
  const { user, hasRole } = useAuth();

  const currentUserEmail = user?.email;
  const isManager = hasRole('ROLE_MANAGER');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pageError, setPageError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    department: '',
    active: 'all',
  });

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    department: '',
  });
  const [formError, setFormError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const resetForm = () => {
    setFormData({ email: '', name: '', department: '' });
    setFormError(null);
    setValidationErrors({});
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleEdit = (staffMember) => {
    setFormData({
      email: staffMember.email,
      name: staffMember.name,
      department: staffMember.department,
    });
    setEditingId(staffMember.id);
    setFormError(null);
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setValidationErrors({});
    setIsSubmitting(true);

    const result = editingId
      ? await updateStaff(editingId, {
          name: formData.name,
          department: formData.department,
        })
      : await createStaff(formData);

    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(
        editingId
          ? tOr(t, 'staffUpdated', 'Staff updated successfully!')
          : tOr(
              t,
              'staffCreated',
              'Staff created successfully. A welcome email has been sent.'
            )
      );
      setIsModalOpen(false);
      resetForm();
      setTimeout(() => setSuccessMessage(null), 4000);
      return;
    }

    setFormError(result.error);
    if (result.validationErrors) {
      setValidationErrors(result.validationErrors);
    }
  };

  const handleActivate = async (staffMember) => {
    if (
      !window.confirm(
        tOr(
          t,
          'confirmActivate',
          `Activate ${staffMember.name}'s account?`,
          { name: staffMember.name }
        )
      )
    ) {
      return;
    }

    const result = await activateStaff(staffMember.id);
    if (result.success) {
      setSuccessMessage('Staff account activated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    setPageError(result.error);
    setTimeout(() => setPageError(null), 4000);
  };

  const handleDeactivate = async (staffMember) => {
    if (
      !window.confirm(
        tOr(
          t,
          'confirmDeactivate',
          `Deactivate ${staffMember.name}'s account?`,
          { name: staffMember.name }
        )
      )
    ) {
      return;
    }

    const result = await deactivateStaff(staffMember.id);
    if (result.success) {
      setSuccessMessage('Staff account deactivated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    setPageError(result.error);
    setTimeout(() => setPageError(null), 4000);
  };

  const handleUnlock = async (staffMember) => {
    if (
      !window.confirm(
        `Unlock ${staffMember.name}'s account and reset failed login attempts?`
      )
    ) {
      return;
    }

    const result = await unlockStaff(staffMember.id);
    if (result.success) {
      setSuccessMessage('Account unlocked successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    setPageError(result.error);
    setTimeout(() => setPageError(null), 4000);
  };

  const filteredStaff = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    return staff.filter((member) => {
      const matchesSearch = searchTerm
        ? (member.name ?? '').toLowerCase().includes(searchTerm) ||
          (member.email ?? '').toLowerCase().includes(searchTerm)
        : true;
      const matchesDepartment = filters.department
        ? (member.department ?? '')
            .toLowerCase()
            .includes(filters.department.toLowerCase())
        : true;
      const matchesActive =
        filters.active === 'all'
          ? true
          : filters.active === 'true'
            ? member.active === true
            : member.active === false;

      return matchesSearch && matchesDepartment && matchesActive;
    });
  }, [staff, filters]);

  const summary = useMemo(() => {
    return {
      total: staff.length,
      active: staff.filter((member) => member.active).length,
      inactive: staff.filter((member) => !member.active).length,
      departments: new Set(staff.map((member) => member.department).filter(Boolean)).size,
    };
  }, [staff]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow="Access Control"
        title={tOr(t, 'staffManagementTitle', 'Staff Management')}
        description={tOr(
          t,
          'staffManagementDesc',
          'Manage front-desk staff profiles, account activation, and account recovery actions.'
        )}
        meta={[
          `${summary.total} staff total`,
          `${summary.active} active`,
          `${summary.departments} departments`,
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            Team Snapshot
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Active
              </p>
              <p className="mt-2 text-lg font-black">{summary.active}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Inactive
              </p>
              <p className="mt-2 text-lg font-black">{summary.inactive}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
        >
          <UserPlus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {successMessage && (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {successMessage}
        </div>
      )}

      {(error || pageError) && (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
          {pageError || error}
        </div>
      )}

      <DashboardPanel
        title="Staff Filters"
        description="Filter by name, email, department, or account state."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              Search
            </label>
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              placeholder="Name or email"
              className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              Department
            </label>
            <input
              value={filters.department}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, department: event.target.value }))
              }
              placeholder="e.g. Front Desk"
              className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              Account State
            </label>
            <select
              value={filters.active}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, active: event.target.value }))
              }
              className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              <option value="all">All Staff</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Staff Directory"
        description={`${filteredStaff.length} staff member${filteredStaff.length === 1 ? '' : 's'} match the current filters.`}
      >
        {loading && !staff.length ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-zinc-100" />
            ))}
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 text-center">
            <Users className="mx-auto h-10 w-10 text-zinc-400" />
            <p className="mt-4 text-lg font-black text-zinc-950">No staff found</p>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              Adjust the current filters or create a new staff member.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[1.5rem] border border-zinc-200">
            <table className="min-w-full border-collapse">
              <thead className="bg-zinc-50">
                <tr>
                  {['Details', 'Department', 'Status', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-4 text-left text-xs font-black uppercase tracking-[0.18em] text-zinc-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {filteredStaff.map((member) => {
                  const isCurrentUser = member.email === currentUserEmail;

                  return (
                    <tr key={member.id}>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-zinc-950">{member.name}</p>
                            {isCurrentUser && (
                              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-zinc-500">{member.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700">
                          <Briefcase className="h-4 w-4 text-zinc-400" />
                          {member.department || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {member.active ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-900">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-zinc-600">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(member)}
                            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          {member.active ? (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(member)}
                              disabled={isCurrentUser}
                              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                            >
                              <PowerOff className="h-4 w-4" />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivate(member)}
                              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-800"
                            >
                              <Power className="h-4 w-4" />
                              Activate
                            </button>
                          )}

                          {isManager && (
                            <button
                              type="button"
                              onClick={() => handleUnlock(member)}
                              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
                            >
                              <LockOpen className="h-4 w-4" />
                              Unlock
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
        )}
      </DashboardPanel>

      {isModalOpen && (
        <StaffFormModal
          editingId={editingId}
          formData={formData}
          validationErrors={validationErrors}
          formError={formError}
          isSubmitting={isSubmitting}
          onChange={handleInputChange}
          onClose={() => {
            setIsModalOpen(false);
            resetForm();
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
