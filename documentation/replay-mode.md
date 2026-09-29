# Replay Mode

A replay window plays one recorded round back. It has no session, no wallet and
no balance: the round is fetched once, shown to the player, and played from its
own book. `/wallet/play` is never called, so the same URL always produces the
same playback.

## The URL

```
https://<game-host>/?replay=true
  &rgs_url=<rgs-host>
  &game=<game-id>
  &version=<math-version>
  &mode=<bet-mode-key>
  &event=<round-id>
  &lang=en
  &currency=USD
  &amount=1000000
  &social=true
```

| parameter  | required | meaning                                                              |
| ---------- | -------- | -------------------------------------------------------------------- |
| `replay`   | yes      | `true` puts the app in replay mode (`stateUi.config.mode = 'replay'`) |
| `rgs_url`  | yes      | host the round is fetched from                                        |
| `game`     | yes      | game id the round belongs to                                          |
| `version`  | yes      | math version the round was recorded against                           |
| `mode`     | yes      | bet mode key of the round — `BASE`, `feature_contract`, `feature_blades`      |
| `event`    | yes      | the recorded round (book) to load                                     |
| `lang`     | no       | locale for the round request **and** the UI; defaults to `en`         |
| `currency` | no       | currency every amount is printed in                                   |
| `amount`   | no       | base wager in API units, used when the round record omits `amount`    |
| `social`   | no       | `true` switches the window to social (sweepstakes) wording            |

`game`, `version`, `mode` and `event` address the round; everything else is
presentation.

`lang` reaches two places: `requestReplay()` sends it to the RGS as `?lang=`, and
`<LoadI18n>` activates it for the UI. A social replay is English only —
`stateUrlDerived.lang()` collapses to `en` and `lang` is ignored, exactly as in a
play session.

`currency` and `amount` are applied in the game, not forwarded to the RGS: the
replay endpoint addresses a recorded book, which neither of them changes.
`language` is the one that is forwarded, because the RGS resolves text with it.

