# Proxmox VE Deployment Guide

This guide details how to deploy the IoT Platform (Next.js frontend, ChirpStack, and Supabase) on a Proxmox VE virtualization host.

---

## Architecture Overview

For a reliable production deployment on Proxmox VE, you can use:
1. **LXC Container (Lightweight)**: A Debian/Ubuntu Linux Container running Docker & Docker Compose.
2. **Nginx Proxy Manager**: A separate lightweight LXC or VM acting as a Reverse Proxy with Let's Encrypt SSL/TLS automation.

---

## Step 1: Create a Proxmox LXC Container

1. Open your Proxmox VE Web UI.
2. Click **Create CT** (top right).
3. **General Tab**:
   - Set a Hostname (e.g., `iot-platform-prod`).
   - Uncheck **Unprivileged container** (highly recommended for Docker nested storage support).
   - Enter a secure root password.
4. **Template Tab**: Select a clean `ubuntu-22.04-standard` or `debian-12-standard` template.
5. **Disks Tab**: Allocate at least **30 GB** of space (to account for telemetry databases and docker image layers).
6. **CPU Tab**: Allocate at least **2 vCPUs** (Next.js builds and PostgreSQL databases can be CPU intensive).
7. **Memory Tab**: Allocate at least **4 GB RAM** and **1 GB Swap**.
8. **Network Tab**:
   - Set IPv4 to **Static** (e.g., `192.168.1.150/24`) and specify your gateway (e.g., `192.168.1.1`).
9. **Confirm Tab**: Do not start it yet. Click **Finish**.

### Crucial: Enable Docker Nesting
Before starting the container, you must enable nesting:
1. Select the newly created container in Proxmox.
2. Go to **Options** -> **Features**.
3. Edit, check **Nesting** and **keyctl**, then save.
4. Now, start the container and log in via the Console.

---

## Step 2: Install Docker and Docker Compose (Inside LXC)

Log into your LXC console as `root` and run the following command:

```bash
# Update repositories and upgrade system
apt update && apt upgrade -y

# Install Docker dependencies
apt install -y ca-certificates curl gnupg lsb-release git

# Add Docker's official GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker and Docker Compose
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Verify docker status:
```bash
systemctl status docker
```

---

## Step 3: Clone the Codebase and Configure Environment Variables

```bash
# Clone the repository
git clone https://github.com/karlokolaric7/iot-platofrm.git /opt/iot-platform
cd /opt/iot-platform

# Create the environment file for production
cp .env.local .env
```

Open `.env` (using `nano .env`) and set production-ready variables:
```env
# Next.js Public URL & Keys (point to your domain or static Proxmox LXC IP)
NEXT_PUBLIC_SUPABASE_URL=http://192.168.1.150:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Admin key used by route handlers (e.g., API Ingest)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ChirpStack Integration
CHIRPSTACK_API_TOKEN=your_chirpstack_api_token
```

---

## Step 4: Deploy Supabase (Self-Hosted Production)

For local development, Supabase CLI runs a simplified local configuration. For a production Proxmox host, you should deploy the official Supabase Self-Hosted Stack:

```bash
# Clone official self-hosted Supabase config
git clone --depth 1 https://github.com/supabase/supabase.git /opt/supabase-docker
cd /opt/supabase-docker/docker

# Copy production env template
cp .env.example .env
```

1. Generate secure random passwords in `/opt/supabase-docker/docker/.env` for:
   - `POSTGRES_PASSWORD`
   - `JWT_SECRET`
   - `ANON_KEY`
   - `SERVICE_ROLE_KEY`
2. Start the Supabase stack:
   ```bash
   docker compose up -d
   ```
3. Apply database migrations to your production Supabase database:
   ```bash
   cd /opt/iot-platform
   # Set SUPABASE_ACCESS_TOKEN and push migrations from your development machine:
   # npx supabase db push --db-url "postgresql://postgres:your_prod_pass@192.168.1.150:54322/postgres"
   ```

---

## Step 5: Build and Run Next.js & ChirpStack

Once Supabase is running, return to the project root and spin up the unified stack:

```bash
cd /opt/iot-platform

# Build and start frontend and ChirpStack LNS in the background
docker compose -f docker-compose.prod.yml up -d --build
```

Verify that all containers are healthy:
```bash
docker ps
```

---

## Step 6: Configure SSL and Domain Routing (Reverse Proxy)

To expose your platform securely (using HTTPS/SSL):
1. Install **Nginx Proxy Manager** (either in the same LXC container or a separate one).
2. Point your domains (e.g., `dashboard.yourdomain.com` and `lora.yourdomain.com`) to your Proxmox server's IP address.
3. Configure Proxy Hosts:
   - **Frontend App**: Route `dashboard.yourdomain.com` to HTTP port `3001` of the LXC container.
   - **ChirpStack Web UI**: Route `lora.yourdomain.com` to HTTP port `8080` of the LXC container.
4. Request SSL Certificates via Let's Encrypt in the Nginx Proxy Manager interface.

---

## Backup & Maintenance (Proxmox VE features)

- **Backups**: Set up automated Proxmox Backups (VZDump) under the **Backup** tab of your LXC container. Schedule daily incremental backups to a local disk or external NAS.
- **Snapshots**: Before running database migrations or pulling the latest git changes, take a Proxmox VM Snapshot so you can instantly roll back if needed.
