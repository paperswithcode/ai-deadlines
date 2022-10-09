from pathlib import Path

project_root = Path(__file__).parent.parent

csv_path_master_data = project_root / "_data/master_data.csv"
yaml_path_conferences = project_root / "_data/conferences.yml"
yaml_path_conference_new_candidates = (
    project_root / "_data/conference_new_candidates.yml"
)
yaml_path_conference_updated_candidates = (
    project_root / "_data/conference_update_candidates.yml"
)
