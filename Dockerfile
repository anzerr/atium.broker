FROM anzerr/node:11

COPY . /app
RUN apk update && \
	apk upgrade && \
	apk --update add --no-cache --virtual .source-tools git build-base openssh-client findutils && \
	cd / && \
	cd app && \
	npm ci && \
	npm run test && \
	rm -Rf node_modules && \
	npm ci --only=prod && \
	find /app -regextype egrep -regex ".*.(ts|map|md)$"  -type f -delete && \
	find /app -regextype egrep -regex ".*(Dockerfile|LICENSE)$"  -type f -delete

FROM anzerr/node:slim-11
COPY --from=0 /app /app
WORKDIR /app
ENTRYPOINT ["node", "server.js"]