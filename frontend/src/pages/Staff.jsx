import { useState, useEffect } from 'react';
import { useStaff } from '../hooks/useStaff';
import { useAuth } from '../context/AuthProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../components/ui/sheet';
import { Loader2, UserPlus, Filter, X, Shield, Briefcase, Mail, KeyRound, LockKeyhole, PowerOff, Power, RefreshCw, Pencil, Users, Unlock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useTranslation } from 'react-i18next';

function SkeletonRow() {
    return (
        <tr className="border-b border-zinc-100">
            <td className="p-4">
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-zinc-200 rounded-full animate-pulse" />
                    <div className="h-3 w-48 bg-zinc-100 rounded-full animate-pulse" />
                </div>
            </td>
            <td className="p-4">
                <div className="h-4 w-24 bg-zinc-200 rounded-full animate-pulse" />
            </td>
            <td className="p-4">
                <div className="h-6 w-20 bg-zinc-200 rounded-full animate-pulse" />
            </td>
            <td className="p-4">
                <div className="h-6 w-20 bg-zinc-200 rounded-full animate-pulse" />
            </td>
            <td className="p-4 text-end">
                <div className="flex justify-end gap-2">
                    <div className="h-8 w-8 bg-zinc-200 rounded-full animate-pulse" />
                    <div className="h-8 w-20 bg-zinc-200 rounded-full animate-pulse" />
                    <div className="h-8 w-16 bg-zinc-200 rounded-full animate-pulse" />
                </div>
            </td>
        </tr>
    );
}

