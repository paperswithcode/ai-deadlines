import dateutil.parser

from src.config import csv_path_master_data, yaml_path_conferences
from src.io import load_ai_deadlines_data, load_csv, load_yaml, save_yaml
from src.scraping.utils import get_date_format_from_start_and_end

time_format = '%Y/%m/%d %H:%M'


def update_data_with_ai_deadlines_data():
    ai_deadlines = load_ai_deadlines_data()
    deadlines_info = load_yaml(yaml_path_conferences, key="id")
    for conf_id, conf_data in ai_deadlines.items():
        if conf_id.lower() not in list(set([c['id'].lower() for c in deadlines_info.values()])):  # conf does not exist
            master_data = {c['title'].lower(): c for c in load_csv(csv_path_master_data)}
            master_data_match = master_data.get(conf_data['title'].lower(), None)
            if master_data_match:
                conf_data['full_name'] = master_data_match['full_name']
                deadlines_info[conf_id] = conf_data
        else:  # conf exists -> overwrite data if mismatch
            conf_match = deadlines_info.get(conf_id)
            for key, val in conf_data.items():
                match_key = key if key != "long" else "full_name"  # necessary due to renaming of key
                if conf_data[key] != conf_match.get(match_key, None):  # use ai-deadlines data if mismatch
                    conf_match[match_key] = val

    # Adjust data
    for conf_id, conf_data in deadlines_info.items():
        for key, val in conf_data.items():
            if key == "note":
                conf_data[key] = val.replace("<b>NOTE</b>: ", "")
            if key == "date":
                if conf_data.get("start", None) is not None and conf_data.get("end", None) is not None:
                    start = dateutil.parser.parse(conf_data["start"])
                    end = dateutil.parser.parse(conf_data["end"])
                    conf_data[key] = get_date_format_from_start_and_end(start, end)
            if "deadline" in key:
                if conf_data["deadline"].lower() == "tba":
                    continue
                date = dateutil.parser.parse(val)
                conf_data[key] = date.strftime(time_format)
                # try:
                #     conf_data[key] = datetime.datetime.strptime(val, '%Y-%m-%d %H:%M:%S').strftime(time_format)
                # except:
                #     conf_data[key] = datetime.datetime.strptime(val, format_datetime).strftime(time_format)
                #     pass  # format correct
    save_yaml(yaml_path_conferences, list(deadlines_info.values()))


if __name__ == '__main__':
    update_data_with_ai_deadlines_data()
