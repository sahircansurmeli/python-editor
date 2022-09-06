import React, { useRef } from "../../node_modules/react"
import { ProgrammingExercise } from "../../src/components/ProgrammingExercise"
import { Button, TextField, MenuItem, Grid } from "@material-ui/core"
import { StylesProvider } from "@material-ui/styles"
import styled from "styled-components"
import { useInput } from "../../src/hooks/customHooks"
import { useLocalStorage } from "../../src/hooks/useLocalStorage"
import { isBoolean } from "../../src/utils/booleans"
import { I18nextProvider } from "../../node_modules/react-i18next"
import i18n from "../../src/i18n"

const StyledTextField = styled((props) => (
  <TextField variant="outlined" fullWidth {...props} />
))`
  margin: 1rem;
`

const StyledButton = styled((props) => (
  <Button variant="contained" {...props} />
))`
  margin: 1rem;
`

const App = () => {
  const editorRef = useRef(null)

  const copy = (file) => {
    console.log(file.shortName)
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ProgrammingExercise
        editorHeight="55%"
        outputHeight="200px"
        ref={editorRef}
        onCopy={copy}
      />
    </I18nextProvider>
  )
}

const StyledApp = () => (
  <StylesProvider injectFirst>
    <App />
  </StylesProvider>
)

export default StyledApp
