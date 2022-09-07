import React from "react"
import { I18nextProvider } from "react-i18next"
import i18n from "./i18n"
import {
  ProgrammingExercise,
  ProgrammingExerciseProps,
} from "./components/ProgrammingExercise"
import { StylesProvider, ThemeProvider } from "@material-ui/styles"
import { createTheme } from "@material-ui/core/styles"
import CssBaseline from "@material-ui/core/CssBaseline"
import { PaletteType } from "@material-ui/core"

const darkTheme = {
  palette: {
    type: "dark" as PaletteType,
  },
}

const lightTheme = {
  palette: {
    type: "light" as PaletteType,
  },
}

const PythonEditor: React.FunctionComponent<ProgrammingExerciseProps> = ({
  dark,
  ...props
}: ProgrammingExerciseProps) => {
  return (
    <ThemeProvider
      theme={dark ? createTheme(darkTheme) : createTheme(lightTheme)}
    >
      <StylesProvider injectFirst>
        <CssBaseline />
        <I18nextProvider i18n={i18n}>
          <ProgrammingExercise {...props} dark={dark} />
        </I18nextProvider>
      </StylesProvider>
    </ThemeProvider>
  )
}

export default PythonEditor
