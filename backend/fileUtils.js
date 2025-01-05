import fs from "fs";
import path from "path";

/**
 * Reads a JSON file and parses its content.
 * If the file does not exist, it initializes it with default data.
 *
 * @param {string} filePath - The path to the JSON file.
 * @param {object} defaultData - The default data to initialize if the file doesn't exist.
 * @returns {object} - The parsed JSON content.
 */
export function readJsonFile(filePath, defaultData = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      // If file doesn't exist, initialize with default data
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const fileContent = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading file at ${filePath}:`, error.message);
    throw new Error("Failed to read JSON file.");
  }
}

/**
 * Writes data to a JSON file.
 *
 * @param {string} filePath - The path to the JSON file.
 * @param {object} data - The data to write to the file.
 */
export function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing file at ${filePath}:`, error.message);
    throw new Error("Failed to write to JSON file.");
  }
}

/**
 * Resolves the absolute path for a file.
 *
 * @param {string} relativePath - The relative path to the file.
 * @returns {string} - The absolute path.
 */
export function resolvePath(relativePath) {
  return path.resolve(process.cwd(), relativePath);
}
