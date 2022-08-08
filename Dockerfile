FROM ubuntu:20.04

# Install jekyll
#RUN apt-get update
#RUN apt-get install -y ruby-full build-essential zlib1g-dev
#RUN export GEM_HOME="$HOME/gems"
#RUN export PATH="$HOME/gems/bin:$PATH"
#RUN gem install jekyll bundler

# Install python
RUN apt-get install -y python3 python3-pip
RUN ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY . ./

# RUN bundle install
RUN pip3 install -r requirements.txt

ENV PYTHONPATH "${PYTHONPATH}:/app"
EXPOSE 4000

#CMD ["bundle", "exec", "jekyll", "serve"]
CMD ["python", "src/tools/scrape_new_deadlines.py"]