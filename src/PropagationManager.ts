import axios from 'axios';
import * as Satellite from 'satellite.js';
import { Sat } from './Sat';
import { TLEs } from './celestrakTLEs';
import { descriptions } from './descriptions';

type dict<T> = {
    [key : string] : T;
} 

let starlinkDesc = "Starlink is a satellite internet constellation operated by American aerospace company SpaceX, providing coverage to over 60 countries. It also aims for global mobile phone service after 2023. SpaceX started launching Starlink satellites in 2019. As of August 2023, Starlink consists of over 5,000 mass-produced small satellites in low Earth orbit (LEO), which communicate with designated ground transceivers. In total, nearly 12,000 satellites are planned to be deployed, with a possible later extension to 42,000. SpaceX announced reaching more than 1 million subscribers in December 2022 and 1.5 million subscribers in May 2023. Starlink has had a key role in the Russo-Ukrainian War."

type satDisplayInfo = {
    "Revolutions per Day" : string
    "Orbit Regime" : string
    "Description" : string
}


function constructInfoString(info : satDisplayInfo) {
    let str = ""
    for (let key of Object.keys(info)) {
        //@ts-ignore
        if (info[key]) {
            //@ts-ignore
            str += key + ": " + info[key];
            str += "\n"
        }
    }
    return str;
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
    descriptions : dict<string> = {} 
    infos : dict<satDisplayInfo> = {};
    satrecs : dict<Satellite.SatRec> = {}
    propagations : dict<Satellite.EciVec3<number>> = {}
    old_timestamp : number
    old_propagations : dict<Satellite.EciVec3<number>> = {}
    next_propagations : dict<Satellite.EciVec3<number>> = {}

    /**
     * @param url - API endpoint to get TLEs, requires data in TLE format
     */
    constructor(url : string) {
        this.url = url;
        this.old_timestamp = 0
    }

    makeInfo (meanMotion : number, desc : string ) {
        let meanMotionRevPerDay = Math.floor((meanMotion * 24 * 60 / (Math.PI * 2)) * 100) / 100;

        if (11 < meanMotionRevPerDay) {
            return {
                "Revolutions per Day": String(meanMotionRevPerDay),
                "Orbit Regime": "Low Earth Orbit",
                "Description" : desc
            }
        }
        if (1.1 < meanMotionRevPerDay) {
            return {
                "Revolutions per Day": String(meanMotionRevPerDay),
                "Orbit Regime": "Medium Earth Orbit",
                "Description" : desc
            }
        }
        if (.9 < meanMotionRevPerDay) {
            return {
                "Revolutions per Day": String(meanMotionRevPerDay),
                "Orbit Regime": "Geosynchronous Orbit",
                "Description" : desc
            }
        }
        else {
            return {
                "Revolutions per Day": String(meanMotionRevPerDay),
                "Orbit Regime": "High Earth Orbit",
                "Description" : desc
            }
        }
    }

    parse (data : string) {
        const lines = data.split('\n')
        let satrecs : dict<Satellite.SatRec> = {}  
        let propagations : dict<Satellite.EciVec3<number>> = {}
        let infos : dict<satDisplayInfo> = {}
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
            //@ts-ignore
            if (key.includes("STARLINK")) descriptions[key] = starlinkDesc; 
            //@ts-ignore
            infos[key] = this.makeInfo(value.no, descriptions[key]);
        }

        this.satrecs = satrecs
        this.propagations = propagations
        this.infos = infos
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
        this.descriptions = descriptions
        
    }

    
    constructSats = () => {
        let keys = Object.keys(this.propagations);
        let satArr = Array(keys.length)
        for (let i = 0; i < keys.length; i++) {
            satArr[i] = new Sat(keys[i], keys[i], "Orbit Regime: " + constructInfoString(this.infos[keys[i]]), i, this)
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
        const curr_timestamp = new Date().getTime()
        if (curr_timestamp > this.old_timestamp + 5000) {
            console.log("longer thing...")
            for (let key of Object.keys(this.satrecs)) {
                let old_prop = Satellite.propagate(this.satrecs[key], new Date()).position;
                if (typeof old_prop != "boolean") this.old_propagations[key] = old_prop;

                let next_date = new Date()
                next_date.setSeconds(next_date.getSeconds() + 5)
                let next_prop = Satellite.propagate(this.satrecs[key], next_date).position
                if (typeof next_prop != "boolean") this.next_propagations[key] = next_prop;
            }
            this.old_timestamp = curr_timestamp
        } else {
            // interpolate between propagations
            for (let key of Object.keys(this.old_propagations)) {
                const ratio = (curr_timestamp - this.old_timestamp) / 5000;
                let interp_prop : Satellite.EciVec3<number> = {
                    x : (this.old_propagations[key].x * (1 - ratio) 
                        + this.next_propagations[key].x * ratio),
                    y : (this.old_propagations[key].y * (1 - ratio) 
                        + this.next_propagations[key].y * ratio) ,
                    z : (this.old_propagations[key].z * (1 - ratio) 
                        + this.next_propagations[key].z * ratio)
                }
                this.propagations[key] = interp_prop
            }
        }
    }
}