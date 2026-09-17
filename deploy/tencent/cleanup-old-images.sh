#!/usr/bin/env bash
# Only remove this website's unused immutable deployment tags.
set -euo pipefail
cd /home/ubuntu/club-deploy
repository='ghcr.io/dswxf0216/sustech-meteorology-club-website'
current=$(sed -n 's/^APP_IMAGE=//p' .env.web | tr -d '\r')
previous=$(sed -n 's/^APP_IMAGE=//p' .env.web.before-auto-deploy 2>/dev/null | tr -d '\r' || true)
[[ "$current" == "$repository":* ]] || { echo 'Cannot verify current website image; refusing cleanup'; exit 1; }
echo 'Disk space before cleanup:'
df -h / /var/lib/docker
mapfile -t container_images < <(sudo docker ps -aq | xargs -r sudo docker inspect --format '{{.Image}}')
mapfile -t candidates < <(sudo docker image ls "$repository" --format '{{.Repository}}:{{.Tag}}' | sort -u)
for ref in "${candidates[@]}"; do
  [[ "$ref" =~ ^ghcr\.io/dswxf0216/sustech-meteorology-club-website:[a-f0-9]{40}$ ]] || continue
  [[ "$ref" != "$current" && "$ref" != "$previous" ]] || continue
  id=$(sudo docker image inspect "$ref" --format '{{.Id}}')
  protected=false
  for used in "${container_images[@]}"; do [[ "$id" != "$used" ]] || protected=true; done
  if [[ "$protected" == false ]]; then
    # No force: Docker also refuses to remove images used by containers.
    sudo docker image rm "$ref"
  fi
done
echo 'Disk space after cleanup:'
df -h / /var/lib/docker
