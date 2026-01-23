const constants = {}
constants.STOCKHOLM_LAT_MAX = 59.360000;
constants.STOCKHOLM_LAT_MIN = 59.270000;
constants.STOCKHOLM_LONG_MAX = 18.210000;
constants.STOCKHOLM_LONG_MIN = 17.900000;

constants.MAX_RETRY = 10;
constants.RETRY_DELAY = 2000;
constants.BROADCAST_RATE = 4000;
constants.EARTH_RADIUS = 6371000;

constants.SIMULATION_RATE = 1000;
constants.BIKE_LIMIT = 2000;
constants.SIMULATION_REROUTE_LIMIT = 5;
constants.SIMULATION_MOVE_LIMIT = 4000; // backup if something makes a bike not finish

constants.HELP = `
        Use 'simulate' to start a simulation.
        To start a simulation with X bikes that run Y routes each:
            >   simulate start bikes <X> routes <Y>
        
        **note: this will run X * Y simulations, use reasonable numbers or be ready to wait
        ---

        To start a simulation with X bikes that each run 1 route:
            >   simulate start bikes <X> 
        ---

        To view log of simulation:
            > simulate log
        **note: this result is overwritten every time the simulation starts, 
                simulation recap history is accesible on the admin page.
        ---

        To stop a simulation:
            >   simulate stop
        **note: progress may be lost if simulation isnt finished. this is a forceful exit.
        ---

        Use 'set' to configure:
            >   set 'parameter' <value>
        Available parameters: 
            - broadcastEnable: <true/false> (default=true)
            - broadcastRate: <rate in ms> (default=4000)
            - tickrate: <rate in ms> (default=1000)
            - tickLimit: max simulation tick (default=4000)
        ---

        Use 'config' to see configuration:
            >   config 

        Use 'enable' to enable broadcast of all bikes:
            >   enable

        Use 'exit' to terminate server:
            >   exit
        `

module.exports = {
    constants
}