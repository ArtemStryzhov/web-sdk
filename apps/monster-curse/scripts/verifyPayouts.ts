/**
 * Checks the amount the game ends a round on against the amount the math says
 * that round pays, for a sample of rounds drawn the way the RGS draws them.
 *
 *   node --experimental-strip-types scripts/verifyPayouts.ts \
 *     --publish-dir ~/Downloads/publish_files [--n 500] [--seed 1] [--bet 1]
 *     [--mode base] [--ids 732,410]
 *
 * For every drawn round it folds the book through `roundWinBookEventAmount` —
 * the same rule `bookEventHandlerMap` applies event by event while the round
 * plays — and compares the result with `payoutMultiplier` from that mode's
 * lookup table. A round only passes when the WIN field lands on exactly what the
 * RGS settles, so a client that re-derives a win, drops a book event or stops at
 * the pre-cap running total fails here instead of in front of a player.
 *
 * This is the automated form of the "check wins against the Game Rules" pass:
 * the rules pay `payoutMultiplier x bet`, and that is what the last column
 * compares.
 */

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { BOOK_AMOUNT_MULTIPLIER } from '../../../packages/constants-shared/bet.ts';
import { roundWinBookEventAmount } from '../src/game/winAccounting.ts';

type ModeManifest = { name: string; cost: number; events: string; weights: string };
type Book = {
	id: number;
	payoutMultiplier: number;
	events: { type: string; amount?: number }[];
};
type LookUpRow = { simulation: number; weight: bigint; payoutMultiplier: number };

// ── arguments ──────────────────────────────────────────────────────────────

const parseArgs = (argv: string[]) => {
	const args = new Map<string, string>();
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		if (!token.startsWith('--')) continue;
		const [flag, inlineValue] = token.slice(2).split('=');
		args.set(flag, inlineValue ?? (argv[i + 1]?.startsWith('--') ? 'true' : (argv[++i] ?? 'true')));
	}
	return args;
};

const args = parseArgs(process.argv.slice(2));
const publishDir = path.resolve(
	String(args.get('publish-dir') ?? process.env.PUBLISH_DIR ?? './publish_files').replace(
		/^~/,
		process.env.HOME ?? '~',
	),
);
const roundsPerMode = Number(args.get('n') ?? 500);
const seed = Number(args.get('seed') ?? 1);
const betAmount = Number(args.get('bet') ?? 1);
const onlyMode = args.get('mode');
const explicitIds = args.get('ids')?.split(',').map(Number).filter(Number.isFinite);
// A weighted draw almost never lands on a win-capped round, so `--payout` takes
// every round of one payout instead — `--payout 2000000` is "all max wins".
const explicitPayout = args.has('payout') ? Number(args.get('payout')) : undefined;

if (!existsSync(path.join(publishDir, 'index.json'))) {
	console.error(`No index.json in ${publishDir} — pass --publish-dir <path to the published math>`);
	process.exit(2);
}

// ── the math files ─────────────────────────────────────────────────────────

const readLookUpTable = (file: string): LookUpRow[] =>
	readFileSync(file, 'utf8')
		.split('\n')
		.filter((line) => line.length > 0)
		.map((line) => {
			const [simulation, weight, payoutMultiplier] = line.split(',');
			return {
				simulation: Number(simulation),
				weight: BigInt(weight),
				payoutMultiplier: Number(payoutMultiplier),
			};
		});

/** Streams the books file and keeps only the rounds that were drawn. */
const readBooks = async (file: string, wantedIds: Set<number>): Promise<Map<number, Book>> => {
	const books = new Map<number, Book>();
	const zstd = file.endsWith('.zst') ? spawn('zstd', ['-dcq', file]) : null;
	const input = zstd ? zstd.stdout : createReadStream(file);
	const lines = createInterface({ input, crlfDelay: Infinity });

	for await (const line of lines) {
		if (line.length === 0) continue;
		// Cheap pre-filter: parsing every book of a 200 MB file is the slow part.
		const id = Number(line.slice(7, line.indexOf(',')));
		if (!wantedIds.has(id)) continue;
		const book = JSON.parse(line) as Book;
		books.set(book.id, book);
		if (books.size === wantedIds.size) break;
	}

	lines.close();
	zstd?.kill();
	return books;
};

// ── drawing rounds the way the RGS does ────────────────────────────────────

