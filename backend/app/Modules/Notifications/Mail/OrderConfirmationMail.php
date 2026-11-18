<?php

namespace App\Modules\Notifications\Mail;

use App\Modules\Orders\Models\Order;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** بريد تأكيد الطلب: بيُرسل من العامل (Worker) وليس من طلب الـ HTTP */
class OrderConfirmationMail extends Mailable
{
    public function __construct(public readonly Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Order #{$this->order->id} confirmed");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.order-confirmation');
    }
}
