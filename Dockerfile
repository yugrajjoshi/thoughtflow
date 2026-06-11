FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /code

RUN apt-get update \
    && apt-get install -y build-essential libpq-dev --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY thoughtflow/requirements.txt /code/requirements.txt

RUN pip install --upgrade pip \
    && pip install -r /code/requirements.txt

COPY . /code

# Collect static files from /code/thoughtflow
RUN cd /code/thoughtflow && python manage.py collectstatic --noinput || true

WORKDIR /code/thoughtflow

ENV PYTHONPATH=/code/thoughtflow

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "thoughtflow.asgi:application"]
