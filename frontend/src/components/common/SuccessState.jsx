import { CheckCircle2 } from 'lucide-react';

const SuccessState = ({ title = "تمت العملية بنجاح!", message = "تم تنفيذ طلبك بنجاح." }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-50 rounded-3xl border border-zinc-200">
            <CheckCircle2 className="h-12 w-12 text-zinc-900 mb-4" />
            <h3 className="text-xl font-bold text-zinc-900 mb-2 font-heading">{title}</h3>
            <p className="text-zinc-600">{message}</p>
        </div>
    );
};

export default SuccessState;
