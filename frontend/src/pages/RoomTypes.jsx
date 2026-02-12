import { useState, useEffect } from 'react';
import { useRoomTypes } from '../hooks/useRoomTypes';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../components/ui/sheet';
import { Plus, Trash2, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const COMMON_AMENITIES = ["WiFi", "TV", "AC", "Mini Bar", "Safe", "Balcony", "Breakfast", "Ocean View"];

export default function RoomTypes() {
    const { roomTypes, loading, error, fetchRoomTypes, createRoomType, deleteRoomType } = useRoomTypes();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        const result = await createRoomType(payload);

        setIsSubmitting(false);

        if (result.success) {
            setSuccessMessage("Room Type created successfully!");
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
        if (window.confirm("Are you sure you want to delete this room type?")) {
            const result = await deleteRoomType(id);
            if (result.success) {
                setSuccessMessage("Room Type deleted successfully!");
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                alert(result.error);
            }
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Room Types</h1>
                    <p className="text-gray-500 mt-2">Manage your hotel's room categories and pricing.</p>
                </div>
                <Button onClick={() => { setIsSheetOpen(true); resetForm(); }} className="gap-2">
                    <Plus className="h-4 w-4" /> Create New
                </Button>
            </div>

            {successMessage && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                    <Info className="h-4 w-4 text-green-600" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle>All Room Types</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading && !roomTypes.length ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : roomTypes.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No room types found. Create one to get started.
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[100px]">Details</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Amenities</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Price</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Max Guests</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right w-[100px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {roomTypes.map((rt) => (
                                        <tr key={rt.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle font-medium">
                                                <div className="font-semibold">{rt.name}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{rt.description}</div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex flex-wrap gap-1">
                                                    {rt.amenities ? rt.amenities.split(',').map((amenity, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-100">
                                                            {amenity.trim()}
                                                        </Badge>
                                                    )) : <span className="text-gray-400 text-xs">-</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-right font-mono">
                                                ${rt.basePrice?.toFixed(2)}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                {rt.maxGuests}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(rt.id)}
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
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
                        <SheetTitle>Create Room Type</SheetTitle>
                        <SheetDescription>
                            Add a new category of rooms to your hotel.
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-8">

                        {formError && (
                            <Alert variant="destructive">
                                <Info className="h-4 w-4" />
                                <AlertDescription>{formError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="e.g. Deluxe Suite"
                                className={validationErrors.name ? "border-red-500" : ""}
                                required
                            />
                            {validationErrors.name && <p className="text-xs text-red-500">{validationErrors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="basePrice">Base Price ($) <span className="text-red-500">*</span></Label>
                                <Input
                                    id="basePrice"
                                    name="basePrice"
                                    type="number"
                                    step="0.01"
                                    value={formData.basePrice}
                                    onChange={handleInputChange}
                                    className={validationErrors.basePrice ? "border-red-500" : ""}
                                    required
                                />
                                {validationErrors.basePrice && <p className="text-xs text-red-500">{validationErrors.basePrice}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxGuests">Max Guests <span className="text-red-500">*</span></Label>
                                <Input
                                    id="maxGuests"
                                    name="maxGuests"
                                    type="number"
                                    min="1"
                                    max="8"
                                    value={formData.maxGuests}
                                    onChange={handleInputChange}
                                    className={validationErrors.maxGuests ? "border-red-500" : ""}
                                    required
                                />
                                {validationErrors.maxGuests && <p className="text-xs text-red-500">{validationErrors.maxGuests}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Amenities</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {COMMON_AMENITIES.map((amenity) => (
                                    <label key={amenity} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer p-2 border rounded hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={formData.amenities.includes(amenity)}
                                            onChange={() => handleAmenityToggle(amenity)}
                                        />
                                        <span>{amenity}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Optional description..."
                            />
                        </div>

                        <SheetFooter className="mt-8">
                            <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                                    </>
                                ) : (
                                    'Create Room Type'
                                )}
                            </Button>
                        </SheetFooter>

                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}
