# CrewFlow Deployment Guide — StackCP (`bytebunkers.sbs`)

This guide explains how to set up **continuous, automated, failproof deployment** for CrewFlow to your **StackCP** shared hosting account (`bytebunkers.sbs`) whenever code is pushed to your `main` branch.

---

## Architecture Overview

```mermaid
flowchart LR
    A[git push to main] --> B[GitHub Actions]
    B --> C[1. PHP 8.4 + Node 22 Setup]
    C --> D[2. Compile Vite Assets]
    D --> E[3. Run Automated Tests]
    E -->|Pass| F[4. Rsync to StackCP over SSH]
    E -->|Fail| Z[Abort Deployment & Alert]
    F --> G[5. Run deploy.sh on Server]
    G --> H[Migrate DB + Cache Clear + Restart Queues]
```

### Why this setup is Failproof:
1. **No Node.js / Vite build on shared hosting**: Compiling assets directly on shared hosting frequently crashes due to 128MB RAM limits. All assets (`public/build`) are compiled inside GitHub Actions runners with 16GB RAM.
2. **Pre-deployment Test Gate**: Automated Pest feature tests execute before any files are uploaded. If a regression or syntax error exists, the deployment aborts immediately.
3. **Safe Storage & Secret Persistence**: The `.env` file, database records, uploaded evidence files (`storage/app/private`), and logs are strictly preserved across deployments.
4. **Zero-downtime maintenance safety**: `deploy.sh` puts the application in maintenance mode with a 60-second retry header, runs migrations, warms production caches, and uses an error trap to ensure the application is never left offline if a step fails.

---

## Step 1: Get Your SSH Credentials from StackCP

1. Log into your **StackCP** control panel (`https://stackcp.com` or your hosting portal).
2. Select your domain: **`bytebunkers.sbs`**.
3. Under the **Web Tools** section, click **SSH Access** (or **Manage SSH**).
4. Ensure SSH is **Enabled**.
5. Note the following details:
   - **SSH Host**: (e.g. `ssh.stackcp.com` or `s1.stackcp.com` or your server IP)
   - **SSH Username**: (e.g. `bytebunkers.sbs` or your account username)
   - **SSH Port**: Usually `22`
   - **Password** or **SSH Key** configuration.

---

## Step 2: Generate an SSH Key Pair for GitHub Actions

On your local terminal (or inside StackCP), generate a dedicated SSH key pair:

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy@bytebunkers.sbs" -f crewflow_deploy_key -N ""
```

This creates two files:
- `crewflow_deploy_key` (**Private key** — add to GitHub Secrets)
- `crewflow_deploy_key.pub` (**Public key** — add to StackCP)

### Add Public Key to StackCP:
In your StackCP panel under **SSH Access**, click **Add Public Key** and paste the public key (`github-actions-deploy@bytebunkers.sbs`).
The private key is stored as the `SSH_PRIVATE_KEY` repository secret in GitHub Actions.

---

## Step 3: Add GitHub Secrets

In your GitHub repository:
1. Go to **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** and add the following 5 secrets:

| Secret Name | Description | Example Value |
| :--- | :--- | :--- |
| `SSH_HOST` | StackCP SSH server hostname or IP | `ssh.stackcp.com` |
| `SSH_USER` | StackCP SSH account username | `bytebunkers.sbs` |
| `SSH_PRIVATE_KEY` | Entire private key (`crewflow_deploy_key` file content) | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |
| `SSH_PORT` | SSH Port (default is 22) | `22` |
| `DEPLOY_PATH` | Path on the server where the app will live | `crewflow` |

---

## Step 4: One-Time Initial Server Setup on StackCP

Connect to your StackCP server via SSH:

```bash
ssh -p 22 your_username@your_ssh_host
```

### 1. Create the App Directory
```bash
mkdir -p ~/crewflow
```

### 2. Configure Your Database (Choose MySQL or Zero-Config SQLite)

#### Option A: MySQL (Recommended for Multi-User Production)
1. In your StackCP panel, click **MySQL Databases**.
2. Create a new database: e.g. `crewflow_db`.
3. Create a database user, assign all privileges to the database, and note the password.

#### Option B: SQLite (Zero Configuration Required)
If you don't want to manage MySQL credentials, you can set `DB_CONNECTION=sqlite` in `.env`. The deployment pipeline automatically creates and manages `database/database.sqlite`.

### 3. Configure the Production `.env`
In your SSH session:
```bash
cd ~/crewflow
nano .env
```
Copy the contents of [`.env.production.example`](file:///c:/Users/raja/Music/crm/.env.production.example), paste it into `.env`, and update:
- `APP_URL=https://bytebunkers.sbs`
- `DB_DATABASE=your_database_name` (or leave default for SQLite)
- `DB_USERNAME=your_database_user`
- `DB_PASSWORD=your_database_password`
- `ADMIN_EMAIL=admin@bytebunkers.sbs`
- `ADMIN_INITIAL_PASSWORD=YourSecurePassword123!`
- `APP_KEY=` (run `php artisan key:generate` to populate)

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

