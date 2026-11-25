# ZAWN product ideas (micro-SaaS)

## P1. EU compliance helper for Etsy/Amazon sellers (Awais, 26 Nov 2026)
Problem: non-EU marketplace sellers must handle GPSR (manufacturer + EU responsible person on listings, since 13 Dec 2024), PPWR packaging EPR + an authorised representative per EU country they ship to (since 12 Aug 2026), and the harmonised legal guarantee notice (since 27 Sep 2026). Current offers are mostly companies selling the responsible-person address.
Product: connect the shop, scan every listing, flag what EU info is missing per listing, bulk-fill from saved templates, track which rules apply to which product types and countries, reminders when rules change. $9-19/month; referral fees from responsible-person / EPR services (Etsy partners Cert-Rep and International Associates; check their affiliate programmes).
Funnel already live: free "EU rules checker for Etsy sellers" on https://purlandpaperco.com/eu-rules-checker-etsy-sellers (Seller tools section). Add an email waitlist there before building.
Risks to check BEFORE building:
- Etsy Open API v3: can a third-party app read and write the GPSR / economic operator fields? Etsy now lets sellers apply the responsible person shop-wide, which removes part of the bulk-fill pain. If the API can't write the fields, the product becomes a checker + guided fixer (still useful, lower price).
- Competition exists (e.g. euverify.com SaaS, Craftybase guides, compliance service providers). Our edge: Etsy-native, cheap, covers GPSR + PPWR + guarantee notice together, and per-country EPR tracking.
- Not legal advice: product must say so and link to official sources.
Next steps: (1) confirm Etsy API scope for these fields; (2) waitlist on the free checker; (3) 20 seller interviews via Etsy forums/Reddit (Awais posts himself); (4) build MVP only if 50+ waitlist sign-ups.
