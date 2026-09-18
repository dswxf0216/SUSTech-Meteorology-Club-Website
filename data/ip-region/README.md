# Offline IP region database

Source: https://github.com/lionsoul2014/ip2region
Retrieved 2026-09-18, upstream commit c1a1fc7d5941760db3f8431dc05c48cf7f0e30a1.
Licensed under Apache 2.0; see LICENSE.md.

SHA256:
- ip2region_v4.xdb: 8e31bbdccb5bf21028af10592d4312ec975da0bffa108c0c5d862a12190f9ad3
- ip2region_v6.xdb: 939f6b46bd2b8bec3cf7c5ceb8ba782266ae9b1f35b5ba7916700dec0b7506ed

Only authenticated game administration endpoints perform lookups. These files must not be moved into public/. No external geolocation service receives submission IPs. Regions are approximate network locations, not precise user locations. Older records without a stored submission IP cannot be backfilled.
