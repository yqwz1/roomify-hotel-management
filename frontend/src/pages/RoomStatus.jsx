import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Sparkles, Wrench } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';

const mockRooms = [
    { id: 1, number: '101', type: 'عادية', status: 'متاح' },
    { id: 2, number: '102', type: 'عادية', status: 'مشغول' },
    { id: 3, number: '103', type: 'فاخرة', status: 'يحتاج تنظيف' },
    { id: 4, number: '104', type: 'جناح', status: 'تحت الصيانة' },
    { id: 5, number: '201', type: 'عادية', status: 'متاح' },
    { id: 6, number: '202', type: 'فاخرة', status: 'مشغول' },
    { id: 7, number: '203', type: 'جناح', status: 'متاح' },
    { id: 8, number: '204', type: 'فاخرة', status: 'مشغول' },
    { id: 9, number: '301', type: 'عادية', status: 'يحتاج تنظيف' },
    { id: 10, number: '302', type: 'جناح', status: 'تحت الصيانة' },
];

const getStatusConfig = (status) => {
    switch (status) {
        case 'متاح':
            return { color: 'bg-white text-zinc-900 border-zinc-200', icon: CheckCircle2 };
        case 'مشغول':
            return { color: 'bg-zinc-100 text-zinc-800 border-zinc-300', icon: AlertCircle };
        case 'يحتاج تنظيف':
            return { color: 'bg-zinc-800 text-zinc-100 border-zinc-700', icon: Sparkles };
        case 'تحت الصيانة':
            return { color: 'bg-black text-white border-black', icon: Wrench };
        default:
            return { color: 'bg-zinc-50 text-zinc-500 border-zinc-200', icon: AlertCircle };
    }
};

const RoomStatus = () => {
    const [filter, setFilter] = useState('الكل');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRooms = mockRooms.filter(room => {
        const matchesFilter = filter === 'الكل' || room.status === filter;
        const matchesSearch = room.number.includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    const statuses = ['الكل', 'متاح', 'مشغول', 'يحتاج تنظيف', 'تحت الصيانة'];

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-heading text-black">متابعة حالة الغرف</h1>
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
                                ? 'bg-black text-white border-black shadow-sm'
                                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-black'
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
                        className="rounded-full border-zinc-300 focus-visible:ring-black"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredRooms.map(room => {
                    const config = getStatusConfig(room.status);
                    const Icon = config.icon;

                    return (
                        <Card key={room.id} className="overflow-hidden hover:shadow-md transition-shadow rounded-3xl border-zinc-200">
                            <div className={`h-1.5 w-full ${config.color.split(' ')[0]}`} />
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-xs text-zinc-500 font-bold tracking-wider">{room.type}</span>
                                        <h3 className="text-3xl font-black text-black tracking-tight">{room.number}</h3>
                                    </div>
                                    <div className={`p-2 rounded-full border ${config.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                                    {room.status}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {filteredRooms.length === 0 && (
                <div className="text-center py-16 bg-zinc-50 rounded-3xl border border-dashed border-zinc-300 text-zinc-500 font-medium">
                    لم يتم العثور على غرف تطابق معايير البحث.
                </div>
            )}
        </div>
    );
};

export default RoomStatus;
