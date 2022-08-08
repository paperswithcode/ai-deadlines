#!/usr/bin/env python3
# coding: utf-8

# Sort and Clean conference data.
# It writes to `sorted_data.yml` and `cleaned_data.yml`, copy those to the conference.yml after screening.

import datetime
from collections import OrderedDict
from pathlib import Path

import pytz
import yaml
from yaml import CLoader as Loader, CDumper as Dumper
from yaml.representer import SafeRepresenter

from src.config import (
    yaml_path_conference_new_candidates,
    yaml_path_conference_updated_candidates,
    yaml_path_conferences,
)
from src.scraping.utils import datetime_format, date_format

_mapping_tag = yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG


def dict_representer(dumper, data):
    return dumper.represent_dict(data.iteritems())


def dict_constructor(loader, node):
    return OrderedDict(loader.construct_pairs(node))


Dumper.add_representer(OrderedDict, dict_representer)
Loader.add_constructor(_mapping_tag, dict_constructor)

Dumper.add_representer(str, SafeRepresenter.represent_str)


def ordered_dump(data, stream=None, Dumper=yaml.Dumper, **kwds):
    class OrderedDumper(Dumper):
        pass

    def _dict_representer(dumper, data):
        return dumper.represent_mapping(
            yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, data.items()
        )

    OrderedDumper.add_representer(OrderedDict, _dict_representer)
    return yaml.dump(data, stream, OrderedDumper, **kwds)


default_timezone = "UTC"
tba_words = ["tba", "tbd"]


def sort_data(yaml_path: Path, overwrite):
    with open(yaml_path.as_posix(), "r") as stream:
        try:
            data = yaml.load(stream, Loader=Loader)
            conf = [x for x in data if x["deadline"].lower() not in tba_words]
            tba = [x for x in data if x["deadline"].lower() in tba_words]

            def datesort(conf):
                deadline_str = conf.get("deadline", "")
                for format in [date_format, datetime_format + ":%S"]:
                    try:
                        deadline = datetime.datetime.strptime(deadline_str, format)
                        break
                    except ValueError:
                        pass
                    deadline = datetime.datetime.utcnow()
                timezone = (
                    conf.get("timezone", default_timezone)
                    .replace("PDT", "UTC-7")
                    .replace("UTC+", "Etc/GMT-")
                    .replace("UTC-", "Etc/GMT+")
                )
                return pytz.utc.normalize(
                    deadline.replace(tzinfo=pytz.timezone(timezone))
                )

            conf.sort(key=datesort, reverse=True)
            conf = tba + conf

            output_yaml = (
                yaml_path
                if overwrite
                else yaml_path.parent / f"{yaml_path.stem}_sorted{yaml_path.suffix}"
            )
            with open(output_yaml.as_posix(), "w") as outfile:
                for line in ordered_dump(
                    conf + tba,
                    Dumper=yaml.SafeDumper,
                    default_flow_style=False,
                    explicit_start=True,
                ).splitlines():
                    outfile.write(line.replace("- title:", "\n- title:"))
                    outfile.write("\n")
        except yaml.YAMLError as exc:
            print(exc)


if __name__ == "__main__":
    sort_data(yaml_path_conferences, overwrite=True)
