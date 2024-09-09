import { useCallback,useEffect,useState} from 'react'
import Quill from "quill"
import "quill/dist/quill.snow.css"
import "./style.css"
import {io} from 'socket.io-client'
import { useParams } from 'react-router-dom'

const SAVE_INTERVAL_MS = 2000
export default function TextEditor() {
  const {id:documentId} = useParams()
  const [socket,setSocket] = useState()
  const [quill,setQuill] = useState()
 
 // use to establish connection with server
  useEffect(()=>{
    const s= io('http://localhost:3001')
    setSocket(s)


    return ()=>{
      s.disconnect()
    }
  },[])
  // helps in making diff rooms of the page
  useEffect(()=>{
    if(socket==null||quill==null) return

    socket.once("load-document",document=>{
      quill.setContents(document)
      quill.enable()
    })
    socket.emit("get-document",documentId)
  },[socket,quill,documentId])

  useEffect (()=>{
    if(socket==null||quill==null) return

    const interval= setInterval(()=>{
      socket.emit('save-document',quill.getContents())
    },SAVE_INTERVAL_MS)

    return ()=>{
      clearInterval(interval)
    }
  },[socket,quill])

  // for detecting changes when the quill changes 

  useEffect(()=>{
    if(socket==null || quill==null) return 
    const handler = (delta,oldDelta,source)=>{  //here source will check whether the user makes change or the library
      if(source !== 'user') return
      socket.emit("send-changes",delta)
    }
    
    quill.on('text-change',handler)
    return()=>{
      quill.off('text-change',handler)
    }
  },[socket,quill])
  
  // help to control all the screen at same time
  useEffect(()=>{
    if(socket==null || quill==null) return 
    
    const handler = delta =>{  
      quill.updateContents(delta) // it will run the changes in our case
    }
    
    socket.on('receive-changes',handler)
    
    return()=>{
      socket.off('receive-changes',handler)
    }
  },[socket,quill])
 
  /* adding our own toolbar */
 const TOOLBAR_OPTIONS =[
  [{header:[1,2,3,4,5,6,false]}],
  [{font:[]}],
  [{list:"ordered"},{list:"bullet"}],
  ["bold","italic","underline"],
  [{color:[]},{background:[]}],
  [{script:"sub"},{script:"super"}],
  [{align:[]}],
  ["image","blockquote","code-block"],
  ["clean"]
 ]
  const wrapperRef = useCallback((wrapper) => {
    if(wrapper==null)return
    wrapper.innerHTML = ''
    const editor = document.createElement("div")
    wrapper.append(editor);
    const q = new Quill(editor, { theme: "snow",modules:{toolbar:TOOLBAR_OPTIONS} 
  }) 
    q.disable()
    q.setText("Loading...")
    setQuill(q)
  }, []) // module property was use to add the toolbar

  return (
    <div className="container" ref={wrapperRef}>

    </div>
  )
}
