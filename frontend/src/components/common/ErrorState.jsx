import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

const ErrorState = ({ title = "حدث خطأ ما", message = "حدث خطأ أثناء معالجة طلبك.", onRetry }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-50 rounded-3xl border border-zinc-200">
            <AlertCircle className="h-12 w-12 text-zinc-900 mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 mb-2 font-heading">{title}</h3>
            <p className="text-sm text-zinc-600 mb-6 max-w-md">{message}</p>
            {onRetry && (
                <Button variant="outline" className="rounded-full border-zinc-300 text-zinc-900 hover:bg-zinc-100" onClick={onRetry}>
                    حاول مرة أخرى
                </Button>
            )}
        </div>
    );
};

export default ErrorState;
