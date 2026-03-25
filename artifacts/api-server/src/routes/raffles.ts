import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  rafflesTable,
  raffleNumbersTable,
  buyersTable,
  winnersTable,
} from "@workspace/db/schema";
import { eq, and, count, sql } from "drizzle-orm";

const router: IRouter = Router();

function buildRaffleResponse(raffle: typeof rafflesTable.$inferSelect, numbers: (typeof raffleNumbersTable.$inferSelect & { buyerName?: string | null })[], buyers: (typeof buyersTable.$inferSelect & { numbers: number[] })[], winners?: { number: number; buyerName: string; buyerPhone: string | null; prize: string | null }[]) {
  const soldNumbers = numbers.filter((n) => n.status === "sold").length;
  return {
    id: raffle.id,
    name: raffle.name,
    description: raffle.description ?? null,
    drawDate: raffle.drawDate ? raffle.drawDate.toISOString() : null,
    pricePerNumber: parseFloat(raffle.pricePerNumber),
    type: raffle.type,
    prizeImage: raffle.prizeImage ?? null,
    status: raffle.status,
    prizes: raffle.prizes ?? null,
    singlePrizeAmount: raffle.singlePrizeAmount ? parseFloat(raffle.singlePrizeAmount) : null,
    totalNumbers: numbers.length,
    soldNumbers,
    createdAt: raffle.createdAt.toISOString(),
    ...(numbers.length > 0 ? {
      numbers: numbers.map((n) => ({
        id: n.id,
        raffleId: n.raffleId,
        number: n.number,
        status: n.status,
        buyerId: n.buyerId ?? null,
        buyerName: n.buyerName ?? null,
      })),
      buyers: buyers.map((b) => ({
        id: b.id,
        raffleId: b.raffleId,
        name: b.name,
        phone: b.phone ?? null,
        email: b.email ?? null,
        numbers: b.numbers,
        createdAt: b.createdAt.toISOString(),
      })),
      winners: winners ?? null,
    } : {}),
  };
}

