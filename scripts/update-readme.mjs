/* Rewrites the section between LIVE markers in README.md with fresh data
   from the public GitHub API. Run by .github/workflows/update-readme.yml. */
import { readFileSync, writeFileSync } from "node:fs";

const USER = "hassannaveed327";
const README = new URL("../README.md", import.meta.url);

async function gh(path) {
  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

const user = await gh(`/users/${USER}`);
const repos = await gh(`/users/${USER}/repos?per_page=100&sort=pushed`);
const own = repos.filter((r) => !r.fork);
const stars = own.reduce((n, r) => n + r.stargazers_count, 0);
const recent = own.slice(0, 3);

const when = new Date().toISOString().slice(0, 10);
const block = [
  "",
  `<div align="center">`,
  "",
  `📦 **${user.public_repos}** public repos&ensp;·&ensp;⭐ **${stars}** stars&ensp;·&ensp;👥 **${user.followers}** followers&ensp;·&ensp;🔄 synced **${when}**`,
  "",
  "</div>",
  "",
  "**Recently pushed:**",
  "",
  ...recent.map((r) => {
    const desc = r.description ? ` — ${r.description}` : "";
    const lang = r.language ? ` \`${r.language}\`` : "";
    return `- [**${r.name}**](${r.html_url})${desc}${lang}`;
  }),
  "",
].join("\n");

const md = readFileSync(README, "utf8");
const next = md.replace(
  /(<!--LIVE:START-->)[\s\S]*(<!--LIVE:END-->)/,
  `$1${block}$2`,
);
if (next !== md) {
  writeFileSync(README, next);
  console.log("README updated");
} else {
  console.log("No changes");
}
