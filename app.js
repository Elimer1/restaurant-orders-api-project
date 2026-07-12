import express from "express";
import fs from "fs/promises";
import { getFile, saveFile } from "./utils.js";

const app = express();
const ORDERS_FILE_PATH = "./orders.json";

app.use(express.json());

app.post("/orders", async (req, res, next) => {
  const { customerName, tableNumber, status = "NEW" } = req.body;
  const orders = await getFile(ORDERS_FILE_PATH);
  const id =
    orders.length > 0
      ? Math.max(...orders.map((order) => Number(order.id))) + 1
      : 1;
  if (!customerName) {
    const error = new Error("missing customer name");
    error.status = 400;
    return next(error);
  }
  if (!tableNumber) {
    const error = new Error("missing table number");
    error.status = 400;
    return next(error);
  }
  const order = { id, customerName, tableNumber, status };
  orders.push(order);
  await saveFile(ORDERS_FILE_PATH, orders);

  return res
    .status(201)
    .json({ success: true, message: "order placed successfully" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "internal server error" });
});
