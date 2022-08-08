import datetime
import time
import urllib.request
from pathlib import Path
from typing import List, Dict

import tqdm
from bs4 import BeautifulSoup

from src.config import (
    yaml_path_conferences,
    csv_path_master_data,
    yaml_path_conference_new_candidates,
    yaml_path_conference_updated_candidates,
)
from src.io import load_yaml, load_csv, save_yaml
from src.scraping.core_conference_rankings import get_matching_core_ranking
from src.scraping.models import (
    ConferenceMasterData,
    ConferenceCandidateCFP,
    ConferenceDeadline,
)
from src.scraping.matching import compute_conference_match_score
from src.scraping.utils import (
    format_conf_date,
    get_datetime,
    datetime_to_string,
    get_date_format_from_start_and_end,
)

project_root = Path(__file__).parent.parent


def scrape_update_suggestions_from_wikicfp():
    conference_deadlines = [
        ConferenceDeadline(**data) for data in load_yaml(yaml_path_conferences)
    ]
    conference_masterdatas = [
        ConferenceMasterData(**conf_dict)
        for conf_dict in load_csv(csv_path_master_data)
    ]
    new_conference_deadlines = scrape_new_conference_deadlines_for_master_data(
        conference_masterdatas
    )
    (
        new_conference_deadlines,
        updated_conference_deadlines,
    ) = update_conference_deadlines(conference_deadlines, new_conference_deadlines)

    save_yaml(
        yaml_path_conference_new_candidates,
        [c.as_dict() for c in new_conference_deadlines],
    )
    save_yaml(
        yaml_path_conference_updated_candidates,
        [c.as_dict() for c in updated_conference_deadlines],
    )
    return new_conference_deadlines


def scrape_new_conference_deadlines_for_master_data(
    conferences: List[ConferenceMasterData],
) -> List[ConferenceDeadline]:
    new_conference_deadlines = []
    for conference in tqdm.tqdm(conferences):
        new_conference_deadline = scrape_new_conference_deadline(conference)
        if new_conference_deadline is not None:
            conference_ranking = get_matching_core_ranking(new_conference_deadline)
            if conference_ranking is not None:
                new_conference_deadline.ranking = conference_ranking.rank
                new_conference_deadline.ranking_link = conference_ranking.link
            new_conference_deadlines.append(new_conference_deadline)
    return new_conference_deadlines


def scrape_new_conference_deadline(
    conference: ConferenceMasterData,
) -> ConferenceDeadline:
    """
    Note: Wee add sleep of 5 seconds, since that is the maximum, see http://wikicfp.com/cfp/data.jsp
    """
    conference_candidates = scrape_conference_candidates_from_wikicpf(conference)
    best_conference_candidates = find_conference_from_candidates(
        conference, conference_candidates
    )
    for conference_data in best_conference_candidates:
        time.sleep(5)
        conference_details = extract_data_from_website(conference_data.wikicfp_link)
        conference_deadline = convert_wikicfp2deadline(
            {**conference_details, **conference_data.__dict__}, conference
        )
        return conference_deadline  # currently only use best one
    time.sleep(5)


def update_conference_deadlines(
    conference_deadlines: List[ConferenceDeadline],
    new_conference_deadline_candidates: List[ConferenceDeadline],
):
    updated_conference_deadlines = []
    new_conference_deadlines = []
    existing_conference_ids = [c.id for c in conference_deadlines]
    for new_conference in new_conference_deadline_candidates:
        if new_conference.id in existing_conference_ids:
            existing_entry = [
                c for c in conference_deadlines if c.id == new_conference.id
            ][0]
            updated = existing_entry.update_from_candidate(new_conference)
            if updated:
                updated_conference_deadlines.append(existing_entry)
        else:
            new_conference_deadlines.append(new_conference)
    return new_conference_deadlines, updated_conference_deadlines


