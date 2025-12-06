import { useState } from 'react';

export const usePrinter = () => {
    const [isPrinting, setIsPrinting] = useState(false);

    const printReceipt = async (contentId: string) => {
        setIsPrinting(true);
        try {
            const content = document.getElementById(contentId);
            if (!content) {
                console.error('Print content not found');
                return;
            }

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                console.error('Failed to open print window');
                return;
            }

            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Receipt</title>
                        <style>
                            body { font-family: 'Courier New', monospace; padding: 20px; }
                            .receipt { width: 300px; margin: 0 auto; }
                            .text-center { text-align: center; }
                            .font-bold { font-weight: bold; }
                            .text-xl { font-size: 1.25rem; }
                            .text-sm { font-size: 0.875rem; }
                            .border-b { border-bottom: 1px dashed #000; }
                            .border-t { border-top: 1px dashed #000; }
                            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                            .my-4 { margin-top: 1rem; margin-bottom: 1rem; }
                            .flex { display: flex; }
                            .justify-between { justify-content: space-between; }
                        </style>
                    </head>
                    <body>
                        ${content.innerHTML}
                    </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.focus();

            // Wait for styles to load
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);

        } catch (error) {
            console.error('Printing failed:', error);
        } finally {
            setIsPrinting(false);
        }
    };

    return { printReceipt, isPrinting };
};
