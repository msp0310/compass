namespace Schedule.Api.Application;

/// <summary>システム全体へ適用する権限ロールです。</summary>
public static class SystemRoles
{
    public const string Admin = "admin";
    public const string User = "user";

    public static bool IsValid(string role) => role is Admin or User;
}

/// <summary>チーム内での権限ロールです。</summary>
public static class TeamRoles
{
    public const string Manager = "manager";
    public const string Member = "member";

    public static bool IsValid(string role) => role is Manager or Member;
}

/// <summary>案件内での権限ロールです。</summary>
public static class ProjectRoles
{
    public const string Owner = "owner";
    public const string Planner = "planner";
    public const string Member = "member";
    public const string Viewer = "viewer";

    public static bool IsValid(string role) => role is Owner or Planner or Member or Viewer;
}
