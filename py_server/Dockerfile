FROM python:latest

WORKDIR /app

COPY requirements.txt .

RUN pip3 install -r requirements.txt

COPY . .

CMD [ "python", "-m", "flask", "--app", "src/server.py", "run", "--host=0.0.0.0"]