const fs = require("fs");
const path = require("path");

if (fs.existsSync(path.join(__dirname, "config/mappings.json"))) {
  fs.rmSync(path.join(__dirname, "config/mappings.json"));
}

if (fs.existsSync(path.join(__dirname, "config/my-mappings.json"))) {
  fs.copyFileSync(
    path.join(__dirname, "config/my-mappings.json"),
    path.join(__dirname, "config/mappings.json")
  );
  return;
}

fs.copyFileSync(
  path.join(__dirname, "config/sample-mappings.json"),
  path.join(__dirname, "config/mappings.json")
);
