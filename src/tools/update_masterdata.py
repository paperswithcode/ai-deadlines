from src.config import csv_path_master_data, yaml_path_conferences
from src.io import load_csv, save_csv, load_yaml


def update_master_data_from_conferences():
    conferences_data = load_yaml(yaml_path_conferences)
    master_data = load_csv(csv_path_master_data)

    titles = set([r["title"] for r in conferences_data])
    master_data_conference_titles = list(set([c["title"].lower() for c in master_data]))
    for title in titles:
        # find matching title
        confs = [r for r in conferences_data if r["title"] == title]
        # use newest conf entry for update
        conf = sorted(confs, key=lambda x: int(x["year"]), reverse=True)[0]
        if conf["title"].lower() not in master_data_conference_titles:
            master_data.append(
                {
                    "title": conf.get("title", "").lower(),
                    "full_name": conf.get("full_name", ""),
                    "wikicfp_query": conf.get("title", ""),
                    "wikicfp_link": "",
                    "sub": conf.get("sub", ""),
                }
            )
    save_csv(
        csv_path_master_data,
        master_data,
        key_order=["title", "full_name", "wikicfp_query", "wikicfp_link", "sub"],
    )


if __name__ == "__main__":
    update_master_data_from_conferences()
