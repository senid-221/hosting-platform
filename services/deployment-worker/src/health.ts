import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export async function containerIsRunning(name:string) {
  const result = await exec("docker",["inspect","-f","{{.State.Running}}",name]);
  return result.stdout.trim() === "true";
}

export async function containerLogs(name:string) {
  const result = await exec("docker",["logs","--tail","200",name]);
  return (result.stdout + result.stderr).slice(-100000);
}