export default function Staff() {
    const { t } = useTranslation();
    const { staff, loading, error, fetchStaff, createStaff, updateStaff, deactivateStaff, activateStaff, resetLoginAttempts } = useStaff();
    const { user, hasRole } = useAuth();
    const currentUserEmail = user?.email;
    const isManager = hasRole('ROLE_MANAGER');

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [pageError, setPageError] = useState(null);

    // Filter State
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        department: '',
        active: null
    });

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        department: ''
    });

    // Error State
    const [formError, setFormError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApplyFilters = () => {
        const cleanFilters = {};
        if (filters.search) cleanFilters.search = filters.search;
        if (filters.role && filters.role !== 'all') cleanFilters.role = filters.role;
        if (filters.department) cleanFilters.department = filters.department;
        if (filters.active !== null && filters.active !== '') {
            cleanFilters.active = filters.active === 'true';
        }
        fetchStaff(cleanFilters);
    };

    const handleResetFilters = () => {
        setFilters({
            search: '',
            role: '',
            department: '',
            active: null
        });
        fetchStaff();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleEdit = (staffMember) => {
        setFormData({
            email: staffMember.email,
            name: staffMember.name,
            department: staffMember.department
        });
        setEditingId(staffMember.id);
        setIsSheetOpen(true);
    };

    const resetForm = () => {
        setFormData({
            email: '',
            name: '',
            department: ''
        });
        setFormError(null);
        setValidationErrors({});
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        setValidationErrors({});

        setIsSubmitting(true);

        let result;
        if (editingId) {
            // For edit, only send name and department
            const { name, department } = formData;
            result = await updateStaff(editingId, { name, department });
        } else {
            // For create, send all fields
            result = await createStaff(formData);
        }

        setIsSubmitting(false);

        if (result.success) {
            setSuccessMessage(editingId ? (t('staffUpdated') || "Staff updated successfully!") : (t('staffCreated') || "Staff created successfully! Welcome email sent."));
            setIsSheetOpen(false);
            resetForm();
            // Clear success message after 4 seconds
            setTimeout(() => setSuccessMessage(null), 4000);
        } else {
            setFormError(result.error);
            if (result.validationErrors) {
                setValidationErrors(result.validationErrors);
            }
        }
    };

    const handleActivate = async (staffMember) => {
        if (window.confirm(t('confirmActivate', { name: staffMember.name }) || `Are you sure you want to activate ${staffMember.name}'s account?`)) {
            const result = await activateStaff(staffMember.id);
            if (result.success) {
                setSuccessMessage(t('staffActivated') || "Staff activated successfully!");
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setPageError(result.error);
                setTimeout(() => setPageError(null), 4000);
            }
        }
    };

    const handleDeactivate = async (staffMember) => {
        if (window.confirm(t('confirmDeactivate', { name: staffMember.name }) || `Are you sure you want to deactivate ${staffMember.name}'s account?`)) {
            const result = await deactivateStaff(staffMember.id);
            if (result.success) {
                setSuccessMessage(t('staffDeactivated') || "Staff deactivated successfully!");
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setPageError(result.error);
                setTimeout(() => setPageError(null), 4000);
            }
        }
    };

    const handleResetLoginAttempts = async (staffMember) => {
        if (window.confirm(t('confirmResetLoginAttempts', { name: staffMember.name }) || `Unlock ${staffMember.name}'s account and reset failed login attempts?`)) {
            const result = await resetLoginAttempts(staffMember.id);

            if (result.success) {
                setSuccessMessage(t('accountUnlocked') || "Account unlocked successfully!");
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setPageError(result.error);
                setTimeout(() => setPageError(null), 4000);
            }
        }
    };

    const filteredStaff = staff.filter(s => {
        const matchesSearch = filters.search ? (s.name.toLowerCase().includes(filters.search.toLowerCase()) || s.email.toLowerCase().includes(filters.search.toLowerCase())) : true;
        const matchesRole = filters.role && filters.role !== 'all' ? s.role === filters.role : true;
        const matchesDepartment = filters.department ? s.department?.toLowerCase().includes(filters.department.toLowerCase()) : true;
        const matchesActive = filters.active !== null ? s.active === filters.active : true;
        return matchesSearch && matchesRole && matchesDepartment && matchesActive;
    });

    const isFiltersActive = Object.values(filters).some(value => value !== '' && value !== null && value !== 'all');

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 bg-zinc-50 h-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-black">{t('staffManagementTitle') || 'Staff Management'}</h1>
                    <p className="text-zinc-500 mt-2 text-sm font-medium">{t('staffManagementDesc') || 'Manage staff members and their accounts.'}</p>
                </div>
                <Button onClick={() => { setIsSheetOpen(true); resetForm(); }} className="gap-2 self-start sm:self-auto rounded-full bg-black hover:bg-zinc-800 text-white font-extrabold h-12 px-6 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
                    <UserPlus className="h-5 w-5" /> {t('addStaffBtn') || 'Add Staff'}
                </Button>
            </div>

            {successMessage && (
                <Alert className="bg-zinc-100 border-zinc-200 text-black rounded-3xl p-5">
                    <Info className="h-5 w-5 text-black" />
                    <AlertTitle className="font-extrabold tracking-tight">{t('success') || 'Success'}</AlertTitle>
                    <AlertDescription className="font-medium">{successMessage}</AlertDescription>
                </Alert>
            )}

            {(error || pageError) && (
                <Alert variant="destructive" className="rounded-3xl p-5">
                    <Info className="h-5 w-5" />
                    <AlertTitle className="font-extrabold tracking-tight">{t('error') || 'Error'}</AlertTitle>
                    <AlertDescription className="font-medium">{pageError || error}</AlertDescription>
                </Alert>
            )}

            {/* Filters Card */}
            <Card className="border-zinc-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="py-5 flex flex-row items-center justify-between bg-zinc-50 border-b border-zinc-100">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-black uppercase tracking-widest">
                        <Filter className="h-4 w-4" /> {t('filters') || 'Filters'}
                    </CardTitle>
                    {isFiltersActive && (
                        <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs font-bold text-zinc-500 hover:text-black rounded-full h-8">
                            <X className="h-3 w-3 mr-1" /> {t('resetFilters') || 'Reset Filters'}
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('searchLabel') || 'Search'}</Label>
                            <Input
                                placeholder={t('searchPlaceholder') || "Name or email..."}
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="h-12 rounded-full border-zinc-200 focus-visible:ring-black px-5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('roleLabel') || 'Role'}</Label>
                            <select 
                                value={filters.role} 
                                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                                className="flex h-12 w-full rounded-full border border-zinc-200 bg-white px-5 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
                            >
                                <option value="all">{t('allRoles') || 'All Roles'}</option>
                                <option value="MANAGER">{t('managerRole') || 'Manager'}</option>
                                <option value="STAFF">{t('staffRole') || 'Staff'}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('departmentLabel') || 'Department'}</Label>
                            <Input
                                placeholder={t('deptPlaceholder') || "e.g. Front Desk"}
                                value={filters.department}
                                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                                className="h-12 rounded-full border-zinc-200 focus-visible:ring-black px-5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('statusLabel') || 'Status'}</Label>
                            <select 
                                value={filters.active === null ? 'all' : filters.active.toString()} 
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setFilters({ ...filters, active: v === 'all' ? null : v === 'true' });
                                }}
                                className="flex h-12 w-full rounded-full border border-zinc-200 bg-white px-5 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
                            >
                                <option value="all">{t('allStatus') || 'All Status'}</option>
                                <option value="true">{t('activeOnly') || 'Active Only'}</option>
                                <option value="false">{t('inactiveOnly') || 'Inactive Only'}</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Staff List Card */}
            <Card className="border-zinc-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="py-5 border-b border-zinc-100 bg-zinc-50">
                    <CardTitle className="text-lg font-extrabold text-black uppercase tracking-widest flex items-center gap-3">
                        {t('allStaff') || 'All Staff'} 
                        <Badge variant="secondary" className="font-extrabold rounded-full bg-black text-white px-3 py-1 text-xs">{filteredStaff.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading && !staff.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full caption-bottom text-sm text-start">
                                <thead className="[&_tr]:border-b bg-gray-50/30">
                                    <tr className="border-b transition-colors">
                                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-xs uppercase">{t('nameLabel') || 'Name'}</th>
                                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-xs uppercase">{t('colDepartment') || 'Department'}</th>
                                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-xs uppercase">{t('colRole') || 'Role'}</th>
                                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-xs uppercase">{t('statusLabel') || 'Status'}</th>
                                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-xs uppercase text-end w-[140px]">{t('colActions') || 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
                                </tbody>
                            </table>
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
                                <Users className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-lg font-medium text-gray-700">{t('noStaffFound') || 'No staff found'}</p>
                                <p className="text-sm text-gray-500">{t('noStaffFoundDesc') || 'Try adjusting your filters or add a new staff member.'}</p>
                            </div>
                            <Button onClick={() => { setIsSheetOpen(true); resetForm(); }} className="gap-2 mt-2">
                                <UserPlus className="h-4 w-4" /> {t('addNowBtn') || 'Add Now'}
                            </Button>
                        </div>
                    ) : (
                        <div className="relative w-full overflow-x-auto">
                            <table className="w-full caption-bottom text-sm text-start">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Details</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Department</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Role</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {filteredStaff.map((s) => {
                                        const isCurrentUser = s.email === currentUserEmail;
                                        return (
                                            <tr key={s.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">
                                                    <div className="font-semibold flex items-center">
                                                        {s.name}
                                                        {isCurrentUser && (
                                                            <Badge variant="outline" className="ml-2 font-normal text-[10px] h-4 leading-4 px-1">{t('youBadge') || 'You'}</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{s.email}</div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                                        <Briefcase className="h-3 w-3" />
                                                        {s.department || '-'}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {s.department}
                                                </td>
                                                <td className="p-5 align-middle">
                                                    <Badge variant="secondary" className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${s.role === 'MANAGER' ? 'bg-black text-white border-transparent' : 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
                                                        {s.role === 'MANAGER' ? (t('managerRole') || 'Manager') : (t('staffRole') || 'Staff')}
                                                    </Badge>
                                                </td>
                                                <td className="p-5 align-middle">
                                                    {s.active ? (
                                                        <Badge variant="outline" className="rounded-full bg-white text-black border-zinc-300 shadow-sm gap-1.5 pr-3 py-1 text-[10px] font-extrabold uppercase tracking-wider h-6">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-black ml-1" />
                                                            {t('activeBadge') || 'Active'}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="rounded-full bg-zinc-100 text-zinc-500 border-transparent gap-1.5 pr-3 py-1 text-[10px] font-extrabold uppercase tracking-wider h-6">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 ml-1" />
                                                            {t('inactiveBadge') || 'Inactive'}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="p-5 align-middle text-end">
                                                    <div className="flex justify-end gap-2 text-zinc-500">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(s)}
                                                            className="h-10 w-10 rounded-full hover:bg-zinc-100 hover:text-black transition-colors"
                                                            title={t('editStaffTitle') || "Edit staff"}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        {s.active ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeactivate(s)}
                                                                disabled={isCurrentUser}
                                                                className={`h-10 rounded-full px-4 border border-zinc-200 ${isCurrentUser ? 'opacity-50 cursor-not-allowed text-zinc-400' : 'text-zinc-600 hover:text-black hover:bg-zinc-50'}`}
                                                                title={isCurrentUser ? (t('cannotDeactivateSelf') || "Cannot deactivate your own account") : (t('deactivateBtn') || "Deactivate")}
                                                            >
                                                                <PowerOff className="h-4 w-4 me-2" />
                                                                <span className="text-xs font-bold uppercase tracking-widest">{t('deactivateBtn') || 'Deactivate'}</span>
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleActivate(s)}
                                                                className="h-10 rounded-full px-4 border border-black bg-black text-white hover:bg-zinc-800"
                                                                title={t('activateBtn') || "Activate"}
                                                            >
                                                                <Power className="h-4 w-4 me-2" />
                                                                <span className="text-xs font-bold uppercase tracking-widest">{t('activateBtn') || 'Activate'}</span>
                                                            </Button>
                                                        )}
                                                        {isManager && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleResetLoginAttempts(s)}
                                                                className="h-10 rounded-full px-4 border border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-50"
                                                                title={t('unlockAccountBtn') || "Unlock account"}
                                                            >
                                                                <RefreshCw className="h-4 w-4 me-2" />
                                                                <span className="text-xs font-bold uppercase tracking-widest">{t('unlockBtn') || 'Unlock'}</span>
                                                            </Button>
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
                </CardContent>
            </Card>

            {/* Create/Edit Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            {editingId ? <Pencil className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                            {editingId ? (t('editStaff') || 'Edit Staff') : (t('addNewStaff') || 'Add New Staff')}
                        </SheetTitle>
                        <SheetDescription>
                            {editingId ? (t('updateStaffDesc') || 'Update staff member details.') : (t('addNewStaffDesc') || 'Add a new staff member to your team. Password will be auto-generated and emailed.')}
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-8">

                        {formError && (
                            <Alert variant="destructive">
                                <Info className="h-4 w-4" />
                                <AlertDescription>{formError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-500" /> {t('emailLabel') || 'Email'} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder={t('emailPlaceholder') || "staff@example.com"}
                                    disabled={!!editingId} // Email can't be changed after creation
                                    className={validationErrors.email ? "border-red-500" : ""}
                                    required
                                />
                                {validationErrors.email && <p className="text-xs text-red-500">{validationErrors.email}</p>}
                                {!editingId && <p className="text-xs text-gray-500 mt-1">{t('welcomeEmailMsg') || 'A welcome email with login credentials will be sent to this address.'}</p>}
                                {editingId && <p className="text-xs text-gray-500 mt-1">{t('emailCannotChange') || 'Email cannot be changed.'}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" /> {t('fullNameLabel') || 'Full Name'} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder={t('fullNamePlaceholder') || "e.g. John Doe"}
                                    className={validationErrors.name ? "border-red-500" : ""}
                                    required
                                />
                                {validationErrors.name && <p className="text-xs text-red-500">{validationErrors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role" className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-gray-500" /> {t('roleLabel') || 'Role'} <span className="text-red-500">*</span>
                                </Label>
                                <select 
                                    id="role"
                                    value={formData.role} 
                                    onChange={(e) => handleSelectChange('role', e.target.value)}
                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${validationErrors.role ? "border-red-500" : "border-input"}`}
                                >
                                    <option value="" disabled>{t('selectRolePlaceholder') || "Select a role"}</option>
                                    <option value="MANAGER">{t('managerRole') || 'Manager'}</option>
                                    <option value="STAFF">{t('staffRole') || 'Staff'}</option>
                                </select>
                                {validationErrors.role && <p className="text-xs text-red-500">{validationErrors.role}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="department" className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-gray-500" /> {t('departmentLabel') || 'Department'} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    placeholder={t('deptExample') || "e.g. Front Desk, Housekeeping"}
                                    className={validationErrors.department ? "border-red-500" : ""}
                                    maxLength={50}
                                    required
                                />
                                {validationErrors.department && <p className="text-xs text-red-500">{validationErrors.department}</p>}
                            </div>
                        </div>

                        {!editingId && (
                            <Alert className="bg-zinc-50 border-zinc-200 rounded-3xl p-5 mt-4">
                                <Info className="h-5 w-5 text-black" />
                                <AlertDescription className="text-zinc-600 font-medium">
                                    {t('autoGenPwdMsg') || "A secure password will be automatically generated and sent to the staff member's email."}
                                </AlertDescription>
                            </Alert>
                        )}

                        <SheetFooter className="mt-8 pt-6 border-t border-zinc-100 flex gap-3 sm:justify-end">
                            <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="rounded-full h-12 px-6 font-extrabold text-black border-zinc-200 hover:bg-zinc-50 uppercase tracking-widest text-xs">{t('cancel') || 'Cancel'}</Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-full h-12 px-6 font-extrabold text-white bg-black hover:bg-zinc-800 uppercase tracking-widest text-xs">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="me-2 h-4 w-4 animate-spin" /> {editingId ? (t('updatingMsg') || 'Updating...') : (t('creatingMsg') || 'Creating...')}
                                    </>
                                ) : (
                                    editingId ? (t('updateStaffBtn') || 'Update Staff') : (t('createStaffBtn') || 'Create Staff')
                                )}
                            </Button>
                        </SheetFooter>

                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}
