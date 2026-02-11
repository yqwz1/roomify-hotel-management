import { useEffect, useState, useCallback } from 'react';
import { z } from 'zod';
import {
    getRoomTypes,
    createRoomType,
    updateRoomType,
    toggleRoomTypeStatus,
} from '../services/roomTypeService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';

// ── Zod Validation Schema ──────────────────────────────────────────
const roomTypeSchema = z.object({
    name: z
        .string()
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name must not exceed 100 characters'),
    basePrice: z
        .number({ invalid_type_error: 'Price must be a number' })
        .positive('Price must be greater than 0'),
    maxGuests: z
        .number({ invalid_type_error: 'Max guests must be a number' })
        .int('Max guests must be a whole number')
        .min(1, 'Must allow at least 1 guest'),
    amenities: z.array(z.string()).optional().default([]),
    description: z.string().max(500, 'Description must not exceed 500 characters').optional().default(''),
});

// ── Constants ──────────────────────────────────────────────────────
const PAGE_LIMIT = 10;

// ── Tags Input Sub-Component ───────────────────────────────────────
function TagsInput({ tags = [], onChange, placeholder = 'Type and press Enter…' }) {
    const [inputValue, setInputValue] = useState('');

    const addTag = (value) => {
        const trimmed = value.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }
        setInputValue('');
    };

    const removeTag = (indexToRemove) => {
        onChange(tags.filter((_, i) => i !== indexToRemove));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent p-2 min-h-[42px] focus-within:ring-1 focus-within:ring-ring transition-shadow">
            {tags.map((tag, idx) => (
                <Badge
                    key={`${tag}-${idx}`}
                    variant="secondary"
                    className="gap-1 pl-2.5 pr-1.5 py-1 text-xs cursor-default select-none"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={() => removeTag(idx)}
                        className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5 transition-colors"
                        aria-label={`Remove ${tag}`}
                    >
                        ✕
                    </button>
                </Badge>
            ))}
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => { if (inputValue.trim()) addTag(inputValue); }}
                placeholder={tags.length === 0 ? placeholder : ''}
                className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
        </div>
    );
}

