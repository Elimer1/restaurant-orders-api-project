import fs from "fs/promises";

export async function getFile(filePath) {
  try {
    const fileData = await fs.readFile(filePath, "utf8");
    return fileData ? JSON.parse(fileData) : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function saveFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    throw error;
  }
}