/** Seeded PRNG, so a failing run can be replayed with the same `--seed`. */
const createRandom = (initialSeed: number) => {
	let state = initialSeed >>> 0 || 1;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

const createWeightedDraw = (rows: LookUpRow[], random: () => number) => {
	const cumulative: bigint[] = new Array(rows.length);
	let total = 0n;
	rows.forEach((row, index) => {
		total += row.weight;
		cumulative[index] = total;
	});

	return () => {
		// 64 random bits folded into the weight range; the modulo bias over a
		// total of ~1e18 is far below anything this check can observe.
		const bits =
			(BigInt(Math.floor(random() * 0x100000000)) << 32n) |
			BigInt(Math.floor(random() * 0x100000000));
		const target = bits % total;

		let low = 0;
		let high = rows.length - 1;
		while (low < high) {
			const mid = (low + high) >> 1;
			if (cumulative[mid] <= target) low = mid + 1;
			else high = mid;
		}
		return rows[low];
	};
};

// ── the check ──────────────────────────────────────────────────────────────

const bookAmountToMultiplier = (bookAmount: number) => bookAmount / BOOK_AMOUNT_MULTIPLIER;
const money = (value: number) => value.toFixed(Math.abs(value) < 0.01 && value !== 0 ? 4 : 2);

type Failure = {
	simulation: number;
	reason: string;
	expected: number;
	onScreen: number;
};

const verifyMode = async (mode: ModeManifest) => {
	const rows = readLookUpTable(path.join(publishDir, mode.weights));
	const rowBySimulation = new Map(rows.map((row) => [row.simulation, row]));
	const random = createRandom(seed + mode.name.length);
	const draw = createWeightedDraw(rows, random);

	const drawn = explicitIds
		? explicitIds.map((id) => rowBySimulation.get(id)).filter((row): row is LookUpRow => !!row)
		: explicitPayout !== undefined
			? rows.filter((row) => row.payoutMultiplier === explicitPayout)
			: Array.from({ length: roundsPerMode }, draw);

	const books = await readBooks(
		path.join(publishDir, mode.events),
		new Set(drawn.map((row) => row.simulation)),
	);

	const failures: Failure[] = [];
	let cappedRounds = 0;

	for (const row of drawn) {
		const book = books.get(row.simulation);
		if (!book) {
			failures.push({
				simulation: row.simulation,
				reason: 'no book for this lookup-table row',
				expected: bookAmountToMultiplier(row.payoutMultiplier),
				onScreen: NaN,
			});
			continue;
		}

		// What the WIN field holds once the round has finished playing.
		const onScreenBookAmount = roundWinBookEventAmount(book.events);
		// What the round is actually settled at.
		const expectedBookAmount = row.payoutMultiplier;

		// A round whose running total never reaches its payout is win-capped; the
		// regression this check guards is the client stopping at that total.
		const runningTotal = book.events.reduce(
			(amount, bookEvent) =>
				bookEvent.type === 'setTotalWin' ? (bookEvent.amount ?? amount) : amount,
			0,
		);
		if (runningTotal !== expectedBookAmount) cappedRounds += 1;

		if (book.payoutMultiplier !== expectedBookAmount) {
			failures.push({
				simulation: row.simulation,
				reason: "book's own payoutMultiplier disagrees with the lookup table",
				expected: bookAmountToMultiplier(expectedBookAmount),
				onScreen: bookAmountToMultiplier(book.payoutMultiplier),
			});
			continue;
		}

		if (onScreenBookAmount !== expectedBookAmount) {
			failures.push({
				simulation: row.simulation,
				reason: 'WIN field does not land on payoutMultiplier',
				expected: bookAmountToMultiplier(expectedBookAmount),
				onScreen: bookAmountToMultiplier(onScreenBookAmount),
			});
		}
	}

	return { mode, drawn: drawn.length, cappedRounds, failures };
};

// ── run ────────────────────────────────────────────────────────────────────

const manifest = JSON.parse(readFileSync(path.join(publishDir, 'index.json'), 'utf8')) as {
	modes: ModeManifest[];
};
const modes = manifest.modes.filter((mode) => !onlyMode || mode.name === onlyMode);

console.log(
	`payout check — ${publishDir}\n` +
		(explicitIds
			? `rounds: ${explicitIds.join(', ')}\n`
			: explicitPayout !== undefined
				? `rounds: every round paying ${explicitPayout / BOOK_AMOUNT_MULTIPLIER}x\n`
				: `rounds: ${roundsPerMode} per mode, weighted draw, seed ${seed}\n`) +
		`bet: ${money(betAmount)}\n`,
);

let failed = 0;
for (const mode of modes) {
	const result = await verifyMode(mode);
	failed += result.failures.length;

	const status = result.failures.length === 0 ? 'PASS' : 'FAIL';
	console.log(
		`[${status}] ${mode.name.padEnd(13)} ${String(result.drawn).padStart(5)} rounds` +
			`  ${String(result.cappedRounds).padStart(4)} win-capped` +
			`  ${String(result.failures.length).padStart(4)} mismatched`,
	);

	for (const failure of result.failures.slice(0, 10)) {
		console.log(
			`         round ${failure.simulation}: ${failure.reason}\n` +
				`           pays     ${failure.expected}x  (${money(betAmount * failure.expected)})\n` +
				`           screen   ${failure.onScreen}x  (${money(betAmount * failure.onScreen)})`,
		);
	}
	if (result.failures.length > 10) {
		console.log(`         ... and ${result.failures.length - 10} more`);
	}
}

console.log(
	failed === 0 ? '\nevery drawn round pays what it shows.' : `\n${failed} mismatched rounds.`,
);
process.exit(failed === 0 ? 0 : 1);
