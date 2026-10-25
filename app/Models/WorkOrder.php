<?php

namespace App\Models;

use App\Enums\WorkOrderPriority;
use App\Enums\WorkOrderStatus;
use Database\Factories\WorkOrderFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WorkOrder extends Model
{
    /** @use HasFactory<WorkOrderFactory> */
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'workspace_id',
        'customer_id',
        'service_location_id',
        'order_number',
        'title',
        'description',
        'priority',
        'status',
        'due_date',
        'scheduled_start_at',
        'scheduled_end_at',
        'created_by_user_id',
        'assigned_to_user_id',
        'completed_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'priority' => WorkOrderPriority::class,
            'status' => WorkOrderStatus::class,
            'due_date' => 'date',
            'scheduled_start_at' => 'datetime',
            'scheduled_end_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Workspace this work order belongs to.
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Customer for this work order.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Service location for this job.
     */
    public function serviceLocation(): BelongsTo
    {
        return $this->belongsTo(ServiceLocation::class);
    }

    /**
     * User who dispatched/created the work order.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Field worker currently assigned to the job.
     */
    public function assignedWorker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    /**
     * Assignment history records.
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(WorkOrderAssignment::class)->latest('assigned_at');
    }

    /**
     * Status transition event history.
     */
    public function statusEvents(): HasMany
    {
        return $this->hasMany(WorkOrderStatusEvent::class)->latest();
    }

    /**
     * Get checklists attached to this work order.
     */
    public function checklists(): HasMany
    {
        return $this->hasMany(WorkOrderChecklist::class);
    }

    /**
     * Get evidence files uploaded for this work order.
     */
    public function evidence(): HasMany
    {
        return $this->hasMany(WorkOrderEvidence::class)->latest();
    }

    /**
     * Scope query to jobs assigned to a specific worker.
     */
    public function scopeAssignedTo(Builder $query, User|int $user): Builder
    {
        $userId = $user instanceof User ? $user->id : $user;

        return $query->where('assigned_to_user_id', $userId);
    }

    /**
     * Scope query to overdue jobs.
     */
    public function scopeOverdue(Builder $query): Builder
    {
        return $query->whereNotIn('status', [WorkOrderStatus::Completed->value, WorkOrderStatus::Cancelled->value])
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString());
    }

    /**
     * Determine if job is overdue.
     */
    public function isOverdue(): bool
    {
        if (in_array($this->status, [WorkOrderStatus::Completed, WorkOrderStatus::Cancelled], true)) {
            return false;
        }

        return $this->due_date !== null && $this->due_date->isPast();
    }
}