`currency` matters because a replay never calls `authenticate()`, so there is no
`balance.currency` to read. Without it a social replay would print `$`; see
[social-mode-wording.md](./social-mode-wording.md#currency).

## The flow

| step | what happens                                                                             | code                                                                  |
| ---- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1    | `replay=true` is detected and the UI drops every control that would place a bet           | `Authenticate.svelte`, `UI.svelte`                                     |
| 2    | the URL is read, the round is fetched, and the round's own numbers go into `stateReplay`  | `packages/components-shared/src/replay.ts` — `loadReplayRound()`       |
| 3    | the loading screen runs as usual, then the start panel shows the round's cost and win      | `ReplayPanel.svelte`                                                   |
| 4    | **Start Replay** resets the scene and plays the book from its first event                 | `ResumeBet.svelte` — `playReplay()`                                    |
| 5    | the round's `finalWin` book event marks the replay finished                               | `bookEventHandlerMap.ts`                                               |
| 6    | a **Replay Again** button appears; pressing it repeats step 4                             | `ReplayPanel.svelte`, `ResumeBet.svelte`                               |

Playback is deterministic but not unattended: a max-win screen and the bonus
intro popup both wait for a press, exactly as they do in a normal round.

The round is played through the resume-bet path (`event: '0'`, `active: true`),
which is the one path that plays a book the game already holds. `resumeGame`
consumes `stateBet.lastBet` and clears it, so the bet is rebuilt from the
pristine round in `stateReplay.round` on every playback — that is what makes the
second and third runs identical to the first.

`resetSceneToRoundStart()` in `ResumeBet.svelte` is the scene reset: it stops the
looping win animation, broadcasts `replayReset`, settles the board back to a
**clone** of `INITIAL_BOARD` and clears the round's `stateGame`, `stateBet` and
`stateUi` fields. Two things there are easy to get wrong:

- `INITIAL_BOARD` must be cloned. The reels hold their raw symbols by reference
  inside `$state`, so a played round writes its multipliers and collected flags
  straight back into the module-level constant.
- Overlays reset on `replayReset`, not on their own hide events. `freeSpinOutroHide`
  is a step in the round rather than a reset — it plays the total-win sting and
  makes the stones run their free-to-base transition.

`replayReset` also clears the latches no hide event touches, such as
`StoneFXOverlay`'s set of transitions already played. Anything a future book
event adds to `stateGame`, or any new component latch, has to be cleared there
too, or the second playback starts with the first one's leftovers.

The button is honoured, not dropped, if it is pressed before the finished round's
machine settles: the game actor only accepts `RESUME_BET` while idle, so the
press is remembered and spent on the next idle tick.

## The start panel

| row                                | value                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------- |
| Mode                               | `round.mode`, printed through the bet-mode dictionary                        |
| Base Bet / *Base Play*             | `round.amount` (falls back to the `amount` URL parameter)                    |
| Cost Multiplier / *Feature Multiplier* | the mode's `costMultiplier`                                              |
| Total Bet Cost                     | base wager × cost multiplier                                                 |
| Payout Multiplier / *Final Multiplier* | `round.payoutMultiplier`                                                 |
| Total Win                          | `round.payout` (falls back to base wager × payout multiplier)                |

Every number is the round as the RGS recorded it, not something re-derived from
what the animation happens to show. Where a field is missing the fallback is
still the book's own: the payout multiplier falls back to the last `finalWin`
book event's amount in book units, and the total win to base wager × payout
multiplier. The one value the book cannot carry is the mode's cost multiplier —
a replay has no `authenticate()` response to read it from, so it comes from the
game's bet-mode dictionary, which mirrors the same math config the RGS charges
from.

> **Assumption to confirm against a live RGS:** `round.amount` is read as the
> base wager, which is what the schema implies (`PayoutMultiplier = Payout /
> Amount`). If the replay endpoint returns the total a feature buy was *charged*
> instead, a `feature_contract` round would print a 100x-too-large base wager and
> total cost, and every book-unit amount in the playback would be scaled with it.
> `/bet/replay/...` is not in `packages/rgs-fetcher/src/schema.ts`, so this has
> not been verified against a recorded buy-bonus round.

The italic labels are the social (sweepstakes) wording; see
[social-mode-wording.md](./social-mode-wording.md).

### Sizing

A replay window is a popout and can be genuinely small — 400x225 and 320x568 are
both in scope, and the panel may neither clip nor scroll at either. Every length
in `ReplayPanel.svelte` is an `em`, and the root font size is

```scss
font-size: clamp(7px, min(2.7vh, 3.4vw), 16px);
```

so the whole panel scales with whichever side of the viewport runs out first
instead of overflowing it. Below 260px of height the badge and the footnote are
dropped and the spacing tightens, which is what buys the room at 400x225. New
rows must follow the same rule: no `px`, no fixed heights, nothing that can only
fit on a desktop.

## Bet-mode names

`apps/monster-curse/src/game/betModes.ts` is the single dictionary of bet modes.
It carries, per mode, the protocol key, the name, the social name and the cost
multiplier, and it is the only place any of them is written down:

| consumer                | reads it through                                            |
| ----------------------- | ------------------------------------------------------------ |
| bet-mode metadata       | `betModeMeta.ts` builds every entry from it                  |
| the replay panel        | `stateMeta.betModeNameMap` → `stateMetaDerived.betModeName()` |
| the game rules modal    | `stateMetaDerived.betModeName()`                             |
| the platform manifest   | `toIndexJsonBetModes()`                                      |

`index.json` is uploaded with the build rather than checked in, and its shape is enforced by
Stake Engine: `name` there **is the mode key** (`base`, `feature_contract`, `feature_blades`) —
the Studio's game-mode picker lists it and the RGS receives it as `mode`. It has no display-name
field, so the keys themselves must not contain restricted wording (`buy` became `feature`), and
the math config, the books and `config.betModes` must all use the same keys. The player-facing
names live only in `betModes.ts` and are used by the game UI. `toIndexJsonBetModes()` yields the
`name` / `cost` pairs. `stateMetaDerived.betModeName()` matches mode keys case-insensitively,
because the RGS, the math config and the game have each settled on their own
casing (`BASE` vs `base`).
