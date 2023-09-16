import axios, { AxiosResponse } from 'axios';
import { propagate, sgp4, twoline2satrec } from 'satellite.js';

/**
 * Class for fetching data from a TLE API endpoint and propagating
 * General usage: construct a PropogationManager object, and use the
 * .propagations field in order to access the propagations dictionary
 */
export class PropagationManager {
    url: string
    satrecs : any
    propagations : any

    /**
     * @param url - API endpoint to get TLEs, requires data in TLE format
     */
    constructor(url : string) {
        this.url = url
        axios({
            method: 'get',
            url: url,
        }).then((response) => {
            const data : string = (response.data) 
            const lines = data.split('\n')
            let satrecs : any = {}  
            let propagations : any = {}
            // console.log(data)
            
            for (let i = 0; i < lines.length - 1; i += 3) {
                const name = lines[i]
                const tle_line_1 = lines[i+1]
                const tle_line_2 = lines[i+2]
                const satrec = twoline2satrec(tle_line_1, tle_line_2)
                satrecs[name] = satrec
            }

            for (let [key, value] of Object.entries(satrecs)) {
                propagations[key] = propagate(satrecs[key], new Date())
            }

            this.satrecs = satrecs
            this.propagations = propagations
        })
    }

    /** 
     * Updates the propagations dictionary
     * 
     * Format will be a dictionary of satellite names
     * mapped to a dictionary with format:
     * { position : {x, y, z}, velocity : {x, y ,z} }
     */

    updatePropagations = () => {
        for (let [key, value] of Object.entries(this.satrecs)) {
            this.propagations[key] = propagate(this.satrecs[key], new Date())
        }
    }


}