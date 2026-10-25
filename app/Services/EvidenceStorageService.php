<?php

namespace App\Services;

use App\Models\User;
use App\Models\WorkOrder;
use App\Models\WorkOrderEvidence;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EvidenceStorageService
{
    /**
     * Allowed MIME types and their canonical extensions.
     *
     * @var array<string, string>
     */
    protected const ALLOWED_MIME_TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'application/pdf' => 'pdf',
    ];

    /**
     * Maximum file size in bytes (10 Megabytes).
     */
    protected const MAX_FILE_SIZE = 10 * 1024 * 1024;

    /**
     * Store an uploaded evidence file on private storage.
     *
     * @throws ValidationException
     */
    public function store(
        WorkOrder $workOrder,
        UploadedFile $file,
        User $uploader,
        ?string $notes = null
    ): WorkOrderEvidence {
        $fileSize = $file->getSize();

        // 1. Validate file size
        if ($fileSize > self::MAX_FILE_SIZE) {
            throw ValidationException::withMessages([
                'file' => 'Evidence file exceeds maximum permitted size of 10MB.',
            ]);
        }

        // 2. Detect actual MIME type from server-side inspection
        $mimeType = $file->getMimeType();
        if (! array_key_exists($mimeType, self::ALLOWED_MIME_TYPES)) {
            throw ValidationException::withMessages([
                'file' => 'Invalid file format. Only JPEG, PNG, WebP, and PDF files are allowed.',
            ]);
        }

        $extension = self::ALLOWED_MIME_TYPES[$mimeType];
        $uuid = (string) Str::uuid();
        $filename = "{$uuid}.{$extension}";

        $workspaceId = $workOrder->workspace_id;
        $workOrderId = $workOrder->id;
        $storageDir = "workspaces/{$workspaceId}/work-orders/{$workOrderId}/evidence";
        $storagePath = "{$storageDir}/{$filename}";

        // 3. Put file into private storage
        $stored = Storage::disk('local')->putFileAs($storageDir, $file, $filename);
        if (! $stored) {
            throw ValidationException::withMessages([
                'file' => 'Failed to store file on secure storage. Please retry.',
            ]);
        }

        // 4. Create metadata record
        return WorkOrderEvidence::create([
            'workspace_id' => $workspaceId,
            'work_order_id' => $workOrderId,
            'uploaded_by_user_id' => $uploader->id,
            'original_filename' => $file->getClientOriginalName(),
            'storage_path' => $storagePath,
            'disk' => 'local',
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
            'notes' => $notes,
        ]);
    }

    /**
     * Stream an evidence file with appropriate security headers.
     */
    public function download(WorkOrderEvidence $evidence, bool $inline = true): StreamedResponse
    {
        $disk = Storage::disk($evidence->disk);

        if (! $disk->exists($evidence->storage_path)) {
            abort(404, 'Evidence file not found.');
        }

        $headers = [
            'Content-Type' => $evidence->mime_type,
            'Content-Length' => $evidence->file_size,
            'X-Content-Type-Options' => 'nosniff',
        ];

        $disposition = $inline ? 'inline' : 'attachment';

        return $disk->response(
            path: $evidence->storage_path,
            name: $evidence->original_filename,
            headers: $headers,
            disposition: $disposition
        );
    }

    /**
     * Delete an evidence file from storage and database.
     */
    public function delete(WorkOrderEvidence $evidence): bool
    {
        Storage::disk($evidence->disk)->delete($evidence->storage_path);

        return $evidence->delete();
    }
}
