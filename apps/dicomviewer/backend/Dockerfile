# Backend with GPU inference; also serves the built viewer. Build from the project root:
#   npm run build && docker compose up --build
FROM pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime
WORKDIR /srv
COPY backend/requirements.txt backend/requirements-ai.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-ai.txt
COPY backend/app ./app
COPY dist ./dist
ENV FRONTEND_DIST=/srv/dist DATA_DIR=/data MODELS_DIR=/models
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
