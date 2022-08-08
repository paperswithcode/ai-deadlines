import urllib.request
from typing import List

from bs4 import BeautifulSoup

from src.scraping.models import ConferenceRanking, ConferenceDeadline
from src.scraping.matching import compute_conference_ranking_match_score


def extract_conference_ranking_link(row):
    sub_url = row.get("onclick")[len("navigate('") : -3]
    url = f"http://portal.core.edu.au{sub_url}"
    return url


def scrape_core_ratings(query: str, year: int) -> List[ConferenceRanking]:
    table_head = [
        "Title",
        "Acronym",
        "Source",
        "Rank",
        "DBLP",
        "hasData?",
        "Primary FoR",
        "Comments",
        "Average Rating",
    ]
    url = f"http://portal.core.edu.au/conf-ranks/?search={query}&by=all&source=CORE{year}&sort=atitle&page=1"

    try:
        page = urllib.request.urlopen(url)
    except Exception as e:
        print(f"Error: could not open {url}: {e}")
        return []
    soup = BeautifulSoup(page, "html.parser")
    tables = soup.select("div#search table")
    if len(tables) == 0:
        return []
    table = tables[0]
    tables_rows = table.find_all("tr")
    del tables_rows[0]  # remove headline
    rankings = []
    for row in tables_rows:
        row_data = row.find_all(["th", "td"])
        ranking = ConferenceRanking(
            **{
                table_head[i]
                .lower()
                .replace(" ", "_")
                .replace("?", ""): row_data[i]
                .text.replace("\n", "")
                .strip()
                for i in range(len(table_head))
            },
            link=extract_conference_ranking_link(row),
        )
        rankings.append(ranking)
    return rankings


def get_matching_core_ranking(conference: ConferenceDeadline) -> ConferenceRanking:
    conference_rankings = scrape_core_ratings(conference.title, conference.year)
    for conference_ranking in conference_rankings:
        score = compute_conference_ranking_match_score(conference, conference_ranking)
        if score == 1:
            return conference_ranking
