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

if (typeof module !== "undefined") module.exports = { getGameSettings };

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
