FROM node:20-alpine

RUN apk --update add tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apk del tzdata && \
    rm -rf /var/cache/apk/*

WORKDIR /app

COPY package.json yarn.lock /app

RUN yarn config set registry https://registry.npm.taobao.org/ && \
    yarn config set strict-ssl false && \
    yarn install && \
    yarn add sharp --ignore-engines && \
    yarn cache clean

COPY . /app

RUN cd /app && \
    yarn build

EXPOSE 12345

CMD yarn start:prod
