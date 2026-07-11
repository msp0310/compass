namespace Schedule.Api.Contracts;

/// <summary>未提出日報のリマインド通知です。</summary>
public sealed record DailyReportReminderDto(
    string Id,
    string TeamId,
    string Date,
    string RecipientMemberId,
    string SenderName,
    string CreatedAt,
    string? ReadAt);
