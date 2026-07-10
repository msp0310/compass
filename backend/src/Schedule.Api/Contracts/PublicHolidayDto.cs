namespace Schedule.Api.Contracts;

/// <summary>PublicHolidayDtoのAPI入出力契約です。</summary>
public sealed record PublicHolidayDto(
    string Date,
    string Name,
    string Source);
