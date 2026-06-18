import os
import tempfile

from filelock import FileLock, Timeout

_lock = FileLock(
    os.path.join(tempfile.gettempdir(), ".campaign_backend_scheduler.lock"),
    timeout=0,
)


def try_become_scheduler_master() -> bool:
    """Return True if this process should run the scheduler."""
    try:
        _lock.acquire(timeout=0)
        return True
    except Timeout:
        return False


def release_scheduler_master_lock() -> None:
    if _lock.is_locked:
        _lock.release()
