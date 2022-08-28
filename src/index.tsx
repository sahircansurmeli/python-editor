import React from "react"
import { I18nextProvider } from "react-i18next"
import i18n from "./i18n"
import {
  ProgrammingExercise,
  ProgrammingExerciseProps,
} from "./components/ProgrammingExercise"
import { StylesProvider } from "@material-ui/styles"

const PythonEditor: React.FunctionComponent<ProgrammingExerciseProps> = (
  props: ProgrammingExerciseProps,
) => (
  <StylesProvider injectFirst>
    <I18nextProvider i18n={i18n}>
      <ProgrammingExercise {...props} />
    </I18nextProvider>
  </StylesProvider>
)

export { PythonEditor }
