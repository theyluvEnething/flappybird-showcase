"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createGame, flapGame, stepGame, resetGame, togglePause } = require("../src/main.js");

// Fixed, hand-checked inputs keep the tests valid when the demo tuning changes.
const settings = {
  forwardSpeed: 120, flapSpeed: 300, gravity: 900, pipeGap: 110,
  pipeSpacing: 180, width: 288, height: 512, groundHeight: 112,
  birdX: 68, birdStartY: 200, birdRadius: 10, pipeWidth: 52
};
function playing() {
  const game = createGame(settings, () => 0.5);
  game.phase = "playing";
  return game;
}

test("a flap starts the run with an upward impulse", () => {
  const game = createGame(settings, () => 0.5);
  flapGame(game);
  assert.equal(game.phase, "playing");
  assert.equal(game.bird.velocity, -300);
});

test("gravity advances velocity and position in seconds", () => {
  const game = playing();
  stepGame(game, 0.02);
  assert.equal(game.bird.velocity, 18);
  assert.equal(game.bird.y, 200.36);
});

test("a new flap replaces downward velocity instead of accumulating impulses", () => {
  const game = playing();
  game.bird.velocity = 250;
  flapGame(game);
  assert.equal(game.bird.velocity, -300);
});

test("pipes move at the configured forward speed", () => {
  const game = playing();
  game.pipes = [{ x: 330, centerY: 200, counted: false }];
  stepGame(game, 0.05);
  assert.equal(game.pipes[0].x, 324);
});

test("passing a pipe awards one point only", () => {
  const game = playing();
  game.pipes = [{ x: 15, centerY: 200, counted: false }];
  stepGame(game, 0.01);
  assert.equal(game.score, 1);
  stepGame(game, 0.01);
  assert.equal(game.score, 1);
});

test("touching the upper pipe ends flight", () => {
  const game = playing();
  game.bird.y = 130;
  game.pipes = [{ x: 60, centerY: 200, counted: false }];
  stepGame(game, 0.01);
  assert.equal(game.phase, "falling");
});

test("touching the lower pipe ends flight", () => {
  const game = playing();
  game.bird.y = 270;
  game.pipes = [{ x: 60, centerY: 200, counted: false }];
  stepGame(game, 0.01);
  assert.equal(game.phase, "falling");
});

test("the ground stops the bird and finishes the run", () => {
  const game = playing();
  game.bird.y = 390;
  game.bird.velocity = 100;
  stepGame(game, 0.01);
  assert.equal(game.phase, "over");
  assert.equal(game.bird.y, 390);
});

test("restart resets the run while preserving the best score", () => {
  const game = createGame(settings, () => 0.5, 7);
  game.phase = "over";
  game.score = 3;
  game.bird.y = 390;
  game.pipes = [{ x: 60, centerY: 200, counted: true }];
  resetGame(game);
  assert.equal(game.phase, "ready");
  assert.equal(game.score, 0);
  assert.equal(game.best, 7);
  assert.equal(game.bird.y, 200);
  assert.equal(game.pipes.length, 0);
});

test("pause freezes the simulation and resume preserves the flight", () => {
  const game = playing();
  game.bird.velocity = -100;
  togglePause(game);
  assert.equal(game.phase, "paused");
  stepGame(game, 0.05);
  assert.equal(game.bird.y, 200);
  assert.equal(game.bird.velocity, -100);
  togglePause(game);
  assert.equal(game.phase, "playing");
});

test("the ceiling constrains the bird without ending the run", () => {
  const game = playing();
  game.bird.y = 5;
  game.bird.velocity = -300;
  stepGame(game, 0.01);
  assert.equal(game.bird.y, 10);
  assert.equal(game.bird.velocity, 0);
  assert.equal(game.phase, "playing");
});

test("an impossible pipe gap is rejected before play starts", () => {
  assert.throws(() => createGame({ ...settings, pipeGap: 500 }), RangeError);
});

test("random pipe gaps remain within the playable height", () => {
  for (const [random, expected] of [[0, 103], [1, 297]]) {
    const game = createGame(settings, () => random);
    flapGame(game);
    assert.ok(game.pipes.length > 0, "starting a run creates a pipe pair");
    assert.equal(game.pipes[0].centerY, expected);
  }
});

test("a large speed change keeps generating pipes instead of crashing", () => {
  const game = createGame({ ...settings, forwardSpeed: 10000 }, () => 0.5);
  flapGame(game);
  assert.doesNotThrow(() => stepGame(game, 0.05));
  assert.ok(game.pipes.length > 0);
});
