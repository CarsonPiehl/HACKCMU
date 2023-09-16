import { PropagationManager } from "./PropagationManager";
import * as Satellite from 'satellite.js';
import * as THREE from 'three';

const DISTANCE_FROM_OBSERVER = 100;
const RENDER_SIZE = .5
const UNSELECTED_COLOR = 0xF0D168;
const SELECTED_COLOR = 0x00FF00;

export class Sat {
    
    propagationManager : PropagationManager
    propagationManagerKey : string;
    description : string;
    title : string;
    id : number;
    shape : THREE.Mesh;

    constructor(key : string, title : string, description : string, id: number, propMan : PropagationManager) {
        this.propagationManager = propMan;
        this.propagationManagerKey = key;
        this.description = description;
        this.title = title;
        this.id = id;
        this.shape = this.makeShape();
    }

    getECIVector = () => {
        return this.propagationManager.propagations[this.propagationManagerKey];
    }

    makeShape = () => {
        let shape = new THREE.Mesh(new THREE.SphereGeometry(RENDER_SIZE, 8, 8), new THREE.MeshBasicMaterial({ color: UNSELECTED_COLOR }));
        shape.name = String(this.id);
        return shape;
    }

    // returns object with azimuth, elev, range
    static getLookAngle = (propagation : Satellite.EciVec3<number>, date : Date) => {
        var gmst = Satellite.gstime(date);
        let ecf : Satellite.EcfVec3<number> = Satellite.eciToEcf(propagation, gmst);
        return Satellite.ecfToLookAngles(PropagationManager.PITTSBURGH_OBSERVER, ecf);
    }

    static lookAngleToUnitVector (lookAngle : Satellite.LookAngles) {
        return new THREE.Vector3(
            Math.sin(lookAngle.azimuth) * Math.cos(lookAngle.elevation),
            Math.sin(lookAngle.elevation),
            // the z-vector is actually facing south
            -(Math.cos(lookAngle.azimuth) * Math.cos(lookAngle.elevation))
        )
    }

    static lookAngleToVector (length : number, lookAngle : Satellite.LookAngles) {
        let vector = this.lookAngleToUnitVector(lookAngle);
        vector.x *= length;
        vector.y *= length;
        vector.z *= length;
        return vector;
    }

    getVector (length : number, date = new Date()) {
        return Sat.lookAngleToVector(length, Sat.getLookAngle(this.getECIVector(), date))
    }

    updateShapePosition () {
        let newVec = this.getVector(DISTANCE_FROM_OBSERVER)
        this.shape.position.x = newVec.x;
        this.shape.position.y = newVec.y;
        this.shape.position.z = newVec.z;
    }

    selectShape () {
        //@ts-ignore
        this.shape.material.color.set(SELECTED_COLOR);
    }

    unselectShape () {
        //@ts-ignore
        this.shape.material.color.set(UNSELECTED_COLOR);
    }

}