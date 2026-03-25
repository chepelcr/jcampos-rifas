import { pgTable, text, serial, integer, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rafflesTable = pgTable("raffles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  drawDate: timestamp("draw_date"),
  pricePerNumber: numeric("price_per_number", { precision: 10, scale: 2 }).notNull(),
  type: text("type", { enum: ["single_amount", "multiple_prizes"] }).notNull(),
  prizeImage: text("prize_image"),
  status: text("status", { enum: ["active", "completed", "cancelled"] }).notNull().default("active"),
  prizes: jsonb("prizes").$type<string[]>(),
  singlePrizeAmount: numeric("single_prize_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRaffleSchema = createInsertSchema(rafflesTable).omit({ id: true, createdAt: true });
export type InsertRaffle = z.infer<typeof insertRaffleSchema>;
export type Raffle = typeof rafflesTable.$inferSelect;

export const raffleNumbersTable = pgTable("raffle_numbers", {
  id: serial("id").primaryKey(),
  raffleId: integer("raffle_id").notNull().references(() => rafflesTable.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  status: text("status", { enum: ["available", "sold"] }).notNull().default("available"),
  buyerId: integer("buyer_id"),
});

export const insertRaffleNumberSchema = createInsertSchema(raffleNumbersTable).omit({ id: true });
export type InsertRaffleNumber = z.infer<typeof insertRaffleNumberSchema>;
export type RaffleNumber = typeof raffleNumbersTable.$inferSelect;

export const buyersTable = pgTable("buyers", {
  id: serial("id").primaryKey(),
  raffleId: integer("raffle_id").notNull().references(() => rafflesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBuyerSchema = createInsertSchema(buyersTable).omit({ id: true, createdAt: true });
export type InsertBuyer = z.infer<typeof insertBuyerSchema>;
export type Buyer = typeof buyersTable.$inferSelect;

export const winnersTable = pgTable("winners", {
  id: serial("id").primaryKey(),
  raffleId: integer("raffle_id").notNull().references(() => rafflesTable.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  buyerId: integer("buyer_id").notNull().references(() => buyersTable.id),
  prize: text("prize"),
  drawnAt: timestamp("drawn_at").notNull().defaultNow(),
});

export const insertWinnerSchema = createInsertSchema(winnersTable).omit({ id: true, drawnAt: true });
export type InsertWinner = z.infer<typeof insertWinnerSchema>;
export type Winner = typeof winnersTable.$inferSelect;
