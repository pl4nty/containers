# Use the official Ruby image as the base image
FROM ruby:3.4.10@sha256:ce3b7a999d9e430e59e1a12456c631fbea3dd18948c89cf8a913c3566c77b2ae AS build

# Set the working directory
WORKDIR /usr/src/app

# Install Jekyll and Bundler
RUN gem install jekyll bundler

# Copy the Gemfile and Gemfile.lock into the container
# Kept outside the site dir so the patches below survive copying the site
COPY website/Gemfile website/Gemfile.lock /usr/src/gems/

# The upstream lockfile pins Bundler 2.2.9, which crashes on Ruby >= 3.4, so use the image's Bundler.
# Ruby 3.4 moved csv, base64 and bigdecimal out of the default gems, and the locked
# jekyll-last-modified-at depends on posix-spawn, which no longer compiles.
ENV BUNDLE_VERSION=system BUNDLE_GEMFILE=/usr/src/gems/Gemfile
RUN bundle add csv base64 bigdecimal --skip-install \
 && bundle lock --update jekyll-last-modified-at

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
