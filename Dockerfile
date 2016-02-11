FROM node:4.2

MAINTAINER Alexandre Vallette <alexandre.vallette@ants.builders>

RUN mkdir /pheromon
WORKDIR /pheromon

RUN npm install nodemon -g

RUN apt-get update -y
RUN apt-get upgrade -y

# install pgdump and related

RUN apt-get install -y wget ca-certificates
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