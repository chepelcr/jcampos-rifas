import { useQueryClient, UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { 
  useListRaffles as useGenListRaffles,
  useCreateRaffle as useGenCreateRaffle,
  useGetRaffle as useGenGetRaffle,
  useUpdateRaffle as useGenUpdateRaffle,
  useDeleteRaffle as useGenDeleteRaffle,
  useDrawRaffle as useGenDrawRaffle,
  useListRaffleNumbers as useGenListRaffleNumbers,
  useAssignNumber as useGenAssignNumber,
  useReleaseNumber as useGenReleaseNumber,
  useListBuyers as useGenListBuyers,
  getListRafflesQueryKey,
  getGetRaffleQueryKey,
  getListRaffleNumbersQueryKey,
  getListBuyersQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

// Wrapper hooks to handle standard cache invalidation and toast notifications

export function useRaffles() {
  return useGenListRaffles();
}

export function useRaffle(id: number) {
  return useGenGetRaffle(id);
}

export function useRaffleNumbers(id: number) {
  return useGenListRaffleNumbers(id);
}

export function useRaffleBuyers(id: number) {
  return useGenListBuyers(id);
}

export function useCreateRaffleWrapper() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useGenCreateRaffle({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRafflesQueryKey() });
        toast({ title: "Rifa creada", description: "La rifa se ha creado exitosamente." });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message || "No se pudo crear la rifa." });
      }
    }
  });
}

export function useUpdateRaffleWrapper() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGenUpdateRaffle({
    mutation: {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: getListRafflesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRaffleQueryKey(variables.id) });
        toast({ title: "Rifa actualizada", description: "Los cambios han sido guardados." });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message || "No se pudo actualizar." });
      }
    }
  });
}

export function useDeleteRaffleWrapper() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGenDeleteRaffle({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRafflesQueryKey() });
        toast({ title: "Rifa eliminada", description: "La rifa ha sido eliminada permanentemente." });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message || "No se pudo eliminar la rifa." });
      }
    }
  });
}

export function useAssignNumberWrapper() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGenAssignNumber({
    mutation: {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: getListRaffleNumbersQueryKey(variables.id) });
        queryClient.invalidateQueries({ queryKey: getListBuyersQueryKey(variables.id) });
        queryClient.invalidateQueries({ queryKey: getGetRaffleQueryKey(variables.id) });
        toast({ title: "Número asignado", description: `El número ${variables.number} ha sido asignado.` });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message || "No se pudo asignar el número." });
      }
    }
  });
}

export function useReleaseNumberWrapper() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGenReleaseNumber({
    mutation: {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: getListRaffleNumbersQueryKey(variables.id) });
        queryClient.invalidateQueries({ queryKey: getListBuyersQueryKey(variables.id) });
        queryClient.invalidateQueries({ queryKey: getGetRaffleQueryKey(variables.id) });
        toast({ title: "Número liberado", description: `El número ${variables.number} está disponible nuevamente.` });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message || "No se pudo liberar el número." });
      }
    }
  });
}

export function useDrawRaffleWrapper() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGenDrawRaffle({
    mutation: {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: getListRafflesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRaffleQueryKey(variables.id) });
        toast({ title: "¡Sorteo realizado!", description: "Los ganadores han sido seleccionados." });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message || "Ocurrió un error al realizar el sorteo." });
      }
    }
  });
}
