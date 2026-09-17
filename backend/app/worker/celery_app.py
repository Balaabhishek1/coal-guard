"""Celery Application Initialization & Task Configuration

Configures asynchronous background workers and periodic beat scheduling
using Redis as broker and results cache.
"""

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "coalguard_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.worker.sla_worker"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes hard limit
    beat_schedule={
        "check-sla-escalations-every-5-minutes": {
            "task": "check_sla_escalations",
            "schedule": 300.0,  # Run every 5 minutes
        },
    },
)
