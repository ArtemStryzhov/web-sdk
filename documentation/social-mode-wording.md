# Social Mode (sweepstakes) wording

Applies when `social=true` is present in the game URL (`stateUrlDerived.social()`).
Everything below is **social-only** — the real-money build keeps its original wording.

## Substitution table

| Restricted term                                        | Social replacement                     | Where it is applied                                                                     |
| ------------------------------------------------------ | -------------------------------------- | --------------------------------------------------------------------------------------- |
| bet _(noun / wager)_                                   | play                                   | `BET` → `PLAY`, `BET MENU` → `PLAY MENU`, `SELECT YOUR BET` → `SELECT YOUR PLAY`        |
| the underlying bet                                     | the underlying play amount             | About the Game, bonus-unlock descriptions                                               |
| betting modes                                          | play modes                             | About the Game                                                                          |
| place your bet                                         | place your play                        | bet-mode ticker (`tickerIdle`)                                                          |
| buy                                                    | play                                   | `FEATURE BUY` → `FEATURE PLAY`, bonus button `BUY` → `PLAY`                             |
| BUY BONUS _(the control itself)_                       | FEATURE PLAY                           | bonus-buy button in the UI, User Interaction Guide, Feature Play rules section          |
| funds                                                  | coins                                  | User Interaction Guide — BALANCE                                                        |
| the feature purchase menu / purchased directly         | the feature play menu / played directly | User Interaction Guide — FEATURE PLAY                                                   |
| purchase _(verb)_                                      | play                                   | "purchase game features" → "play game features"                                         |
| costs _N_ times                                        | can be played for _N_ times            | Monster Contract / Blades of Fate descriptions                                          |
| paytable                                               | win table                              | `PAYTABLE` → `WIN TABLE`                                                                |
| paying symbols                                         | winning symbols                        | Special Symbols                                                                         |
| payline(s) _(counted)_                                 | line(s)                                | Ways to Win ("15 fixed lines", "highest win per line"), paylines image alt text         |
| payline _(as a slot descriptor)_                       | _dropped entirely_                     | About the Game — "5-reel, 5-row slot", not "5-row line slot"                            |
| payout                                                 | prize                                  | "Maximum payout" → "Maximum prize"                                                      |
| insufficient funds / add funds                         | insufficient coins / add coins         | autoplay + bet-menu error                                                               |
| lower the bet level                                    | lower the play level                   | autoplay + bet-menu error                                                               |
| Base Bet                                               | Base Play                              | platform round-details panel, replay start panel                                        |
| Cost Multiplier                                        | Feature Multiplier                     | platform round-details panel, replay start panel                                        |
| Payout Multiplier                                      | Final Multiplier                       | platform round-details panel, replay start panel                                        |
| Bet Replay                                             | Play Replay                            | replay start panel title                                                                |
| Total Bet Cost                                         | Total Play Cost                        | replay start panel                                                                      |
| a previous bet round / no bets will be placed          | a previous play round / no plays…      | replay start panel footnote                                                             |
| `© 2026 Stake Engine` / `TM and © 2026 Stake Engine` | `TM and © 2026. All rights reserved.` | General Game Disclaimer _(both builds)_                                                 |

`TM and © 2026. All rights reserved.` always sits on its own line — it is a separate `<p>`
at the end of the General Game Disclaimer, never appended to the malfunction paragraph.

### Deliberately **not** replaced

`win` / `winning` / `WIN` / `WAYS TO WIN`, `balance`, `free spins`, `bonus`, `loss limit`,
`single win limit`, `multiplier`, `round`, `spin`.

`win` is kept because the platform-approved social labels already in the code depend on it —
`PAYTABLE` → **WIN** TABLE and "paying symbols" → "**winning** symbols". The reviewer's own
violation table confirms this: it asks for "the single highest **win** per line", keeping
`win` while replacing `payline`.

## Where the rules live

| Surface                                                            | File                                                                                          |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Button / label strings routed through lingui                       | `src/i18n/messagesMap/sweeps_en.ts` (per package + per game, merged by `mergeMessagesMaps`)   |
| About the Game, Win Table, Ways to Win, Bonus Features, User Interaction Guide, disclaimer | `packages/components-ui-html/src/components/ModalGameRules.svelte` — the `txt` map at the top |
| Bet-mode names (game, rules, replay, index.json)                    | `apps/monster-curse/src/game/betModes.ts` — `name` / `socialName` per mode                    |
| Bet-mode dialogs, tickers, bonus buttons                            | `apps/monster-curse/src/game/betModeMeta.ts` — `getBetModeMeta(social)`                       |
| "Maximum prize" info panel                                         | `apps/monster-curse/src/components/PressToContinue.svelte`                                    |
| Currency ticker shown next to every amount                          | `packages/utils-shared/amount.ts` — `NO_LOCALISATION_CURRENCY_MAP`                            |

New user-facing copy goes through one of these, never inline in a template.

## Language: English only

Social Mode is English-only — no other locale is selectable, and the `lang` URL
parameter is ignored.

There is **no in-game language switcher**: the settings modal only carries the three
sound sliders, and nothing in `apps/` or `packages/` renders a locale picker. The
language is chosen entirely by the platform wrapper through the `lang` URL parameter,
so the enforcement point is `stateUrlDerived.lang()` rather than a UI control.

`stateUrlDerived.languageLocked()` is the single source of truth. It is true when
**either** social signal is present:

