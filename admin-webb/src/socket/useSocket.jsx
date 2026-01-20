import {useContext} from "react";
import { SocketCtx } from "./SocketContext";

export function useSocket() {
    const context = useContext(SocketCtx);
    if (!context) {
        throw new Error("useSocket needs to be in the SocketContext");
    }
    return context;
}