import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import {
  useRaffle,
  useRaffleNumbers,
  useRaffleBuyers,
  useDrawRaffleWrapper,
  useDeleteRaffleWrapper,
  useSetPaymentStatusWrapper,
} from "@/hooks/use-raffles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatRaffleDate } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  Image as ImageIcon,
  Users,
  User,
  Ticket,
  CheckCircle2,
  Trophy,
  Loader2,
  Sparkles,
  Trash2,
  Phone,
  Mail,
  Pencil,
  Clock3,
  Plus,
  CircleDollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { AssignDialog } from "@/components/assign-dialog";
import { BuyerInfoDialog } from "@/components/buyer-info-dialog";
import { EditPrizesDialog } from "@/components/edit-prizes-dialog";
import type { Buyer, RaffleNumber } from "@workspace/api-client-react";
import confetti from "canvas-confetti";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { downloadBuyerConfirmation } from "@/lib/buyer-confirmation";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppSettings } from "@/lib/app-settings";

export default function RaffleDetail() {
  const [, params] = useRoute("/raffles/:id");
  const [, setLocation] = useLocation();
  const raffleId = parseInt(params?.id || "0");

  const { data: raffle, isLoading, error } = useRaffle(raffleId);
  const { data: numbers } = useRaffleNumbers(raffleId);
  const { data: buyers } = useRaffleBuyers(raffleId);

  const drawMutation = useDrawRaffleWrapper();
  const deleteMutation = useDeleteRaffleWrapper();
  const paymentMutation = useSetPaymentStatusWrapper();

  const [activeTab, setActiveTab] = useState<"numbers" | "buyers">("numbers");
  const [editPrizesOpen, setEditPrizesOpen] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [assigningBuyer, setAssigningBuyer] = useState<Buyer | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "image" | null>(null);
  const [drawDialogOpen, setDrawDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [numberFilter, setNumberFilter] = useState<
    "all" | "sold" | "available"
  >("all");
  const [buyerSearch, setBuyerSearch] = useState("");
  const [buyerOrder, setBuyerOrder] = useState<"recent" | "name" | "numbers">(
    "recent",
  );
  const [buyerPage, setBuyerPage] = useState(1);
  const { toast } = useToast();
  const { t } = useAppSettings();

  const createRaffleCanvas = () => {
    if (!raffle) throw new Error("No se encontró la rifa");
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1550;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Este navegador no permite generar imágenes");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(
      0,
      getComputedStyle(document.documentElement).getPropertyValue("--primary")
        ? settingsColor("--primary")
        : "#e62e62",
    );
    gradient.addColorStop(1, settingsColor("--accent"));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 285);
    ctx.fillStyle = settingsColor("--brand-foreground");
    ctx.font = "700 58px system-ui";
    ctx.fillText(raffle.name.slice(0, 32), 70, 105);
    const drawDate = raffle.drawDate
      ? formatRaffleDate(raffle.drawDate, "d 'de' MMMM, yyyy")
      : "Por definir";
    ctx.font = "30px system-ui";
    ctx.fillText(`Precio: ${formatCurrency(raffle.pricePerNumber)}`, 70, 175);
    ctx.fillText(`Fecha del sorteo: ${drawDate}`, 70, 220);
    ctx.fillText(
      `Vendidos: ${raffle.soldNumbers} de ${raffle.totalNumbers}`,
      70,
      265,
    );
    ctx.fillStyle = "#171717";
    ctx.font = "700 34px system-ui";
    ctx.fillText("Números de la rifa", 70, 355);
    const sold = new Set(
      numbers?.filter((n) => n.status === "sold").map((n) => n.number) ?? [],
    );
    const canvasNumbers = Array.from(
      { length: 100 },
      (_, number) => number,
    ).filter(
      (number) =>
        numberFilter === "all" ||
        (numberFilter === "sold" ? sold.has(number) : !sold.has(number)),
    );
    const size = 88,
      gap = 18,
      startX = 70,
      startY = 405;
    for (const [index, number] of canvasNumbers.entries()) {
      const x = startX + (index % 10) * (size + gap),
        y = startY + Math.floor(index / 10) * (size + gap);
      ctx.fillStyle = sold.has(number) ? "#e5e7eb" : "#ffffff";
      ctx.strokeStyle = sold.has(number)
        ? "#9ca3af"
        : settingsColor("--primary");
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = sold.has(number) ? "#6b7280" : "#171717";
      ctx.font = "700 28px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(number).padStart(2, "0"), x + size / 2, y + size / 2);
    }
    ctx.textAlign = "left";
    ctx.fillStyle = "#525252";
    ctx.font = "24px system-ui";
    const modeLabel =
      numberFilter === "all"
        ? "Todos los números"
        : numberFilter === "sold"
          ? "Números vendidos"
          : "Números disponibles";
    ctx.fillText(`${modeLabel} · ${canvasNumbers.length} en total`, 70, 1510);
    return canvas;
  };

  const settingsColor = (name: string) =>
    `hsl(${getComputedStyle(document.documentElement).getPropertyValue(name).trim()})`;

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadPdf = async () => {
    setExporting("pdf");
    try {
      const canvas = createRaffleCanvas();
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
        compress: true,
      });
      const image = canvas.toDataURL("image/jpeg", 0.82);
      pdf.addImage(
        image,
        "JPEG",
        0,
        0,
        canvas.width,
        canvas.height,
        undefined,
        "FAST",
      );
      downloadBlob(pdf.output("blob"), `${raffle?.name ?? "rifa"}.pdf`);
      toast({
        title: "PDF generado",
        description: "Revisa las descargas de tu dispositivo.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo generar el PDF",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadImage = async () => {
    setExporting("image");
    try {
      const canvas = createRaffleCanvas();
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(new Error("No se pudo crear el archivo")),
          "image/png",
        ),
      );
      downloadBlob(blob, `${raffle?.name ?? "rifa"}.png`);
      toast({
        title: "Imagen generada",
        description: "Revisa las descargas de tu dispositivo.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo generar la imagen",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadExcel = () => {
    if (!numbers || !buyers) return;
    const buyerById = new Map(buyers.map((buyer) => [buyer.id, buyer]));
    const rows = numbers
      .filter((item) => numberFilter === "all" || item.status === numberFilter)
      .sort((a, b) => a.number - b.number)
      .map((item) => {
        const buyer = item.buyerId ? buyerById.get(item.buyerId) : undefined;
        return {
          Número: item.number,
          Estado: item.status === "sold" ? "Vendido" : "Disponible",
          Pago:
            item.status === "sold"
              ? item.paymentStatus === "paid"
                ? "Pagado"
                : "Pendiente"
              : "—",
          Comprador: buyer?.name ?? "",
          Teléfono: buyer?.phone ?? "",
          Email: buyer?.email ?? "",
        };
      });
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet["!cols"] = [
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
      { wch: 28 },
      { wch: 18 },
      { wch: 30 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Números");
    XLSX.writeFile(workbook, `${raffle?.name ?? "rifa"}-${numberFilter}.xlsx`);
    toast({
      title: "Excel generado",
      description: "La descarga respeta el filtro seleccionado.",
    });
  };
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedSoldNum, setSelectedSoldNum] = useState<RaffleNumber | null>(
    null,
  );

  const filteredBuyers = useMemo(() => {
    const query = buyerSearch.trim().toLocaleLowerCase();
    return [...(buyers ?? [])]
      .filter(
        (buyer) =>
          !query ||
          buyer.name.toLocaleLowerCase().includes(query) ||
          buyer.phone?.toLocaleLowerCase().includes(query),
      )
      .sort((a, b) => {
        if (buyerOrder === "name") return a.name.localeCompare(b.name, "es");
        if (buyerOrder === "numbers")
          return (b.numbers?.length ?? 0) - (a.numbers?.length ?? 0);
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [buyerOrder, buyerSearch, buyers]);
  const buyersPerPage = 6;
  const buyerPageCount = Math.max(
    1,
    Math.ceil(filteredBuyers.length / buyersPerPage),
  );
  const visibleBuyers = filteredBuyers.slice(
    (buyerPage - 1) * buyersPerPage,
    buyerPage * buyersPerPage,
  );

  useEffect(() => setBuyerPage(1), [buyerOrder, buyerSearch]);
  useEffect(() => {
    if (buyerPage > buyerPageCount) setBuyerPage(buyerPageCount);
  }, [buyerPage, buyerPageCount]);

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  if (error || !raffle)
    return <div className="text-center py-20">{t("Error al cargar la rifa")}</div>;

  const handleDraw = () => {
    drawMutation.mutate(
      { id: raffleId },
      {
        onSuccess: () => {
          setDrawDialogOpen(false);
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#ff512f", "#f09819", "#ffffff"],
          });
        },
      },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(
      { id: raffleId },
      {
        onSuccess: () => setLocation("/"),
      },
    );
  };

  // Create an array of 100 elements for the grid 0-99
  const gridNumbers = Array.from({ length: 100 }, (_, i) => i).filter(
    (number) => {
      const status =
        numbers?.find((item) => item.number === number)?.status ?? "available";
      return numberFilter === "all" || status === numberFilter;
    },
  );

  // Map API numbers to a fast lookup dictionary
  const numbersMap = new Map(numbers?.map((n) => [n.number, n]));
  const paidNumbers =
    numbers?.filter(
      (number) => number.status === "sold" && number.paymentStatus === "paid",
    ).length ?? 0;
  const pendingNumbers =
    (numbers?.filter((number) => number.status === "sold").length ?? 0) -
    paidNumbers;
  const collectedAmount = paidNumbers * raffle.pricePerNumber;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors font-medium bg-card px-4 py-2 rounded-full shadow-sm border border-border"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("Volver")}
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-card"
            onClick={handleDownloadPdf}
            disabled={exporting !== null}
          >
            {exporting === "pdf" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}{" "}
            PDF
          </Button>
          <Button
            variant="outline"
            className="bg-card"
            onClick={handleDownloadImage}
            disabled={exporting !== null}
          >
            {exporting === "image" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4 mr-2" />
            )}{" "}
            {t("Imagen")}
          </Button>
          <Button
            variant="outline"
            className="bg-card"
            onClick={handleDownloadExcel}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card className="overflow-hidden border-0 shadow-2xl">
        <div className="bg-gradient-to-r from-primary to-accent p-8 text-brand-foreground relative">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Ticket className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-4 max-w-2xl">
              <Badge className="bg-white/20 hover:bg-white/30 text-brand-foreground border-none backdrop-blur-md">
                {raffle.status === "active"
                  ? t("En Curso")
                  : raffle.status === "completed"
                    ? t("Finalizada")
                    : t("Cancelada")}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold text-brand-foreground drop-shadow-sm">
                {raffle.name}
              </h1>
              {raffle.description && (
                <p className="text-brand-foreground/80 text-lg">
                  {raffle.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mt-6">
                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-brand-foreground/70 text-sm">
                      {t("Precio CRC")}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(raffle.pricePerNumber)}
                    </p>
                  </div>
                </div>
                {raffle.drawDate && (
                  <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-brand-foreground/70 text-sm">{t("Sorteo")}</p>
                      <p className="text-xl font-bold">
                        {formatRaffleDate(raffle.drawDate, "d MMM, yyyy")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {raffle.status === "active" && (
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full shadow-2xl shadow-black/20 hover:scale-105"
                onClick={() => setDrawDialogOpen(true)}
                disabled={raffle.soldNumbers === 0 || drawMutation.isPending}
              >
                {drawMutation.isPending ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                {t("Realizar Sorteo")}
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar inside card */}
        <div className="bg-background p-6 border-b border-border/50">
          <div className="flex justify-between text-sm mb-2 font-medium">
            <span className="text-muted-foreground flex items-center">
              <Users className="w-4 h-4 mr-2" /> {t("Números Vendidos")}
            </span>
            <span className="text-primary font-bold">
              {raffle.soldNumbers} de {raffle.totalNumbers}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-primary to-accent h-4 rounded-full transition-all duration-1000 ease-out relative"
              style={{
                width: `${(raffle.soldNumbers / raffle.totalNumbers) * 100}%`,
              }}
            >
              <div className="absolute inset-0 bg-white/20 bg-[length:1rem_1rem] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.15)_25%,rgba(255,255,255,.15)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.15)_75%,rgba(255,255,255,.15)_100%)] animate-[progress-pattern_1s_linear_infinite]" />
            </div>
          </div>
        </div>
      </Card>

      {/* Prizes Section */}
      {(raffle.singlePrizeAmount ||
        (raffle.prizes && raffle.prizes.length > 0)) && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-bold">{t("Premios")}</h2>
              </div>
              {raffle.status === "active" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditPrizesOpen(true)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>
            {raffle.type === "single_amount" && raffle.singlePrizeAmount ? (
              <div className="bg-accent/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-accent">
                  {formatCurrency(raffle.singlePrizeAmount)}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {raffle.prizes?.map((prize, idx) => (
                  <div
                    key={idx}
                    className="bg-muted/50 rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <p className="font-medium">{prize}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Winners Section if completed */}
      {raffle.status === "completed" &&
        raffle.winners &&
        raffle.winners.length > 0 && (
          <Card className="border-4 border-accent shadow-xl bg-gradient-to-br from-card to-accent/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-10 h-10 text-accent drop-shadow-md" />
                <h2 className="text-3xl font-display font-extrabold text-foreground">
                  {t("¡Ganadores!")}
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {raffle.winners.map((winner, idx) => (
                  <div
                    key={idx}
                    className="bg-card rounded-2xl p-6 shadow-sm border border-accent/20 flex items-center gap-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent text-brand-foreground flex items-center justify-center text-2xl font-bold shadow-md shrink-0">
                      {winner.number}
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className="mb-2 bg-accent/10 border-accent/30 text-accent-foreground"
                      >
                        {winner.prize || t("Premio")}
                      </Badge>
                      <p className="font-bold text-xl">{winner.buyerName}</p>
                      <p className="text-muted-foreground text-sm">
                        {winner.buyerPhone || t("Sin teléfono")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Grid & Buyers Layout */}
      <div className="bg-card rounded-3xl border shadow-lg overflow-hidden">
        <div className="flex border-b">
          <button
            className={`flex-1 py-4 font-bold text-lg transition-colors relative ${activeTab === "numbers" ? "text-primary" : "text-muted-foreground hover:bg-muted/50"}`}
            onClick={() => setActiveTab("numbers")}
          >
            {t("Cuadrícula (0-99)")}
            {activeTab === "numbers" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>
          <button
            className={`flex-1 py-4 font-bold text-lg transition-colors relative ${activeTab === "buyers" ? "text-primary" : "text-muted-foreground hover:bg-muted/50"}`}
            onClick={() => setActiveTab("buyers")}
          >
            {t("Compradores")} ({buyers?.length || 0})
            {activeTab === "buyers" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>
        </div>

        <div className="p-6 md:p-8 bg-muted/10 min-h-[500px]">
          {activeTab === "numbers" ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{t("Mostrar y descargar")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("La imagen, el PDF y el Excel usarán esta misma vista.")}
                  </p>
                </div>
                <div
                  className="grid w-full grid-cols-3 rounded-xl bg-muted p-1 sm:w-auto sm:min-w-[22rem]"
                  aria-label={t("Filtrar números")}
                >
                  {(["all", "available", "sold"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => {
                        setNumberFilter(filter);
                        setSelectedNumbers([]);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-center text-sm font-medium transition ${numberFilter === filter ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {filter === "all"
                        ? t("Todos")
                        : filter === "available"
                          ? t("Disponibles")
                          : t("Vendidos")}
                    </button>
                  ))}
                </div>
              </div>
              {assigningBuyer && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <p className="text-sm">
                    <strong>Agregando números a {assigningBuyer.name}.</strong>{" "}
                    Selecciona los números disponibles.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAssigningBuyer(null);
                      setSelectedNumbers([]);
                    }}
                  >
                    {t("Cancelar")}
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-5 md:grid-cols-10 md:gap-3">
                {gridNumbers.map((num) => {
                  const info = numbersMap.get(num);
                  const isSold = info?.status === "sold";

                  return (
                    <button
                      key={num}
                      onClick={() => {
                        if (raffle.status !== "active") return;
                        if (isSold) {
                          setSelectedSoldNum(info);
                        } else
                          setSelectedNumbers((current) =>
                            current.includes(num)
                              ? current.filter((number) => number !== num)
                              : [...current, num].sort((a, b) => a - b),
                          );
                      }}
                      disabled={raffle.status !== "active" && !isSold}
                      className={`
                      aspect-square rounded-xl md:rounded-2xl flex items-center justify-center font-display font-bold text-xl transition-all duration-200
                      ${
                        isSold
                          ? "bg-muted border border-border text-muted-foreground cursor-pointer hover:bg-muted/80 shadow-inner"
                          : selectedNumbers.includes(num)
                            ? "bg-primary border-2 border-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg cursor-pointer"
                            : "bg-card border-2 border-border text-foreground hover:border-primary hover:text-primary hover:shadow-lg hover:-translate-y-1 hover:bg-primary/5 cursor-pointer shadow-sm"
                      }
                      ${raffle.status !== "active" && !isSold ? "opacity-50 cursor-not-allowed hover:transform-none hover:border-border hover:shadow-none hover:text-foreground" : ""}
                    `}
                    >
                      <span>{num}</span>
                      {!isSold && selectedNumbers.includes(num) && (
                        <CheckCircle2 className="absolute top-1 right-1 w-4 h-4" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {t("Cobrado")}
                  </p>
                  <p className="text-xl font-bold text-green-700">
                    {formatCurrency(collectedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {t("Pagados")}
                  </p>
                  <p className="text-xl font-bold">{paidNumbers}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {t("Pendientes")}
                  </p>
                  <p className="text-xl font-bold text-amber-700">
                    {pendingNumbers}
                  </p>
                </div>
                {raffle.type === "single_amount" && raffle.singlePrizeAmount ? (
                  <div className="border-t pt-3 sm:col-span-3">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <CircleDollarSign className="h-4 w-4" />
                      {collectedAmount >= raffle.singlePrizeAmount
                        ? t("El monto del premio ya está cubierto.")
                        : `Faltan ${formatCurrency(raffle.singlePrizeAmount - collectedAmount)} para cubrir el premio.`}
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={buyerSearch}
                    onChange={(event) => setBuyerSearch(event.target.value)}
                    placeholder={t("Buscar por nombre o teléfono")}
                    className="pl-9"
                    aria-label={t("Buscar comprador por nombre o teléfono")}
                  />
                </div>
                <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">
                  {t("Ordenar")}
                  <span className="relative min-w-0 flex-1">
                  <select
                    value={buyerOrder}
                    onChange={(event) =>
                      setBuyerOrder(event.target.value as typeof buyerOrder)
                    }
                    className="h-9 w-full appearance-none rounded-md border bg-background pl-3 pr-10 text-sm"
                  >
                    <option value="recent">{t("Más recientes")}</option>
                    <option value="name">{t("Nombre A–Z")}</option>
                    <option value="numbers">{t("Más números")}</option>
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </span>
                </label>
              </div>
              {!buyers?.length ? (
                <div className="text-center py-20 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">{t("No hay compradores registrados aún.")}</p>
                </div>
              ) : filteredBuyers.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Search className="mx-auto mb-3 h-10 w-10 opacity-25" />
                  {t("No encontramos compradores con esa búsqueda.")}
                </div>
              ) : (
                visibleBuyers.map((buyer) => {
                  const buyerNumbers =
                    numbers?.filter((item) => item.buyerId === buyer.id) ?? [];
                  const allPaid =
                    buyerNumbers.length > 0 &&
                    buyerNumbers.every((item) => item.paymentStatus === "paid");
                  return (
                    <div
                      key={buyer.id}
                      className="bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col gap-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                          {buyer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{buyer.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            {buyer.phone && (
                              <span className="flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {buyer.phone}
                              </span>
                            )}
                            {buyer.email && (
                              <span className="flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {buyer.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {buyerNumbers.map((item) => (
                          <button
                            key={item.number}
                            type="button"
                            disabled={paymentMutation.isPending}
                            onClick={() =>
                              paymentMutation.mutate({
                                id: raffleId,
                                numbers: [item.number],
                                paymentStatus:
                                  item.paymentStatus === "paid"
                                    ? "pending"
                                    : "paid",
                              })
                            }
                            aria-label={`Marcar número ${item.number} como ${item.paymentStatus === "paid" ? "pendiente" : "pagado"}`}
                          >
                            <Badge
                              variant="outline"
                              className={`cursor-pointer transition hover:brightness-95 ${item.paymentStatus === "paid" ? "border-green-300 bg-green-50 text-green-700" : "border-amber-300 bg-amber-50 text-amber-700"}`}
                            >
                              #{item.number} ·{" "}
                              {item.paymentStatus === "paid"
                                ? "Pagado"
                                : "Pendiente"}
                            </Badge>
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAssigningBuyer(buyer);
                            setSelectedNumbers([]);
                            setActiveTab("numbers");
                            toast({
                              title: `Agregando números a ${buyer.name}`,
                              description:
                                "Selecciona uno o varios números disponibles en la cuadrícula.",
                            });
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar números
                        </Button>
                        <Button
                          variant={allPaid ? "outline" : "default"}
                          disabled={paymentMutation.isPending}
                          onClick={() =>
                            paymentMutation.mutate({
                              id: raffleId,
                              numbers: buyerNumbers.map((item) => item.number),
                              paymentStatus: allPaid ? "pending" : "paid",
                            })
                          }
                        >
                          {allPaid ? (
                            <Clock3 className="mr-2 h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Marcar todos como {allPaid ? "pendientes" : "pagados"}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            try {
                              await downloadBuyerConfirmation(
                                raffle,
                                buyer,
                                numbers ?? [],
                              );
                              toast({
                                title: "Confirmación descargada",
                                description:
                                  "La imagen está lista para enviarla al comprador.",
                              });
                            } catch (error) {
                              toast({
                                variant: "destructive",
                                title: "No se pudo crear la confirmación",
                                description:
                                  error instanceof Error
                                    ? error.message
                                    : "Intenta nuevamente.",
                              });
                            }
                          }}
                        >
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Descargar confirmación
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
              {filteredBuyers.length > buyersPerPage && (
                <div className="flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {buyerPage} de {buyerPageCount} ·{" "}
                    {filteredBuyers.length} compradores
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={buyerPage === 1}
                      onClick={() => setBuyerPage((page) => page - 1)}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={buyerPage === buyerPageCount}
                      onClick={() => setBuyerPage((page) => page + 1)}
                    >
                      Siguiente <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedNumbers.length > 0 && !assignDialogOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-1 sm:px-6">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedNumbers([]);
                setAssigningBuyer(null);
              }}
              className="shrink-0"
            >
              Cancelar
            </Button>
            <p className="hidden flex-1 text-sm text-muted-foreground sm:block">
              <strong className="text-foreground">
                {selectedNumbers.length}
              </strong>{" "}
              {selectedNumbers.length === 1
                ? "número seleccionado"
                : "números seleccionados"}
            </p>
            <Button
              size="lg"
              className="ml-auto flex-1 sm:flex-none"
              onClick={() => setAssignDialogOpen(true)}
            >
              <User className="mr-2 h-5 w-5" />
              {assigningBuyer
                ? `Agregar a ${assigningBuyer.name}`
                : `Asignar ${selectedNumbers.length} ${selectedNumbers.length === 1 ? "número" : "números"}`}
            </Button>
          </div>
        </div>
      )}

      {assignDialogOpen && selectedNumbers.length > 0 && (
        <AssignDialog
          isOpen={true}
          onClose={() => setAssignDialogOpen(false)}
          onAssigned={() => {
            setSelectedNumbers([]);
            setAssigningBuyer(null);
          }}
          raffleId={raffleId}
          numbers={selectedNumbers}
          existingBuyer={assigningBuyer}
        />
      )}

      {selectedSoldNum && (
        <BuyerInfoDialog
          isOpen={true}
          onClose={() => setSelectedSoldNum(null)}
          raffle={raffle}
          buyer={
            buyers?.find((buyer) => buyer.id === selectedSoldNum.buyerId) ??
            null
          }
          numbers={numbers ?? []}
          numberInfo={selectedSoldNum}
        />
      )}

      {editPrizesOpen && (
        <EditPrizesDialog
          isOpen={true}
          onClose={() => setEditPrizesOpen(false)}
          raffle={raffle}
        />
      )}

      <AlertDialog open={drawDialogOpen} onOpenChange={setDrawDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Realizar el sorteo ahora?</AlertDialogTitle>
            <AlertDialogDescription>
              Se elegirán los ganadores entre los números vendidos y la rifa
              quedará finalizada. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={drawMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDraw();
              }}
              disabled={drawMutation.isPending}
            >
              {drawMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Realizar sorteo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta rifa?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán permanentemente la rifa, sus compradores, números
              asignados y resultados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar rifa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
