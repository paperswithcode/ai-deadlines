import pandas as pd
import yaml

from src.io import load_yaml, save_csv


def convert_yaml_to_csv(yaml_path, csv_path):
    data = load_yaml(yaml_path)
    save_csv(csv_path, data)


def convert_csv_to_yaml(csv_path, yaml_path):
    data = pd.read_csv(csv_path, encoding="utf-8").fillna("")
    column_order = [
        "title",
        "year",
        "id",
        "name",
        "link",
        "deadline",
        "abstract_deadline",
        "timezone",
        "place",
        "date",
        "start",
        "end",
        "paperslink",
        "pwclink",
        "hindex",
        "sub",
        "ranking",
        "note",
        "wikicfp",
    ]
    data = data[
        [name for name in column_order if name in data.columns]
    ]  # sort by specified order
    data = data.rename(columns={"name": "full_name"})  # renamings
    data = data.to_dict("records")  # to list of dicts
    for conf in data:
        del_keys = []
        for key, val in conf.items():
            if val == "":
                del_keys.append(key)
            if isinstance(val, float):
                conf[key] = int(val)
        for key in del_keys:
            del conf[key]

    with open(yaml_path, "w") as output_file:
        yaml.safe_dump(data, output_file, sort_keys=False)


if __name__ == "__main__":
    convert_yaml_to_csv("../../_data/conferences.yml", "../../_data/conferences.csv")
    # convert_csv_to_yaml("../../_data/conferences.csv", "../../_data/conferences.yml")
