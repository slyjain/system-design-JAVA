# Scheduled GitHub Actions

## What a cron schedule means

A scheduled workflow asks GitHub to start a job at recurring calendar times. It does not keep a process running on your laptop. The workflow must exist on the repository's default branch, and scheduled runs use that branch's latest commit.

Cron has five fields, in UTC by default:

```text
minute  hour  day-of-month  month  day-of-week
```

`*` means every allowed value. `/5` means steps of five. Our counter workflow uses `3-59/5 * * * *`: minutes **03, 08, 13, …, 58** of every hour, every day. The offset avoids the particularly busy start of the hour. `*/10 * * * *` would mean minutes **00, 10, 20, …, 50**.

`workflow_dispatch` adds an on-demand run option in GitHub's Actions tab and through `gh workflow run`. The counter workflow reads its public destination from `vars.COUNTER_APP_URL`; database credentials are not needed to call the public health endpoint. Setup commands live in `HLD/counter-app/README.md`.

## A schedule is best-effort

GitHub's minimum schedule interval is five minutes. Runs can be delayed or dropped under load, so a five-minute schedule is not a guarantee of requests exactly five minutes apart. In public repositories, scheduled workflows are automatically disabled after 60 days without repository activity.

Render Free spins down after 15 minutes without inbound traffic. Periodic health requests reduce idle sleeps and can wake a sleeping service, but cannot guarantee continuous uptime or prevent platform restarts. Our workflow allows 90 seconds per attempt to accommodate a cold start and verifies the health JSON instead of treating any HTML loading page as success.

## How this affects the free allowance

Render grants **750 free instance hours per workspace per calendar month**, shared by all its Free web services. A continuously awake service uses **720 hours in a 30-day month** or **744 in a 31-day month**. This leaves little room for another service in the same workspace. Exhausting that allowance suspends the Free services until the next month; a keep-alive cannot bypass that limit.

Sources: [GitHub schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [Render Free limits](https://render.com/docs/free).
