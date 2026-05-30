import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  LockOpen,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import ModalFrame from '../components/common/ModalFrame';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { useAuth } from '../context/AuthProvider';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useStaff } from '../hooks/useStaff';
import { translateKnownValue, translateWithFallback } from '../utils/localization';

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
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
    'h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5';

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
          <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
            {formError}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
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
            <p className="text-sm font-medium text-brand-danger break-words">{validationErrors.email}</p>
          )}
          <p className="text-sm font-medium text-brand-ink-muted break-words">
            {editingId ? t(`${pageTx}.emailNoteEdit`) : t(`${pageTx}.emailNoteCreate`)}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
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
            <p className="text-sm font-medium text-brand-danger break-words">{validationErrors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
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
            <p className="text-sm font-medium text-brand-danger break-words">{validationErrors.department}</p>
          )}
        </div>

        {!editingId && (
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {t('roleLabel')}
            </label>
            <NativeSelect
              name="role"
              value={formData.role}
              onChange={onChange}
              className={inputClassName}
            >
              <option value="STAFF">{t('staffRole')}</option>
              <option value="MANAGER">{t('managerRole')}</option>
            </NativeSelect>
            {validationErrors.roleAllowed && (
              <p className="text-sm font-medium text-brand-danger break-words">{validationErrors.roleAllowed}</p>
            )}
          </div>
        )}

        {!editingId && (
          <div className="rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3 text-sm font-medium text-brand-ink-muted">
            {t(`${pageTx}.passwordNote`)}
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button variant="unstyled" size="none"
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-surface-border px-5 py-3 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light"
          >
            {t('cancel')}
          </Button>
          <Button variant="unstyled" size="none"
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted"
          >
            {isSubmitting
              ? editingId
                ? t('updatingMsg')
                : t('creatingMsg')
              : editingId
                ? t('updateStaffBtn')
                : t('createStaffBtn')}
          </Button>
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
    deleteStaff,
  } = useStaff();
  const { user, hasRole } = useAuth();
  const showMobileCards = useMediaQuery('(max-width: 767px)');

  const currentUserEmail = user?.email;
  const canUnlock = hasRole('ROLE_ADMIN');
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
    role: 'STAFF',
  });
  const [formError, setFormError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const resetForm = () => {
    setFormData({ email: '', name: '', department: '', role: 'STAFF' });
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
      role: 'STAFF',
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

  const handleDelete = async (staffMember) => {
    if (!window.confirm(t(`${pageTx}.confirmDelete`, { name: staffMember.name }))) return;

    const result = await deleteStaff(staffMember.id);
    if (result.success) {
      setSuccessMessage(t(`${pageTx}.deletedSuccess`));
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
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
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
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint break-words">
            {t(`${pageTx}.teamSnapshot`)}
          </p>
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t(`${pageTx}.active`)}
              </p>
              <p className="mt-2 text-lg font-black break-words">{summary.active}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t(`${pageTx}.inactive`)}
              </p>
              <p className="mt-2 text-lg font-black break-words">{summary.inactive}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="flex min-w-0 justify-end">
        <Button variant="unstyled" size="none"
          type="button"
          onClick={openCreate}
          className="inline-flex min-w-0 items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-primary-deep"
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          {t(`${pageTx}.addStaff`)}
        </Button>
      </div>

      {successMessage && (
        <div className="rounded-[1.25rem] border border-brand-success/30 bg-brand-success/10 px-4 py-3 text-sm font-medium text-brand-success">
          {successMessage}
        </div>
      )}

      {(error || pageError) && (
        <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
          {pageError || error}
        </div>
      )}

      <DashboardPanel
        title={t(`${pageTx}.addFiltersTitle`)}
        description={t(`${pageTx}.addFiltersDescription`)}
      >
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {t('searchLabel')}
            </label>
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              placeholder={t('staffPage.searchPlaceholder')}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {t('departmentLabel')}
            </label>
            <input
              value={filters.department}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, department: event.target.value }))
              }
              placeholder={t('deptPlaceholder')}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {t(`${pageTx}.accountState`)}
            </label>
            <NativeSelect
              value={filters.active}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, active: event.target.value }))
              }
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              <option value="all">{t('allStaff')}</option>
              <option value="true">{t('activeOnly')}</option>
              <option value="false">{t('inactiveOnly')}</option>
            </NativeSelect>
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
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-brand-primary-tint" />
            ))}
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-brand-surface-border bg-brand-surface-light px-6 py-14 text-center">
            <Users className="mx-auto h-10 w-10 text-brand-ink-hint shrink-0" />
            <p className="mt-4 text-lg font-black text-brand-ink break-words">{t(`${pageTx}.noStaffTitle`)}</p>
            <p className="mt-2 text-sm font-medium text-brand-ink-muted break-words">
              {t(`${pageTx}.noStaffDescription`)}
            </p>
          </div>
        ) : (
          <>
            {showMobileCards ? (
            <div className="space-y-4">
              {filteredStaff.map((member) => {
                const isCurrentUser = member.email === currentUserEmail;

                return (
                  <article
                    key={member.id}
                    className="rounded-[1.5rem] border border-brand-surface-border bg-white p-4 shadow-sm"
                  >
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="text-lg font-black text-brand-ink break-words">{member.name}</p>
                          {isCurrentUser ? (
                            <span className="rounded-full border border-brand-surface-border bg-brand-surface-light px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-ink-muted break-words">
                              {t(`${pageTx}.you`)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">{member.email}</p>
                      </div>
                      <div className="flex min-w-0 flex-wrap gap-2">
                        {member.active ? (
                          <span className="rounded-full border border-brand-success/30 bg-brand-success/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-brand-success break-words">
                            {t(`${pageTx}.active`)}
                          </span>
                        ) : (
                          <span className="rounded-full border border-brand-surface-border bg-brand-primary-tint px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-brand-ink-muted break-words">
                            {t(`${pageTx}.inactive`)}
                          </span>
                        )}
                        {member.locked ? (
                          <span className="rounded-full border border-brand-warning/30 bg-brand-warning/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-brand-warning break-words">
                            {translateWithFallback(t, `${pageTx}.locked`, 'Locked')}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                        {t(`${pageTx}.tableDepartment`)}
                      </p>
                      <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                        {translateKnownValue(member.department || '-', t)}
                      </p>
                    </div>

                    <div className="mt-4 flex min-w-0 flex-col gap-2">
                      <Button variant="unstyled" size="none"
                        type="button"
                        onClick={() => handleEdit(member)}
                        className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-brand-surface-border px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light"
                      >
                        <Pencil className="h-4 w-4 shrink-0" />
                        {t(`${pageTx}.edit`)}
                      </Button>

                      {member.active ? (
                        <Button variant="unstyled" size="none"
                          type="button"
                          onClick={() => handleDeactivate(member)}
                          disabled={isCurrentUser}
                          className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-brand-surface-border px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light disabled:cursor-not-allowed disabled:bg-brand-primary-tint disabled:text-brand-ink-hint"
                        >
                          <PowerOff className="h-4 w-4 shrink-0" />
                          {t(`${pageTx}.deactivate`)}
                        </Button>
                      ) : (
                        <Button variant="unstyled" size="none"
                          type="button"
                          onClick={() => handleActivate(member)}
                          className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-primary-deep"
                        >
                          <Power className="h-4 w-4 shrink-0" />
                          {t(`${pageTx}.activate`)}
                        </Button>
                      )}

                      {canUnlock ? (
                        <Button variant="unstyled" size="none"
                          type="button"
                          onClick={() => handleUnlock(member)}
                          disabled={!member.locked}
                          className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-brand-surface-border px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light disabled:cursor-not-allowed disabled:bg-brand-primary-tint disabled:text-brand-ink-hint"
                        >
                          <LockOpen className="h-4 w-4 shrink-0" />
                          {t(`${pageTx}.unlock`)}
                        </Button>
                      ) : null}

                      <Button variant="unstyled" size="none"
                        type="button"
                        onClick={() => handleDelete(member)}
                        disabled={isCurrentUser}
                        className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-brand-danger/30 px-4 py-2 text-sm font-bold text-brand-danger transition hover:border-brand-danger/50 hover:bg-brand-danger/5 disabled:cursor-not-allowed disabled:border-brand-surface-border disabled:bg-brand-primary-tint disabled:text-brand-ink-hint"
                      >
                        <Trash2 className="h-4 w-4 shrink-0" />
                        {t(`${pageTx}.delete`)}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
            ) : (
            <div className="overflow-x-auto rounded-[1.5rem] border border-brand-surface-border">
              <table className="min-w-full border-collapse">
              <thead className="bg-brand-surface-light">
                <tr>
                  {[t(`${pageTx}.tableDetails`), t(`${pageTx}.tableDepartment`), t(`${pageTx}.tableStatus`), t(`${pageTx}.tableActions`)].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-4 text-start text-xs font-black uppercase tracking-[0.18em] text-brand-ink-muted"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-surface-border bg-white">
                {filteredStaff.map((member) => {
                  const isCurrentUser = member.email === currentUserEmail;

                  return (
                    <tr key={member.id}>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="text-sm font-black text-brand-ink break-words">{member.name}</p>
                            {isCurrentUser && (
                              <span className="rounded-full border border-brand-surface-border bg-brand-surface-light px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-ink-muted break-words">
                                {t(`${pageTx}.you`)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-brand-ink-muted break-words">{member.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="inline-flex min-w-0 items-center gap-2 rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1.5 text-sm font-medium text-brand-ink">
                          <Briefcase className="h-4 w-4 text-brand-ink-hint shrink-0" />
                          {translateKnownValue(member.department || '-', t)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {member.active ? (
                          <div className="flex min-w-0 flex-wrap gap-2">
                            <span className="rounded-full border border-brand-success/30 bg-brand-success/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-brand-success break-words">
                              {t(`${pageTx}.active`)}
                            </span>
                            {member.locked && (
                              <span className="rounded-full border border-brand-warning/30 bg-brand-warning/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-brand-warning break-words">
                                {translateWithFallback(t, `${pageTx}.locked`, 'Locked')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="rounded-full border border-brand-surface-border bg-brand-primary-tint px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-brand-ink-muted break-words">
                            {t(`${pageTx}.inactive`)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-0 flex-wrap gap-2">
                          <Button variant="unstyled" size="none"
                            type="button"
                            onClick={() => handleEdit(member)}
                            className="inline-flex min-w-0 items-center gap-2 rounded-full border border-brand-surface-border px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light"
                          >
                            <Pencil className="h-4 w-4 shrink-0" />
                            {t(`${pageTx}.edit`)}
                          </Button>

                          {member.active ? (
                            <Button variant="unstyled" size="none"
                              type="button"
                              onClick={() => handleDeactivate(member)}
                              disabled={isCurrentUser}
                              className="inline-flex min-w-0 items-center gap-2 rounded-full border border-brand-surface-border px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light disabled:cursor-not-allowed disabled:bg-brand-primary-tint disabled:text-brand-ink-hint"
                            >
                              <PowerOff className="h-4 w-4 shrink-0" />
                              {t(`${pageTx}.deactivate`)}
                            </Button>
                          ) : (
                            <Button variant="unstyled" size="none"
                              type="button"
                              onClick={() => handleActivate(member)}
                              className="inline-flex min-w-0 items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-primary-deep"
                            >
                              <Power className="h-4 w-4 shrink-0" />
                              {t(`${pageTx}.activate`)}
                            </Button>
                          )}

                          {canUnlock && (
                            <Button variant="unstyled" size="none"
                              type="button"
                              onClick={() => handleUnlock(member)}
                              disabled={!member.locked}
                              className="inline-flex min-w-0 items-center gap-2 rounded-full border border-brand-surface-border px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light disabled:cursor-not-allowed disabled:bg-brand-primary-tint disabled:text-brand-ink-hint"
                            >
                              <LockOpen className="h-4 w-4 shrink-0" />
                              {t(`${pageTx}.unlock`)}
                            </Button>
                          )}

                          <Button variant="unstyled" size="none"
                            type="button"
                            onClick={() => handleDelete(member)}
                            disabled={isCurrentUser}
                            className="inline-flex min-w-0 items-center gap-2 rounded-full border border-brand-danger/30 px-4 py-2 text-sm font-bold text-brand-danger transition hover:border-brand-danger/50 hover:bg-brand-danger/5 disabled:cursor-not-allowed disabled:border-brand-surface-border disabled:bg-brand-primary-tint disabled:text-brand-ink-hint"
                          >
                            <Trash2 className="h-4 w-4 shrink-0" />
                            {t(`${pageTx}.delete`)}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            )}
          </>
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