// ── Form Dialog Sub-Component ──────────────────────────────────────
function RoomTypeFormDialog({ isOpen, onClose, onSubmit, initialData, isSubmitting }) {
    const isEditing = !!initialData;
    const [formData, setFormData] = useState({
        name: '',
        basePrice: '',
        maxGuests: '',
        amenities: [],
        description: '',
    });
    const [errors, setErrors] = useState({});

    // Populate form when editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                basePrice: String(initialData.basePrice || ''),
                maxGuests: String(initialData.maxGuests || ''),
                amenities: initialData.amenities || [],
                description: initialData.description || '',
            });
        } else {
            setFormData({ name: '', basePrice: '', maxGuests: '', amenities: [], description: '' });
        }
        setErrors({});
    }, [initialData, isOpen]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear field error on change
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Parse numeric fields
        const parsed = {
            ...formData,
            basePrice: parseFloat(formData.basePrice) || 0,
            maxGuests: parseInt(formData.maxGuests, 10) || 0,
        };

        // Validate with Zod
        const result = roomTypeSchema.safeParse(parsed);
        if (!result.success) {
            const fieldErrors = {};
            result.error.errors.forEach((err) => {
                const field = err.path[0];
                if (!fieldErrors[field]) fieldErrors[field] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        onSubmit(result.data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <Card className="relative z-10 w-full max-w-lg mx-4 shadow-2xl border-0 animate-in fade-in-0 zoom-in-95 duration-200">
                <CardHeader className="pb-4 border-b">
                    <CardTitle className="text-xl">
                        {isEditing ? 'Edit Room Type' : 'Create Room Type'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="rt-name">
                                Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="rt-name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="e.g. Deluxe Suite"
                                className={errors.name ? 'border-destructive' : ''}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">{errors.name}</p>
                            )}
                        </div>

                        {/* Price & Guests — side by side */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rt-price">
                                    Base Price ($) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="rt-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.basePrice}
                                    onChange={(e) => handleChange('basePrice', e.target.value)}
                                    placeholder="99.99"
                                    className={errors.basePrice ? 'border-destructive' : ''}
                                />
                                {errors.basePrice && (
                                    <p className="text-xs text-destructive">{errors.basePrice}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rt-guests">
                                    Max Guests <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="rt-guests"
                                    type="number"
                                    min="1"
                                    value={formData.maxGuests}
                                    onChange={(e) => handleChange('maxGuests', e.target.value)}
                                    placeholder="2"
                                    className={errors.maxGuests ? 'border-destructive' : ''}
                                />
                                {errors.maxGuests && (
                                    <p className="text-xs text-destructive">{errors.maxGuests}</p>
                                )}
                            </div>
                        </div>

                        {/* Amenities — Tags Input */}
                        <div className="space-y-2">
                            <Label>Amenities</Label>
                            <TagsInput
                                tags={formData.amenities}
                                onChange={(tags) => handleChange('amenities', tags)}
                                placeholder="Type amenity and press Enter…"
                            />
                            <p className="text-xs text-muted-foreground">
                                Press Enter to add. Backspace to remove last.
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="rt-desc">Description</Label>
                            <textarea
                                id="rt-desc"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Optional description of this room type…"
                                rows={3}
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                            />
                            {errors.description && (
                                <p className="text-xs text-destructive">{errors.description}</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Saving…
                                    </span>
                                ) : isEditing ? 'Save Changes' : 'Create Room Type'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

// ── Pagination Sub-Component ───────────────────────────────────────
function Pagination({ page, limit, total, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-1 py-4">
            <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">{(page - 1) * limit + 1}</span>
                –
                <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span>
                {' '}of{' '}
                <span className="font-medium text-foreground">{total}</span> results
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    ← Previous
                </Button>
                {/* Page indicators */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        size="sm"
                        className="w-9"
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </Button>
                ))}
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next →
                </Button>
            </div>
        </div>
    );
}

// ── Confirmation Dialog Sub-Component ──────────────────────────────
function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel, isLoading }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <Card className="relative z-10 w-full max-w-sm mx-4 shadow-2xl border-0 animate-in fade-in-0 zoom-in-95 duration-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-6">{message}</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                        <Button onClick={onConfirm} disabled={isLoading}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Processing…
                                </span>
                            ) : confirmLabel}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// ── Main Room Types Page ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
export default function RoomTypes() {
    // ── State ──
    const [roomTypes, setRoomTypes] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    // Dialog state
    const [formOpen, setFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // Toggle confirmation state
    const [toggleConfirm, setToggleConfirm] = useState(null); // { id, name, currentlyActive }
    const [isToggling, setIsToggling] = useState(false);

    // ── Data Fetching ──
    const fetchRoomTypes = useCallback(async (page = 1, searchQuery = '') => {
        try {
            setLoading(true);
            setError(null);
            const result = await getRoomTypes({ page, limit: PAGE_LIMIT, search: searchQuery });
            setRoomTypes(result.data);
            setPagination(result.pagination);
        } catch (err) {
            console.error('Failed to load room types:', err);
            setError(err.message || 'Failed to load room types');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRoomTypes(1, search);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Search with debounce ──
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchRoomTypes(1, search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, fetchRoomTypes]);

    // ── Handlers ──
    const handleCreate = () => {
        setEditingItem(null);
        setSubmitError(null);
        setFormOpen(true);
    };

    const handleEdit = (roomType) => {
        setEditingItem(roomType);
        setSubmitError(null);
        setFormOpen(true);
    };

    const handleFormSubmit = async (data) => {
        try {
            setIsSubmitting(true);
            setSubmitError(null);

            if (editingItem) {
                await updateRoomType(editingItem.id, data);
            } else {
                await createRoomType(data);
            }

            setFormOpen(false);
            setEditingItem(null);
            fetchRoomTypes(pagination.page, search);
        } catch (err) {
            setSubmitError(err.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = (roomType) => {
        setToggleConfirm({
            id: roomType.id,
            name: roomType.name,
            currentlyActive: roomType.isActive,
        });
    };

    const confirmToggleStatus = async () => {
        if (!toggleConfirm) return;
        try {
            setIsToggling(true);
            await toggleRoomTypeStatus(toggleConfirm.id);
            setToggleConfirm(null);
            fetchRoomTypes(pagination.page, search);
        } catch (err) {
            console.error('Failed to toggle status:', err);
        } finally {
            setIsToggling(false);
        }
    };

    const handlePageChange = (newPage) => {
        fetchRoomTypes(newPage, search);
    };

    // ── Render: Loading State ──
    if (loading && roomTypes.length === 0) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">Loading room types…</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Render: Error State ──
    if (error && roomTypes.length === 0) {
        return (
            <div className="p-8 max-w-2xl mx-auto">
                <Alert variant="destructive">
                    <AlertTitle>Error loading room types</AlertTitle>
                    <AlertDescription className="mt-2">
                        {error}
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-3"
                            onClick={() => fetchRoomTypes(1, search)}
                        >
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Room Types</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your hotel&apos;s room categories, pricing, and amenities.
                    </p>
                </div>
                <Button onClick={handleCreate} className="gap-2 shadow-sm">
                    <span className="text-lg leading-none">+</span>
                    Add Room Type
                </Button>
            </div>

            {/* ── Search Bar ── */}
            <div className="relative max-w-sm">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search room types…"
                    className="pl-9"
                />
            </div>

            {/* ── Submit Error Banner ── */}
            {submitError && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                </Alert>
            )}

            {/* ── Empty State ── */}
            {!loading && roomTypes.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="bg-secondary rounded-full p-4 mb-4">
                            <span className="text-4xl">🏨</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-1">No room types found</h3>
                        <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                            {search
                                ? `No room types match "${search}". Try a different search term.`
                                : 'Get started by adding your first room type to categorize your hotel rooms.'}
                        </p>
                        {!search && (
                            <Button onClick={handleCreate} className="gap-2">
                                <span className="text-lg leading-none">+</span>
                                Add Your First Room Type
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── Data Table ── */}
            {roomTypes.length > 0 && (
                <Card className="shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="text-left font-semibold py-3.5 px-4 text-muted-foreground">Name</th>
                                    <th className="text-left font-semibold py-3.5 px-4 text-muted-foreground">Base Price</th>
                                    <th className="text-left font-semibold py-3.5 px-4 text-muted-foreground">Max Guests</th>
                                    <th className="text-left font-semibold py-3.5 px-4 text-muted-foreground">Amenities</th>
                                    <th className="text-left font-semibold py-3.5 px-4 text-muted-foreground">Status</th>
                                    <th className="text-right font-semibold py-3.5 px-4 text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roomTypes.map((rt) => (
                                    <tr
                                        key={rt.id}
                                        className={`border-b last:border-b-0 transition-colors hover:bg-muted/30 ${!rt.isActive ? 'opacity-60' : ''
                                            }`}
                                    >
                                        {/* Name */}
                                        <td className="py-3.5 px-4">
                                            <div>
                                                <p className="font-medium text-foreground">{rt.name}</p>
                                                {rt.description && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[200px]">
                                                        {rt.description}
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Price */}
                                        <td className="py-3.5 px-4">
                                            <span className="font-semibold text-foreground">
                                                ${rt.basePrice.toFixed(2)}
                                            </span>
                                            <span className="text-xs text-muted-foreground ml-1">/night</span>
                                        </td>

                                        {/* Guests */}
                                        <td className="py-3.5 px-4">
                                            <span className="inline-flex items-center gap-1">
                                                <span>👤</span>
                                                <span className="font-medium">{rt.maxGuests}</span>
                                            </span>
                                        </td>

                                        {/* Amenities */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                                                {(rt.amenities || []).slice(0, 3).map((a, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                                        {a}
                                                    </Badge>
                                                ))}
                                                {(rt.amenities || []).length > 3 && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                                                        +{rt.amenities.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4">
                                            <Badge
                                                variant={rt.isActive ? 'default' : 'secondary'}
                                                className={
                                                    rt.isActive
                                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-100 border-gray-200'
                                                }
                                            >
                                                {rt.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(rt)}
                                                    className="h-8 px-2.5 text-xs"
                                                >
                                                    ✏️ Edit
                                                </Button>
                                                <Button
                                                    variant={rt.isActive ? 'outline' : 'ghost'}
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(rt)}
                                                    className={`h-8 px-2.5 text-xs ${rt.isActive
                                                            ? 'text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700'
                                                            : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                                                        }`}
                                                >
                                                    {rt.isActive ? '📦 Archive' : '♻️ Restore'}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="border-t px-4">
                        <Pagination
                            page={pagination.page}
                            limit={pagination.limit}
                            total={pagination.total}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </Card>
            )}

            {/* ── Loading overlay for refetches ── */}
            {loading && roomTypes.length > 0 && (
                <div className="flex justify-center py-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            )}

            {/* ── Form Dialog ── */}
            <RoomTypeFormDialog
                isOpen={formOpen}
                onClose={() => { setFormOpen(false); setEditingItem(null); setSubmitError(null); }}
                onSubmit={handleFormSubmit}
                initialData={editingItem}
                isSubmitting={isSubmitting}
            />

            {/* ── Toggle Status Confirmation ── */}
            <ConfirmDialog
                isOpen={!!toggleConfirm}
                onClose={() => setToggleConfirm(null)}
                onConfirm={confirmToggleStatus}
                isLoading={isToggling}
                title={toggleConfirm?.currentlyActive ? 'Archive Room Type' : 'Restore Room Type'}
                message={
                    toggleConfirm?.currentlyActive
                        ? `Are you sure you want to archive "${toggleConfirm?.name}"? It will be hidden from active listings but can be restored later.`
                        : `Are you sure you want to restore "${toggleConfirm?.name}"? It will appear in active listings again.`
                }
                confirmLabel={toggleConfirm?.currentlyActive ? 'Archive' : 'Restore'}
            />
        </div>
    );
}
