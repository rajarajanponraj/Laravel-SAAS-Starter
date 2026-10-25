<?php

namespace App\Mail;

use App\Models\WorkOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WorkOrderNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public WorkOrder $workOrder,
        public string $notificationSubject,
        public string $notificationMessage
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[{$this->workOrder->order_number}] {$this->notificationSubject}",
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: "
                <h2>{$this->notificationSubject}</h2>
                <p><strong>Work Order:</strong> {$this->workOrder->order_number} - {$this->workOrder->title}</p>
                <p><strong>Status:</strong> {$this->workOrder->status->label()}</p>
                <p><strong>Priority:</strong> {$this->workOrder->priority->label()}</p>
                <p>{$this->notificationMessage}</p>
                <p><a href=\"".route('work-orders.show', $this->workOrder).'">View Work Order in CrewFlow</a></p>
            ',
        );
    }
}
