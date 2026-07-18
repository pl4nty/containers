# Use the official Ruby image as the base image
FROM ruby:3.1.0 AS build

# Set the working directory
WORKDIR /usr/src/app

# Install Jekyll and Bundler
RUN gem install jekyll bundler

# Copy the Gemfile and Gemfile.lock into the container
COPY website/Gemfile website/Gemfile.lock ./

# Install the dependencies
RUN bundle install

# Copy the rest of the application code
COPY website/. .

# Build the Jekyll site
RUN bundle exec jekyll build

# Use the static web server image to serve the built files
FROM joseluisq/static-web-server:2.43.0@sha256:6acea6260b14e08dda986361e42640082fbfaab8d88c327de532bb13a3b22994

# Copy the built site to the public directory
COPY --from=build /usr/src/app/_site /public

# Expose the port that the static web server will serve on
EXPOSE 4000
