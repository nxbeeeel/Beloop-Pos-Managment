/**
 * Printer Bridge Service
 * 
 * Unifies printing logic between Web (Window.print) and Native (Bluetooth/USB/Network).
 * Supports "Kitchen Routing" (splitting food/drinks) and ESC/POS formatting.
 */

interface PrinterDevice {
    name: string;
    address: string; // MAC or IP
    type: 'BLUETOOTH' | 'USB' | 'NETWORK';
    target: 'RECEIPT' | 'KITCHEN' | 'BAR';
}

interface PrintItem {
    name: string;
    quantity: number;
    price: number;
    modifiers?: string[];
    category?: string;
}

interface PrintOrder {
    id: string;
    table?: string;
    server?: string;
    date: Date;
    items: PrintItem[];
    total: number;
    taxes: number;
}

class PrinterService {
    private isNative: boolean = false;
    private printers: Record<string, PrinterDevice> = {};

    // Commands for ESC/POS
    private static CMDS = {
        RESET: '\x1B\x40',
        TEXT_SMALL: '\x1B\x21\x01', // Font B
        TEXT_NORMAL: '\x1B\x21\x00', // Font A
        TEXT_DOUBLE_HEIGHT: '\x1B\x21\x10',
        TEXT_DOUBLE_WIDTH: '\x1B\x21\x20',
        TEXT_BIG: '\x1B\x21\x30',
        ALIGN_LEFT: '\x1B\x61\x00',
        ALIGN_CENTER: '\x1B\x61\x01',
        ALIGN_RIGHT: '\x1B\x61\x02',
        BOLD_ON: '\x1B\x45\x01',
        BOLD_OFF: '\x1B\x45\x00',
        CUT: '\x1D\x56\x42\x00',
        FEED_LINES: (n: number) => `\x1B\x64${String.fromCharCode(n)}`,
        BEEP: '\x1B\x42\x04\x02', // Beep 4 times, 200ms
    };

    constructor() {
        if (typeof window !== 'undefined') {
            // Check for Capacitor context
            this.isNative = !!(window as any).Capacitor?.isNativePlatform();

            // Load printers from storage
            const saved = localStorage.getItem('pos_printers');
            if (saved) {
                try {
                    this.printers = JSON.parse(saved);
                } catch (e) { console.error('Failed to load printer config', e); }
            }
        }
    }

    /**
     * Configure a printer
     */
    addPrinter(name: string, address: string, target: PrinterDevice['target']) {
        this.printers[target] = { name, address, type: 'NETWORK', target };
        localStorage.setItem('pos_printers', JSON.stringify(this.printers));
    }

    /**
     * Main Entry Point: Print an order
     * Handles routing to Receipt, Kitchen, and Bar printers based on content.
     */
    async printOrder(order: PrintOrder) {
        console.log('[Printer] Processing Order:', order.id);

        if (!this.isNative) {
            console.log('[Printer] Web Mode: Using Browser Print');
            // In web mode, we just trigger the browser print dialog for the receipt 
            // We can't really do kitchen routing easily in web without a local server bridge
            window.print();
            return;
        }

        // 1. Always print Receipt (to 'RECEIPT' printer or default)
        const receiptCmds = this.formatReceipt(order);
        await this.sendToPrinter('RECEIPT', receiptCmds);

        // 2. Kitchen Routing
        // Filter Food items
        const foodItems = order.items.filter(i => !this.isDrink(i));
        if (foodItems.length > 0) {
            const kitchenCmds = this.formatKitchenTicket(order, foodItems, 'KITCHEN');
            await this.sendToPrinter('KITCHEN', kitchenCmds);
        }

        // 3. Bar Routing
        // Filter Drink items
        const drinkItems = order.items.filter(i => this.isDrink(i));
        if (drinkItems.length > 0) {
            const barCmds = this.formatKitchenTicket(order, drinkItems, 'BAR');
            await this.sendToPrinter('BAR', barCmds);
        }
    }

    private isDrink(item: PrintItem): boolean {
        // Simple mock logic for categorization if exact category not provided
        const cat = (item.category || '').toLowerCase();
        return cat.includes('drink') || cat.includes('beverage') || cat.includes('coffee') || cat.includes('bar');
    }

