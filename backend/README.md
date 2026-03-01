# Backend Setup

## Local run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

## Initial admin user

```bash
python manage.py createsuperuser
```
