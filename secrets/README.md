Files in this folder hold real MySQL credentials for production/docker-compose use and must
never be committed.

Create these files (plain text, no quotes, no trailing newline needed):

- `mysql_user.txt`      -> value for `MYSQL_USER_FILE`
- `mysql_password.txt`  -> value for `MYSQL_PASSWORD_FILE`

Example:

```powershell
Set-Content -NoNewline -Path secrets/mysql_user.txt -Value 'app_user'
Set-Content -NoNewline -Path secrets/mysql_password.txt -Value 'super-secret-password'
```

`docker-compose.yml` mounts these as Docker secrets and points `MYSQL_USER_FILE` /
`MYSQL_PASSWORD_FILE` at the in-container secret paths (`/run/secrets/...`).

