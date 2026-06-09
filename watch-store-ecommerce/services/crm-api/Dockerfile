# Gunakan base image Python yang ringan
FROM python:3.10-slim

# Set working directory di dalam container
WORKDIR /app

# Salin requirements.txt terlebih dahulu untuk memanfaatkan cache docker
COPY requirements.txt .

# Install dependensi tanpa menyimpan cache pip
RUN pip install --no-cache-dir -r requirements.txt

# Salin seluruh sisa source code crm-api ke container
COPY . .

# Ekspos port 8000 untuk FastAPI
EXPOSE 8000

# Jalankan server uvicorn FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
