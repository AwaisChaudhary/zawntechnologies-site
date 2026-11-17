# ZAWN Technologies website

Source of https://www.zawntechnologies.com. Every push to `main` goes live within about 15 minutes: a cPanel cron job runs `.deploy/deploy-zawn.sh`, which copies the files into public_html. `send.php` and `smtp-config.php` live only on the server and are never overwritten.
