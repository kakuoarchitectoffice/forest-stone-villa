import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/videoScrub.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
});
const { smoothVideoTime, videoTimeForProgress, SEEK_EPSILON } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);

test('forward and backward seeks approach their target without overshoot', () => {
  for (const [start, target] of [[0, 40], [40, 0]]) {
    let time = start;
    for (let i = 0; i < 90; i++) {
      const next = smoothVideoTime(time, target, 1000 / 60);
      assert.ok(Math.abs(target - next) <= Math.abs(target - time));
      assert.ok(next >= Math.min(start, target) && next <= Math.max(start, target));
      time = next;
    }
    assert.equal(time, target);
  }
});

test('a sudden touch jump is eased and direction can reverse immediately', () => {
  const first = smoothVideoTime(0, 10, 1000 / 60);
  assert.ok(first > 0 && first < 2);
  assert.ok(smoothVideoTime(first, 0, 1000 / 60) < first);
});

test('60 Hz and 120 Hz converge at the same rate', () => {
  const run = (hz) => {
    let time = 0;
    for (let i = 0; i < hz / 2; i++) time = smoothVideoTime(time, 10, 1000 / hz);
    return time;
  };
  assert.ok(Math.abs(run(60) - run(120)) < 0.000001);
});

test('large resume delays do not cause an immediate jump', () => {
  assert.equal(smoothVideoTime(0, 10, 5000), smoothVideoTime(0, 10, 64));
});

test('tiny moves finish exactly and resetting to zero stays at zero', () => {
  assert.equal(smoothVideoTime(0, SEEK_EPSILON / 2, 16), SEEK_EPSILON / 2);
  assert.equal(smoothVideoTime(0, 0, 16), 0);
});

test('progress is bounded and the last seek remains on a valid video frame', () => {
  assert.equal(videoTimeForProgress(46, -1), 0);
  assert.equal(videoTimeForProgress(46, 0), 0);
  assert.equal(videoTimeForProgress(46, 0.5), 23);
  assert.equal(videoTimeForProgress(46, 1), 46 - 1 / 30);
  assert.equal(videoTimeForProgress(46, 2), 46 - 1 / 30);
});
