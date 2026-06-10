FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY common.py .
COPY router.py .
COPY adapter.py .

CMD ["python", "router.py"]
