import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = "جاري التحميل، يرجى الانتظار..." }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-900 mb-4" />
            <p className="text-zinc-500 font-medium">{message}</p>
        </div>
    );
};

export default LoadingState;