def scrape_conference_candidates_from_wikicpf(
    conference: ConferenceMasterData,
) -> List[ConferenceCandidateCFP]:
    if conference.wikicfp_link is None or conference.wikicfp_link == "":
        url = f"http://wikicfp.com/cfp/servlet/tool.search?q={conference.wikicfp_query}&year=f"
        table_id = 1
    else:
        url = conference.wikicfp_link
        table_id = 3

    try:
        page = urllib.request.urlopen(url)
    except Exception as e:
        print(f"Error: could not open {url}: {e}")
        return []
    soup = BeautifulSoup(page, "html.parser")
    table = soup.select("div.contsec table")[table_id]
    tables_rows = table.find_all("tr")
    if len(tables_rows) == 0:
        return []
    headline = tables_rows.pop(0)
    content_rows = [
        [tables_rows[i], tables_rows[i + 1]] for i in range(0, len(tables_rows), 2)
    ]
    conference_candidates = []
    for i, row in enumerate(content_rows):
        row_data = [subrow.find_all(["th", "td"]) for subrow in row]
        row_data = sum(row_data, [])
        try:
            year = int(row_data[0].text.split(" ")[-1])
            # year = get_datetime(row_data[2].text.split("-")[0].strip()).year
            conf_data = {
                "title": row_data[0].text,
                "wikicfp_link": f"http://wikicfp.com{row_data[0].find_all('a')[0]['href']}",
                "full_name": row_data[1].text,
                "year": year,
                # 'date': row_data[2].text,
                # 'location': row_data[3].text,
                # 'deadline': row_data[4].text,
            }
            conference_candidates.append(ConferenceCandidateCFP(**conf_data))
        except Exception as e:
            print(f"Error with {[r.text for r in row_data]}: {e}")
    return conference_candidates


def find_conference_from_candidates(
    conference: ConferenceMasterData,
    conference_candidates: List[ConferenceCandidateCFP],
) -> List[ConferenceCandidateCFP]:
    current_year = datetime.datetime.now().year

    # Only conferences next year
    best_candidates = [
        c
        for c in conference_candidates
        if c.year - current_year in [-1, 0, 1]
        and compute_conference_match_score(conference, c) > 0.8
    ]
    if len(best_candidates) == 0:
        print(
            f"WARNING: no candidates found for {conference.title} ({conference.full_name}); \n"
            f"Candidates: {conference_candidates}"
        )
    return best_candidates


def extract_data_from_website(url) -> Dict:
    def get_data(keyword: str, resources):
        candidates = [
            r for r in resources if r[0].text.strip().lower() == keyword.lower()
        ]
        if len(candidates) == 1:
            return candidates[0][1].text

    page = urllib.request.urlopen(url)
    soup = BeautifulSoup(page, "html.parser")

    # Extract Conference Info
    table = soup.select("div.contsec table.gglu")[0]
    tables_rows = table.find_all("tr")
    row_data = [row.find_all(["th", "td"]) for row in tables_rows]
    conf_data = {
        "date": get_data("when", row_data),
        "location": get_data("where", row_data),
        "deadline_abstract": get_data("abstract registration due", row_data),
        "deadline_submission": get_data("submission deadline", row_data),
        "notification_date": get_data("notification due", row_data),
        "final_version": get_data("final version due", row_data),
        "wikicfp": url,
    }

    # Extract Conference Link
    link_table = soup.select("div.contsec")[0]
    link_candidates = [f.text for f in link_table.find_all("td") if "Link:" in f.text]
    if len(link_candidates) == 1:
        link = link_candidates[0].replace("Link:", "")
        conf_data["link"] = link

    conf_data = {
        key: val.replace("\n", "").replace("\t", "").strip()
        for key, val in conf_data.items()
        if val
    }
    return conf_data


def convert_wikicfp2deadline(
    conference_data, conference: ConferenceMasterData
) -> ConferenceDeadline:
    start, end = [get_datetime(d) for d in conference_data["date"].split("-")]
    abstract_deadline = (
        get_datetime(conference_data["deadline_abstract"])
        if "deadline_abstract" in conference_data.keys()
        and conference_data["deadline_abstract"] is not None
        else ""
    )
    data = {
        "title": conference.title.upper(),
        "full_name": conference_data["full_name"],
        "hindex": conference.hindex,
        "ranking": conference.ranking,
        "year": int(conference_data["year"]),
        "id": f"{conference.title}{str(conference_data['year'])[2:]}",
        "link": conference_data["link"] if "link" in conference_data.keys() else None,
        "deadline": get_datetime(conference_data["deadline_submission"]),
        "abstract_deadline": abstract_deadline,
        "timezone": "",
        "start": start,
        "end": end,
        "date": get_date_format_from_start_and_end(start, end),
        "place": conference_data["location"]
        if "location" in conference_data.keys()
        else None,
        "sub": conference.sub,
        "note": f"Abstract deadline: {datetime_to_string(get_datetime(conference_data['deadline_abstract']), format_conf_date)}"
        if abstract_deadline != ""
        else "",
        "wikicfp": conference_data["wikicfp"],
    }
    return ConferenceDeadline(**data)
