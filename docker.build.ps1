docker build -t timestamp-enabled-umami --build-arg DATABASE_TYPE=postgresql .
docker tag timestamp-enabled-umami:latest clementjoye/timestamp-enabled-umami:latest
docker push clementjoye/timestamp-enabled-umami:latest 