<!DOCTYPE html>
<html lang="en">
<body style="font-family: Arial, sans-serif; color: #222; max-width: 560px; margin: auto;">
    <h2>Hello {{ $order->user->name }},</h2>
    <p>The status of your order <strong>#{{ $order->id }}</strong> is now
       <strong style="text-transform: capitalize;">{{ $newStatus }}</strong>.</p>
    <p>Total: <strong>{{ number_format((float) $order->total, 2) }}</strong></p>
</body>
</html>