// List all raffles
router.get("/", async (req, res) => {
  try {
    const raffles = await db.select().from(rafflesTable).orderBy(rafflesTable.createdAt);

    const result = await Promise.all(
      raffles.map(async (raffle) => {
        const numbers = await db.select().from(raffleNumbersTable).where(eq(raffleNumbersTable.raffleId, raffle.id));
        const soldNumbers = numbers.filter((n) => n.status === "sold").length;
        return {
          id: raffle.id,
          name: raffle.name,
          description: raffle.description ?? null,
          drawDate: raffle.drawDate ? raffle.drawDate.toISOString() : null,
          pricePerNumber: parseFloat(raffle.pricePerNumber),
          type: raffle.type,
          prizeImage: raffle.prizeImage ?? null,
          status: raffle.status,
          prizes: raffle.prizes ?? null,
          singlePrizeAmount: raffle.singlePrizeAmount ? parseFloat(raffle.singlePrizeAmount) : null,
          totalNumbers: numbers.length,
          soldNumbers,
          createdAt: raffle.createdAt.toISOString(),
        };
      })
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error listing raffles");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a raffle
router.post("/", async (req, res) => {
  try {
    const { name, description, drawDate, pricePerNumber, type, prizeImage, prizes, singlePrizeAmount } = req.body;

    if (!name || !pricePerNumber || !type) {
      res.status(400).json({ error: "name, pricePerNumber, and type are required" });
      return;
    }

    const [raffle] = await db
      .insert(rafflesTable)
      .values({
        name,
        description: description ?? null,
        drawDate: drawDate ? new Date(drawDate) : null,
        pricePerNumber: String(pricePerNumber),
        type,
        prizeImage: prizeImage ?? null,
        prizes: prizes ?? null,
        singlePrizeAmount: singlePrizeAmount ? String(singlePrizeAmount) : null,
        status: "active",
      })
      .returning();

    // Generate numbers 0-99
    const numberValues = Array.from({ length: 100 }, (_, i) => ({
      raffleId: raffle.id,
      number: i,
      status: "available" as const,
    }));
    await db.insert(raffleNumbersTable).values(numberValues);

    res.status(201).json({
      id: raffle.id,
      name: raffle.name,
      description: raffle.description ?? null,
      drawDate: raffle.drawDate ? raffle.drawDate.toISOString() : null,
      pricePerNumber: parseFloat(raffle.pricePerNumber),
      type: raffle.type,
      prizeImage: raffle.prizeImage ?? null,
      status: raffle.status,
      prizes: raffle.prizes ?? null,
      singlePrizeAmount: raffle.singlePrizeAmount ? parseFloat(raffle.singlePrizeAmount) : null,
      totalNumbers: 100,
      soldNumbers: 0,
      createdAt: raffle.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating raffle");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a raffle by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [raffle] = await db.select().from(rafflesTable).where(eq(rafflesTable.id, id));

    if (!raffle) {
      res.status(404).json({ error: "Raffle not found" });
      return;
    }

    const numbers = await db.select().from(raffleNumbersTable).where(eq(raffleNumbersTable.raffleId, id));
    const buyers = await db.select().from(buyersTable).where(eq(buyersTable.raffleId, id));
    const winners = await db.select().from(winnersTable).where(eq(winnersTable.raffleId, id));

    // Map buyer IDs to their numbers
    const buyerNumberMap = new Map<number, number[]>();
    for (const num of numbers) {
      if (num.buyerId) {
        if (!buyerNumberMap.has(num.buyerId)) buyerNumberMap.set(num.buyerId, []);
        buyerNumberMap.get(num.buyerId)!.push(num.number);
      }
    }

    // Map buyer IDs to names for numbers
    const buyerMap = new Map(buyers.map((b) => [b.id, b]));

    const numbersWithBuyers = numbers.map((n) => ({
      ...n,
      buyerName: n.buyerId ? (buyerMap.get(n.buyerId)?.name ?? null) : null,
    }));

    const buyersWithNumbers = buyers.map((b) => ({
      ...b,
      numbers: buyerNumberMap.get(b.id) ?? [],
    }));

    const winnersFormatted = await Promise.all(
      winners.map(async (w) => {
        const buyer = buyerMap.get(w.buyerId);
        return {
          number: w.number,
          buyerName: buyer?.name ?? "Desconocido",
          buyerPhone: buyer?.phone ?? null,
          prize: w.prize ?? null,
        };
      })
    );

    res.json(buildRaffleResponse(raffle, numbersWithBuyers, buyersWithNumbers, winnersFormatted));
  } catch (err) {
    req.log.error({ err }, "Error getting raffle");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a raffle
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, drawDate, pricePerNumber, type, prizeImage, status, prizes, singlePrizeAmount } = req.body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (drawDate !== undefined) updateData.drawDate = drawDate ? new Date(drawDate) : null;
    if (pricePerNumber !== undefined) updateData.pricePerNumber = String(pricePerNumber);
    if (type !== undefined) updateData.type = type;
    if (prizeImage !== undefined) updateData.prizeImage = prizeImage;
    if (status !== undefined) updateData.status = status;
    if (prizes !== undefined) updateData.prizes = prizes;
    if (singlePrizeAmount !== undefined) updateData.singlePrizeAmount = singlePrizeAmount ? String(singlePrizeAmount) : null;

    const [raffle] = await db
      .update(rafflesTable)
      .set(updateData)
      .where(eq(rafflesTable.id, id))
      .returning();

    if (!raffle) {
      res.status(404).json({ error: "Raffle not found" });
      return;
    }

    const numbers = await db.select().from(raffleNumbersTable).where(eq(raffleNumbersTable.raffleId, id));
    const soldNumbers = numbers.filter((n) => n.status === "sold").length;

    res.json({
      id: raffle.id,
      name: raffle.name,
      description: raffle.description ?? null,
      drawDate: raffle.drawDate ? raffle.drawDate.toISOString() : null,
      pricePerNumber: parseFloat(raffle.pricePerNumber),
      type: raffle.type,
      prizeImage: raffle.prizeImage ?? null,
      status: raffle.status,
      prizes: raffle.prizes ?? null,
      singlePrizeAmount: raffle.singlePrizeAmount ? parseFloat(raffle.singlePrizeAmount) : null,
      totalNumbers: numbers.length,
      soldNumbers,
      createdAt: raffle.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error updating raffle");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a raffle
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(rafflesTable).where(eq(rafflesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting raffle");
    res.status(500).json({ error: "Internal server error" });
  }
});

// List numbers for a raffle
router.get("/:id/numbers", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const numbers = await db.select().from(raffleNumbersTable).where(eq(raffleNumbersTable.raffleId, id));
    const buyers = await db.select().from(buyersTable).where(eq(buyersTable.raffleId, id));
    const buyerMap = new Map(buyers.map((b) => [b.id, b]));

    res.json(
      numbers.map((n) => ({
        id: n.id,
        raffleId: n.raffleId,
        number: n.number,
        status: n.status,
        buyerId: n.buyerId ?? null,
        buyerName: n.buyerId ? (buyerMap.get(n.buyerId)?.name ?? null) : null,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Error listing numbers");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Assign a number to a buyer
router.post("/:id/numbers/:number/assign", async (req, res) => {
  try {
    const raffleId = parseInt(req.params.id);
    const number = parseInt(req.params.number);
    const { buyerName, buyerPhone, buyerEmail } = req.body;

    if (!buyerName) {
      res.status(400).json({ error: "buyerName is required" });
      return;
    }

    // Check if number exists and is available
    const [raffleNumber] = await db
      .select()
      .from(raffleNumbersTable)
      .where(and(eq(raffleNumbersTable.raffleId, raffleId), eq(raffleNumbersTable.number, number)));

    if (!raffleNumber) {
      res.status(404).json({ error: "Number not found" });
      return;
    }

    if (raffleNumber.status === "sold") {
      res.status(400).json({ error: "Number is already sold" });
      return;
    }

    // Find or create buyer
    let buyer = (await db
      .select()
      .from(buyersTable)
      .where(and(eq(buyersTable.raffleId, raffleId), eq(buyersTable.name, buyerName)))
    )[0];

    if (!buyer) {
      [buyer] = await db
        .insert(buyersTable)
        .values({ raffleId, name: buyerName, phone: buyerPhone ?? null, email: buyerEmail ?? null })
        .returning();
    }

    const [updated] = await db
      .update(raffleNumbersTable)
      .set({ status: "sold", buyerId: buyer.id })
      .where(and(eq(raffleNumbersTable.raffleId, raffleId), eq(raffleNumbersTable.number, number)))
      .returning();

    res.json({
      id: updated.id,
      raffleId: updated.raffleId,
      number: updated.number,
      status: updated.status,
      buyerId: updated.buyerId ?? null,
      buyerName: buyer.name,
    });
  } catch (err) {
    req.log.error({ err }, "Error assigning number");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Release a number
router.post("/:id/numbers/:number/release", async (req, res) => {
  try {
    const raffleId = parseInt(req.params.id);
    const number = parseInt(req.params.number);

    const [updated] = await db
      .update(raffleNumbersTable)
      .set({ status: "available", buyerId: null })
      .where(and(eq(raffleNumbersTable.raffleId, raffleId), eq(raffleNumbersTable.number, number)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Number not found" });
      return;
    }

    res.json({
      id: updated.id,
      raffleId: updated.raffleId,
      number: updated.number,
      status: updated.status,
      buyerId: null,
      buyerName: null,
    });
  } catch (err) {
    req.log.error({ err }, "Error releasing number");
    res.status(500).json({ error: "Internal server error" });
  }
});

// List buyers for a raffle
router.get("/:id/buyers", async (req, res) => {
  try {
    const raffleId = parseInt(req.params.id);
    const buyers = await db.select().from(buyersTable).where(eq(buyersTable.raffleId, raffleId));
    const numbers = await db.select().from(raffleNumbersTable).where(eq(raffleNumbersTable.raffleId, raffleId));

    const buyerNumberMap = new Map<number, number[]>();
    for (const num of numbers) {
      if (num.buyerId) {
        if (!buyerNumberMap.has(num.buyerId)) buyerNumberMap.set(num.buyerId, []);
        buyerNumberMap.get(num.buyerId)!.push(num.number);
      }
    }

    res.json(
      buyers.map((b) => ({
        id: b.id,
        raffleId: b.raffleId,
        name: b.name,
        phone: b.phone ?? null,
        email: b.email ?? null,
        numbers: buyerNumberMap.get(b.id) ?? [],
        createdAt: b.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Error listing buyers");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Draw raffle
router.post("/:id/draw", async (req, res) => {
  try {
    const raffleId = parseInt(req.params.id);
    const [raffle] = await db.select().from(rafflesTable).where(eq(rafflesTable.id, raffleId));

    if (!raffle) {
      res.status(404).json({ error: "Raffle not found" });
      return;
    }

    const soldNumbers = await db
      .select()
      .from(raffleNumbersTable)
      .where(and(eq(raffleNumbersTable.raffleId, raffleId), eq(raffleNumbersTable.status, "sold")));

    if (soldNumbers.length === 0) {
      res.status(400).json({ error: "No sold numbers to draw from" });
      return;
    }

    const buyers = await db.select().from(buyersTable).where(eq(buyersTable.raffleId, raffleId));
    const buyerMap = new Map(buyers.map((b) => [b.id, b]));

    // Determine prizes
    const prizes: (string | null)[] = raffle.prizes ?? [];
    let winners: { number: number; buyerName: string; buyerPhone: string | null; prize: string | null }[] = [];

    if (raffle.type === "multiple_prizes" && prizes.length > 0) {
      // Shuffle sold numbers and pick winners per prize
      const shuffled = [...soldNumbers].sort(() => Math.random() - 0.5);
      const numWinners = Math.min(prizes.length, shuffled.length);

      for (let i = 0; i < numWinners; i++) {
        const winnerNum = shuffled[i];
        const buyer = winnerNum.buyerId ? buyerMap.get(winnerNum.buyerId) : null;
        winners.push({
          number: winnerNum.number,
          buyerName: buyer?.name ?? "Desconocido",
          buyerPhone: buyer?.phone ?? null,
          prize: prizes[i] ?? null,
        });

        if (buyer) {
          await db.insert(winnersTable).values({
            raffleId,
            number: winnerNum.number,
            buyerId: buyer.id,
            prize: prizes[i] ?? null,
          });
        }
      }
    } else {
      // Single winner
      const randomIndex = Math.floor(Math.random() * soldNumbers.length);
      const winnerNum = soldNumbers[randomIndex];
      const buyer = winnerNum.buyerId ? buyerMap.get(winnerNum.buyerId) : null;
      const prize = raffle.singlePrizeAmount
        ? `₡${parseFloat(raffle.singlePrizeAmount).toLocaleString("es-CR")}`
        : null;

      winners.push({
        number: winnerNum.number,
        buyerName: buyer?.name ?? "Desconocido",
        buyerPhone: buyer?.phone ?? null,
        prize,
      });

      if (buyer) {
        await db.insert(winnersTable).values({
          raffleId,
          number: winnerNum.number,
          buyerId: buyer.id,
          prize,
        });
      }
    }

    // Mark raffle as completed
    await db.update(rafflesTable).set({ status: "completed" }).where(eq(rafflesTable.id, raffleId));

    res.json({ raffleId, winners });
  } catch (err) {
    req.log.error({ err }, "Error drawing raffle");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export as PDF
router.get("/:id/export/pdf", async (req, res) => {
  try {
    const raffleId = parseInt(req.params.id);
    const [raffle] = await db.select().from(rafflesTable).where(eq(rafflesTable.id, raffleId));

    if (!raffle) {
      res.status(404).json({ error: "Raffle not found" });
      return;
    }

    const numbers = await db.select().from(raffleNumbersTable).where(eq(raffleNumbersTable.raffleId, raffleId));
    const buyers = await db.select().from(buyersTable).where(eq(buyersTable.raffleId, raffleId));
    const buyerMap = new Map(buyers.map((b) => [b.id, b]));

    const html = generateRaffleHtml(raffle, numbers, buyerMap);

    try {
      const puppeteer = await import("puppeteer");
      const browser = await puppeteer.default.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({ format: "A4", printBackground: true });
      await browser.close();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="rifa-${raffleId}.pdf"`);
      res.send(pdf);
    } catch {
      // Fallback: return HTML if puppeteer fails
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    }
  } catch (err) {
    req.log.error({ err }, "Error exporting PDF");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export as Image
router.get("/:id/export/image", async (req, res) => {
  try {
    const raffleId = parseInt(req.params.id);
    const [raffle] = await db.select().from(rafflesTable).where(eq(rafflesTable.id, raffleId));

    if (!raffle) {
      res.status(404).json({ error: "Raffle not found" });
      return;
    }

    const numbers = await db.select().from(raffleNumbersTable).where(eq(raffleNumbersTable.raffleId, raffleId));
    const buyers = await db.select().from(buyersTable).where(eq(buyersTable.raffleId, raffleId));
    const buyerMap = new Map(buyers.map((b) => [b.id, b]));

    const html = generateRaffleHtml(raffle, numbers, buyerMap);

    try {
      const puppeteer = await import("puppeteer");
      const browser = await puppeteer.default.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
      const page = await browser.newPage();
      await page.setViewport({ width: 900, height: 1100 });
      await page.setContent(html, { waitUntil: "networkidle0" });
      const screenshot = await page.screenshot({ type: "png", fullPage: true });
      await browser.close();

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", `attachment; filename="rifa-${raffleId}.png"`);
      res.send(screenshot);
    } catch {
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    }
  } catch (err) {
    req.log.error({ err }, "Error exporting image");
    res.status(500).json({ error: "Internal server error" });
  }
});

function generateRaffleHtml(
  raffle: typeof rafflesTable.$inferSelect,
  numbers: (typeof raffleNumbersTable.$inferSelect)[],
  buyerMap: Map<number, typeof buyersTable.$inferSelect>
): string {
  const drawDate = raffle.drawDate
    ? new Date(raffle.drawDate).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
    : "Por definir";

  const numberCells = Array.from({ length: 100 }, (_, i) => {
    const num = numbers.find((n) => n.number === i);
    const isSold = num?.status === "sold";
    const buyer = num?.buyerId ? buyerMap.get(num.buyerId) : null;

    return `<div class="number-cell ${isSold ? "sold" : "available"}" title="${buyer ? buyer.name : ""}">
      <span>${i}</span>
      ${isSold ? '<span class="x">✕</span>' : ""}
    </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rifa: ${raffle.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; padding: 20px; background: #fff; }
  .header { text-align: center; margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; border-radius: 12px; }
  .header h1 { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
  .header p { font-size: 14px; opacity: 0.9; }
  .info-row { display: flex; gap: 12px; margin-bottom: 20px; }
  .info-card { flex: 1; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
  .info-card .label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
  .info-card .value { font-size: 18px; font-weight: bold; color: #111827; margin-top: 4px; }
  .prizes { margin-bottom: 20px; }
  .prizes h3 { font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 8px; }
  .prizes-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .prize-item { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 6px 12px; font-size: 13px; font-weight: 600; color: #92400e; }
  .grid { display: grid; grid-template-columns: repeat(11, 1fr); gap: 4px; margin-top: 10px; }
  .number-cell { position: relative; border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 2px; text-align: center; font-size: 13px; font-weight: 600; }
  .number-cell.available { background: #ffffff; color: #111827; }
  .number-cell.sold { background: #e5e7eb; color: #6b7280; }
  .number-cell .x { position: absolute; top: 2px; right: 4px; font-size: 9px; color: #ef4444; }
  .legend { display: flex; gap: 16px; margin-top: 12px; font-size: 12px; }
  .legend-item { display: flex; align-items: center; gap: 6px; }
  .legend-box { width: 14px; height: 14px; border-radius: 3px; border: 1px solid #d1d5db; }
  .watermark { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 16px; }
</style>
</head>
<body>
<div class="header">
  <h1>🎟️ ${raffle.name}</h1>
  ${raffle.description ? `<p>${raffle.description}</p>` : ""}
</div>
<div class="info-row">
  <div class="info-card"><div class="label">Fecha del Sorteo</div><div class="value">${drawDate}</div></div>
  <div class="info-card"><div class="label">Valor por Número</div><div class="value">₡${parseFloat(raffle.pricePerNumber).toLocaleString("es-CR")}</div></div>
  <div class="info-card"><div class="label">Números Vendidos</div><div class="value">${numbers.filter((n) => n.status === "sold").length} / 100</div></div>
</div>
${raffle.type === "single_amount" && raffle.singlePrizeAmount ? `
<div class="prizes">
  <h3>🏆 Premio</h3>
  <div class="prizes-list"><div class="prize-item">₡${parseFloat(raffle.singlePrizeAmount).toLocaleString("es-CR")}</div></div>
</div>` : raffle.prizes && raffle.prizes.length > 0 ? `
<div class="prizes">
  <h3>🏆 Premios</h3>
  <div class="prizes-list">${raffle.prizes.map((p, i) => `<div class="prize-item">${i + 1}. ${p}</div>`).join("")}</div>
</div>` : ""}
<h3 style="margin-bottom:8px;color:#374151;">Números de la Rifa</h3>
<div class="grid">${numberCells}</div>
<div class="legend">
  <div class="legend-item"><div class="legend-box" style="background:#fff;"></div><span>Disponible</span></div>
  <div class="legend-item"><div class="legend-box" style="background:#e5e7eb;"></div><span>Vendido</span></div>
</div>
<div class="watermark">Generado por Gestor de Rifas</div>
</body>
</html>`;
}

export default router;
