using System.Globalization;
using System.Text;
using Schedule.Api.Contracts;

namespace Schedule.Api.Application;

/// <summary>内閣府の祝日CSVを取得し、アプリの休日DTOへ変換します。</summary>
public sealed class JapaneseHolidayService(HttpClient httpClient, IConfiguration configuration)
{
    private const string DefaultHolidayCsvUrl =
        "https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv";

    /// <summary>指定期間の日本の祝日を取得します。</summary>
    public async Task<IReadOnlyList<PublicHolidayDto>> GetHolidaysAsync(
        DateOnly? from,
        DateOnly? to,
        CancellationToken cancellationToken)
    {
        var endpoint = configuration["PublicHolidays:JapanCsvUrl"] ?? DefaultHolidayCsvUrl;
        var csvBytes = await httpClient.GetByteArrayAsync(endpoint, cancellationToken);
        var csv = Encoding.GetEncoding(932).GetString(csvBytes);
        var holidays = ParseCabinetOfficeCsv(csv);

        if (from is not null)
        {
            holidays = holidays
                .Where(holiday => DateOnly.Parse(holiday.Date, CultureInfo.InvariantCulture) >= from.Value)
                .ToArray();
        }

        if (to is not null)
        {
            holidays = holidays
                .Where(holiday => DateOnly.Parse(holiday.Date, CultureInfo.InvariantCulture) <= to.Value)
                .ToArray();
        }

        return holidays;
    }

    /// <summary>内閣府CSVの全行を休日DTOへ変換し、日付順に並べます。</summary>
    private static PublicHolidayDto[] ParseCabinetOfficeCsv(string csv)
    {
        return csv
            .Split(["\r\n", "\n"], StringSplitOptions.RemoveEmptyEntries)
            .Skip(1)
            .Select(ParseLine)
            .Where(holiday => holiday is not null)
            .Select(holiday => holiday!)
            .OrderBy(holiday => holiday.Date)
            .ToArray();
    }

    /// <summary>内閣府CSVの1行を検証し、休日DTOへ変換します。</summary>
    private static PublicHolidayDto? ParseLine(string line)
    {
        var commaIndex = line.IndexOf(',');
        if (commaIndex <= 0 || commaIndex >= line.Length - 1) return null;

        var rawDate = line[..commaIndex].Trim().Trim('"');
        var name = line[(commaIndex + 1)..].Trim().Trim('"');
        if (!DateOnly.TryParseExact(
                rawDate,
                "yyyy/M/d",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var date))
        {
            return null;
        }

        return new PublicHolidayDto(
            date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            name,
            "内閣府 国民の祝日.csv");
    }
}
