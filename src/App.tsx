import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Three from './Three'
import './App.css'
import { Infobox } from './Components/Infobox'

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
    </>
  )
}

export default App
