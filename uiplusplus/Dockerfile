# Use the official Ruby image as the base image
FROM ruby:3.4.10@sha256:364bd08657bc1106373e8c2fc1b39b68f384f339decc5867374caf6e2e112927 AS build

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
FROM joseluisq/static-web-server:2.44.0@sha256:2c1a7c3e0feaea5859307403b74e1c575f3ec1499094fc077344173d11abaae2

# Copy the built site to the public directory
COPY --from=build /usr/src/app/_site /public

# Expose the port that the static web server will serve on
EXPOSE 4000
