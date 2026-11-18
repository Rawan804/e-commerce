<?php

namespace App\Modules\Notifications\Mail;

use App\Modules\Orders\Models\Order;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** بريد تغيّر حالة الطلب (يُرسل من العامل) */
class OrderStatusMail extends Mailable
{
    public function __construct(public readonly Order $order, public readonly string $newStatus) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Order #{$this->order->id} is now {$this->newStatus}");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.order-status');
    }
}
