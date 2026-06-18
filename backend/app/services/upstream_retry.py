"""Shared retry policy for the upstream campaign API."""

import httpx

UPSTREAM_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}

# Per-page fetch: fail fast so polls finish within POLL_INTERVAL_SECONDS.
UPSTREAM_PAGE_MAX_ATTEMPTS = 3
UPSTREAM_HTTP_TIMEOUT = httpx.Timeout(5.0, connect=2.0)


def is_retryable_upstream_error(exc: BaseException) -> bool:
    if isinstance(exc, httpx.RequestError):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in UPSTREAM_RETRYABLE_STATUS_CODES
    return False
