from dataclasses import dataclass
from datetime import datetime, date
from typing import Dict

from src.scraping.utils import datetime_to_string, datetime_format, date_format


def attributes_as_dict(instance):
    res = {}
    for key, val in instance.__dict__.items():
        if key in ["__len__"]:
            continue
        if val not in ["", None]:
            if key in ["deadline", "abstract_deadline"]:
                res[key] = datetime_to_string(val, date_format) + " 23:59"
            elif key in ["start", "end"]:
                res[key] = datetime_to_string(val, date_format)
            else:
                res[key] = val
    return res


@dataclass
class ConferenceMasterData:
    title: str = ""
    full_name: str = ""
    wikicfp_query: str = ""
    wikicfp_link: str = ""
    ranking: str = ""
    sub: str = ""
    hindex: str = ""

    def as_dict(self) -> Dict:
        return attributes_as_dict(self)


@dataclass
class ConferenceCandidateCFP:
    title: str = ""
    wikicfp_link: str = ""
    full_name: str = ""
    year: int = None

    def as_dict(self) -> Dict:
        return attributes_as_dict(self)


@dataclass
class ConferenceRanking:
    title: str  # full_name in other classes
    acronym: str  # title in other classes
    source: str
    rank: str
    dblp: str
    hasdata: str
    primary_for: str
    comments: str
    average_rating: str
    link: str

    def as_dict(self) -> Dict:
        return attributes_as_dict(self)


@dataclass
class ConferenceDeadline:
    title: str = ""
    year: int = None
    id: str = ""
    full_name: str = ""
    link: str = ""
    deadline: datetime = None
    abstract_deadline: datetime = None
    timezone: str = ""
    place: str = ""
    date: str = ""
    start: datetime = None
    end: datetime = None
    paperslink: str = ""
    pwclink: str = ""
    hindex: int = None
    sub: str = ""
    ranking: str = ""
    ranking_link: str = ""
    note: str = ""
    wikicfp: str = ""
    wikicfp_comment: str = ""

    def __post_init__(self):
        # Convert date strings into datetime objects
        for key in ["deadline", "abstract_deadline", "start", "end"]:
            val = self.__dict__[key]
            if (
                val is not None
                and not isinstance(val, datetime)
                and not isinstance(val, date)
            ):
                for dt_format in [
                    date_format,
                    datetime_format,
                    datetime_format + ":%S",
                ]:
                    try:
                        d = datetime.strptime(val, dt_format)
                        break
                    except:
                        d = None
                        pass
                self.__dict__[key] = d
        return self

    def as_dict(self) -> Dict:
        return attributes_as_dict(self)

    def update_from_candidate(self, new_conference: "ConferenceDeadline"):
        updated = False
        for key in new_conference.as_dict().keys():
            val = new_conference.__dict__[key]
            if key in self.as_dict().keys():
                if val != self.__dict__[key]:
                    updated = True
                    if isinstance(val, str):
                        self.__dict__[key] = f"{val} (NEW)"
                    else:
                        self.__dict__[key] = val
            else:
                if isinstance(val, str):
                    self.__dict__[key] = f"{val} (NEW)"
                else:
                    self.__dict__[key] = val
        return updated
