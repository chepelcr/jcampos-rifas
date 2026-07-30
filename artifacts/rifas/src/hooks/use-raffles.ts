import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AssignNumberInput,
  Buyer,
  CreateRaffleInput,
  DrawResult,
  Raffle,
  RaffleDetail,
  RaffleNumber,
  UpdateRaffleInput,
  Winner,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "rifas-local-data-v1";
const rafflesKey = ["local", "raffles"] as const;

type StoredRaffle = RaffleDetail & {
  numbers: RaffleNumber[];
  buyers: Buyer[];
  winners: Winner[];
};

type Store = { version: 1; nextRaffleId: number; nextBuyerId: number; raffles: StoredRaffle[] };

const emptyStore = (): Store => ({ version: 1, nextRaffleId: 1, nextBuyerId: 1, raffles: [] });

function readStore(): Store {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyStore();
  try {
    return { ...emptyStore(), ...JSON.parse(raw) } as Store;
  } catch {
    throw new Error("No fue posible leer los datos guardados en este dispositivo.");
  }
}

function writeStore(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function summary(raffle: StoredRaffle): Raffle {
  const { numbers: _numbers, buyers: _buyers, winners: _winners, ...result } = raffle;
  return result;
}

function requireRaffle(store: Store, id: number) {
  const raffle = store.raffles.find((item) => item.id === id);
  if (!raffle) throw new Error("La rifa no existe en este dispositivo.");
  return raffle;
}

function useLocalMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => TData,
  success: { title: string; description: string },
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (variables: TVariables) => mutationFn(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rafflesKey });
      toast(success);
    },
    onError: (error: Error) =>
      toast({ variant: "destructive", title: "Error", description: error.message }),
  });
}

export function useRaffles() {
  return useQuery({ queryKey: rafflesKey, queryFn: async () => readStore().raffles.map(summary) });
}

export function useRaffle(id: number) {
  return useQuery({ queryKey: [...rafflesKey, id], queryFn: async () => requireRaffle(readStore(), id) });
}

export function useRaffleNumbers(id: number) {
  return useQuery({ queryKey: [...rafflesKey, id, "numbers"], queryFn: async () => requireRaffle(readStore(), id).numbers });
}

export function useRaffleBuyers(id: number) {
  return useQuery({
    queryKey: [...rafflesKey, id, "buyers"],
    queryFn: async () => {
      const raffle = requireRaffle(readStore(), id);
      const assigned = new Set(raffle.numbers.flatMap((number) => number.buyerId ? [number.buyerId] : []));
      return raffle.buyers.filter((buyer) => assigned.has(buyer.id)).map((buyer) => ({
        ...buyer,
        numbers: raffle.numbers.filter((number) => number.buyerId === buyer.id).map((number) => number.number),
      }));
    },
  });
}

export function useCreateRaffleWrapper() {
  return useLocalMutation<Raffle, { data: CreateRaffleInput }>(({ data }) => {
    const store = readStore();
    const id = store.nextRaffleId++;
    const numbers = Array.from({ length: 100 }, (_, number): RaffleNumber => ({
      id: id * 100 + number,
      raffleId: id,
      number,
      status: "available",
      buyerId: null,
      buyerName: null,
    }));
    const raffle: StoredRaffle = {
      ...data,
      id,
      description: data.description ?? null,
      drawDate: data.drawDate ?? null,
      prizeImage: data.prizeImage ?? null,
      prizes: data.prizes ?? null,
      singlePrizeAmount: data.singlePrizeAmount ?? null,
      status: "active",
      totalNumbers: 100,
      soldNumbers: 0,
      createdAt: new Date().toISOString(),
      numbers,
      buyers: [],
      winners: [],
    };
    store.raffles.push(raffle);
    writeStore(store);
    return summary(raffle);
  }, { title: "Rifa creada", description: "Se guardó de forma segura en este dispositivo." });
}

export function useUpdateRaffleWrapper() {
  return useLocalMutation<StoredRaffle, { id: number; data: UpdateRaffleInput }>(({ id, data }) => {
    const store = readStore();
    const raffle = requireRaffle(store, id);
    Object.assign(raffle, data);
    writeStore(store);
    return raffle;
  }, { title: "Rifa actualizada", description: "Los cambios se guardaron localmente." });
}

export function useDeleteRaffleWrapper() {
  return useLocalMutation<void, { id: number }>(({ id }) => {
    const store = readStore();
    store.raffles = store.raffles.filter((raffle) => raffle.id !== id);
    writeStore(store);
  }, { title: "Rifa eliminada", description: "La rifa fue eliminada de este dispositivo." });
}

