import { collectCutoverPayload } from "./cutover_payload.mjs";

const shouldList = process.argv.includes("--list");
const { failures, payloadFiles, warnings } = collectCutoverPayload();

if (failures.length) {
  console.error("Cutover payload verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
  process.exit(1);
}

console.log(`Cutover payload verification passed (${payloadFiles.length} source files).`);
if (shouldList) {
  console.log("Cutover payload files:");
  for (const file of payloadFiles) console.log(`- ${file}`);
}
for (const warning of warnings) {
  const line = `warning: ${warning}`;
  if (shouldList) console.log(line);
  else console.warn(line);
}
