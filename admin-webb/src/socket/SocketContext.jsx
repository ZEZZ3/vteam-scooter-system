import {createContext, useEffect, useState} from "react";
import { io } from "socket.io-client";
import { getBikes } from "../lib/api"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
export const SocketCtx = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [bikes, setBikes] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loadingBikes, setLoadingBikes] = useState(true);
  const [refetch, setRefetch] = useState(0);

  useEffect(()=>{

    async function loadBikes() {
        try {
            const data = await getBikes();
            setBikes(data);
        } catch (e) {
            console.log("Fel när scootrar skulle laddas in: ", e)
        } finally {
            setLoadingBikes(false);
        }
    }
    loadBikes();

    const socketInst = io(API_BASE, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 6000,
        reconnectionAttempts: 10
    });

    socketInst.on("connect", () => {
        console.log("Socket connected.");
        socketInst.emit("client-connect");
        setConnected(true);
    });

    socketInst.on("bikes-list", (data) => {
        setBikes(data);
    });

    socketInst.on("bike-position", (data) => {
        console.log(data)
        setBikes((p) =>
            p.map((b) =>
                b._id === data.bikeID ? 
            {
                ...b,
                status: data.status,
                position: data.position,
                battery: data.battery,
                updatedAt: data.broadcastAt
            } : b
        ));
    });

    socketInst.on("error", (e) => {
        console.log("Error: ", e)
    });

    socketInst.on("disconnect", () => {
        console.log("Socket disconnected")
        setConnected(false);
    })

    setSocket(socketInst);

    return () => {
        socketInst.disconnect();
    }
  }, [refetch]);

/*   const updateBikes = (b) => {
    setBikes(b);
  } */

  return (
    <SocketCtx.Provider value={{ socket, bikes, connected, loadingBikes, triggerRefetch: () => setRefetch(r => r + 1)}}>{children}</SocketCtx.Provider>
  )


}