| Signal                                     | Source                                |
| ------------------------------------------ | ------------------------------------- |
| `social=true`                              | game URL (also the only replay signal) |
| `config.jurisdiction.socialCasino === true` | `authenticate()` response             |

When it is true, `stateUrlDerived.lang()` returns `SOCIAL_LANGUAGE` (`'en'`) and the
`lang` parameter is discarded — including `lang=br`, which otherwise maps to `pt`.
Because every language consumer goes through `lang()`, this covers all of them at once:

- lingui messages in `LoadI18n` (resolves to `sweeps_en`, or `en` if a game ships no
  sweeps map)
- the `language` field sent to the RGS in `authenticate()`, and the `lang` query the
  replay request carries instead (`requestReplay`)
- the per-locale image keys — `freespins_{lang}.png`, `winsmall_{lang}.png`,
  `pressToContinueText_{lang}.png`

**If a language switcher is ever added, it must hide itself when
`stateUrlDerived.languageLocked()` is true.** Do not re-derive the rule from
`social()`, which is the URL parameter alone.

> One ordering caveat: `authenticate()` sends `language: stateUrlDerived.lang()` before
> its own response has populated `stateConfig.jurisdiction`. A session whose only social
> signal is `socialCasino` therefore sends the URL language on that one request; every
> surface the player sees is still English, because `<LoadI18n>` mounts only after
> `<Authenticate>` resolves. Keeping `social=true` on social URLs avoids this entirely.

## Currency

Social balances are sweeps coins, never real money, so **no amount may ever carry a `$`
prefix in a social session** — not the balance, the win field, the bet/play label, the
buy-bonus card prices, or the replay window.

The ticker is mapped at the formatter, not at the call sites:

| Currency from the platform | Displayed as |
| -------------------------- | ------------ |
| `XEC`                      | `SC`         |
| `XSC`                      | `SC`         |
| `XGC`                      | `GC`         |
| `SC` / `GC` _(bare)_       | unchanged    |

`NO_LOCALISATION_CURRENCY_MAP` in `packages/utils-shared/amount.ts` is the single source
of truth. Everything the player sees goes through one of the two helpers beside it:

| Helper                                       | Use                                                        |
| -------------------------------------------- | ---------------------------------------------------------- |
| `numberToCurrencyString` (and `bookEventAmountToCurrencyString`) | a whole formatted amount — `SC 1.00` |
| `currencyPrefix()`                           | the currency part alone, when the digits are styled separately |

Mapped tickers render verbatim (`SC 1.00`); everything else still goes through Intl, so
the real-money build keeps its own localised symbols (`$1.00`, `R$1,00`). Intl throws on a
malformed currency code, so both helpers fall back to printing the code rather than taking
the UI down with them.

**Never write a currency symbol into a template.** The buy-bonus cards
(`packages/components-ui-html/src/components/BonusCards.svelte`) render the price piecewise
and previously hardcoded `stateBet.currency === 'USD' ? '$' : …`; they now call
`currencyPrefix()`. Any new piecewise amount must do the same.

### Where the currency comes from

| Session | Source                                                                  |
| ------- | ----------------------------------------------------------------------- |
| play    | `authenticate()` → `balance.currency`                                    |
| replay  | the `currency` URL parameter                                             |

A replay never calls `authenticate()`, so a replay URL **should carry `currency`**. When it
does not and `social=true` is present, the currency falls back to `SOCIAL_CURRENCY`
(`'XEC'`, i.e. `SC`) instead of the `USD` default — otherwise a social replay would print
`$`. A social replay that is actually a `GC` round therefore needs the parameter to show
the right ticker.

## Replay window

A replay (`replay=true`) never calls `authenticate()`, so `stateConfig.jurisdiction.socialCasino`
is always `false` there — the **only** social signal a replay window has is the `social=true`
URL parameter.

The replay window renders: the replay start panel, game name, logo, `WIN` label, `PLAY`
label, turbo, menu, close, game info, settings, sound. All of these resolve to compliant
wording when `social=true`; the game-info modal opened from a replay uses the same `txt`
map as normal play.

The start panel's labels go through lingui like every other button string —
`packages/components-ui-html/src/i18n/i18nDerived.ts` for the ids and
`packages/components-ui-html/src/i18n/messagesMap/sweeps_en.ts` for the social wording.
Its mode name comes from the game's bet-mode dictionary
(`apps/monster-curse/src/game/betModes.ts`), which carries a `socialName` per mode; the
Monster Curse feature names are not restricted terms, so the two are the same today. See
[replay-mode.md](./replay-mode.md).

> **The platform must include `social=true` on replay URLs.** Without it the replay window
> falls back to real-money wording (`BET`, `PAYTABLE`, `paylines`).

## Open items for the reviewer

1. **`win` → `prize`** — not applied; the reviewer's violation table keeps `win`
   ("the single highest win per line"), which settles it.
2. **Baked-in image text** — checked: `assets/sprites/paylines/paylines.png` and
   `paylines_mob.png` contain only grid diagrams, no lettering, so no new artwork is
   needed. Their `alt` text is social-aware.
3. No `jurisdiction-requirements` document is checked into this repo. The table above was
   derived from the sweepstakes overrides already committed in `sweeps_en.ts` and
   `ModalGameRules.svelte`, plus the terms named in the review. Worth diffing against the
   authoritative Stake document before sign-off.
