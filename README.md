# Flappy Bird Showcase

A small browser game for Philipp Gurndin's Git and GitHub demo in Tools in Data Science at the University of Vienna.

Download the ZIP from [Releases](https://github.com/theyluvEnething/flappybird-showcase/releases), unzip it, and open `index.html` in a browser. The game has no dependencies and works offline. The repository's `index.html` works the same way.

For a local web preview, with Node.js 22 or later:

```sh
npm start
```

Open the Local URL printed in the terminal. There is no installation step.

Space, Arrow Up, click or tap makes the bird flap. Use P or the pause button to pause. Tap or press Space after game over to return to Get Ready. Your best score stays in this browser when local storage is available.

## The classroom change

The editable settings are at the top of [`src/main.js`](src/main.js), inside `getGameSettings()`:

| Setting | Initial value | Example live change | Effect |
| --- | ---: | ---: | --- |
| `flapSpeed` | 300 | 360 | A stronger upward flap |
| `pipeGap` | 108 | 126 | More space between the pipes |
| `forwardSpeed` | 120 | leave unchanged | How quickly the pipes approach |

Edit the first two values, save the file, and reload the browser. The example change is deliberately left for you to make during the demo.

Show what changed before saving a commit:

```sh
git status --short
git diff -- src/main.js
npm test
```

## The release demonstration

Use a Git clone with Node.js 22+, Bash, Git and the GitHub CLI already available. `gh` must be signed into the account that owns the repository. No `npm install` is needed.

Open [`scripts/release.sh`](scripts/release.sh) while explaining the commands. First show its preview, which changes nothing:

```sh
./scripts/release.sh --dry-run 1.0.1 "Increase flap strength and widen the pipe gap"
```

After making and reviewing the gameplay change, run it for real:

```sh
./scripts/release.sh 1.0.1 "Increase flap strength and widen the pipe gap"
```

The script checks the game, updates both version surfaces, stages all non-ignored changes, commits with your configured Git identity, pushes, creates an annotated tag, and uploads a ZIP and checksum to a **draft** GitHub release. Inspect `git diff` first because `git add --all` includes every non-ignored change in this clone.

After the [GitHub checks](https://github.com/theyluvEnething/flappybird-showcase/actions) pass, review the draft and publish it yourself:

```sh
gh release edit v1.0.1 --draft=false --latest
```

Download that release, unzip it, open `index.html`, and show the new version in the game's footer. The ZIP comes from the tagged commit, so later uncommitted edits cannot enter it.

```sh
git log --graph --decorate --oneline --all
git show v1.0.1 --stat
```

If a release command fails, it stops. Inspect the completed steps and continue from the failing command. The script never rewrites history or replaces an existing tag.

This is an independent teaching project inspired by Flappy Bird. Its code and visuals are created for this showcase.
