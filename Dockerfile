FROM ants/nodejs:v1
MAINTAINER Alexandre Vallette <alexandre.vallette@ants.builders>

RUN mkdir /pheromon
WORKDIR /pheromon

RUN npm install nodemon -g

# install pgdump and related
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
RUN apt-get install -y wget ca-certificates
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install -y postgresql-9.4 

# install ansible and related
RUN apt-get install -y python2.7
RUN apt-get install -y python-dev
RUN apt-get install -y python-pip
RUN pip install ansible
RUN mkdir /etc/ansible
 # Ansible config
RUN echo '[ssh_connection]' >> /etc/ansible/ansible.cfg
RUN echo 'pipelining = True' >> /etc/ansible/ansible.cfg
 # SSH config
RUN echo '' >> /etc/ssh/ssh_config
RUN echo 'Host *' >> /etc/ssh/ssh_config
RUN echo '    StrictHostKeyChecking no' >> /etc/ssh/ssh_config
RUN echo '    UserKnownHostsFile=/dev/null' >> /etc/ssh/ssh_config

#COPY ./package.json /pheromon/package.json

#RUN npm install
