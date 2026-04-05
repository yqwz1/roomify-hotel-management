import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  LockOpen,
  Pencil,
  Power,
  PowerOff,
  UserPlus,
  Users,
} from 'lucide-react';
import ModalFrame from '../components/common/ModalFrame';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { useAuth } from '../context/AuthProvider';
import { useStaff } from '../hooks/useStaff';
import { translateKnownValue } from '../utils/localization';

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
  const { t } = useTranslation();
  const pageTx = 'staffPage';
  const inputClassName =
    'h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5';

  return (
    <ModalFrame
      title={editingId ? t(`${pageTx}.modalEditTitle`) : t(`${pageTx}.modalAddTitle`)}
      description={
        editingId ? t(`${pageTx}.modalEditDescription`) : t(`${pageTx}.modalAddDescription`)
      }
      onClose={onClose}
      closeLabel={t('closeDialog')}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {formError && (
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {formError}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            {t('emailLabel')}
          </label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={onChange}
            placeholder={t('staffEmailPlaceholder')}
            disabled={Boolean(editingId)}
            className={inputClassName}
          />
          {validationErrors.email && (
            <p className="text-sm font-medium text-rose-900">{validationErrors.email}</p>
          )}
          <p className="text-sm font-medium text-zinc-500">
            {editingId ? t(`${pageTx}.emailNoteEdit`) : t(`${pageTx}.emailNoteCreate`)}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            {t('fullNameLabel')}
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={onChange}
            placeholder={t('staffPage.namePlaceholder')}
            className={inputClassName}
          />
          {validationErrors.name && (
            <p className="text-sm font-medium text-rose-900">{validationErrors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            {t('departmentLabel')}
          </label>
          <input
            name="department"
            value={formData.department}
            onChange={onChange}
            placeholder={t('staffPage.departmentPlaceholder')}
            className={inputClassName}
          />
          {validationErrors.department && (
            <p className="text-sm font-medium text-rose-900">{validationErrors.department}</p>
          )}
        </div>

        {!editingId && (
          <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-600">
            {t(`${pageTx}.passwordNote`)}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
          >
            {isSubmitting
              ? editingId
                ? t('updatingMsg')
                : t('creatingMsg')
              : editingId
                ? t('updateStaffBtn')
                : t('createStaffBtn')}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

export default function Staff() {
  const { t } = useTranslation();
  const pageTx = 'staffPage';
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
      setSuccessMessage(editingId ? t('staffUpdated') : t('staffCreated'));
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
    if (!window.confirm(t('confirmActivate', { name: staffMember.name }))) return;

    const result = await activateStaff(staffMember.id);
    if (result.success) {
      setSuccessMessage(t(`${pageTx}.activatedSuccess`));
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    setPageError(result.error);
    setTimeout(() => setPageError(null), 4000);
  };

  const handleDeactivate = async (staffMember) => {
    if (!window.confirm(t('confirmDeactivate', { name: staffMember.name }))) return;

    const result = await deactivateStaff(staffMember.id);
    if (result.success) {
      setSuccessMessage(t(`${pageTx}.deactivatedSuccess`));
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    setPageError(result.error);
    setTimeout(() => setPageError(null), 4000);
  };

  const handleUnlock = async (staffMember) => {
    if (!window.confirm(t(`${pageTx}.confirmUnlock`, { name: staffMember.name }))) return;

    const result = await unlockStaff(staffMember.id);
    if (result.success) {
      setSuccessMessage(t(`${pageTx}.unlockedSuccess`));
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
        ? (member.department ?? '').toLowerCase().includes(filters.department.toLowerCase())
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

  const summary = useMemo(
    () => ({
      total: staff.length,
      active: staff.filter((member) => member.active).length,
      inactive: staff.filter((member) => !member.active).length,
      departments: new Set(staff.map((member) => member.department).filter(Boolean)).size,
    }),
    [staff]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow={t(`${pageTx}.heroEyebrow`)}
        title={t('staffManagementTitle')}
        description={t('staffManagementDesc')}
        meta={[
          t('staffPage.totalMeta', { count: summary.total }),
          t('staffPage.activeMeta', { count: summary.active }),
          t('staffPage.departmentsMeta', { count: summary.departments }),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {t(`${pageTx}.teamSnapshot`)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t(`${pageTx}.active`)}
              </p>
              <p className="mt-2 text-lg font-black">{summary.active}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t(`${pageTx}.inactive`)}
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
          {t(`${pageTx}.addStaff`)}
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
        title={t(`${pageTx}.addFiltersTitle`)}
        description={t(`${pageTx}.addFiltersDescription`)}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              {t('searchLabel')}
            </label>
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              placeholder={t('staffPage.searchPlaceholder')}
              className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              {t('departmentLabel')}
            </label>
            <input
              value={filters.department}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, department: event.target.value }))
              }
              placeholder={t('deptPlaceholder')}
              className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              {t(`${pageTx}.accountState`)}
            </label>
            <select
              value={filters.active}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, active: event.target.value }))
              }
              className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              <option value="all">{t('allStaff')}</option>
              <option value="true">{t('activeOnly')}</option>
              <option value="false">{t('inactiveOnly')}</option>
            </select>
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel
        title={t(`${pageTx}.directoryTitle`)}
        description={t(`${pageTx}.directoryDescription`, { count: filteredStaff.length })}
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
            <p className="mt-4 text-lg font-black text-zinc-950">{t(`${pageTx}.noStaffTitle`)}</p>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              {t(`${pageTx}.noStaffDescription`)}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[1.5rem] border border-zinc-200">
            <table className="min-w-full border-collapse">
              <thead className="bg-zinc-50">
                <tr>
                  {[t(`${pageTx}.tableDetails`), t(`${pageTx}.tableDepartment`), t(`${pageTx}.tableStatus`), t(`${pageTx}.tableActions`)].map((heading) => (
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
                                {t(`${pageTx}.you`)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-zinc-500">{member.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700">
                          <Briefcase className="h-4 w-4 text-zinc-400" />
                          {translateKnownValue(member.department || '-', t)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {member.active ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-900">
                            {t(`${pageTx}.active`)}
                          </span>
                        ) : (
                          <span className="rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-zinc-600">
                            {t(`${pageTx}.inactive`)}
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
                            {t(`${pageTx}.edit`)}
                          </button>

                          {member.active ? (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(member)}
                              disabled={isCurrentUser}
                              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                            >
                              <PowerOff className="h-4 w-4" />
                              {t(`${pageTx}.deactivate`)}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivate(member)}
                              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-800"
                            >
                              <Power className="h-4 w-4" />
                              {t(`${pageTx}.activate`)}
                            </button>
                          )}

                          {isManager && (
                            <button
                              type="button"
                              onClick={() => handleUnlock(member)}
                              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
                            >
                              <LockOpen className="h-4 w-4" />
                              {t(`${pageTx}.unlock`)}
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
