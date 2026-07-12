using Schedule.Api.Application;
using Schedule.Api.Contracts;
using Xunit;

namespace Schedule.Api.Tests;

public sealed class ScheduleRequestValidatorTests
{
    [Fact]
    public void Validate_RejectsParentCycle()
    {
        var request = CreateRequest([
            CreateTask("a", parentId: "b"),
            CreateTask("b", parentId: "a")
        ]);

        var error = ScheduleRequestValidator.Validate("project-1", request);

        Assert.Equal("タスク階層が循環しています。親タスクの指定を見直してください。", error);
    }

    [Fact]
    public void Validate_RejectsDependencyCycle()
    {
        var request = CreateRequest([
            CreateTask("a", dependencies: ["b"]),
            CreateTask("b", dependencies: ["a"])
        ]);

        var error = ScheduleRequestValidator.Validate("project-1", request);

        Assert.Equal("タスクの依存関係が循環しています。依存先の指定を見直してください。", error);
    }

    [Fact]
    public void Validate_AcceptsAcyclicTaskGraph()
    {
        var request = CreateRequest([
            CreateTask("phase"),
            CreateTask("design", parentId: "phase"),
            CreateTask("build", parentId: "phase", dependencies: ["design"])
        ]);

        var error = ScheduleRequestValidator.Validate("project-1", request);

        Assert.Null(error);
    }

    private static SaveScheduleRequest CreateRequest(IReadOnlyList<ScheduleTaskDto> tasks)
    {
        return new SaveScheduleRequest(
            new CalendarDefinitionDto("calendar-1", "標準", [1, 2, 3, 4, 5], []),
            [],
            [],
            new ProjectDto(
                "project-1",
                null,
                "案件",
                "案件",
                "inProgress",
                [],
                "2026-07-01",
                "2026-07-31",
                new NextMilestoneDto("完了", "2026-07-31"),
                "active",
                null,
                1),
            tasks,
            [],
            null,
            1);
    }

    private static ScheduleTaskDto CreateTask(
        string id,
        string? parentId = null,
        IReadOnlyList<string>? dependencies = null)
    {
        return new ScheduleTaskDto(
            id,
            parentId,
            id,
            "task",
            "notStarted",
            "2026-07-01",
            "2026-07-02",
            0,
            [],
            [],
            "#2e6be6",
            true,
            dependencies ?? [],
            null,
            8,
            null,
            null,
            null,
            [],
            [],
            []);
    }
}
