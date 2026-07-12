using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Schedule.Api.ExternalApi;
using Xunit;

namespace Schedule.Api.Tests;

public sealed class ExternalApiAuthenticationTests
{
    [Fact]
    public void Authenticate_AcceptsHashedKeyAndKeepsScopesAndProjectBoundary()
    {
        const string secret = "integration-secret";
        var authenticator = CreateAuthenticator(secret);
        var context = new DefaultHttpContext();
        context.Request.Headers[ExternalApiAuthenticator.HeaderName] = secret;

        var client = authenticator.Authenticate(context.Request);

        Assert.NotNull(client);
        Assert.True(client.HasScope(ExternalApiScopes.TasksRead));
        Assert.False(client.HasScope(ExternalApiScopes.TasksWrite));
        Assert.True(client.CanAccessProject("project-1"));
        Assert.False(client.CanAccessProject("project-2"));
    }

    [Fact]
    public void Authenticate_RejectsUnknownOrMissingKey()
    {
        var authenticator = CreateAuthenticator("expected");
        var context = new DefaultHttpContext();
        context.Request.Headers[ExternalApiAuthenticator.HeaderName] = "unexpected";

        Assert.Null(authenticator.Authenticate(context.Request));
        context.Request.Headers.Remove(ExternalApiAuthenticator.HeaderName);
        Assert.Null(authenticator.Authenticate(context.Request));
    }

    private static ExternalApiAuthenticator CreateAuthenticator(string secret)
    {
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(secret)));
        return new ExternalApiAuthenticator(Options.Create(new ExternalApiOptions
        {
            Enabled = true,
            Clients =
            [
                new ExternalApiClientOptions
                {
                    Id = "integration",
                    Name = "連携テスト",
                    KeyHash = hash,
                    Scopes = [ExternalApiScopes.TasksRead],
                    ProjectIds = ["project-1"]
                }
            ]
        }));
    }
}
