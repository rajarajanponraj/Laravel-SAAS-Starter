<?php

namespace App\Enums;

enum WorkOrderStatus: string
{
    case Draft = 'draft';
    case Assigned = 'assigned';
    case InProgress = 'in_progress';
    case Submitted = 'submitted';
    case ChangesRequested = 'changes_requested';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    /**
     * Get human-readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Assigned => 'Assigned',
            self::InProgress => 'In Progress',
            self::Submitted => 'Submitted for Review',
            self::ChangesRequested => 'Changes Requested',
            self::Completed => 'Completed',
            self::Cancelled => 'Cancelled',
        };
    }

    /**
     * Get badge color styling.
     */
    public function badgeVariant(): string
    {
        return match ($this) {
            self::Draft => 'secondary',
            self::Assigned => 'outline',
            self::InProgress => 'default',
            self::Submitted => 'warning',
            self::ChangesRequested => 'destructive',
            self::Completed => 'success',
            self::Cancelled => 'secondary',
        };
    }

    /**
     * Determine if a transition from current status to target status is valid.
     */
    public function canTransitionTo(self $target): bool
    {
        if ($this === $target) {
            return false;
        }

        return match ($this) {
            self::Draft => in_array($target, [self::Assigned, self::Cancelled]),
            self::Assigned => in_array($target, [self::InProgress, self::Draft, self::Cancelled]),
            self::InProgress => in_array($target, [self::Submitted, self::Assigned, self::Cancelled]),
            self::Submitted => in_array($target, [self::Completed, self::ChangesRequested, self::Cancelled]),
            self::ChangesRequested => in_array($target, [self::InProgress, self::Submitted, self::Cancelled]),
            self::Completed => false, // Final state
            self::Cancelled => in_array($target, [self::Draft]), // Can be reopened as draft
        };
    }

    /**
     * Return all active (non-completed, non-cancelled) statuses.
     *
     * @return list<string>
     */
    public static function activeValues(): array
    {
        return [
            self::Draft->value,
            self::Assigned->value,
            self::InProgress->value,
            self::Submitted->value,
            self::ChangesRequested->value,
        ];
    }
}
