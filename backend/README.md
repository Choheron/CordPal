## APPLICATION BACKEND README

Gitignore will ignore the following critical files and paths:
- data/ (Data file for connections to locally hosted discord bot)
- .env files (ignores `.env.local` and `.env.production`)

Expected Volumes:
| Description | Host Path (Planned) | Container Path |
|---|---|---|
| Bot Data Directory | /\(discord-bot dir\)/data | `/app/botData/<bot name>` |
| Media Directory | /\(discord-site dir\)/media | `/srv/media` |

Expected Environment Vars:
| Description | Key | Value |
|---|---|---|
| App Operating Environment  | APP_ENV | `PROD` |