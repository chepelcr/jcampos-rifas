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
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const [releaseConfirmationOpen, setReleaseConfirmationOpen] = useState(false);

  if (!numberInfo) return null;

  const handleRelease = () => {
    releaseMutation.mutate(
      { id: raffle.id, number: numberInfo.number },
      { onSuccess: () => { setReleaseConfirmationOpen(false); onClose(); } },
    );
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
            onClick={() => setReleaseConfirmationOpen(true)}
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
      <AlertDialog open={releaseConfirmationOpen} onOpenChange={setReleaseConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Liberar el número {numberInfo.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              El número quedará disponible y dejará de pertenecer a {buyer?.name ?? "su comprador actual"}.
              {buyer?.numbers?.length === 1 ? " Como este es su último número, el comprador desaparecerá de la lista." : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={releaseMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={releaseMutation.isPending} onClick={(event) => { event.preventDefault(); handleRelease(); }}>
              {releaseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Liberar número
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
