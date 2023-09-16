type InfoboxProps = {
    title: string,
    description: string,
    // this is a path
    image: string
}

export function Infobox(props : InfoboxProps) {
    return (
        <div style={{display: "flex", flexDirection: "column"}}>
            <h1> {props.title} </h1>
            <h3> {props.description} </h3>
        </div>
    )
}