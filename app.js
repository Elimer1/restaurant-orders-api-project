import express from "express";
import fs from "fs/promises";
import { getFile, saveFile } from "./utils.js";
import { get } from "http";
import { fileURLToPath } from "url";

const app = express();
const ORDERS_FILE_PATH = "./orders.json";
const statuses = ["NEW", "PREPARING", "READY", "DELIVERED", "CANCELLED"];
const statusTransition = {"NEW" : ["PREPARING", CANCELLED], "PREPARING": ["READY", "CANCELLED"], "READY": ["DELIVERED"]}

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

app.get("/orders", async (req, res, next) => {

  const { statusType, customer, tableNum } = req.query;
  const orders = await getFile(ORDERS_FILE_PATH);

  const status = statusType ? statusType.toUpperCase() : null;
  const customerName = customer ? customer.toLowerCase() : null;
  const tableNumber = tableNum ? Number(tableNum) : null;

  let filteredOrders = orders;

  if (status) {
    if (!statuses.includes(status)) {
      const error = new Error("invalid status");
      error.status = 400;
      return next(error);
    }
    filteredOrders = filteredOrders.filter((order) => order.status === status);
  }
  if (customerName) {
    filteredOrders = filteredOrders.filter(
      (order) => order.customerName.toLowerCase() === customerName,
    );
  }

  if (tableNumber) {
    if (isNaN(tableNumber)) {
      const error = new Error("invalid data for table number");
      error.status = 400;
      return next(error);
    }
    filteredOrders = filteredOrders.filter(
      (order) => order.tableNumber === tableNumber,
    );
  }

  return res.status(200).json({ success: true, data: filteredOrders });
});

app.get("/orders/:id", async (req, res, next) => {
  const orderId = Number(req.params.id);

  if (isNaN(orderId)) {
    const error = new Error("invalid id");
    error.status = 400;
    return next(error);
  }

  const orders = await getFile(ORDERS_FILE_PATH);
  const order = orders.find((order) => order.id === orderId);

  if (!order) {
    const error = new Error("order not found");
    error.status = 404;
    return next(error);
  }
  res.status(200).json({ success: true, data: order });
});

app.patch("/orders/:id/status", (req, res, next) => {
  const orderId = Number(req.params.id);

  if (isNaN(orderId)) {
    const error = new Error("invalid id");
    error.status = 400;
    return next(error);
  }

  let newStatus = req.body.status;

  if (newStatus){
    newStatus = newStatus.toUpperCase()
      if (!statuses.includes(newStatus)){
        const error = new Error("invalid status to update");
        error.status = 400;
        return next(error);
      }
  }
  else{
        const error = new Error("missing status to update");
        error.status = 400;
        return next(error);
  }



  const orders = await getFile(ORDERS_FILE_PATH);
  const order = orders.find((order) => order.id === orderId);

  if (!order) {
    const error = new Error("order not found");
    error.status = 404;
    return next(error);
  }

  const allowedUpdate = statusTransition[order.status];

  if (!allowedUpdate.includes(newStatus)){
    const error = new Error("invalid status transition");
    error.status = 400;
    return next(error);
  }

  order.status = newStatus

  await saveFile(ORDERS_FILE_PATH, orders);
  res.status(200).json({success: true, message: "status updated successfully"})
});

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "internal server error" });
});
