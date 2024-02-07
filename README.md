# Containers

Builds container images for third-party apps with GitHub Actions, to run them on [my homelab](https://github.com/pl4nty/homelab/).

The contents of this repository are licensed under the MIT license. For dependencies and submodules, all rights are reserved by their respective owners.

## Usage

```bash
git submodule add -b [tag/branch] [url] [name]/[name] && cd [name]
docker build -t [name] -f Dockerfile [name]
```

## Archive

Unused images are archived in case someone else finds them useful. However, they aren't updated and may succumb to bitrot.

```bash
git mv [name] archive/[name]
```

## Delete

Images may be deleted if an upstream image becomes available.

```bash
git rm -r [name]/[name]
rm -r [name]
```
