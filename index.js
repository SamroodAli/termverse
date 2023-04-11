const { exec: cbExec } = require("child_process");
const path = require("path");
const { promisify } = require("util");
const fs = require("fs");
const exec = promisify(cbExec);

main();

function main() {
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

  // create sessions
  config.sessions.forEach(createTmuxSession);
}

/** Helpers */

async function createTmuxSession(session) {
  // create session
  runCommand(`tmux new-session -ds ${session.name}`);

  // create windows
  session.windows.forEach(async (window, index) => {
    // start window
    await runCommand(`tmux new-window -dt ${session.name}: -n ${window.name}`);

    // change directory to session workdir
    const commandPrefix =`tmux send-keys -t ${session.name}:${index + 1} cd ${session.workdir} C-m`

    // execute window command
    await runCommand(`tmux send-keys -t ${session.name}:${index + 1} ${window.command} C-m`);

    console.log(`${session.name} ${window.name} ${window.command} :✅`);
  });
}

async function runCommand(command) {
  const { stderr, stdout } = await exec(command);

  stdout.length && console.log("stdout:", stdout);
  stderr.length && console.error("stderr:", stderr);
}
