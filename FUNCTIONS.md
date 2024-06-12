## CloudFlare Functions

Install `wrangler` command line tool from Cloudflare.

## Production

1. Deploy script `./functions/api/v0/submit` to production:

```
wrangler deploy 
```

Note `deploy` uses the parameters in `wranger.toml` file.

---

## Test External APIs (Dev & Localhost)

### Test reCAPTCHAv3

```
curl -v -X POST https://www.google.com/recaptcha/api/siteverify  \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'secret=________&response=________'
```

### Test InfinyOn Webhooks

```
curl -v -X POST https://infinyon.cloud/webhooks/v1/nClw0iNCI3QnZHOrtr2MTBPjc8KFn3Z6QMMJdWvUdWHsfSxhRalsdZw2lMXq9Zik \
    -H "Content-Type: application/json" \
    -d '[{"key": "value"}, {"key2": "value2"}]'
```