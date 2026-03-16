# 9Tours AWS Multi-Machine Deployment

This guide follows the workshop shape closely:

- `MM` for SSH jump/admin work
- `LB` for `Nginx + HTTPS + frontend static files`
- `APP1` and `APP2` for the Nest backend
- `RDS PostgreSQL` as the only source of truth
- `EFS` for shared uploads
- `CloudWatch` for logs and basic alarms

## 1. Target Topology

- Public traffic reaches the `LB` machine only.
- `Nginx` serves the frontend from `/var/www/9tours/frontend`.
- `Nginx` proxies `/api/*` to the private backend nodes and strips the `/api` prefix before forwarding.
- `APP1` and `APP2` run the same backend release with the same `.env.production`.
- `RDS` is private and reachable only from app nodes and the management machine if needed.
- `EFS` is mounted on both app nodes at the same `UPLOADS_ROOT`, for example `/mnt/9tours-uploads`.

## 2. Security Groups

Recommended role-based groups:

- `public-web`
  - inbound `80, 443` from `0.0.0.0/0`
  - attach to `LB`
- `public-ssh`
  - inbound `22` only from your current public IP or campus IP
  - attach to `MM`
- `backend-app`
  - inbound backend app port such as `3000` from `LB` private security group only
  - inbound `22` from `MM` security group only
  - attach to `APP1`, `APP2`
- `rds-db`
  - inbound `5432` from `backend-app`
  - optional inbound `5432` from `MM` only if you need `psql`
- `efs`
  - inbound `2049` from `backend-app`

Rules that must stay true:

- backend app ports are never public
- RDS is never public
- SSH is not open to the world unless the workshop explicitly requires it

## 3. Required Environment Files

Backend production values:

- use [backend/.env.production.example](/d:/Y1_T2/240-124_WebDev/Project_9Tours/9Tours-main/backend/.env.production.example) as the template
- set `DB_SYNCHRONIZE=false`
- set `ENABLE_TOUR_JSON_IMPORT=false`
- set `MAIL_ENABLED=false`
- set `BACKEND_PUBLIC_URL=https://<your-domain>/api`
- set `UPLOADS_ROOT=/mnt/9tours-uploads`

Frontend production values:

- use [frontend/.env.production.example](/d:/Y1_T2/240-124_WebDev/Project_9Tours/9Tours-main/frontend/.env.production.example)
- set `VITE_API_URL=https://<your-domain>/api`

## 4. Bootstrap and Seed

Run these only after the backend release and production env are on an app node:

```bash
cd /var/www/9tours/releases/current/backend
npm ci
npm run build
npm run db:bootstrap
npm run seed:tours -- --reset
```

Notes:

- `db:bootstrap` forces `DB_SYNCHRONIZE=true` only inside the script, then exits.
- `seed:tours` disables runtime JSON import and imports `backend/tours-data.json` once.
- Do not leave `DB_SYNCHRONIZE=true` in the production env after bootstrap.

## 5. Backend Release Steps

On each app node:

```bash
sudo mkdir -p /var/www/9tours/releases/current
sudo mkdir -p /var/www/9tours/shared
sudo mkdir -p /mnt/9tours-uploads
```

Deploy the backend release to `/var/www/9tours/releases/current/backend`, then:

```bash
cd /var/www/9tours/releases/current/backend
npm ci
npm run build
sudo systemctl daemon-reload
sudo systemctl enable 9tours-backend
sudo systemctl restart 9tours-backend
sudo systemctl status 9tours-backend
```

Use the systemd example from [documentation/examples/9tours-backend.service](/d:/Y1_T2/240-124_WebDev/Project_9Tours/9Tours-main/documentation/examples/9tours-backend.service).

## 6. Frontend + Nginx on LB

Build frontend locally or on MM:

```bash
cd frontend
npm ci
npm run build
```

Copy `frontend/dist/*` to `/var/www/9tours/frontend` on `LB`.

Use the Nginx template from [documentation/examples/nginx-9tours-lb.conf](/d:/Y1_T2/240-124_WebDev/Project_9Tours/9Tours-main/documentation/examples/nginx-9tours-lb.conf), then:

```bash
sudo cp nginx-9tours-lb.conf /etc/nginx/sites-available/9tours
sudo ln -s /etc/nginx/sites-available/9tours /etc/nginx/sites-enabled/9tours
sudo nginx -t
sudo certbot --nginx -d <your-domain>
sudo systemctl reload nginx
```

## 7. EFS

Mount the same EFS path on both app nodes:

```bash
sudo apt-get install -y nfs-common
sudo mkdir -p /mnt/9tours-uploads
sudo mount -t nfs4 -o nfsvers=4.1 <efs-dns-name>:/ /mnt/9tours-uploads
```

Persist it in `/etc/fstab` after you verify the mount works.

## 8. CloudWatch

Minimum recommended setup:

- install the CloudWatch agent on `LB`, `APP1`, `APP2`
- ship `/var/log/nginx/access.log`, `/var/log/nginx/error.log`, and backend journald logs
- create one dashboard with CPU for `LB`, `APP1`, `APP2`, and DB
- create one alarm for sustained high CPU or app unavailability

Use [documentation/examples/cloudwatch-agent-config.json](/d:/Y1_T2/240-124_WebDev/Project_9Tours/9Tours-main/documentation/examples/cloudwatch-agent-config.json) as a starting point.

## 9. Post-Deploy Smoke Tests

Run these before demo day:

1. Homepage loads tour cards correctly.
2. Tour details show correct title, images, and schedules.
3. Join-trip booking and private-trip booking compute correct totals.
4. Payment page shows correct tour name and `booking.totalPrice`.
5. Slip upload succeeds.
6. Admin can review uploaded payments.
7. Google login completes through `https://<your-domain>/api/auth/google/callback`.
8. Stop `APP1` and confirm the site still works through `APP2`.
9. Upload a file and confirm both app nodes can access it through EFS.

## 10. Rollback

- Keep the previous backend build on each app node.
- Take an RDS snapshot before the final bootstrap/seed.
- If code is broken but data is fine, roll back the app release first.
- Restore the database only if schema or seeded data is broken.
