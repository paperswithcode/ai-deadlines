import csv
import datetime
from pathlib import Path
from typing import List

import requests
import yaml

from src.scraping.models import ConferenceDeadline
from src.scraping.utils import get_datetime


def load_ai_deadlines_data():
    url = "https://raw.githubusercontent.com/paperswithcode/ai-deadlines/gh-pages/_data/conferences.yml"
    r = requests.get(url)
    conferences = yaml.safe_load(r.content)
    conferences = {conf["id"]: conf for conf in conferences}
    return conferences


def load_csv(path, key=None):
    with open(path, "r", newline="", encoding="utf-8") as file:
        dict_reader = csv.DictReader(file)
        data = [dict(r) for r in dict_reader]
    if key:
        data = {l[key]: l for l in data}
    return data


def save_csv(path, data, key_order=None):
    key_order = (
        list(set(sum([list(d.keys()) for d in data], [])))
        if key_order is None
        else key_order
    )  # get all keys
    with open(path, "w", newline="", encoding="utf-8") as file:
        dict_writer = csv.DictWriter(file, key_order)
        dict_writer.writeheader()
        dict_writer.writerows(data)


def load_yaml(path, key=None):
    with open(path, encoding="utf-8") as f:
        data = yaml.load(f, Loader=yaml.SafeLoader)
    if key:
        data = {l[key]: l for l in data}
    return data


def save_yaml(path, data):
    with open(path, "w", encoding="utf-8") as file:
        yaml.safe_dump(data, file, sort_keys=False)


def save_updated_data(conference_deadlines: List[ConferenceDeadline], path: Path):
    conference_deadlines = sorted(
        conference_deadlines,
        key=lambda x: get_datetime(x.deadline)
        if x.deadline.lower() != "tba"
        else datetime.datetime(3000, 1, 1),
    )
    save_yaml(path, [c.as_dict() for c in conference_deadlines])
