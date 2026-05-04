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
import { formatLocalizedCurrency, translateKnownValue, translateWithFallback } from '../utils/localization';

const COMMON_AMENITIES = ["WiFi", "TV", "AC", "Safe", "Balcony", "Breakfast"];

function SkeletonRow() {
    return (
        <tr className="border-b border-zinc-100">
            <td className="p-5">
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-zinc-200 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-zinc-100 rounded animate-pulse" />
                </div>
            </td>
            <td className="p-5">
                <div className="flex gap-2">
                    <div className="h-6 w-16 bg-zinc-200 rounded-full animate-pulse" />
                    <div className="h-6 w-20 bg-zinc-100 rounded-full animate-pulse" />
                </div>
            </td>
            <td className="p-5 text-end">
                <div className="h-5 w-20 bg-zinc-200 rounded animate-pulse ms-auto" />
            </td>
            <td className="p-5 text-end">
                <div className="h-5 w-8 bg-zinc-100 rounded animate-pulse ms-auto" />
            </td>
            <td className="p-5 text-end">
                <div className="flex justify-end gap-2">
                    <div className="h-10 w-10 bg-zinc-200 rounded-full animate-pulse" />
                    <div className="h-10 w-10 bg-zinc-100 rounded-full animate-pulse" />
                </div>
            </td>
        </tr>
    );
}