export function useAssignNumberWrapper() {
  return useLocalMutation<RaffleNumber, { id: number; number: number; data: AssignNumberInput }>(({ id, number, data }) => {
    const store = readStore();
    const raffle = requireRaffle(store, id);
    const raffleNumber = raffle.numbers.find((item) => item.number === number);
    if (!raffleNumber || raffleNumber.status === "sold") throw new Error("Este número ya no está disponible.");
    let buyer = raffle.buyers.find((item) => item.name.trim().toLocaleLowerCase() === data.buyerName.trim().toLocaleLowerCase());
    if (!buyer) {
      buyer = { id: store.nextBuyerId++, raffleId: id, name: data.buyerName.trim(), phone: data.buyerPhone || null, email: data.buyerEmail || null, numbers: [], createdAt: new Date().toISOString() };
      raffle.buyers.push(buyer);
    }
    raffleNumber.status = "sold";
    raffleNumber.buyerId = buyer.id;
    raffleNumber.buyerName = buyer.name;
    raffle.soldNumbers = raffle.numbers.filter((item) => item.status === "sold").length;
    writeStore(store);
    return raffleNumber;
  }, { title: "Número asignado", description: "La asignación quedó guardada en el dispositivo." });
}

export function useAssignNumbersWrapper() {
  return useLocalMutation<RaffleNumber[], { id: number; numbers: number[]; data: AssignNumberInput }>(({ id, numbers, data }) => {
    const store = readStore();
    const raffle = requireRaffle(store, id);
    const uniqueNumbers = [...new Set(numbers)];
    if (!uniqueNumbers.length) throw new Error("Selecciona al menos un número.");
    const selected = uniqueNumbers.map((number) => raffle.numbers.find((item) => item.number === number));
    if (selected.some((number) => !number || number.status === "sold")) {
      throw new Error("Uno de los números seleccionados ya no está disponible.");
    }
    let buyer = raffle.buyers.find((item) => item.name.trim().toLocaleLowerCase() === data.buyerName.trim().toLocaleLowerCase());
    if (!buyer) {
      buyer = { id: store.nextBuyerId++, raffleId: id, name: data.buyerName.trim(), phone: data.buyerPhone || null, email: data.buyerEmail || null, numbers: [], createdAt: new Date().toISOString() };
      raffle.buyers.push(buyer);
    }
    const assigned = selected as RaffleNumber[];
    assigned.forEach((raffleNumber) => {
      raffleNumber.status = "sold";
      raffleNumber.buyerId = buyer.id;
      raffleNumber.buyerName = buyer.name;
    });
    raffle.soldNumbers = raffle.numbers.filter((item) => item.status === "sold").length;
    writeStore(store);
    return assigned;
  }, { title: "Números asignados", description: "Todas las asignaciones quedaron guardadas en el dispositivo." });
}

export function useReleaseNumberWrapper() {
  return useLocalMutation<RaffleNumber, { id: number; number: number }>(({ id, number }) => {
    const store = readStore();
    const raffle = requireRaffle(store, id);
    const raffleNumber = raffle.numbers.find((item) => item.number === number);
    if (!raffleNumber) throw new Error("No se encontró el número.");
    raffleNumber.status = "available";
    raffleNumber.buyerId = null;
    raffleNumber.buyerName = null;
    raffle.soldNumbers = raffle.numbers.filter((item) => item.status === "sold").length;
    writeStore(store);
    return raffleNumber;
  }, { title: "Número liberado", description: "El número está disponible nuevamente." });
}

export function useDrawRaffleWrapper() {
  return useLocalMutation<DrawResult, { id: number }>(({ id }) => {
    const store = readStore();
    const raffle = requireRaffle(store, id);
    const sold = raffle.numbers.filter((number) => number.status === "sold");
    if (!sold.length) throw new Error("Debe asignar al menos un número antes del sorteo.");
    const shuffled = [...sold].sort(() => Math.random() - 0.5);
    const prizes = raffle.type === "multiple_prizes" && raffle.prizes?.length
      ? raffle.prizes
      : [raffle.singlePrizeAmount ? `₡${raffle.singlePrizeAmount.toLocaleString("es-CR")}` : "Premio"];
    raffle.winners = prizes.slice(0, shuffled.length).map((prize, index) => {
      const number = shuffled[index];
      const buyer = raffle.buyers.find((item) => item.id === number.buyerId);
      return { number: number.number, buyerName: buyer?.name ?? "Desconocido", buyerPhone: buyer?.phone ?? null, prize };
    });
    raffle.status = "completed";
    writeStore(store);
    return { raffleId: id, winners: raffle.winners };
  }, { title: "¡Sorteo realizado!", description: "Los resultados quedaron guardados localmente." });
}

export function exportLocalBackup() {
  return localStorage.getItem(STORAGE_KEY) ?? JSON.stringify(emptyStore());
}

export function importLocalBackup(raw: string) {
  const parsed = JSON.parse(raw) as Store;
  if (parsed.version !== 1 || !Array.isArray(parsed.raffles)) throw new Error("El archivo de respaldo no es válido.");
  writeStore(parsed);
}
