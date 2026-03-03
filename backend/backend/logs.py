# backend/logs.py
import json_log_formatter

class JSONFormatter(json_log_formatter.JSONFormatter):
    def extra_from_record(self, record):
        extra = super().extra_from_record(record)
        extra.pop('request', None)  # Django injects HttpRequest, which is not JSON-serializable
        return extra

    def json_record(self, message, extra, record):
        extra.update({
            "source": "django",
            "level": record.levelname,
            "pathname": record.pathname,
            "lineno": record.lineno,
            "function": record.funcName
        })
        return super().json_record(message, extra, record)