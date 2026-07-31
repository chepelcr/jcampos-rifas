import type { Buyer, Raffle, RaffleNumber } from "@workspace/api-client-react";
import { formatCurrency, formatRaffleDate } from "@/lib/utils";

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

export async function downloadBuyerConfirmation(
  raffle: Raffle,
  buyer: Buyer,
  raffleNumbers: RaffleNumber[],
) {
  const assigned = raffleNumbers
    .filter((item) => item.buyerId === buyer.id)
    .sort((a, b) => a.number - b.number);
  if (!assigned.length)
    throw new Error("Este comprador no tiene números asignados.");

  const columns = Math.min(5, assigned.length);
  const rows = Math.ceil(assigned.length / columns);
  const footerY = 500 + rows * 175;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = footerY + 170;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Este navegador no permite generar imágenes.");

  const primary = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary")
    .trim();
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, primary ? `hsl(${primary})` : "#e62e62");
  gradient.addColorStop(1, accent ? `hsl(${accent})` : "#f59e0b");
  // The canvas itself is the confirmation card. Keeping content directly on it
  // avoids the previous card-inside-an-image effect and wastes less space.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, 320);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 34px system-ui";
  ctx.fillText("CONFIRMACIÓN DE RIFA", 540, 78);
  ctx.font = "800 58px system-ui";
  ctx.fillText(raffle.name.slice(0, 30), 540, 165);
  ctx.font = "30px system-ui";
  ctx.fillText(`Gracias por participar, ${buyer.name.slice(0, 32)}`, 540, 230);
  ctx.font = "24px system-ui";
  ctx.fillText(
    raffle.drawDate
      ? `Sorteo: ${formatRaffleDate(raffle.drawDate, "d 'de' MMMM, yyyy")}`
      : "Fecha del sorteo por definir",
    540,
    285,
  );

  ctx.fillStyle = "#64748b";
  ctx.font = "600 24px system-ui";
  ctx.fillText("TUS NÚMEROS", 540, 385);
  const cellSize = 130;
  const gap = 28;
  const gridWidth = columns * cellSize + (columns - 1) * gap;
  const startX = (1080 - gridWidth) / 2;
  assigned.forEach((item, index) => {
    const x = startX + (index % columns) * (cellSize + gap);
    const y = 420 + Math.floor(index / columns) * 175;
    ctx.fillStyle = item.paymentStatus === "paid" ? "#dcfce7" : "#fef3c7";
    ctx.strokeStyle = item.paymentStatus === "paid" ? "#16a34a" : "#d97706";
    roundedRect(ctx, x, y, cellSize, cellSize, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 48px system-ui";
    ctx.fillText(
      String(item.number).padStart(2, "0"),
      x + cellSize / 2,
      y + 62,
    );
    ctx.fillStyle = item.paymentStatus === "paid" ? "#15803d" : "#b45309";
    ctx.font = "700 18px system-ui";
    ctx.fillText(
      item.paymentStatus === "paid" ? "PAGADO" : "PENDIENTE",
      x + cellSize / 2,
      y + 103,
    );
  });

  const paidCount = assigned.filter(
    (item) => item.paymentStatus === "paid",
  ).length;
  const total = assigned.length * raffle.pricePerNumber;
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 28px system-ui";
  ctx.fillText(
    `${assigned.length} ${assigned.length === 1 ? "número" : "números"} · ${formatCurrency(total)}`,
    540,
    footerY,
  );
  ctx.fillStyle = paidCount === assigned.length ? "#15803d" : "#b45309";
  ctx.font = "700 24px system-ui";
  ctx.fillText(
    paidCount === assigned.length
      ? "Pago confirmado"
      : `${paidCount} pagado(s) · ${assigned.length - paidCount} pendiente(s)`,
    540,
    footerY + 45,
  );
  ctx.fillStyle = "#94a3b8";
  ctx.font = "20px system-ui";
  ctx.fillText(
    "Conserva esta imagen como confirmación de tus números.",
    540,
    footerY + 100,
  );

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value
          ? resolve(value)
          : reject(new Error("No se pudo crear la imagen.")),
      "image/png",
    ),
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `confirmacion-${raffle.name}-${buyer.name}.png`.replace(
    /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ._-]+/g,
    "-",
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
