import { Printer } from 'lucide-react';

export const PrinterStatus = () => {
    return (
        <div className="flex items-center gap-2 text-xs text-gray-500">
            <Printer size={14} />
            <span>Ready</span>
        </div>
    );
};
