export type InfoboxProps = {
    title: string,
    description: string,
    // this is a path
    image: string,
    exists: boolean
}


export function Infobox(props : InfoboxProps) {
    return (
        <div id="externalInfobox" style={{position: "absolute", top: 10, right: 10, display: props.exists ? "flex" : "none", flexDirection: "column", zIndex: 2000000}}>
            <h1 id="infoTitle"> {props.title} </h1>
            {props.description.split("\n").map(txt => <h3 style={{fontSize: 14, width: 500}}> {txt} </h3>)}
        </div>
    )
}