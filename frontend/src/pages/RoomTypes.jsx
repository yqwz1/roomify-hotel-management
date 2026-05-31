import { useState, useEffect, useMemo } from 'react';
import { useRoomTypes } from '../hooks/useRoomTypes';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../components/ui/sheet';
import { Plus, Trash2, Loader2, Info, Pencil, Box } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import DashboardHero from '../components/dashboard/DashboardHero';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { formatLocalizedCurrency, translateKnownValue, translateWithFallback } from '../utils/localization';

const COMMON_AMENITIES = ["WiFi", "TV", "AC", "Safe", "Balcony", "Breakfast"];

function SkeletonRow() {
    return (
        <tr className="border-b border-brand-surface-border">
            <td className="p-5">
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-brand-surface-border rounded animate-pulse" />
                    <div className="h-3 w-48 bg-brand-primary-tint rounded animate-pulse" />
                </div>
            </td>
            <td className="p-5">
                <div className="flex min-w-0 gap-2">
                    <div className="h-6 w-16 bg-brand-surface-border rounded-full animate-pulse" />
                    <div className="h-6 w-20 bg-brand-primary-tint rounded-full animate-pulse" />
                </div>
            </td>
            <td className="p-5 text-end">
                <div className="h-5 w-20 bg-brand-surface-border rounded animate-pulse ms-auto" />
            </td>
            <td className="p-5 text-end">
                <div className="h-5 w-8 bg-brand-primary-tint rounded animate-pulse ms-auto" />
            </td>
            <td className="p-5 text-end">
                <div className="flex min-w-0 justify-end gap-2">
                    <div className="h-10 w-10 bg-brand-surface-border rounded-full animate-pulse" />
                    <div className="h-10 w-10 bg-brand-primary-tint rounded-full animate-pulse" />
                </div>
            </td>
        </tr>
    );
}

