const path = require("node:path");
const { flipFuses, FuseVersion, FuseV1Options } = require("@electron/fuses");

/**
 * @param {import("electron-builder").AfterPackContext} context
 */
exports.default = async function afterPack(context) {
  const name = context.packager.appInfo.productFilename;

  const electronPath =
    context.electronPlatformName === "darwin"
      ? path.join(context.appOutDir, `${name}.app`, "Contents", "MacOS", name)
      : path.join(context.appOutDir, `${name}.exe`);

  await flipFuses(electronPath, {
    version: FuseVersion.V1,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
  });
};