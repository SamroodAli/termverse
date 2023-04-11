const { exec: cbExec } = require("child_process");
const path = require("path");
const { promisify } = require("util");
const fs = require("fs");
const exec = promisify(cbExec);

main();

async function main() {
  const jsonFilepath = process.argv[2];

  if (!jsonFilepath) {
    console.error("Error: JSON file path not provided");
    process.exit(1);
  }

  const configFileContent = fs.readFileSync(
    path.resolve(jsonFilepath),
    "utf-8"
  );

  const config = JSON.parse(configFileContent);

  await killServerIfNeeded();
  // create sessions
  config.sessions.forEach(createTmuxSession);
}

/** Helpers */

async function createTmuxSession(session) {
  // create session

  await runCommand(`tmux new-session -ds ${session.name}`);
  // create windows
  session.windows.forEach(async (window, index) => {
    if (index === 0) {
      // a window already exists
      await runCommand(
        `tmux rename-window -t ${session.name}:1 ${window.name}`
      );
    } else {
      // start window
      await runCommand(
        `tmux new-window -dt ${session.name}: -n ${window.name}`
      );
    }

    // change directory to session workdir
    const commandPrefix = `tmux send-keys -t ${session.name}:${index + 1}`;

    if (session.workdir) {
      await runCommand(`${commandPrefix} 'cd\ ${session.workdir}' C-m`);
    }

    if (session.commands && session.commands.pre) {
      await runCommand(`${commandPrefix} '${session.commands.pre}' C-m`);
    }

    // execute window command
    await runCommand(`${commandPrefix} '${window.command}' C-m`);

    console.log(`✅ ${session.name} ${window.name} ${window.command}`);
  });
}

async function runCommand(command, log = true) {
  const { stderr, stdout } = await exec(command);

  if (log) {
    stdout.length && console.log("stdout:", stdout);
    stderr.length && console.error("stderr:", stderr);
  }
}

async function killServerIfNeeded() {
  try {
    await runCommand(`tmux ls`, false);
    await runCommand(`tmux kill-server`, false);
  } catch (err) {
    return true;
  }
}