export default function RoomTypes() {
    const { t, i18n } = useTranslation();
    const { roomTypes, loading, error, fetchRoomTypes, createRoomType, updateRoomType, deleteRoomType } = useRoomTypes();
    const showMobileCards = useMediaQuery('(max-width: 767px)');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [pageError, setPageError] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        basePrice: '',
        maxGuests: 1,
        amenities: [],
        description: ''
    });

    // Error State
    const [formError, setFormError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        fetchRoomTypes();
    }, [fetchRoomTypes]);

    const summary = useMemo(() => {
        const total = roomTypes.length;
        const amenityCount = new Set(
            roomTypes.flatMap((roomType) =>
                roomType.amenities
                    ? roomType.amenities.split(',').map((amenity) => amenity.trim()).filter(Boolean)
                    : []
            )
        ).size;
        const averageRate = total
            ? roomTypes.reduce((sum, roomType) => sum + Number(roomType.basePrice || 0), 0) / total
            : 0;

        return {
            total,
            amenityCount,
            averageRate,
        };
    }, [roomTypes]);

    const amenityOptions = useMemo(() => {
        const options = [...COMMON_AMENITIES];
        formData.amenities
            .map((amenity) => amenity?.trim())
            .filter(Boolean)
            .forEach((amenity) => {
                if (!options.includes(amenity)) {
                    options.push(amenity);
                }
            });
        return options;
    }, [formData.amenities]);

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

    const handleAmenityToggle = (amenity) => {
        setFormData(prev => {
            const currentAmenities = prev.amenities;
            if (currentAmenities.includes(amenity)) {
                return { ...prev, amenities: currentAmenities.filter(a => a !== amenity) };
            } else {
                return { ...prev, amenities: [...currentAmenities, amenity] };
            }
        });
    };

    const handleEdit = (roomType) => {
        setFormData({
            name: roomType.name,
            basePrice: roomType.basePrice,
            maxGuests: roomType.maxGuests,
            amenities: roomType.amenities ? roomType.amenities.split(',').map(a => a.trim()) : [],
            description: roomType.description || ''
        });
        setEditingId(roomType.id);
        setIsSheetOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            basePrice: '',
            maxGuests: 1,
            amenities: [],
            description: ''
        });
        setFormError(null);
        setValidationErrors({});
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        setValidationErrors({});

        // Client-side validation for negative price - REMOVED (Backend now handles this)
        // if (parseFloat(formData.basePrice) < 0) {
        //   setValidationErrors(prev => ({ ...prev, basePrice: "Price must be positive" }));
        //   return;
        // }

        setIsSubmitting(true);

        // Prepare data
        const payload = {
            ...formData,
            basePrice: parseFloat(formData.basePrice),
            maxGuests: parseInt(formData.maxGuests)
        };

        let result;
        if (editingId) {
            result = await updateRoomType(editingId, payload);
        } else {
            result = await createRoomType(payload);
        }

        setIsSubmitting(false);

        if (result.success) {
            setSuccessMessage(editingId ? t('roomTypeUpdated') : t('roomTypeCreated'));
            setIsSheetOpen(false);
            resetForm();
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } else {
            setFormError(result.error);
            if (result.validationErrors) {
                setValidationErrors(result.validationErrors);
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('confirmDeleteRoomType'))) {
            const result = await deleteRoomType(id);
            if (result.success) {
                setSuccessMessage(t('roomTypeDeleted'));
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setPageError(result.error);
                setTimeout(() => setPageError(null), 4000);
            }
        }
    };

    return (
        <div className="roomify-page-enter mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
            <DashboardHero
                eyebrow={translateWithFallback(t, 'roomTypesPage.heroEyebrow', 'Catalog control')}
                title={t('roomTypesTitle')}
                description={t('roomTypesDesc')}
                meta={[
                    translateWithFallback(t, 'roomTypesPage.totalMeta', '{{count}} room types', {
                        count: summary.total,
                    }),
                    translateWithFallback(t, 'roomTypesPage.amenitiesMeta', '{{count}} amenities', {
                        count: summary.amenityCount,
                    }),
                    translateWithFallback(t, 'roomTypesPage.rateMeta', 'Avg {{value}}', {
                        value: formatLocalizedCurrency(summary.averageRate, i18n.language, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                        }),
                    }),
                ]}
            >
                <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint break-words">
                        {translateWithFallback(t, 'roomTypesPage.catalogSnapshot', 'Catalog Snapshot')}
                    </p>
                    <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                                {translateWithFallback(t, 'roomTypesPage.typesLabel', 'Types')}
                            </p>
                            <p className="mt-2 text-lg font-black break-words">{summary.total}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                                {translateWithFallback(t, 'roomTypesPage.avgRateLabel', 'Avg Rate')}
                            </p>
                            <p className="mt-2 whitespace-nowrap text-lg font-black">
                                {formatLocalizedCurrency(summary.averageRate, i18n.language, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </DashboardHero>

            <div className="flex min-w-0 justify-end">
                <Button onClick={() => { setIsSheetOpen(true); resetForm(); }} className="gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-primary-deep">
                    <Plus className="h-4 w-4 shrink-0" /> {t('createNewBtn')}
                </Button>
            </div>

            {successMessage && (
                <Alert className="bg-brand-success border-brand-success text-brand-success">
                    <Info className="h-4 w-4 text-brand-success shrink-0" />
                    <AlertTitle>{t('success')}</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
            )}

            {(error || pageError) && (
                <Alert variant="destructive">
                    <Info className="h-4 w-4 shrink-0" />
                    <AlertTitle>{t('error')}</AlertTitle>
                    <AlertDescription>{pageError || error}</AlertDescription>
                </Alert>
            )}

            <Card className="overflow-hidden rounded-[1.75rem] border border-brand-surface-border bg-white shadow-sm">
                <CardHeader className="border-b border-brand-surface-border px-8 pb-4 pt-8">
                    <CardTitle className="text-xl font-bold text-brand-ink">{t('allRoomTypes')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading && !roomTypes.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed caption-bottom text-sm text-start">
                                <colgroup>
                                    <col className="w-[30%]" />
                                    <col className="w-[42%]" />
                                    <col className="w-[12%]" />
                                    <col className="w-[8%]" />
                                    <col className="w-[8%]" />
                                </colgroup>
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b border-brand-surface-border">
                                        <th className="h-14 px-5 align-middle text-xs font-bold uppercase tracking-widest text-brand-ink-hint w-[260px]">{t('colDetails')}</th>
                                        <th className="h-14 px-5 align-middle text-xs font-bold uppercase tracking-widest text-brand-ink-hint">{t('colAmenities')}</th>
                                        <th className="h-14 px-5 align-middle text-xs font-bold uppercase tracking-widest text-brand-ink-hint text-end">{t('colPrice')}</th>
                                        <th className="h-14 px-5 align-middle text-xs font-bold uppercase tracking-widest text-brand-ink-hint text-end">{t('colMaxGuests')}</th>
                                        <th className="h-14 px-5 align-middle text-xs font-bold uppercase tracking-widest text-brand-ink-hint text-end w-[140px]">{t('colActions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
                                </tbody>
                            </table>
                        </div>
                    ) : roomTypes.length === 0 ? (
                        <div className="flex min-w-0 flex-col items-center justify-center py-20 space-y-5">
                            <div className="flex min-w-0 items-center justify-center h-20 w-20 rounded-full bg-brand-primary-tint">
                                <Box className="h-10 w-10 text-brand-ink-hint shrink-0" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-xl font-bold text-brand-ink break-words">{t('noRoomTypesYet')}</p>
                                <p className="text-sm font-medium text-brand-ink-muted break-words">{t('getStartedRoomType')}</p>
                            </div>
                            <Button onClick={() => { setIsSheetOpen(true); resetForm(); }} className="gap-2 mt-4 rounded-full bg-brand-ink hover:bg-brand-primary-deep text-white font-bold px-6">
                                <Plus className="h-4 w-4 shrink-0" /> {t('createNowBtn')}
                            </Button>
                        </div>
                    ) : (
                        <>
                            {showMobileCards ? (
                            <div className="space-y-4">
                                {roomTypes.map((rt) => (
                                    <article
                                        key={rt.id}
                                        className="rounded-[1.5rem] border border-brand-surface-border bg-white p-4 shadow-sm"
                                    >
                                        <div className="flex min-w-0 items-start justify-between gap-3">
                                            <div>
                                                <p className="text-lg font-black text-brand-ink break-words">{rt.name}</p>
                                                <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                                                    {rt.description || '-'}
                                                </p>
                                            </div>
                                            <span className="rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1 text-xs font-bold text-brand-ink break-words">
                                                {rt.maxGuests} {t('guestsLabel', { defaultValue: 'guests' })}
                                            </span>
                                        </div>

                                        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
                                            <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                                                    {t('colPrice')}
                                                </p>
                                                <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                                                    {formatLocalizedCurrency(rt.basePrice, i18n.language)}
                                                </p>
                                            </div>
                                            <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                                                    {t('colAmenities')}
                                                </p>
                                                <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                                                    {rt.amenities ? rt.amenities.split(',').filter(Boolean).length : 0}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                                            {rt.amenities ? rt.amenities.split(',').map((amenity, idx) => (
                                                <span key={idx} className="rounded-full border border-brand-surface-border bg-white px-3 py-1.5 text-xs font-bold text-brand-ink drop-shadow-sm break-words">
                                                    {translateKnownValue(amenity.trim(), t)}
                                                </span>
                                            )) : <span className="text-brand-ink-hint text-xs font-medium break-words">-</span>}
                                        </div>

                                        <div className="mt-4 flex min-w-0 gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(rt)}
                                                className="h-10 w-10 rounded-full border border-brand-surface-border bg-white text-brand-ink shadow-sm transition-colors hover:bg-brand-primary-tint hover:text-brand-ink"
                                                aria-label={translateWithFallback(t, 'common.edit', 'Edit')}
                                            >
                                                <Pencil className="h-4 w-4 shrink-0" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(rt.id)}
                                                className="h-10 w-10 rounded-full border border-brand-ink bg-brand-ink text-white shadow-sm transition-colors hover:bg-brand-primary-deep"
                                                aria-label={translateWithFallback(t, 'common.delete', 'Delete')}
                                            >
                                                <Trash2 className="h-4 w-4 shrink-0" />
                                            </Button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                            ) : (
                            <div className="relative w-full overflow-x-auto">
                            <table className="w-full table-fixed caption-bottom text-sm text-start">
                                <colgroup>
                                    <col className="w-[30%]" />
                                    <col className="w-[42%]" />
                                    <col className="w-[12%]" />
                                    <col className="w-[8%]" />
                                    <col className="w-[8%]" />
                                </colgroup>
                                <thead className="[&_tr]:border-b [&_tr]:border-brand-surface-border">
                                    <tr className="transition-colors hover:bg-brand-surface-light data-[state=selected]:bg-brand-surface-light">
                                        <th className="h-14 px-6 align-middle text-xs font-bold uppercase tracking-widest text-brand-ink-hint w-[260px]">{t('colDetails')}</th>
                                        <th className="h-14 px-6 align-middle text-xs font-bold uppercase tracking-widest text-brand-ink-hint">{t('colAmenities')}</th>
                                        <th className="h-14 px-6 align-middle text-xs font-bold uppercase tracking-widest text-brand-ink-hint text-end">{t('colPrice')}</th>
                                        <th className="h-14 px-6 align-middle text-xs font-bold uppercase tracking-widest text-brand-ink-hint text-end">{t('colMaxGuests')}</th>
                                        <th className="h-14 px-6 align-middle text-xs font-bold uppercase tracking-widest text-brand-ink-hint text-end w-[140px]">{t('colActions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {roomTypes.map((rt) => (
                                        <tr key={rt.id} className="border-b border-brand-surface-border transition-colors hover:bg-brand-surface-light data-[state=selected]:bg-brand-surface-light">
                                            <td className="p-6 align-middle font-medium">
                                                <div className="font-extrabold text-brand-ink text-base">{rt.name}</div>
                                                <div className="mt-1 line-clamp-2 text-xs font-medium text-brand-ink-muted">{rt.description}</div>
                                            </td>
                                            <td className="p-6 align-middle">
                                                <div className="flex min-w-0 flex-wrap gap-2">
                                                    {rt.amenities ? rt.amenities.split(',').map((amenity, idx) => (
                                                        <span key={idx} className="rounded-full border border-brand-surface-border bg-white px-3 py-1.5 text-xs font-bold text-brand-ink drop-shadow-sm break-words">
                                                            {translateKnownValue(amenity.trim(), t)}
                                                        </span>
                                                    )) : <span className="text-brand-ink-hint text-xs font-medium break-words">-</span>}
                                                </div>
                                            </td>
                                            <td className="p-6 align-middle text-end font-mono">
                                                <span className="font-extrabold text-brand-ink break-words">{formatLocalizedCurrency(rt.basePrice, i18n.language)}</span>
                                            </td>
                                            <td className="p-6 align-middle text-end font-bold text-brand-ink">
                                                {rt.maxGuests}
                                            </td>
                                            <td className="p-6 align-middle">
                                                <div className="inline-flex min-w-0 items-center justify-end gap-1.5 whitespace-nowrap">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(rt)}
                                                        className="h-8 w-8 rounded-lg border border-brand-surface-border bg-white text-brand-ink shadow-sm transition-colors hover:bg-brand-primary-tint hover:text-brand-ink"
                                                        aria-label={translateWithFallback(t, 'common.edit', 'Edit')}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5 shrink-0" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(rt.id)}
                                                        className="h-8 w-8 rounded-lg border border-brand-ink bg-brand-ink text-white shadow-sm transition-colors hover:bg-brand-primary-deep"
                                                        aria-label={translateWithFallback(t, 'common.delete', 'Delete')}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 shrink-0" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Create New Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{editingId ? t('editRoomType') : t('createRoomType')}</SheetTitle>
                        <SheetDescription>
                            {editingId ? t('updateRoomTypeDesc') : t('createRoomTypeDesc')}
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-8">

                        {formError && (
                            <Alert variant="destructive">
                                <Info className="h-4 w-4 shrink-0" />
                                <AlertDescription>{formError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-3">
                            <Label htmlFor="name" className="text-xs font-bold text-brand-ink-muted uppercase tracking-widest">{t('nameLabel')} <span className="text-brand-danger break-words">*</span></Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder={t('namePlaceholder')}
                                className={`rounded-full border px-5 py-6 text-base font-bold text-brand-ink focus-visible:ring-brand-primary focus-visible:ring-offset-1 ${validationErrors.name ? "border-brand-danger" : "border-brand-surface-border"}`}
                                required
                            />
                            {validationErrors.name && <p className="text-xs font-bold text-brand-danger break-words">{validationErrors.name}</p>}
                        </div>

                        <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                            <div className="space-y-3">
                                <Label htmlFor="basePrice" className="text-xs font-bold text-brand-ink-muted uppercase tracking-widest">{t('basePriceLabel')} <span className="text-brand-danger break-words">*</span></Label>
                                <Input
                                    id="basePrice"
                                    name="basePrice"
                                    type="number"
                                    step="0.01"
                                    value={formData.basePrice}
                                    onChange={handleInputChange}
                                    className={`rounded-full border px-5 py-6 text-base font-bold text-brand-ink focus-visible:ring-brand-primary focus-visible:ring-offset-1 ${validationErrors.basePrice ? "border-brand-danger" : "border-brand-surface-border"}`}
                                    required
                                />
                                {validationErrors.basePrice && <p className="text-xs font-bold text-brand-danger break-words">{validationErrors.basePrice}</p>}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="maxGuests" className="text-xs font-bold text-brand-ink-muted uppercase tracking-widest">{t('maxGuestsLabel')} <span className="text-brand-danger break-words">*</span></Label>
                                <Input
                                    id="maxGuests"
                                    name="maxGuests"
                                    type="number"
                                    min="1"
                                    max="8"
                                    value={formData.maxGuests}
                                    onChange={handleInputChange}
                                    className={`rounded-full border px-5 py-6 text-base font-bold text-brand-ink focus-visible:ring-brand-primary focus-visible:ring-offset-1 ${validationErrors.maxGuests ? "border-brand-danger" : "border-brand-surface-border"}`}
                                    required
                                />
                                {validationErrors.maxGuests && <p className="text-xs font-bold text-brand-danger break-words">{validationErrors.maxGuests}</p>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-bold text-brand-ink-muted uppercase tracking-widest">{t('amenitiesLabel')}</Label>
                            <div className="grid min-w-0 grid-cols-2 sm:grid-cols-3 gap-3">
                                {amenityOptions.map((amenity) => (
                                    <label key={amenity} className="flex min-w-0 items-center space-x-3 text-sm font-bold text-brand-ink cursor-pointer p-3 border border-brand-surface-border rounded-2xl hover:bg-brand-surface-light transition-colors">
                                        <Checkbox className="h-5 w-5 rounded-full border-brand-surface-border focus-visible:ring-brand-primary data-[state=checked]:bg-brand-success data-[state=checked]:border-brand-success shrink-0"
                                            checked={formData.amenities.includes(amenity)}
                                            onCheckedChange={() => handleAmenityToggle(amenity)}
                                        />
                                        <span>{translateKnownValue(amenity, t)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="description" className="text-xs font-bold text-brand-ink-muted uppercase tracking-widest">{t('descLabel')}</Label>
                            <Input
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder={t('descPlaceholder')}
                                className="rounded-full border border-brand-surface-border px-5 py-6 text-base font-medium text-brand-ink focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                            />
                        </div>

                        <SheetFooter className="mt-10 mb-4 flex min-w-0 gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="rounded-full border-brand-surface-border bg-white py-6 font-bold text-brand-ink hover:bg-brand-surface-light min-w-0 flex-1">{t('cancel')}</Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-full py-6 font-bold min-w-0 flex-1 bg-brand-ink text-white hover:bg-brand-primary-deep">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="me-2 h-4 w-4 animate-spin shrink-0" /> {editingId ? t('updatingMsg') : t('creatingMsg')}
                                    </>
                                ) : (
                                    editingId ? t('updateRoomTypeBtn') : t('createRoomTypeBtn')
                                )}
                            </Button>
                        </SheetFooter>

                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}
