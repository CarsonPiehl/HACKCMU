import axios, { AxiosResponse } from 'axios';
import * as Satellite from 'satellite.js';
import * as THREE from 'three';
import { Sat } from './Sat';
import { TLEs } from './celestrakTLEs';

type dict<T> = {
    [key : string] : T;
} 

/**
 * Class for fetching data from a TLE API endpoint and propagating
 * General usage: construct a PropogationManager object, and use the
 * .propagations field in order to access the propagations dictionary
 */
export class PropagationManager {
    static PITTSBURGH_OBSERVER = {
        longitude: Satellite.degreesToRadians(-79.944023),
        latitude: Satellite.degreesToRadians(40.443336),
        height: 0.370
    };
    url: string
    satrecs : dict<Satellite.SatRec> = {};
    propagations : dict<Satellite.EciVec3<number>> = {};

    /**
     * @param url - API endpoint to get TLEs, requires data in TLE format
     */
    constructor(url : string) {
        this.url = url;
    }

    parse (data : string) {
        const lines = data.split('\n')
        let satrecs : dict<Satellite.SatRec> = {}  
        let propagations : dict<Satellite.EciVec3<number>> = {}
        console.log(data)
        
        for (let i = 0; i < lines.length - 1; i += 3) {
            const name = lines[i]
            const tle_line_1 = lines[i+1]
            const tle_line_2 = lines[i+2]
            const satrec = Satellite.twoline2satrec(tle_line_1, tle_line_2)
            satrecs[name] = satrec
        }

        for (let [key, value] of Object.entries(satrecs)) {
            let prop = Satellite.propagate(satrecs[key], new Date()).position;
            if (typeof prop != "boolean") propagations[key] = prop;
        }

        this.satrecs = satrecs
        this.propagations = propagations
    }


    getData () {
        if (this.url === "") {
            this.parse(TLEs);
        }
        else {
            axios({
                method: 'get',
                url: this.url,
            }).then((response) => {
                console.log(response);
                const data : string = (response.data);
                this.parse(data);
            })
        }
    }

    
    constructSats = () => {
        let keys = Object.keys(this.propagations);
        let satArr = Array(keys.length)
        for (let i = 0; i < keys.length; i++) {
            satArr[i] = new Sat(keys[i], keys[i], "test desc", this)
        }
        return satArr;
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
            let prop = Satellite.propagate(this.satrecs[key], new Date()).position;
            if (typeof prop != "boolean") this.propagations[key] = prop;
        }
    }


}