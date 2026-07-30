import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReleaseNumberWrapper } from "@/hooks/use-raffles";
import { downloadBuyerConfirmation } from "@/lib/buyer-confirmation";
import { Download, Loader2, Unlock, User } from "lucide-react";
import type { Buyer, Raffle, RaffleNumber } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  raffle: Raffle;
  buyer: Buyer | null;
  numbers: RaffleNumber[];
  numberInfo: RaffleNumber | null;
};

export function BuyerInfoDialog({
  isOpen,
  onClose,
  raffle,
  buyer,
  numbers,
  numberInfo,
}: Props) {
  const releaseMutation = useReleaseNumberWrapper();
  const { toast } = useToast();

  if (!numberInfo) return null;

  const handleRelease = () => {
    if (
      confirm(
        `¿Estás seguro de liberar el número ${numberInfo.number}? Perderá su dueño actual.`,
      )
    ) {
      releaseMutation.mutate(
        { id: raffle.id, number: numberInfo.number },
        { onSuccess: onClose },
      );
    }
  };

  const handleConfirmation = async () => {
    if (!buyer) return;
    try {
      await downloadBuyerConfirmation(raffle, buyer, numbers);
      toast({
        title: "Confirmación descargada",
        description: "La imagen está lista para enviarla al comprador.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo crear la confirmación",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-3xl font-bold text-muted-foreground shadow-inner">
            {numberInfo.number}
          </div>
          <DialogTitle className="text-center text-2xl">
            Número vendido
          </DialogTitle>
          <DialogDescription className="text-center">
            Consulta el comprador, descarga su confirmación o libera el número.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4 rounded-2xl border border-secondary/20 bg-secondary/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary-foreground">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Comprador</p>
              <p className="text-lg font-bold">
                {buyer?.name || numberInfo.buyerName || "Desconocido"}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3 pt-4">
          <Button
            className="w-full"
            variant="secondary"
            disabled={!buyer}
            onClick={handleConfirmation}
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar confirmación del comprador
          </Button>
          <Button
            variant="destructive"
            className="w-full border-none bg-red-100 text-red-700 shadow-none hover:bg-red-200"
            onClick={handleRelease}
            disabled={releaseMutation.isPending}
          >
            {releaseMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Unlock className="mr-2 h-4 w-4" />
            )}
            Liberar número
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
