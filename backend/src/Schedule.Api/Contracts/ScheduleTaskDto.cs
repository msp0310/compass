namespace Schedule.Api.Contracts;

/// <summary>ScheduleTaskDtoのAPI入出力契約です。</summary>
public sealed record ScheduleTaskDto(
    string Id,
    string? ParentId,
    string Title,
    string Type,
    string Status,
    string Start,
    string End,
    int Progress,
    IReadOnlyList<string> AssigneeIds,
    IReadOnlyList<TaskAssigneeAllocationDto>? AssigneeAllocations,
    string Color,
    bool? Expanded,
    IReadOnlyList<string>? Dependencies,
    string? Description,
    decimal? EffortHours,
    string? BaselineStart,
    string? BaselineEnd,
    string? BaselineCapturedAt,
    IReadOnlyList<TaskChecklistItemDto>? Checklist,
    IReadOnlyList<TaskCommentDto>? Comments,
    IReadOnlyList<TaskReferenceLinkDto>? Links,
    string? ActualStart = null,
    string? ActualEnd = null);
