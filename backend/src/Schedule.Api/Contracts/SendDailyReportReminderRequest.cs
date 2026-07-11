namespace Schedule.Api.Contracts;

/// <summary>チーム内の未提出者へ送るリマインド要求です。</summary>
public sealed record SendDailyReportReminderRequest(
    string TeamId,
    string Date,
    IReadOnlyList<string> MemberIds);
