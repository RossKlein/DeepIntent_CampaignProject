FROM python:3.11-slim AS fastapi

EXPOSE 8000

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE=1

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1


WORKDIR /code

COPY requirements.txt /code/
RUN pip3 install --upgrade pip \
    && pip3 install --no-cache-dir -r requirements.txt

COPY . /code
RUN chmod +x /code/scripts/start.sh /code/scripts/db_reset.sh

CMD ["/code/scripts/start.sh"]
