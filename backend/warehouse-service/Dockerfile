FROM python:3.12-slim

WORKDIR /app

COPY warehouse-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# توليد كود gRPC من العقد المشترك
COPY proto/warehouse.proto proto/warehouse.proto
RUN mkdir generated \
    && python -m grpc_tools.protoc -I proto --python_out=generated --grpc_python_out=generated proto/warehouse.proto

COPY warehouse-service/*.py ./

EXPOSE 50051
CMD ["python", "-u", "server.py"]