    private async sendToPrinter(target: string, data: string) {
        const printer = this.printers[target];
        if (!printer) {
            console.warn(`[Printer] No printer configured for ${target}`);
            return; // Skip if no printer configured
        }

        console.log(`[Printer] Sending ${data.length} bytes to ${printer.name} (${printer.address})`);

        try {
            // Mock Capacitor Plugin Call
            // await Socket.write({ address: printer.address, port: 9100, data: btoa(data) }); 
            // OR
            // await BluetoothSerial.connect(printer.address);
            // await BluetoothSerial.write(data);

            // Simulating network delay
            await new Promise(r => setTimeout(r, 500));
            console.log(`[Printer] Print successful to ${target}`);
        } catch (e) {
            console.error(`[Printer] Failed to print to ${target}`, e);
            throw e;
        }
    }

    /**
     * FORMATTER: Customer Receipt
     */
    formatReceipt(order: PrintOrder): string {
        const C = PrinterService.CMDS;
        let p = C.RESET;

        // Header
        p += C.ALIGN_CENTER;
        p += C.BOLD_ON + C.TEXT_DOUBLE_HEIGHT + "Beloop POS" + C.TEXT_NORMAL + C.BOLD_OFF + "\n";
        p += "123 Gourmet Street\n";
        p += "Tel: 555-0123\n\n";

        p += C.ALIGN_LEFT;
        p += `Order: #${order.id}\n`;
        p += `Date: ${new Date().toLocaleString()}\n`;
        if (order.table) p += `Table: ${order.table}\n`;
        if (order.server) p += `Server: ${order.server}\n`;
        p += "--------------------------------\n";

        // Items
        order.items.forEach(item => {
            const name = item.name.substring(0, 20).padEnd(20, ' ');
            const price = item.price.toFixed(2).padStart(8, ' ');
            p += `${item.quantity} x ${name} ${price}\n`;

            // Modifiers usually indented on receipt
            if (item.modifiers && item.modifiers.length > 0) {
                item.modifiers.forEach(mod => {
                    p += `    - ${mod}\n`;
                });
            }
        });

        p += "--------------------------------\n";

        // Totals
        p += C.ALIGN_RIGHT;
        p += C.BOLD_ON;
        p += `TOTAL: $${order.total.toFixed(2)}\n`;
        p += C.BOLD_OFF;
        p += C.TEXT_NORMAL; // Reset size

        // Footer
        p += "\n";
        p += C.ALIGN_CENTER;
        p += "Thank you for dining with us!\n";
        p += "Powered by Project Phoenix\n";
        p += "\n\n";

        p += C.CUT;
        return p;
    }

    /**
     * FORMATTER: Kitchen/Bar Ticket
     * Uses larger fonts, no prices, emphasizes quantity and modifiers
     */
    formatKitchenTicket(order: PrintOrder, items: PrintItem[], station: string): string {
        const C = PrinterService.CMDS;
        let p = C.RESET;

        // Sound Alarm (important for kitchen)
        p += C.BEEP;

        // Header
        p += C.ALIGN_CENTER;
        p += C.TEXT_DOUBLE_HEIGHT + C.BOLD_ON + `*** ${station} ***` + C.TEXT_NORMAL + "\n\n";

        p += C.ALIGN_LEFT;
        p += C.TEXT_DOUBLE_HEIGHT + `#: ${order.id.slice(-4)}` + C.TEXT_NORMAL + "\n"; // Short ID for kitchen
        if (order.table) p += C.TEXT_BIG + `TBL: ${order.table}` + C.TEXT_NORMAL + "\n";
        p += `Wait: ${order.server || 'Staff'}\n`;
        p += `Time: ${new Date().toLocaleTimeString()}\n`;
        p += "--------------------------------\n\n";

        // Items (Double Height for readability)
        items.forEach(item => {
            p += C.TEXT_DOUBLE_HEIGHT + C.BOLD_ON;
            p += `${item.quantity}  ${item.name}\n`;
            p += C.TEXT_NORMAL + C.BOLD_OFF; // Reset for modifiers

            if (item.modifiers && item.modifiers.length > 0) {
                p += C.TEXT_BIG; // Slightly larger for modifiers too
                item.modifiers.forEach(mod => {
                    p += `   >> ${mod.toUpperCase()}\n`;
                });
                p += C.TEXT_NORMAL;
            }
            p += "\n"; // Spacing between items
        });

        p += "--------------------------------\n";
        p += C.FEED_LINES(4);
        p += C.CUT;

        return p;
    }
}

export const printerService = new PrinterService();
