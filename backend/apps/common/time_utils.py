from datetime import datetime


def elapsed_minutes(start: datetime | None, end: datetime | None) -> int | None:
    """Whole minutes between ``start`` and ``end`` (never negative).

    Returns ``None`` when either endpoint is missing, so callers can treat an
    unknown duration distinctly from a zero-length one.
    """
    if not start or not end:
        return None
    return max(int((end - start).total_seconds() // 60), 0)
