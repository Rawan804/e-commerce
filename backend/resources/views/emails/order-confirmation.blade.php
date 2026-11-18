<!DOCTYPE html>
<html lang="en">
<body style="font-family: Arial, sans-serif; color: #222; max-width: 560px; margin: auto;">
    <h2>Thank you, {{ $order->user->name }}!</h2>
    <p>We received your order <strong>#{{ $order->id }}</strong>. We will notify you when its status changes.</p>

    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
        <thead>
            <tr style="background: #f3f3f3; text-align: left;">
                <th>Item</th><th>Qty</th><th style="text-align: right;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($order->items as $item)
                <tr style="border-bottom: 1px solid #eee;">
                    <td>{{ $item->product_name }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td style="text-align: right;">{{ number_format((float) $item->unit_price * $item->quantity, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="2"><strong>Total</strong></td>
                <td style="text-align: right;"><strong>{{ number_format((float) $order->total, 2) }}</strong></td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
