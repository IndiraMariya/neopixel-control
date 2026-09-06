import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CHAR_ALL_UUID, CHAR_SCHEME_UUID, CHAR_STRIP_UUIDS, SERVICE_UUID, STRIPS } from "@/lib/ble";
import { hexToRgb } from "@/lib/color";

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export function useNeoPixelBLE() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const bluetoothSupported = typeof navigator !== "undefined" && !!navigator.bluetooth;

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const stripCharsRef = useRef<BluetoothRemoteGATTCharacteristic[]>([]);
  const allCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const schemeCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  const handleDisconnected = useCallback(() => {
    setStatus("disconnected");
    setDeviceName(null);
  }, []);

  useEffect(() => {
    return () => {
      deviceRef.current?.removeEventListener("gattserverdisconnected", handleDisconnected);
    };
  }, [handleDisconnected]);

  const connect = useCallback(async () => {
    if (status === "connected") {
      deviceRef.current?.gatt?.disconnect(); // triggers handleDisconnected via the event listener
      return;
    }
    if (!navigator.bluetooth) {
      toast.error("Web Bluetooth isn't available in this browser.");
      return;
    }
    setStatus("connecting");
    try {
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: [SERVICE_UUID] }] });
      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      stripCharsRef.current = await Promise.all(CHAR_STRIP_UUIDS.map((uuid) => service.getCharacteristic(uuid)));
      allCharRef.current = await service.getCharacteristic(CHAR_ALL_UUID);
      schemeCharRef.current = await service.getCharacteristic(CHAR_SCHEME_UUID);

      device.addEventListener("gattserverdisconnected", handleDisconnected);
      deviceRef.current = device;
      setDeviceName(device.name || "Connected");
      setStatus("connected");
      toast.success(`Connected to ${device.name || "chandelier"}`);
    } catch (err) {
      const error = err as Error;
      setStatus("disconnected");
      const cancelled = error.name === "NotFoundError";
      toast[cancelled ? "message" : "error"](cancelled ? "No device selected" : `Connection failed: ${error.message}`);
    }
  }, [status, handleDisconnected]);

  async function writeChar(char: BluetoothRemoteGATTCharacteristic | null, value: string) {
    if (!char) return;
    try {
      await char.writeValue(new TextEncoder().encode(value));
    } catch (err) {
      console.error(err);
      toast.error("Write failed — check the connection.");
    }
  }

  const writeStrip = useCallback((index: number, hex: string, brightness: number) => {
    const [r, g, b] = hexToRgb(hex);
    return writeChar(stripCharsRef.current[index] ?? null, `${r},${g},${b},${brightness}`);
  }, []);

  const writeAll = useCallback((hex: string, brightness: number) => {
    const [r, g, b] = hexToRgb(hex);
    return writeChar(allCharRef.current, `${r},${g},${b},${brightness}`);
  }, []);

  const writeScheme = useCallback((name: string) => {
    return writeChar(schemeCharRef.current, name);
  }, []);

  return {
    status,
    deviceName,
    bluetoothSupported,
    stripCount: STRIPS.length,
    connect,
    writeStrip,
    writeAll,
    writeScheme,
  };
}
