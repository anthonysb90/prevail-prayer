# Prevail Prayer — Analytics Guide

Two places answer "who uses what and why":

1. **Admin → Engagement** — per-member feature usage, pulled live from your database. Works today, no app update. Best for "which members use which features."
2. **PostHog** — behavior over time: session length, location, funnels, retention, when people hit the paywall. Best for "what are people doing and where do they drop off."

---

## What's available now vs. after the next app build

| You want to know… | Source | Available |
|---|---|---|
| Who reads devotions / journals / saves Scripture / uses AI | Admin → Engagement | **Now** |
| Who has push on/off | Admin → Engagement (and Notifications) | **Now** |
| Who is on trial / Pro / free | Admin → Engagement, Users | **Now** |
| Where users are located | PostHog (GeoIP, automatic) | **Now** |
| Signups, prayers added, AI imports, timer completions | PostHog events | **Now** |
| Session length / time in app | PostHog | **Next build** (lifecycle capture was just added) |
| Devotion / journal / Scripture events with names attached | PostHog | **Next build** |
| When the paywall is shown + context | PostHog (`paywall_shown`) | **Next build** |
| Push on/off as a filterable trait in PostHog | PostHog person property | **Next build** |

The "next build" items are already coded; they activate when your next app version ships.

---

## Events the app sends (after next build)

| Event | Fires when | Key properties |
|---|---|---|
| `user_signed_up` | Account created | `needs_email_confirm` |
| `prayer_added` | Prayer request created | `is_urgent`, `status` |
| `prayer_import_extracted` | AI Import returns results | `mode` (photo/text), `count` |
| `prayer_import_saved` | AI results saved | `count` |
| `devotion_opened` | A devotion is opened | `devotion_id`, `title` |
| `devotion_reflection_saved` | Reflection saved to journal | `devotion_id` |
| `journal_entry_created` | Journal entry created | `from_prayer` |
| `scripture_topic_viewed` | A Scripture topic is opened | `topic`, `verse_count` |
| `prayer_session_completed` | Timer session finishes | `duration_seconds`, `track` |
| `paywall_shown` | Any upgrade prompt appears | `context` |
| `testimony_shared` | Testimony shared | `kind` |

Every event is tied to the signed-in person, who carries these properties: `email`, `name`, `subscription_status`, `is_premium`, `comped`, `push_enabled`, `platform`, `account_created`, `timezone`, plus automatic `$geoip_city` / `$geoip_country_name`.

---

## PostHog dashboard to build

Create one dashboard called **"Product Health"** with these insights (Insights → New):

1. **Feature adoption (Trends, bar).** Series: `devotion_opened`, `journal_entry_created`, `scripture_topic_viewed`, `prayer_session_completed`, `prayer_import_saved`. Counted by **unique users**, last 30 days. This is your "what to build more" chart — the tallest bars are what people value, the empty ones are what to promote or cut.
2. **Activation funnel (Funnel).** Steps: `user_signed_up` → `prayer_added` → (`devotion_opened` OR `prayer_import_saved`). Shows where new users stall.
3. **Paywall → purchase (Funnel).** Steps: `paywall_shown` → `prayer_import_saved` (or a future `purchase_completed`). Breakdown by `context` to see which prompt converts.
4. **Retention (Retention).** Returning to do `prayer_added` weekly. Your core habit metric.
5. **Where users are (Trends, map or table).** Any event, broken down by `$geoip_country_name` / `$geoip_city`.
6. **Session length (Trends).** Average of session duration, last 30 days (fills in after the next build).
7. **Push reach (Trends, pie).** Unique users broken down by person property `push_enabled`.

### Useful cohorts (People → Cohorts → New)
- **Power users:** performed `prayer_added` ≥ 5 times in 30 days.
- **Premium, not using premium:** `is_premium = true` AND has NOT done `devotion_opened` in 30 days. These are your churn risks — good targets for a "you're missing this" push.
- **AI users:** performed `prayer_import_saved` at least once.
- **Notifications off:** person property `push_enabled = false` — a segment you literally cannot reach by push.

---

## A note on the current numbers

As of this writing, across ~9 members: prayers are being added, but devotions, journaling, Scripture, and the timer have near-zero use. Before investing in building those features deeper, the data suggests the bigger lever is **discovery** — most members haven't found the premium features at all. Watch the activation funnel and the "premium, not using premium" cohort first.
