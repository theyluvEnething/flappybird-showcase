"use strict";

// Change these values during the live demo, then reload the page.
function getGameSettings() {
  return {
    forwardSpeed: 120, // How fast the pipes move left, in pixels per second.
    flapSpeed: 300,    // The bird's upward speed after a flap.
    gravity: 900,      // Downward acceleration, in pixels per second squared.
    pipeGap: 108,      // Space between the upper and lower pipes.
    pipeSpacing: 180,  // Horizontal distance between pairs of pipes.
    width: 288,
    height: 512,
    groundHeight: 112,
    birdX: 68,
    birdStartY: 200,
    birdRadius: 10,
    pipeWidth: 52
  };
}

function createGame(config = getGameSettings(), random = Math.random, best = 0) {
  const positive = ["forwardSpeed", "flapSpeed", "gravity", "pipeSpacing", "width", "height", "groundHeight", "birdRadius", "pipeWidth"];
  if (positive.some(key => !Number.isFinite(config[key]) || config[key] <= 0)) {
    throw new RangeError("Game dimensions and speeds must be positive numbers.");
  }
  const floor = config.height - config.groundHeight;
  if (!Number.isFinite(config.pipeGap) || config.pipeGap < config.birdRadius * 2 + 12 || config.pipeGap > floor - 96) {
    throw new RangeError("The pipe gap must fit between the sky and the ground.");
  }
  if (!Number.isFinite(config.birdStartY) || config.birdStartY < config.birdRadius || config.birdStartY > floor - config.birdRadius ||
      !Number.isFinite(config.birdX) || config.birdX < config.birdRadius || config.birdX > config.width - config.birdRadius ||
      config.pipeSpacing <= config.pipeWidth + config.birdRadius * 2) {
    throw new RangeError("The bird and pipe spacing must fit the play area.");
  }
  best = Number.isSafeInteger(best) && best >= 0 ? best : 0;
  return {
    config: { ...config }, random, phase: "ready", score: 0, best,
    previousBest: best, bird: { y: config.birdStartY, velocity: 0 },
    pipes: [], groundOffset: 0, time: 0, overTime: 0, fallTime: 0
  };
}

function addPipe(game, x) {
  const c = game.config;
  const edge = 48 + c.pipeGap / 2;
  const centerY = edge + game.random() * (c.height - c.groundHeight - edge * 2);
  game.pipes.push({ x, centerY, counted: false });
}

function flapGame(game) {
  if (game.phase === "ready") {
    game.phase = "playing";
    addPipe(game, game.config.width + 60);
  }
  if (game.phase !== "playing") return false;
  game.bird.velocity = -game.config.flapSpeed;
  return true;
}

function circleTouchesRectangle(x, y, radius, left, top, width, height) {
  const nearX = Math.max(left, Math.min(x, left + width));
  const nearY = Math.max(top, Math.min(y, top + height));
  return (x - nearX) ** 2 + (y - nearY) ** 2 <= radius ** 2;
}

function stepGame(game, delta) {
  if (!Number.isFinite(delta) || delta <= 0 || game.phase === "ready" || game.phase === "paused") return;
  const dt = Math.min(delta, 0.05);
  const c = game.config;
  const floor = c.height - c.groundHeight;
  game.time += dt;
  if (game.phase === "over") { game.overTime += dt; return; }

  game.bird.velocity += c.gravity * dt;
  game.bird.y += game.bird.velocity * dt;
  if (game.bird.y < c.birdRadius) {
    game.bird.y = c.birdRadius;
    game.bird.velocity = 0;
  }
  if (game.phase === "falling") game.fallTime += dt;
  if (game.bird.y + c.birdRadius >= floor) {
    game.bird.y = floor - c.birdRadius;
    game.bird.velocity = 0;
    game.phase = "over";
    game.best = Math.max(game.best, game.score);
    return;
  }
  if (game.phase !== "playing") return;

  game.groundOffset = (game.groundOffset + c.forwardSpeed * dt) % 24;
  if (!game.pipes.length) addPipe(game, c.width + 60);
  for (const pipe of game.pipes) {
    pipe.x -= c.forwardSpeed * dt;
    const gapTop = pipe.centerY - c.pipeGap / 2;
    const gapBottom = pipe.centerY + c.pipeGap / 2;
    const hit = circleTouchesRectangle(c.birdX, game.bird.y, c.birdRadius, pipe.x, 0, c.pipeWidth, gapTop) ||
      circleTouchesRectangle(c.birdX, game.bird.y, c.birdRadius, pipe.x, gapBottom, c.pipeWidth, floor - gapBottom);
    if (hit) {
      game.phase = "falling";
      game.fallTime = 0;
      game.best = Math.max(game.best, game.score);
      return;
    }
    if (!pipe.counted && pipe.x + c.pipeWidth < c.birdX) {
      pipe.counted = true;
      game.score += 1;
      game.best = Math.max(game.best, game.score);
    }
  }
  game.pipes = game.pipes.filter(pipe => pipe.x + c.pipeWidth > -4);
  if (!game.pipes.length) addPipe(game, c.width + 60);
  while (game.pipes.at(-1).x < c.width + c.pipeSpacing) {
    addPipe(game, game.pipes.at(-1).x + c.pipeSpacing);
  }
}

function resetGame(game) {
  Object.assign(game, createGame(game.config, game.random, game.best));
}

function togglePause(game) {
  if (game.phase === "playing") game.phase = "paused";
  else if (game.phase === "paused") game.phase = "playing";
}

if (typeof module !== "undefined") module.exports = {
  getGameSettings, createGame, flapGame, stepGame, resetGame, togglePause
};

if (typeof document !== "undefined") {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#71c5cf";
  ctx.fillRect(0, 0, 288, 512);
  ctx.fillStyle = "#ded895";
  ctx.fillRect(0, 400, 288, 112);
  ctx.fillStyle = "#fff8d8";
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.fillText("FLAPPY BIRD", 144, 176);
  document.querySelector("#version").textContent = "v" + document.querySelector('meta[name="application-version"]').content;
}
