"""
FireSight — Detection Category Definitions
Maps YOLO class names to FireSight categories with severity levels.
"""

# COCO class name -> FireSight category mapping
CATEGORY_MAP = {
    # Humans
    "person": "human",
    # Vehicles
    "car": "vehicle",
    "truck": "vehicle",
    "bus": "vehicle",
    "motorcycle": "vehicle",
    "motorbike": "vehicle",
    # Bicycles
    "bicycle": "bicycle",
    # Plant/Machinery (custom model classes)
    "excavator": "plant",
    "forklift": "plant",
    "crane": "plant",
    "bulldozer": "plant",
    "telehandler": "plant",
    "roller": "plant",
    "dump_truck": "plant",
    "concrete_mixer": "plant",
    "generator": "plant",
    "cherry_picker": "plant",
}

# Severity mapping per category
SEVERITY_MAP = {
    "human": "low",
    "vehicle": "low",
    "plant": "medium",
    "bicycle": "low",
    "ppe": "high",
    "fire": "critical",
    "smoke": "high",
    "accident": "critical",
    "intrusion": "high",
    "fall": "critical",
}

# Category display info
CATEGORY_INFO = {
    "human": {"icon": "👤", "label": "Human", "color": "#4FC3F7"},
    "vehicle": {"icon": "🚗", "label": "Vehicle", "color": "#81C784"},
    "plant": {"icon": "🏗️", "label": "Plant/Machinery", "color": "#FFB74D"},
    "bicycle": {"icon": "🚲", "label": "Bicycle", "color": "#CE93D8"},
    "ppe": {"icon": "🦺", "label": "PPE Violation", "color": "#FF8A65"},
    "fire": {"icon": "🔥", "label": "Fire", "color": "#EF5350"},
    "smoke": {"icon": "💨", "label": "Smoke", "color": "#B0BEC5"},
    "accident": {"icon": "💥", "label": "Accident", "color": "#E53935"},
    "intrusion": {"icon": "🚨", "label": "Intrusion", "color": "#FFA726"},
    "fall": {"icon": "⬇️", "label": "Fall", "color": "#D32F2F"},
}


def get_severity(category: str) -> str:
    """Get severity level for a detection category."""
    return SEVERITY_MAP.get(category, "low")


def get_category_info(category: str) -> dict:
    """Get display info for a detection category."""
    return CATEGORY_INFO.get(category, {"icon": "❓", "label": category, "color": "#999999"})
