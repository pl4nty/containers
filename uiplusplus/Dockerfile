# Use the official Ruby image as the base image
FROM ruby:4.0.4@sha256:8b9d39df3e5a2e6b8a488fd07e58d9589ab8fbce79afdabf8b141eb359eafeea AS build

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
FROM joseluisq/static-web-server:2.42.0

# Copy the built site to the public directory
COPY --from=build /usr/src/app/_site /public

# Expose the port that the static web server will serve on
EXPOSE 4000
