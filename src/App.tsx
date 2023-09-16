import { useEffect, useState } from 'react'
import Three from './Three'
import './App.css'
import { Infobox } from './Components/Infobox'
import { Introbox } from './Components/Introbox'

function App() {
  const [threeProps, setThreeProps] = useState({title: "", description: "", image: "", exists: false});

  useEffect ( () => {
    Three(setThreeProps);
  }, [])

  return (
    <>
    <div id='three' style={{position: "absolute", width: window.innerWidth, height: window.innerHeight, top: 0, left: 0}}>
    </div>
    <Infobox {...threeProps}></Infobox>
    <Introbox></Introbox>
    </>
  )
}

export default App
