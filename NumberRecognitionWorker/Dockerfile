FROM ubuntu:16.04

RUN apt-get update
RUN apt-get install -y \
  libopenalpr-dev \
  openalpr \
  openalpr-daemon \
  openalpr-utils \
  curl \
  wget \
  libssl-dev \
  git-core \
  build-essential

RUN curl -sL https://deb.nodesource.com/setup_16.x  | bash -
RUN apt-get -y install nodejs

WORKDIR /app
COPY package*.json ./
COPY index.js ./

RUN npm install

CMD ["node", "index.js"]


