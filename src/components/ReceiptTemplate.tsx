
import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface ReceiptTemplateProps {
    order: any;
    outlet: any; // { name, address, phone }
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(({ order, outlet }, ref) => {
    if (!order) return null;

    const items = order.items || [];
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const total = order.total || 0;
    const discount = order.discount || 0;

    // Format Date
    const date = new Date(order.createdAt).toLocaleDateString();
    const time = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div ref={ref} className="p-4 bg-white text-black font-mono text-xs w-[80mm] mx-auto print-container">
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 0; }
                    .print-container { width: 100%; padding: 0.5cm; }
                }
            `}</style>

            {/* Header */}
            <div className="text-center mb-4">
                <div className="flex justify-center mb-2">
                    <div className="p-2 border-2 border-black rounded-lg">
                        <ShoppingBag size={24} className="text-black" />
                    </div>
                </div>
                <h1 className="text-lg font-bold uppercase tracking-wider">{outlet?.name || "Beloop POS"}</h1>
                {outlet?.address && <p className="text-[10px] mt-1 text-gray-600">{outlet.address}</p>}
                {outlet?.phone && <p className="text-[10px] text-gray-600">Tel: {outlet.phone}</p>}
            </div>

            {/* Order Info */}
            <div className="border-b-2 border-dashed border-gray-300 pb-2 mb-2 flex justify-between text-[10px]">
                <div className="text-left">
                    <p>Order: <span className="font-bold">#{order.id.slice(-6).toUpperCase()}</span></p>
                    <p>Date: {date}</p>
                </div>
                <div className="text-right">
                    <p>Table: {order.tableNumber || "N/A"}</p>
                    <p>Time: {time}</p>
                </div>
            </div>

            {/* Items */}
            <table className="w-full text-left mb-4">
                <thead>
                    <tr className="border-b border-black">
                        <th className="pb-1 w-1/12">Qty</th>
                        <th className="pb-1 w-7/12">Item</th>
                        <th className="pb-1 w-4/12 text-right">Price</th>
                    </tr>
                </thead>
                <tbody className="text-[11px]">
                    {items.map((item: any, i: number) => (
                        <tr key={i}>
                            <td className="py-1 align-top">{item.quantity}</td>
                            <td className="py-1 align-top">
                                <div>{item.name}</div>
                                {item.modifiers && Object.values(item.modifiers).map((m: any, idx: number) => (
                                    <div key={idx} className="text-[9px] text-gray-500 pl-1">+ {m.name || m}</div>
                                ))}
                            </td>
                            <td className="py-1 align-top text-right">{(item.totalPrice || (item.price * item.quantity)).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="border-t-2 border-dashed border-gray-300 pt-2 space-y-1 mb-4">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-gray-600">
                        <span>Discount {order.discountCode ? `(${order.discountCode})` : ''}</span>
                        <span>-{Number(discount).toFixed(2)}</span>
                    </div>
                )}
                {/* Tax Placeholder */}
                {/* 
                <div className="flex justify-between text-gray-600">
                    <span>Tax (5%)</span>
                    <span>{(total * 0.05).toFixed(2)}</span>
                </div> 
                */}
                <div className="flex justify-between text-base font-bold border-t border-black pt-2 mt-2">
                    <span>TOTAL</span>
                    <span>{Number(total).toFixed(2)}</span>
                </div>
            </div>

            {/* Payment Info */}
            <div className="mb-4 text-[10px] text-gray-600">
                <p>Payment Method: <span className="font-bold">{order.paymentMethod || "CASH"}</span></p>
                {order.paymentStatus === 'PARTIAL' && <p>Status: PARTIAL PAYMENT</p>}
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] space-y-2 mt-6">
                <p className="font-bold">Thank you for dining with us!</p>
                <div className="flex justify-center">
                    {/* Barcode Placeholder */}
                    <div className="h-8 w-48 bg-gray-200 flex items-center justify-center text-[8px] tracking-widest text-gray-400">
                        ||| | || ||| || |||
                    </div>
                </div>
                <p className="text-[8px] text-gray-400 mt-2">Powered by Beloop POS</p>
            </div>
        </div>
    );
});

ReceiptTemplate.displayName = "ReceiptTemplate";
