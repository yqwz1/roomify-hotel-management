import { useState, useEffect } from 'react';
import { useStaff } from '../hooks/useStaff';
import { useAuth } from '../context/AuthProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../components/ui/sheet';
import { Plus, Loader2, Info, Pencil, Users, Unlock, PowerOff, Power } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

function SkeletonRow() {
    return (
        <tr className="border-b">
            <td className="p-4">
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
            </td>
            <td className="p-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </td>
            <td className="p-4">
                <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
            </td>
            <td className="p-4">
                <div className="h-5 w-14 bg-gray-200 rounded-full animate-pulse" />
            </td>
            <td className="p-4 text-right">
                <div className="flex justify-end gap-1">
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
            </td>
        </tr>
    );
}

export default function Staff() {
    const { staff, loading, error, fetchStaff, createStaff, updateStaff, activateStaff, deactivateStaff, unlockStaff } = useStaff();
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
        fetchStaff(filters);
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
        if (filters.role) cleanFilters.role = filters.role;
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
            setSuccessMessage(editingId ? "Staff updated successfully!" : "Staff created successfully! Welcome email sent.");
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

    const handleToggleActive = async (staffMember) => {
        const action = staffMember.active ? 'deactivate' : 'activate';
        const confirmMessage = staffMember.active
            ? `Are you sure you want to deactivate ${staffMember.name}'s account?`
            : `Are you sure you want to activate ${staffMember.name}'s account?`;

        if (window.confirm(confirmMessage)) {
            const result = staffMember.active
                ? await deactivateStaff(staffMember.id)
                : await activateStaff(staffMember.id);

            if (result.success) {
                setSuccessMessage(`Staff ${action}d successfully!`);
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setPageError(result.error);
                setTimeout(() => setPageError(null), 4000);
            }
        }
    };

    const handleUnlock = async (staffMember) => {
        if (window.confirm(`Unlock ${staffMember.name}'s account and reset failed login attempts?`)) {
            const result = await unlockStaff(staffMember.id);

            if (result.success) {
                setSuccessMessage("Account unlocked successfully!");
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setPageError(result.error);
                setTimeout(() => setPageError(null), 4000);
            }
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Staff Management</h1>
                    <p className="text-gray-500 mt-1 text-sm">Manage staff members and their accounts.</p>
                </div>
                <Button onClick={() => { setIsSheetOpen(true); resetForm(); }} className="gap-2 self-start sm:self-auto">
                    <Plus className="h-4 w-4" /> Add Staff
                </Button>
            </div>

            {successMessage && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                    <Info className="h-4 w-4 text-green-600" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
            )}

            {(error || pageError) && (
                <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{pageError || error}</AlertDescription>
                </Alert>
            )}

            {/* Filters Card */}
            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="search">Search</Label>
                            <Input
                                id="search"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Name or email..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <select
                                id="role"
                                name="role"
                                value={filters.role}
                                onChange={handleFilterChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">All Roles</option>
                                <option value="MANAGER">Manager</option>
                                <option value="STAFF">Staff</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input
                                id="department"
                                name="department"
                                value={filters.department}
                                onChange={handleFilterChange}
                                placeholder="e.g. Front Desk"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="active">Status</Label>
                            <select
                                id="active"
                                name="active"
                                value={filters.active === null ? '' : filters.active}
                                onChange={handleFilterChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">All Status</option>
                                <option value="true">Active Only</option>
                                <option value="false">Inactive Only</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button onClick={handleApplyFilters} size="sm">Apply Filters</Button>
                        <Button onClick={handleResetFilters} variant="outline" size="sm">Reset</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Staff List Card */}
            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle>All Staff</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading && !staff.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Details</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Department</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Role</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
                                </tbody>
                            </table>
                        </div>
                    ) : staff.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
                                <Users className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-lg font-medium text-gray-700">No staff found</p>
                                <p className="text-sm text-gray-500">Try adjusting your filters or add a new staff member.</p>
                            </div>
                            <Button onClick={() => { setIsSheetOpen(true); resetForm(); }} className="gap-2 mt-2">
                                <Plus className="h-4 w-4" /> Add Now
                            </Button>
                        </div>
                    ) : (
                        <div className="relative w-full overflow-x-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Details</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Department</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Role</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {staff.map((s) => {
                                        const isCurrentUser = s.email === currentUserEmail;
                                        return (
                                            <tr key={s.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">
                                                    <div className="font-semibold">{s.name}</div>
                                                    <div className="text-xs text-gray-500">{s.email}</div>
                                                    {isCurrentUser && (
                                                        <Badge variant="outline" className="text-xs mt-1 bg-blue-50 text-blue-700 border-blue-200">You</Badge>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {s.department}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant="secondary" className={s.role === 'MANAGER' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-700 border-gray-100'}>
                                                        {s.role === 'MANAGER' ? 'Manager' : 'Staff'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant={s.active ? 'default' : 'secondary'} className={s.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                                                        {s.active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(s)}
                                                            className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                            title="Edit staff"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggleActive(s)}
                                                            disabled={isCurrentUser && s.active}
                                                            className={`h-8 px-3 ${isCurrentUser && s.active ? 'opacity-50 cursor-not-allowed' : s.active ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                                                            title={isCurrentUser && s.active ? "Cannot deactivate your own account" : s.active ? "Deactivate" : "Activate"}
                                                        >
                                                            {s.active ? (
                                                                <>
                                                                    <PowerOff className="h-4 w-4 mr-1" />
                                                                    <span className="text-xs">Deactivate</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Power className="h-4 w-4 mr-1" />
                                                                    <span className="text-xs">Activate</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                        {isManager && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleUnlock(s)}
                                                                className="h-8 px-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                title="Unlock account"
                                                            >
                                                                <Unlock className="h-4 w-4 mr-1" />
                                                                <span className="text-xs">Unlock</span>
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
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{editingId ? 'Edit Staff' : 'Add New Staff'}</SheetTitle>
                        <SheetDescription>
                            {editingId ? 'Update staff member details.' : 'Add a new staff member to your team. Password will be auto-generated and emailed.'}
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-8">

                        {formError && (
                            <Alert variant="destructive">
                                <Info className="h-4 w-4" />
                                <AlertDescription>{formError}</AlertDescription>
                            </Alert>
                        )}

                        {!editingId && (
                            <div className="space-y-2">
                                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="staff@example.com"
                                    className={validationErrors.email ? "border-red-500" : ""}
                                    required
                                />
                                {validationErrors.email && <p className="text-xs text-red-500">{validationErrors.email}</p>}
                                <p className="text-xs text-gray-500">A welcome email with login credentials will be sent to this address.</p>
                            </div>
                        )}

                        {editingId && (
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={formData.email}
                                    disabled
                                    className="bg-gray-50"
                                />
                                <p className="text-xs text-gray-500">Email cannot be changed.</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="e.g. John Doe"
                                className={validationErrors.name ? "border-red-500" : ""}
                                maxLength={100}
                                required
                            />
                            {validationErrors.name && <p className="text-xs text-red-500">{validationErrors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
                            <Input
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                                placeholder="e.g. Front Desk, Housekeeping"
                                className={validationErrors.department ? "border-red-500" : ""}
                                maxLength={50}
                                required
                            />
                            {validationErrors.department && <p className="text-xs text-red-500">{validationErrors.department}</p>}
                        </div>

                        {!editingId && (
                            <Alert className="bg-blue-50 border-blue-200">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                    A secure password will be automatically generated and sent to the staff member's email.
                                </AlertDescription>
                            </Alert>
                        )}

                        <SheetFooter className="mt-8">
                            <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {editingId ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    editingId ? 'Update Staff' : 'Create Staff'
                                )}
                            </Button>
                        </SheetFooter>

                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}
