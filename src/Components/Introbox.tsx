import { useState } from "react"

export function Introbox() {
    let [open, setOpen] = useState(true)
    let width  = 500;

    return (
        <div style={{display: open ? "flex" : "none", flexDirection: "column", position: "absolute", top: window.innerHeight / 2 - 350, left: window.innerWidth / 2 - width/2, width: width,
        backgroundColor: "grey", padding: 30, borderRadius: 20}}>
            <h1> Welcome to SkyNet </h1>
            <h3> Hello, and welcome to our virtual satellite observatory: SkyNet. </h3>
            <p>
                 Right now you're standing in the virtual cut.
                 The buildings have been removed so you can focus on the Sky, but we've kept the grass (we find it calming).
                 Hopefully you can see the satellites moving overhead! These are real satellites, that you would see at this
                 current time if you looked in the direction in the Cut right now. Through the magic of geolocation and 
                 calculus though, we've brought them here to you, and made them bigger so that you can actually look at them.
            </p>     
            <p> Click on a few to learn more about them! The ones that you've already seen we'll mark green for you. </p>
            <button onClick={() => setOpen(false)}> OK! </button>
        </div>
    )
}