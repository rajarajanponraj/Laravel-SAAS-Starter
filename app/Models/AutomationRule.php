<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AutomationRule extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'workspace_id',
        'name',
        'trigger_event',
        'conditions',
        'action_type',
        'action_config',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'conditions' => 'array',
            'action_config' => 'array',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the workspace that owns the automation rule.
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Get executions for this automation rule.
     */
    public function executions(): HasMany
    {
        return $this->hasMany(AutomationExecution::class);
    }

    /**
     * Check if a work order satisfies the rule's conditions.
     */
    public function matchesWorkOrder(WorkOrder $workOrder): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $conditions = $this->conditions;
        if (empty($conditions)) {
            return true;
        }

        if (isset($conditions['priority']) && $workOrder->priority->value !== $conditions['priority']) {
            return false;
        }

        if (isset($conditions['customer_id']) && $workOrder->customer_id != $conditions['customer_id']) {
            return false;
        }

        return true;
    }
}
