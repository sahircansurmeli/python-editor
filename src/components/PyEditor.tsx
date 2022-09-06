import React, { forwardRef } from "react"
import Editor, { OnChange, OnMount } from "@monaco-editor/react"
import styled from "styled-components"
import * as monaco from "monaco-editor/esm/vs/editor/editor.api"

interface EditorWrapperProps {
  height?: string
}

const EditorWrapper = styled.div`
  min-height: 200px;
  max-height: 950px;
  border: 1px inset;
  height: ${(props: EditorWrapperProps) =>
    props.height ? props.height : "400px"};
`

type PyEditorProps = {
  editorValue: string
  editorHeight: string | undefined
  setEditorValue(editorValue: string): void
  setIsEditorReady(isReady: boolean): void
  dark: boolean
}

const PyEditor = forwardRef<monaco.editor.IStandaloneCodeEditor, PyEditorProps>(
  (
    { editorValue, setEditorValue, editorHeight, setIsEditorReady, dark },
    ref,
  ) => {
    const handleEditorDidMount: OnMount = (editor) => {
      if (ref && typeof ref !== "function") {
        ref.current = editor
      }
      setIsEditorReady(true)
    }

    const handleChange: OnChange = (value) => {
      if (value) {
        setEditorValue(value)
      }
    }

    return (
      <EditorWrapper height={editorHeight}>
        <Editor
          value={editorValue}
          language="python"
          onChange={handleChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            hideCursorInOverviewRuler: true,
            scrollbar: { alwaysConsumeMouseWheel: false },
          }}
          theme={dark ? "vs-dark" : "light"}
        />
      </EditorWrapper>
    )
  },
)

export default PyEditor
