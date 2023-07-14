Builds container images for third-party apps, to run them on [my homelab](https://github.com/pl4nty/lab-infra/).

The contents of this repository are licensed under the MIT license. For dependencies and submodules, all rights are reserved by their respective owners.

## Usage

```bash
git submodule add -b [tag/branch] [url] [name]/[name] && cd [name]
docker build -t [name] -f Dockerfile [name]
```
