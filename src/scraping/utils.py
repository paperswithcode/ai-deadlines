import datetime

import dateutil.parser

format_wikicpf = "%b %d, %Y"
format_conf_date = "%B %d, %Y"
datetime_format = "%Y-%m-%d %H:%M"  # output format
date_format = "%Y-%m-%d"  # output format


def get_datetime(datetime_string: str):
    date = None
    for format in ["%y/%d/%m %h:%m", "%m/%d/%Y %H:%M", "%m/%d/%Y"]:
        try:
            date = datetime.datetime.strptime(datetime_string.strip(), format)
            break
        except Exception as e:
            # print(f"{e}          [for {format}]")
            pass
    if date is None:
        try:
            date = dateutil.parser.parse(datetime_string)
        except Exception as e:
            pass
    return date


def datetime_to_string(dt, format):
    return dt.strftime(format).lstrip("0").replace(" 0", " ").replace("/0", "/")


def get_date_format_from_start_and_end(
    start: datetime.datetime, end: datetime.datetime
):
    date = (
        f"{datetime_to_string(start, '%B %d')} - {datetime_to_string(end, '%d, %Y')}"
        if start.month == end.month
        else f"{datetime_to_string(start, '%B %d')} - {datetime_to_string(end, '%B %d, %Y')}"
    )
    return date
