namespace Schedule.Api.Contracts;

/// <summary>TaskAssigneeAllocationDtoのAPI入出力契約です。</summary>
public sealed record TaskAssigneeAllocationDto(string MemberId, decimal Percent);
