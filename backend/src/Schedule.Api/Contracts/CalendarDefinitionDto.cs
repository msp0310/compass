namespace Schedule.Api.Contracts;

/// <summary>CalendarDefinitionDtoのAPI入出力契約です。</summary>
public sealed record CalendarDefinitionDto(
    string Id,
    string Name,
    IReadOnlyList<int> WorkWeek,
    IReadOnlyList<CalendarHolidayDto> Holidays);
