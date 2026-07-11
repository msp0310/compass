namespace Schedule.Api.Contracts;

/// <summary>日報へ追加するMarkdownコメントです。</summary>
public sealed record AddDailyReportCommentRequest(string Body);
