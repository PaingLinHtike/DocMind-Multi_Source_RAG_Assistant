<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DashboardResource;
use App\Models\Message;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): DashboardResource
    {
        $user = $request->user();
        $documentMetrics = $user->documents()
            ->selectRaw('COUNT(*) as document_count, COALESCE(SUM(size_bytes), 0) as storage_bytes')
            ->firstOrFail();
        $conversationCount = $user->conversations()->count();
        $messageQuery = Message::query()->whereHas(
            'conversation',
            fn (Builder $query): Builder => $query->where('user_id', $user->getAuthIdentifier()),
        );
        $messageCount = (clone $messageQuery)->where('role', Message::RoleUser)->count();

        $today = CarbonImmutable::today();
        $startDate = $today->subDays(6);
        $activityCounts = (clone $messageQuery)
            ->where('role', Message::RoleUser)
            ->whereBetween('created_at', [$startDate->startOfDay(), $today->endOfDay()])
            ->get(['created_at'])
            ->countBy(fn (Message $message): string => $message->created_at->toDateString());
        $chatActivity = collect(range(0, 6))->map(function (int $offset) use ($startDate, $activityCounts): array {
            $date = $startDate->addDays($offset)->toDateString();

            return ['date' => $date, 'count' => $activityCounts->get($date, 0)];
        })->all();

        return new DashboardResource([
            'user' => $user,
            'metrics' => [
                'documents' => ['value' => (int) $documentMetrics->document_count, 'change' => null],
                'conversations' => ['value' => $conversationCount, 'change' => null],
                'messages' => ['value' => $messageCount, 'change' => null],
                'storage_bytes' => ['value' => (int) $documentMetrics->storage_bytes, 'change' => null],
            ],
            'chat_activity' => $chatActivity,
            'recent_conversations' => $user->conversations()->latest('updated_at')->limit(3)->get(),
            'recent_uploads' => $user->documents()->latest()->limit(4)->get(),
        ]);
    }
}
