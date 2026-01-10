const readline = require("readline");
const SINGLE_RUN_PRINT_ROWS = 9;

function getTimeString() {
    const now = new Date();
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const hours = now.getHours().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`
}

function print(source, text) {
    console.log(`${getTimeString()} [${source}] ${text}`);
}

function coordToString(lat, long) {
    return `${lat.toFixed(6)},${long.toFixed(6)}`
}

function staticPrint(text) {
    process.stdout.write("\x1b[s")
    process.stdout.write("\x1b[1A"); 
    process.stdout.write("\r\x1b[2K");
    process.stdout.write(text);  
    process.stdout.write("\x1b[u");
}

function staticPrintLines(lines) {
    process.stdout.write("\x1b[s");
    for (let i = 0; i < lines.length; i++) {
        readline.moveCursor(process.stdout, 0, -1);
    }
    for (const line of lines) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(line + "\n");
    }
    process.stdout.write("\x1b[u");
}

function runtimePrint(sMC, sML, done, bikes, bc, br, tr, sr, lr) {
    staticPrintLines([
        `${getTimeString()} [Simulation]` ,
        `------------------------------------------`,
        `tick: ${sMC}/${sML}`,
        `shortest route: ${sr} ticks`,
        `longest route: ${lr} ticks`,
        `bikes finished: ${done}/${bikes}`,
        `broadcasts: ${bc}`,
        `broadcast rate: ${br} ms, tickrate: ${tr} ms`,
        `------------------------------------------`
    ]);
}

function clearScreen() {
    for (let i = 0; i < SINGLE_RUN_PRINT_ROWS; i++) {
        console.log("");
    }
}

/*     console.log("----------------------------------------")
    printer.print("Simulation", "Simulation recap")
    console.log("----------------------------------------")
    console.log("Finished routes: ", finishedSimulatedRoutes)
    for (const bike of bikes.values()) {
        const run = bike.simulationRuns[bike.simulationRunIndex];
        const endStamp = run.endStamp;
        console.log(
            `
            Bike: ${bike.id}
            Start station: ${endStamp.startStationName}, ID: ${endStamp.startStationID}
            End station: ${endStamp.endStationName}, ID: ${endStamp.endStationID}
            Start zone: ${endStamp.startZoneName}, ID: ${endStamp.startZoneID}
            End zone: ${endStamp.endZoneName}, ID: ${endStamp.endZoneID}
            Expected End Station: ${run.expectedEndStation}
            Route steps: ${run.routeLength}
            osrm-distance: ${run.preDefinedRouteDistance}
            calc-distance: ${run.calcDistance}
            End on tick: ${run.lastTick}
            Finished at: ${run.finishAt}`
        );
    } */

module.exports = {
    getTimeString,
    print,
    coordToString,
    staticPrint,
    runtimePrint,
    clearScreen
}