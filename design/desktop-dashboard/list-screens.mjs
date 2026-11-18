import fs from "node:fs";

const h = fs.readFileSync("design/desktop-dashboard/v1.html", "utf8");
const re = /<h2>([^<]+)<\/h2><iframe[^#]+#([0-9a-f-]{36})/g;
let m;
while ((m = re.exec(h)) !== null) {
  console.log(`${m[1]}\t${m[2]}`);
}