> [!NOTE]
> **Automated Database Safety & First-Deploy Seeding**:
> - **Pre-migration snapshots**: Before every migration, `deploy.sh` automatically creates a timestamped backup in `storage/app/backups/`. The 10 most recent snapshots are preserved.
> - **Initial Seeding**: On the very first deployment, the script detects an empty database and automatically provisions your Superadmin account, default workspace (`CrewFlow Operations`), and standard field service inspection templates. Your login credentials are saved to `storage/logs/initial_credentials.txt`.
> - **Preservation**: On all future deployments, the database check detects existing users and automatically skips seeding, ensuring customer data is never altered.

### 4. Link the Web Root (`public_html` to `public`)
On StackCP, the document root for your website is `public_html`. To safely isolate your code and `.env` outside the public web root:

```bash
# Backup existing public_html if not empty
mv ~/public_html ~/public_html_backup

# Symlink public_html to crewflow/public
ln -s ~/crewflow/public ~/public_html
```

*(If your StackCP host does not permit symlinking `public_html`, copy `public/*` into `public_html` and edit `index.php` to point to `../crewflow/vendor/autoload.php` and `../crewflow/bootstrap/app.php`).*

---

## Step 5: Setup Background Workers & Scheduler on StackCP

CrewFlow requires the Laravel scheduler (for overdue job alerts and reminders) and queue workers (for email notifications and automations).

In StackCP, open **Scheduled Tasks / Cron Jobs**:

### Cron Job 1: Laravel Scheduler (Runs Every Minute)
- **Schedule**: `* * * * *` (Every Minute)
- **Command**:
  ```bash
  cd ~/crewflow && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
  ```

### Cron Job 2: Queue Worker (Runs Every Minute, Exits When Empty)
Shared hosting terminates persistent background processes. Running `queue:work` with `--stop-when-empty` every minute is the **failproof pattern** for shared hosting:
- **Schedule**: `* * * * *` (Every Minute)
- **Command**:
  ```bash
  cd ~/crewflow && /usr/bin/php artisan queue:work --stop-when-empty --max-time=50 --tries=3 >> /dev/null 2>&1
  ```

---

## Step 6: Testing Automatic Deployment

1. Commit and push your changes to `main`:
   ```bash
   git add .
   git commit -m "Configure failproof automatic deployment to bytebunkers.sbs"
   git push origin main
   ```
2. Navigate to the **Actions** tab on your GitHub repository.
3. You will see the **Deploy to Production (bytebunkers.sbs)** workflow running:
   - ✅ Builds Vite assets and runs test suite
   - ✅ Syncs files securely via Rsync
   - ✅ Runs database migrations
   - ✅ Optimizes production routes, configs, and views
4. Visit `https://bytebunkers.sbs` in your browser!

---

## Troubleshooting Checklist

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **500 Server Error** | Missing `.env` or APP_KEY | Run `cd ~/crewflow && php artisan key:generate` |
| **Permission Denied** | Storage permissions | Run `chmod -R 775 ~/crewflow/storage ~/crewflow/bootstrap/cache` |
| **Database Connection Error** | Wrong DB credentials | Double-check `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` in `~/crewflow/.env` |
| **Vite Assets Missing / 404** | Symlink to `public_html` missing | Verify `~/public_html` points to `~/crewflow/public` |
| **Overdue Jobs Not Triggering** | Cron not executing | Verify StackCP Scheduled Tasks command uses the full path `/usr/bin/php` |
