import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from django.core.exceptions import ImproperlyConfigured
from django.core.management.utils import get_random_secret_key
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
TRUE_VALUES = {"1", "true", "yes", "on"}
FALSE_VALUES = {"0", "false", "no", "off"}


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in TRUE_VALUES:
        return True
    if normalized in FALSE_VALUES:
        return False
    return default


def build_database_config() -> dict:
    database_url = os.getenv("DATABASE_URL", "").strip()
    if database_url:
        use_ssl_require = (not DEBUG) and not database_url.startswith("sqlite")
        return {
            "default": dj_database_url.parse(
                database_url,
                conn_max_age=600,
                ssl_require=use_ssl_require,
            )
        }
    return {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


DEPLOY_ENV = os.getenv("DEPLOY_ENV", "development").strip().lower()
SECRET_KEY_ENV = os.getenv("SECRET_KEY", "").strip()
SECRET_KEY = SECRET_KEY_ENV or get_random_secret_key()
DEBUG = env_bool("DEBUG", DEPLOY_ENV not in {"production", "prod"})
IS_PRODUCTION = DEPLOY_ENV in {"production", "prod"} or not DEBUG

ALLOWED_HOSTS = [host.strip() for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "storages",
    "apps.common",
    "apps.accounts",
    "apps.dogs",
    "apps.reservations",
    "apps.checkins",
    "apps.payments",
    "apps.stats",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = build_database_config()

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "ja"
TIME_ZONE = "Asia/Tokyo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.getenv("THROTTLE_ANON", "60/min"),
        "user": os.getenv("THROTTLE_USER", "240/min"),
        "auth_line": os.getenv("THROTTLE_AUTH_LINE", "20/min"),
        "stripe_webhook": os.getenv("THROTTLE_STRIPE_WEBHOOK", "60/min"),
        "public_availability": os.getenv("THROTTLE_PUBLIC_AVAILABILITY", "60/min"),
        "public_stats": os.getenv("THROTTLE_PUBLIC_STATS", "120/min"),
        "public_content": os.getenv("THROTTLE_PUBLIC_CONTENT", "60/min"),
    },
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("ACCESS_TOKEN_MINUTES", "30"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("REFRESH_TOKEN_DAYS", "14"))),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CSRF_TRUSTED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_MOCK = env_bool("STRIPE_MOCK", DEBUG)
LINE_CHANNEL_ID = os.getenv("LINE_CHANNEL_ID", "")
LINE_LOGIN_MOCK = env_bool("LINE_LOGIN_MOCK", not IS_PRODUCTION)

AZURE_ACCOUNT_NAME = os.getenv("AZURE_ACCOUNT_NAME", "")
AZURE_ACCOUNT_KEY = os.getenv("AZURE_ACCOUNT_KEY", "")
AZURE_CONTAINER = os.getenv("AZURE_CONTAINER", "dogrun-media")

if AZURE_ACCOUNT_NAME and AZURE_ACCOUNT_KEY:
    DEFAULT_FILE_STORAGE = "storages.backends.azure_storage.AzureStorage"
    AZURE_CUSTOM_DOMAIN = f"{AZURE_ACCOUNT_NAME}.blob.core.windows.net"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
        }
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}

appinsights_connection = os.getenv("APPINSIGHTS_CONNECTION_STRING", "")
if appinsights_connection:
    LOGGING["handlers"]["azure"] = {
        "class": "opencensus.ext.azure.log_exporter.AzureLogHandler",
        "connection_string": appinsights_connection,
        "formatter": "standard",
    }
    LOGGING["root"]["handlers"].append("azure")


if IS_PRODUCTION:
    if not SECRET_KEY_ENV:
        raise ImproperlyConfigured("SECRET_KEY must be explicitly set via environment in production.")

    if DEBUG:
        raise ImproperlyConfigured("DEBUG must be False in production.")

    if LINE_LOGIN_MOCK:
        raise ImproperlyConfigured("LINE_LOGIN_MOCK must be False in production.")

    if not ALLOWED_HOSTS or set(ALLOWED_HOSTS).issubset({"localhost", "127.0.0.1"}):
        raise ImproperlyConfigured("ALLOWED_HOSTS must be set to production domains in production.")

    if any("localhost" in origin or "127.0.0.1" in origin for origin in CORS_ALLOWED_ORIGINS):
        raise ImproperlyConfigured("CORS_ALLOWED_ORIGINS must not contain localhost in production.")

    if any("localhost" in origin or "127.0.0.1" in origin for origin in CSRF_TRUSTED_ORIGINS):
        raise ImproperlyConfigured("CSRF_TRUSTED_ORIGINS must not contain localhost in production.")

    if not STRIPE_MOCK and not STRIPE_WEBHOOK_SECRET:
        raise ImproperlyConfigured("STRIPE_WEBHOOK_SECRET must be set in production when STRIPE_MOCK is False.")
