import difflib

from src.scraping.models import (
    ConferenceMasterData,
    ConferenceCandidateCFP,
    ConferenceRanking,
    ConferenceDeadline,
)


def clean_wikicfp_title(title: str) -> str:
    wikicfp_replace_strings = ["dagm", "ieee", "--ei", "-", "scopus", "&", "acm"]
    for replace_string in wikicfp_replace_strings:
        title = title.replace(replace_string, "")
    return title


def compute_conference_match_score(
    conference: ConferenceMasterData,
    conference_candidate: ConferenceCandidateCFP,
    cutoff=0.8,
):
    score = len(
        difflib.get_close_matches(
            clean_wikicfp_title(conference_candidate.full_name.lower()),
            [conference.title.lower(), conference.full_name.lower()],
            cutoff=cutoff,
        )
    )
    return score


def compute_conference_ranking_match_score(
    conference: ConferenceDeadline, conference_candidate: ConferenceRanking, cutoff=0.8,
):
    score = len(
        difflib.get_close_matches(
            conference_candidate.title.lower(),
            [conference.title.lower(), conference.full_name.lower()],
            cutoff=cutoff,
        )
    )
    return score


