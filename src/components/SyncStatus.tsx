"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface SyncStatus {
    isOnline: boolean;
    pending: number;
    failed: number;
}

export function SyncStatusIndicator() {
    const [status, setStatus] = useState<SyncStatus>({
        isOnline: true,
        pending: 0,
        failed: 0
    });

    useEffect(() => {
        const updateStatus = async () => {
            const isOnline = navigator.onLine;

            try {
                const { offlineQueue } = await import("@/lib/offline-queue");
                const queueStatus = await offlineQueue.getStatus();
                setStatus({
                    isOnline,
                    pending: queueStatus.pending,
                    failed: queueStatus.failed
                });
            } catch {
                setStatus({ isOnline, pending: 0, failed: 0 });
            }
        };

        updateStatus();

        // Listen for online/offline
        const handleOnline = () => updateStatus();
        const handleOffline = () => updateStatus();

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Poll every 5 seconds
        const interval = setInterval(updateStatus, 5000);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            clearInterval(interval);
        };
    }, []);

    // Determine status color and icon
    let bgColor = "bg-green-500";
    let Icon = CheckCircle2;
    let text = "Synced";

    if (!status.isOnline) {
        bgColor = "bg-yellow-500";
        Icon = WifiOff;
        text = "Offline";
    } else if (status.pending > 0) {
        bgColor = "bg-blue-500";
        Icon = Loader2;
        text = `Syncing ${status.pending}`;
    } else if (status.failed > 0) {
        bgColor = "bg-red-500";
        Icon = AlertCircle;
        text = `${status.failed} Failed`;
    }

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${bgColor} text-white text-xs font-medium`}>
            <Icon size={14} className={status.pending > 0 ? "animate-spin" : ""} />
            <span>{text}</span>
        </div>
    );
}
