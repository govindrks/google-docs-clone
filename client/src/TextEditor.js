import { useCallback, useEffect, useState } from "react"
import Quill from "quill"
import "quill/dist/quill.snow.css"
import { io } from "socket.io-client"
import { useParams } from "react-router-dom"

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
]

export default function TextEditor() {
  const { id: documentId } = useParams()
  const [socket, setSocket] = useState(null)
  const [quill, setQuill] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = io("http://localhost:3001")
    setSocket(s)

    return () => {
      s.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!socket || !quill) return

    socket.once("load-document", (document) => {
      quill.setContents(document)
      quill.enable()
      setLoading(false) // Document loaded, update loading state
    })

    socket.emit("get-document", documentId)

    // Handle errors
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      setLoading(false) // Update loading state in case of an error
    })

    // Clean up on unmount
    return () => {
      socket.off("connect_error")
    }
  }, [socket, quill, documentId])

  // ... (other useEffect hooks)

  const wrapperRef = useCallback((wrapper) => {
    if (!wrapper) return

    wrapper.innerHTML = ""
    const editor = document.createElement("div")
    wrapper.append(editor)
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    })
    q.disable()
    q.setText("Loading...")
    setQuill(q)
  }, [])

  return (
    <div className="container" ref={wrapperRef}>
      {loading && <div>Loading...</div>}
    </div>
  )
}