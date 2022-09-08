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

const PythonEditor: React.FunctionComponent<ProgrammingExerciseProps> = ({
  dark,
  backgroundColor,
  ...props
}: ProgrammingExerciseProps) => {
  return (
    <ThemeProvider
      theme={createTheme({
        palette: {
          type: dark ? "dark" : ("light" as PaletteType),
          ...(backgroundColor && {
            background: {
              default: backgroundColor,
              paper: backgroundColor,
            },
          }),
        },
      })}
    >
      <StylesProvider injectFirst>
        <CssBaseline />
        <I18nextProvider i18n={i18n}>
          <ProgrammingExercise
            {...props}
            dark={dark}
            backgroundColor={backgroundColor}
          />
        </I18nextProvider>
      </StylesProvider>
    </ThemeProvider>
  )
}

export default PythonEditor
export { ProgrammingExerciseProps }
