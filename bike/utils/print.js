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

function runtimePrint(simulationMoveCount, simulationMoveLimit, done, bikesSize, bc, br, tr, shortest, longest) {
    staticPrintLines([
        `${getTimeString()} [Simulation]` ,
        `------------------------------------------`,
        `tick: ${simulationMoveCount}/${simulationMoveLimit}`,
        `shortest route: ${shortest} ticks`,
        `longest route: ${longest} ticks`,
        `bikes finished: ${done}/${bikesSize}`,
        `broadcasts: ${bc}`,
        `broadcast rate: ${br} ms, tickrate: ${tr} ms`,
        `------------------------------------------`
    ]);
}

function runtimePrintLoop(
    simulationMoveCount, 
    simulationMoveLimit,
    done, 
    broadcastCount,
    broadcastRate,
    tickRate,
    shortest, 
    longest, 
    active,
    totalBikes,
    sampleBikes
) {
    let bikeStr = "";
    for (const bike of sampleBikes) {
        bikeStr += `B${bike.number}: ${bike.routeStep}/${bike.routeLen} (${bike.runs}) | `
    }

    staticPrintLines([
        `${getTimeString()} [Simulation]` ,
        `------------------------------------------`,
        `tick: ${simulationMoveCount}/${simulationMoveLimit}`,
        `${bikeStr}`,
        `shortest route: ${shortest} ticks | longest route: ${longest} ticks`,
        `bikes finished: ${done}`,
        `active: ${active}/${totalBikes}`,
        `broadcasts: ${broadcastCount}`,
        `broadcast rate: ${broadcastRate} ms, tickrate: ${tickRate} ms`,
        `------------------------------------------`
    ]);
}


function clearScreen() {
    for (let i = 0; i < SINGLE_RUN_PRINT_ROWS; i++) {
        console.log("");
    }
}

function simulationRecapSingle(bikes, finishedSimulatedRoutes) {
    console.log("------------------------------------------");
    print("Simulation", "Simulation recap");
    console.log("------------------------------------------");
    console.log(`Simulated: ${bikes.size}.`)
    console.log(`Finished: ${finishedSimulatedRoutes} routes.`)
    
    let totalSteps = 0;
    let totalOsrm = 0;
    let totalCalc = 0;
    for (const bike of bikes.values()) {
        const run = bike.simulationRuns[bike.simulationRunIndex];
        totalSteps += run.routeLength;
        totalOsrm += run.preDefinedRouteDistance;
        totalCalc += run.calcDistance;
    }
    const averageRouteLength = totalSteps/bikes.size
    const averageOsrm = totalOsrm/bikes.size
    const averageCalc = totalCalc/bikes.size
    
    console.log(`Average route length was ${averageRouteLength.toFixed(2)} steps.`)
    console.log(`Average route distance by osrm estimation was ${averageOsrm.toFixed(2)}m.`)
    console.log(`Average route distance by server-side haversine calculation was ${averageCalc.toFixed(2)}m.`)
    console.log("For a full simulation log use 'simulate result")

}

function simulationRecapLoop(bikes, config, finishedSimulatedRoutes, simulationMoveCounter) {
    console.log("------------------------------------------");
    print("Simulation", "Simulation recap");
    console.log("------------------------------------------");
    console.log("Finished routes: ", finishedSimulatedRoutes)
    console.log("Expect: ", config.simulationReRouteLimit * bikes.size);
    console.log("Finished routes can vary depending on the set ticklimit.");
    for (const bike of bikes.values()) {
        const runs = bike.simulationRuns;
        
        console.log(`Bike: ${bike.id} ran ${runs.length} routes. `);
        let runNum = 1;
        runs.forEach(run => {
            console.log(`
                tick: ${run.lastTick}/${simulationMoveCounter}
                Route ${runNum}: ${run.endStamp.startStationName} -> ${run.endStamp.endStationName}. 
                End as excpected: ${run.endStamp.endStationName === run.expectedEndStation}
                steps: ${run.routeLength}
                calc-distance: ${run.calcDistance.toFixed(1)}
                osrm-distance: ${run.preDefinedRouteDistance.toFixed(1)}
                `
            )
            runNum++;
        });
        console.log("----------------------------------------")
    }
}

function logDump(log) {
    console.log("----------------------------------------")
    print("Simulation", "Simulation log dump")
    console.log("----------------------------------------")
    for (const entry of log) {
        console.log(
            `Tick: ${entry.tick}
                shortestRoute: ${entry.shortestRoute} steps
                longestRoute: ${entry.longestRoute} steps
                finished: ${entry.finishedBikes} bikes
                errors: ${entry.errors.length}
                ${entry.active ? "active bikes: " + entry.active : ""}
                ${entry.status ? "status: " + entry.status : ""}
            `
        );
    }
}

function config(configuration) {
    console.log(`
        broadcastEnable: ${configuration.broadcastEnable}
        broadcastRate: ${configuration.broadcastRate}
        tickrate: ${configuration.simulationRate}
        ticklimit: ${configuration.simulationMoveLimit}
    `);
}

module.exports = {
    getTimeString,
    print,
    coordToString,
    staticPrint,
    runtimePrint,
    runtimePrintLoop,
    clearScreen,
    simulationRecapSingle,
    simulationRecapLoop,
    logDump,
    config
}