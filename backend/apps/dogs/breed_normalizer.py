import re
import unicodedata

UNKNOWN_BREED_LABEL = "\u4e0d\u660e"

_CANONICAL_TO_ALIASES: dict[str, tuple[str, ...]] = {
    "\u67f4\u72ac": (
        "\u67f4\u72ac",
        "\u67f4",
        "\u3057\u3070",
        "\u3057\u3070\u3044\u306c",
        "\u30b7\u30d0",
        "\u30b7\u30d0\u30a4\u30cc",
        "shiba",
        "shiba inu",
        "shibainu",
    ),
    "\u30c8\u30a4\u30d7\u30fc\u30c9\u30eb": (
        "\u30c8\u30a4\u30d7\u30fc\u30c9\u30eb",
        "\u30c8\u30a4\u30fb\u30d7\u30fc\u30c9\u30eb",
        "\u3068\u3044\u3077\u30fc\u3069\u308b",
        "toy poodle",
        "toypoodle",
    ),
    "\u30df\u30cb\u30c1\u30e5\u30a2\u30c0\u30c3\u30af\u30b9\u30d5\u30f3\u30c9": (
        "\u30df\u30cb\u30c1\u30e5\u30a2\u30c0\u30c3\u30af\u30b9\u30d5\u30f3\u30c9",
        "\u30df\u30cb\u30c1\u30e5\u30a2\u30fb\u30c0\u30c3\u30af\u30b9\u30d5\u30f3\u30c9",
        "\u30df\u30cb\u30c1\u30e5\u30a2\u30c0\u30c3\u30af\u30b9",
        "\u30c0\u30c3\u30af\u30b9",
        "\u307f\u306b\u3061\u3085\u3042\u3060\u3063\u304f\u3059\u3075\u3093\u3069",
        "miniature dachshund",
        "dachshund",
    ),
    "\u30c1\u30ef\u30ef": (
        "\u30c1\u30ef\u30ef",
        "\u3061\u308f\u308f",
        "chihuahua",
    ),
    "\u30dd\u30e1\u30e9\u30cb\u30a2\u30f3": (
        "\u30dd\u30e1\u30e9\u30cb\u30a2\u30f3",
        "\u307d\u3081\u3089\u306b\u3042\u3093",
        "pomeranian",
    ),
    "\u30d5\u30ec\u30f3\u30c1\u30d6\u30eb\u30c9\u30c3\u30b0": (
        "\u30d5\u30ec\u30f3\u30c1\u30d6\u30eb\u30c9\u30c3\u30b0",
        "\u30d5\u30ec\u30f3\u30c1\u30fb\u30d6\u30eb\u30c9\u30c3\u30b0",
        "\u30d5\u30ec\u30d6\u30eb",
        "french bulldog",
    ),
    "\u30e9\u30d6\u30e9\u30c9\u30fc\u30eb\u30ec\u30c8\u30ea\u30d0\u30fc": (
        "\u30e9\u30d6\u30e9\u30c9\u30fc\u30eb\u30ec\u30c8\u30ea\u30d0\u30fc",
        "\u30e9\u30d6\u30e9\u30c9\u30fc\u30eb",
        "\u3089\u3076\u3089\u3069\u30fc\u308b\u308c\u3068\u308a\u3070\u30fc",
        "labrador retriever",
        "labrador",
    ),
    "\u30b4\u30fc\u30eb\u30c7\u30f3\u30ec\u30c8\u30ea\u30d0\u30fc": (
        "\u30b4\u30fc\u30eb\u30c7\u30f3\u30ec\u30c8\u30ea\u30d0\u30fc",
        "\u30b4\u30fc\u30eb\u30c7\u30f3",
        "\u3054\u30fc\u308b\u3067\u3093\u308c\u3068\u308a\u3070\u30fc",
        "golden retriever",
        "golden",
    ),
    "\u30a6\u30a7\u30eb\u30b7\u30e5\u30b3\u30fc\u30ae\u30fc\u30da\u30f3\u30d6\u30ed\u30fc\u30af": (
        "\u30a6\u30a7\u30eb\u30b7\u30e5\u30b3\u30fc\u30ae\u30fc\u30da\u30f3\u30d6\u30ed\u30fc\u30af",
        "\u30a6\u30a7\u30eb\u30b7\u30e5\u30fb\u30b3\u30fc\u30ae\u30fc\u30fb\u30da\u30f3\u30d6\u30ed\u30fc\u30af",
        "\u30b3\u30fc\u30ae\u30fc",
        "\u3053\u30fc\u304e\u30fc",
        "welsh corgi pembroke",
        "corgi",
    ),
    "\u30df\u30c3\u30af\u30b9": (
        "\u30df\u30c3\u30af\u30b9",
        "\u30df\u30c3\u30af\u30b9\u72ac",
        "\u96d1\u7a2e",
        "mix",
        "mixed",
        "mutt",
    ),
}


def _collapse_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _normalize_key(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value)
    normalized = _collapse_spaces(normalized).lower()
    return re.sub(r"[\s\-_\u30fb/]+", "", normalized)


_ALIAS_TO_CANONICAL = {
    _normalize_key(alias): canonical
    for canonical, aliases in _CANONICAL_TO_ALIASES.items()
    for alias in aliases
}


def _normalize_fallback(value: str) -> str:
    collapsed = _collapse_spaces(unicodedata.normalize("NFKC", value))
    if re.fullmatch(r"[A-Za-z0-9 .'\-]+", collapsed):
        return collapsed.title()
    return collapsed


def normalize_breed_name(value: str | None) -> str:
    if value is None:
        return UNKNOWN_BREED_LABEL

    collapsed = _collapse_spaces(value)
    if not collapsed:
        return UNKNOWN_BREED_LABEL

    canonical = _ALIAS_TO_CANONICAL.get(_normalize_key(collapsed))
    if canonical:
        return canonical

    return _normalize_fallback(collapsed)
