<?php

namespace App\Models;

use Database\Factories\WorkerLocationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkerLocation extends Model
{
    /** @use HasFactory<WorkerLocationFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'workspace_id',
        'user_id',
        'work_order_id',
        'latitude',
        'longitude',
        'accuracy',
        'heading',
        'speed',
        'battery_level',
        'activity_type',
        'captured_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'accuracy' => 'float',
            'heading' => 'float',
            'speed' => 'float',
            'battery_level' => 'integer',
            'captured_at' => 'datetime',
        ];
    }

    /**
     * Workspace this location belongs to.
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Technician / User who reported this location.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Optional work order this location was captured during.
     */
    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    /**
     * Scope to a specific workspace.
     */
    public function scopeForWorkspace(Builder $query, int $workspaceId): Builder
    {
        return $query->where('workspace_id', $workspaceId);
    }

    /**
     * Scope to recent locations within a number of minutes.
     */
    public function scopeRecent(Builder $query, int $minutes = 120): Builder
    {
        return $query->where('captured_at', '>=', now()->subMinutes($minutes));
    }
}
