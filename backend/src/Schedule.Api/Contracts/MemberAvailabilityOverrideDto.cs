namespace Schedule.Api.Contracts;

/// <summary>MemberAvailabilityOverrideDtoのAPI入出力契約です。</summary>
public sealed record MemberAvailabilityOverrideDto(
    string Id,
    string Date,
    string Type,
    string Label);
