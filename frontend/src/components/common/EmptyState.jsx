import { Inbox } from 'lucide-react';

const EmptyState = ({ title = "لا توجد بيانات", message = "لا يوجد بيانات لعرضها في الوقت الحالي.", icon: Icon = Inbox }) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-zinc-50 border border-zinc-200">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4 text-zinc-400">
                <Icon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2 font-heading">{title}</h3>
            <p className="text-sm text-zinc-500 max-w-sm">{message}</p>
        </div>
    );
};

export default EmptyState;