export default function RoomTypes() {
    const { t, i18n } = useTranslation();
    const { roomTypes, loading, error, fetchRoomTypes, createRoomType, updateRoomType, deleteRoomType } = useRoomTypes();
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
        <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
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
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
                        {translateWithFallback(t, 'roomTypesPage.catalogSnapshot', 'Catalog Snapshot')}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                                {translateWithFallback(t, 'roomTypesPage.typesLabel', 'Types')}
                            </p>
                            <p className="mt-2 text-lg font-black">{summary.total}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
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

            <div className="flex justify-end">
                <Button onClick={() => { setIsSheetOpen(true); resetForm(); }} className="gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800">
                    <Plus className="h-4 w-4" /> {t('createNewBtn')}
                </Button>
            </div>

            {successMessage && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                    <Info className="h-4 w-4 text-green-600" />
                    <AlertTitle>{t('success')}</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
            )}

            {(error || pageError) && (
                <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertTitle>{t('error')}</AlertTitle>
                    <AlertDescription>{pageError || error}</AlertDescription>
                </Alert>
            )}

            <Card className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm">
                <CardHeader className="border-b border-zinc-100 px-8 pb-4 pt-8">
                    <CardTitle className="text-xl font-bold text-black">{t('allRoomTypes')}</CardTitle>
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
                                    <tr className="border-b border-zinc-100">
                                        <th className="h-14 px-5 align-middle text-xs font-bold uppercase tracking-widest text-zinc-400 w-[260px]">{t('colDetails')}</th>
                                        <th className="h-14 px-5 align-middle text-xs font-bold uppercase tracking-widest text-zinc-400">{t('colAmenities')}</th>
                                        <th className="h-14 px-5 align-middle text-xs font-bold uppercase tracking-widest text-zinc-400 text-end">{t('colPrice')}</th>
                                        <th className="h-14 px-5 align-middle text-xs font-bold uppercase tracking-widest text-zinc-400 text-end">{t('colMaxGuests')}</th>
                                        <th className="h-14 px-5 align-middle text-xs font-bold uppercase tracking-widest text-zinc-400 text-end w-[140px]">{t('colActions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
                                </tbody>
                            </table>
                        </div>
                    ) : roomTypes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-5">
                            <div className="flex items-center justify-center h-20 w-20 rounded-full bg-zinc-100">
                                <Box className="h-10 w-10 text-zinc-400" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-xl font-bold text-black">{t('noRoomTypesYet')}</p>
                                <p className="text-sm font-medium text-zinc-500">{t('getStartedRoomType')}</p>
                            </div>
                            <Button onClick={() => { setIsSheetOpen(true); resetForm(); }} className="gap-2 mt-4 rounded-full bg-black hover:bg-zinc-800 text-white font-bold px-6">
                                <Plus className="h-4 w-4" /> {t('createNowBtn')}
                            </Button>
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
                                <thead className="[&_tr]:border-b [&_tr]:border-zinc-100">
                                    <tr className="transition-colors hover:bg-zinc-50/50 data-[state=selected]:bg-zinc-50">
                                        <th className="h-14 px-6 align-middle text-xs font-bold uppercase tracking-widest text-zinc-400 w-[260px]">{t('colDetails')}</th>
                                        <th className="h-14 px-6 align-middle text-xs font-bold uppercase tracking-widest text-zinc-400">{t('colAmenities')}</th>
                                        <th className="h-14 px-6 align-middle text-xs font-bold uppercase tracking-widest text-zinc-400 text-end">{t('colPrice')}</th>
                                        <th className="h-14 px-6 align-middle text-xs font-bold uppercase tracking-widest text-zinc-400 text-end">{t('colMaxGuests')}</th>
                                        <th className="h-14 px-6 align-middle text-xs font-bold uppercase tracking-widest text-zinc-400 text-end w-[140px]">{t('colActions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {roomTypes.map((rt) => (
                                        <tr key={rt.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 data-[state=selected]:bg-zinc-50">
                                            <td className="p-6 align-middle font-medium">
                                                <div className="font-extrabold text-black text-base">{rt.name}</div>
                                                <div className="mt-1 line-clamp-2 text-xs font-medium text-zinc-500">{rt.description}</div>
                                            </td>
                                            <td className="p-6 align-middle">
                                                <div className="flex flex-wrap gap-2">
                                                    {rt.amenities ? rt.amenities.split(',').map((amenity, idx) => (
                                                        <span key={idx} className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-black drop-shadow-sm">
                                                            {translateKnownValue(amenity.trim(), t)}
                                                        </span>
                                                    )) : <span className="text-zinc-400 text-xs font-medium">-</span>}
                                                </div>
                                            </td>
                                            <td className="p-6 align-middle text-end font-mono">
                                                <span className="font-extrabold text-black">{formatLocalizedCurrency(rt.basePrice, i18n.language)}</span>
                                            </td>
                                            <td className="p-6 align-middle text-end font-bold text-black">
                                                {rt.maxGuests}
                                            </td>
                                            <td className="p-6 align-middle">
                                                <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(rt)}
                                                        className="h-8 w-8 rounded-lg border border-zinc-200 bg-white text-zinc-800 shadow-sm transition-colors hover:bg-zinc-100 hover:text-black"
                                                        aria-label={translateWithFallback(t, 'common.edit', 'Edit')}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(rt.id)}
                                                        className="h-8 w-8 rounded-lg border border-black bg-black text-white shadow-sm transition-colors hover:bg-zinc-800"
                                                        aria-label={translateWithFallback(t, 'common.delete', 'Delete')}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                                <Info className="h-4 w-4" />
                                <AlertDescription>{formError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-3">
                            <Label htmlFor="name" className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('nameLabel')} <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder={t('namePlaceholder')}
                                className={`rounded-full border px-5 py-6 text-base font-bold text-black focus-visible:ring-black focus-visible:ring-offset-1 ${validationErrors.name ? "border-red-500" : "border-zinc-200"}`}
                                required
                            />
                            {validationErrors.name && <p className="text-xs font-bold text-red-500">{validationErrors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-3">
                                <Label htmlFor="basePrice" className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('basePriceLabel')} <span className="text-red-500">*</span></Label>
                                <Input
                                    id="basePrice"
                                    name="basePrice"
                                    type="number"
                                    step="0.01"
                                    value={formData.basePrice}
                                    onChange={handleInputChange}
                                    className={`rounded-full border px-5 py-6 text-base font-bold text-black focus-visible:ring-black focus-visible:ring-offset-1 ${validationErrors.basePrice ? "border-red-500" : "border-zinc-200"}`}
                                    required
                                />
                                {validationErrors.basePrice && <p className="text-xs font-bold text-red-500">{validationErrors.basePrice}</p>}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="maxGuests" className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('maxGuestsLabel')} <span className="text-red-500">*</span></Label>
                                <Input
                                    id="maxGuests"
                                    name="maxGuests"
                                    type="number"
                                    min="1"
                                    max="8"
                                    value={formData.maxGuests}
                                    onChange={handleInputChange}
                                    className={`rounded-full border px-5 py-6 text-base font-bold text-black focus-visible:ring-black focus-visible:ring-offset-1 ${validationErrors.maxGuests ? "border-red-500" : "border-zinc-200"}`}
                                    required
                                />
                                {validationErrors.maxGuests && <p className="text-xs font-bold text-red-500">{validationErrors.maxGuests}</p>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('amenitiesLabel')}</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {amenityOptions.map((amenity) => (
                                    <label key={amenity} className="flex items-center space-x-3 text-sm font-bold text-black cursor-pointer p-3 border border-zinc-200 rounded-2xl hover:bg-zinc-50 transition-colors">
                                        <Checkbox
                                            className="h-5 w-5 rounded-full border-zinc-300 focus-visible:ring-black data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                            checked={formData.amenities.includes(amenity)}
                                            onCheckedChange={() => handleAmenityToggle(amenity)}
                                        />
                                        <span>{translateKnownValue(amenity, t)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="description" className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('descLabel')}</Label>
                            <Input
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder={t('descPlaceholder')}
                                className="rounded-full border border-zinc-200 px-5 py-6 text-base font-medium text-black focus-visible:ring-black focus-visible:ring-offset-1"
                            />
                        </div>

                        <SheetFooter className="mt-10 mb-4 flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="rounded-full py-6 font-bold flex-1">{t('cancel')}</Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-full py-6 font-bold flex-1 bg-black text-white hover:bg-zinc-800">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="me-2 h-4 w-4 animate-spin" /> {editingId ? t('updatingMsg') : t('creatingMsg')}
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
