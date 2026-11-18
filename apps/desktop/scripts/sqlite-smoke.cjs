try {
  const Database = require("better-sqlite3");
  new Database(":memory:");
  console.log("electron sqlite ok");
} catch (error) {
  console.error(error);
  process.exit(1);
}