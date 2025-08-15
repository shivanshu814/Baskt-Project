// getBinanceData.ts
import axios from "axios";
import https from "https";
import dns from "dns";

// Prefer IPv4 (Node 17+). Safe no-op on older versions.
dns.setDefaultResultOrder?.("ipv4first");

// Reuse sockets & force IPv4 only.
export const agent = new https.Agent({ family: 4, keepAlive: true });
export const timeout = 5000;