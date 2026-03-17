import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Sparkles, Wrench } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { getRooms, updateRoomStatus, extractErrorMessage } from '../services/roomService';

const STATUS_LABELS = {
    AVAILABLE: 'متاح',
    OCCUPIED: 'مشغول',
    NEEDS_CLEANING: 'يحتاج تنظيف',
    UNDER_MAINTENANCE: 'تحت الصيانة',
};

const LABEL_TO_STATUS = {
    متاح: 'AVAILABLE',
    مشغول: 'OCCUPIED',
    'يحتاج تنظيف': 'NEEDS_CLEANING',
    'تحت الصيانة': 'UNDER_MAINTENANCE',
};

const getStatusConfig = (statusEnum) => {
    switch (statusEnum) {
        case 'AVAILABLE':
            return { color: 'bg-white text-zinc-900 border-zinc-200', icon: CheckCircle2 };
        case 'OCCUPIED':
            return { color: 'bg-zinc-100 text-zinc-800 border-zinc-300', icon: AlertCircle };
        case 'NEEDS_CLEANING':
            return { color: 'bg-zinc-800 text-zinc-100 border-zinc-700', icon: Sparkles };
        case 'UNDER_MAINTENANCE':
            return { color: 'bg-rose-900 text-white border-rose-900', icon: Wrench };
        default:
            return { color: 'bg-zinc-50 text-zinc-500 border-zinc-200', icon: AlertCircle };
    }
};

const RoomStatus = () => {
    const [rooms, setRooms] = useState([]);
    const [filter, setFilter] = useState('الكل');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [updatingRoomId, setUpdatingRoomId] = useState(null);

    const statuses = ['الكل', 'متاح', 'مشغول', 'يحتاج تنظيف', 'تحت الصيانة'];

    const fetchRooms = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiStatus = LABEL_TO_STATUS[filter] || undefined;
            const data = await getRooms(apiStatus ? { status: apiStatus } : {});
            setRooms(data);
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const handleStatusChange = async (roomId, nextStatus) => {
        if (!roomId || !nextStatus) return;
        setUpdatingRoomId(roomId);
        setError(null);
        try {
            const updated = await updateRoomStatus(roomId, nextStatus);
            setRooms((prev) =>
                prev.map((room) => (room.id === roomId ? { ...room, status: updated.status } : room)),
            );
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setUpdatingRoomId(null);
        }
    };

    const filteredRooms = rooms.filter((room) => {
        const matchesSearch = String(room.roomNumber ?? '').includes(searchQuery);
        return matchesSearch;
    });

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1
                        className="text-3xl font-bold font-heading text-rose-900"
                        style={{ fontFamily: "'Khat Alharf Alyadawi', system-ui, sans-serif" }}
                    >
                        متابعة حالة الغرف
                    </h1>
                    <p className="text-zinc-500 mt-1">نظرة عامة على جميع الغرف وحالتها الحالية.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-3xl shadow-sm border border-zinc-200">
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {statuses.map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${filter === status
                                ? 'bg-rose-900 text-white border-rose-900 shadow-sm'
                                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-rose-50 hover:text-rose-900'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="w-full md:w-64">
                    <Input
                        placeholder="ابحث برقم الغرفة..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rounded-full border-zinc-300 focus-visible:ring-rose-900"
                    />
                </div>
            </div>

            {loading && (
                <LoadingState message="جاري تحميل حالة الغرف..." />
            )}

            {!loading && error && (
                <div className="mt-4">
                    <ErrorState
                        title="تعذر تحميل حالة الغرف"
                        message={error}
                        onRetry={fetchRooms}
                    />
                </div>
            )}

            {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredRooms.map(room => {
                        const config = getStatusConfig(room.status);
                        const Icon = config.icon;

                        return (
                            <Card key={room.id} className="overflow-hidden hover:shadow-md transition-shadow rounded-3xl border-zinc-200">
                                <div className={`h-1.5 w-full ${config.color.split(' ')[0]}`} />
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-xs text-zinc-500 font-bold tracking-wider">
                                                {room.roomType?.name ?? '—'}
                                            </span>
                                            <h3 className="text-3xl font-black text-black tracking-tight">
                                                {room.roomNumber ?? '—'}
                                            </h3>
                                        </div>
                                        <div className={`p-2 rounded-full border ${config.color}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                                        {STATUS_LABELS[room.status] ?? room.status ?? '—'}
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {room.status === 'AVAILABLE' && (
                                            <>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    className="rounded-full border-zinc-300 text-zinc-800 hover:bg-rose-50 hover:text-rose-900"
                                                    disabled={updatingRoomId === room.id}
                                                    onClick={() => handleStatusChange(room.id, 'OCCUPIED')}
                                                >
                                                    تعيين كمشغول
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    className="rounded-full border-zinc-300 text-zinc-800 hover:bg-rose-50 hover:text-rose-900"
                                                    disabled={updatingRoomId === room.id}
                                                    onClick={() => handleStatusChange(room.id, 'NEEDS_CLEANING')}
                                                >
                                                    يحتاج تنظيف
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    className="rounded-full border-zinc-300 text-zinc-800 hover:bg-rose-50 hover:text-rose-900"
                                                    disabled={updatingRoomId === room.id}
                                                    onClick={() => handleStatusChange(room.id, 'UNDER_MAINTENANCE')}
                                                >
                                                    تحت الصيانة
                                                </Button>
                                            </>
                                        )}
                                        {room.status === 'OCCUPIED' && (
                                            <div className="text-xs text-zinc-500 font-medium py-1">
                                                لا يمكن تغييره يدوياً (تغيير تلقائي عند تسجيل الخروج)
                                            </div>
                                        )}
                                        {room.status === 'NEEDS_CLEANING' && (
                                            <>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    className="rounded-full border-zinc-300 text-zinc-800 hover:bg-rose-50 hover:text-rose-900"
                                                    disabled={updatingRoomId === room.id}
                                                    onClick={() => handleStatusChange(room.id, 'AVAILABLE')}
                                                >
                                                    تعيين كمتاح
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    className="rounded-full border-zinc-300 text-zinc-800 hover:bg-rose-50 hover:text-rose-900"
                                                    disabled={updatingRoomId === room.id}
                                                    onClick={() => handleStatusChange(room.id, 'UNDER_MAINTENANCE')}
                                                >
                                                    تحت الصيانة
                                                </Button>
                                            </>
                                        )}
                                        {room.status === 'UNDER_MAINTENANCE' && (
                                            <Button
                                                size="xs"
                                                variant="outline"
                                                className="rounded-full border-zinc-300 text-zinc-800 hover:bg-rose-50 hover:text-rose-900"
                                                disabled={updatingRoomId === room.id}
                                                onClick={() => handleStatusChange(room.id, 'AVAILABLE')}
                                            >
                                                تعيين كمتاح
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {!loading && !error && filteredRooms.length === 0 && (
                <div className="text-center py-16 bg-rose-50 rounded-3xl border border-dashed border-rose-300 text-rose-900 font-medium font-heading">
                    لم يتم العثور على غرف تطابق معايير البحث.
                </div>
            )}
        </div>
    );
};

export default RoomStatus;
