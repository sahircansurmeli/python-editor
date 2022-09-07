import React, { useState, useEffect, forwardRef } from "react"
import { useTranslation } from "react-i18next"
import {
  CircularProgress,
  Snackbar,
  Button,
  IconButton,
  Tab,
  Tabs,
} from "@material-ui/core"
import { AddCircle, Fullscreen, FullscreenExit } from "@material-ui/icons"
import { useTheme } from "@material-ui/core/styles"
import PyEditor from "./PyEditor"
import AnimatedOutputBox, { AnimatedOutputBoxRef } from "./AnimatedOutputBox"
import { v4 as uuid } from "uuid"
import {
  OutputObject,
  TestResultObject,
  FeedBackAnswer,
  EditorState,
  FileEntry,
} from "../types"
import FeedbackForm from "./FeedbackForm"
import styled from "styled-components"
import { OverlayCenterWrapper } from "./Overlay"
import { useWorker } from "../hooks/useWorker"
import { parseTestCases } from "../services/test_parsing"
import EditorOutput from "./EditorOutput"
import TestOutput from "./TestOutput"
import SubmissionOutput from "./SubmissionOutput"
import Problems from "./Problems"
import {
  faExclamationCircle,
  faPlay,
  faStop,
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCopy } from "@fortawesome/free-regular-svg-icons"
import SubmittingOutput from "./SubmittingOutput"
import useStyles from "../hooks/useStyles"
import AlertDialog from "./AlertDialog"
import { WebEditorExercise } from "../hooks/useExercise"
import useCachedFileEntries from "../hooks/useCachedFileEntries"
import { emptyFile, exampleFiles } from "../constants"
import WithBrowserIncompatibilityOverlay from "./WithBrowserIncompatibilityOverlay"
import { FullScreen, useFullScreenHandle } from "react-full-screen"
import * as monaco from "monaco-editor/esm/vs/editor/editor.api"

interface ProgrammingExerciseProps {
  submitFeedback: (
    testResults: TestResultObject,
    feedback: Array<FeedBackAnswer>,
  ) => void
  submitProgrammingExercise: (
    files: ReadonlyArray<FileEntry>,
  ) => Promise<TestResultObject>
  submitToPaste: (files: ReadonlyArray<FileEntry>) => Promise<string>
  cacheKey?: string
  debug?: boolean
  exercise: WebEditorExercise
  submitDisabled: boolean
  editorHeight?: string
  outputHeight?: string
  solutionUrl?: string
  onCopy?: (file: FileEntry) => void
  dark?: boolean
}

const StyledButton = styled((props) => (
  <Button variant="contained" {...props} />
))`
  margin: 0.5em;
`

const StyledFullScreen = styled((props) => <FullScreen {...props} />)`
  background-color: ${(props) => props.bgcolor};
`

const initialFiles = { value: [emptyFile], timestamp: -1 }

const AddButton: React.FunctionComponent<
  React.HTMLAttributes<HTMLButtonElement>
> = ({ className, onClick, children }) => (
  <IconButton
    className={className}
    onClick={onClick}
    children={children}
    title="New file"
  />
)

const ProgrammingExercise = forwardRef<
  monaco.editor.IStandaloneCodeEditor,
  ProgrammingExerciseProps
>(
  (
    {
      submitFeedback,
      submitProgrammingExercise,
      submitToPaste,
      cacheKey,
      debug,
      exercise,
      submitDisabled,
      solutionUrl,
      editorHeight,
      outputHeight,
      onCopy,
      dark,
    },
    ref,
  ) => {
    const [t] = useTranslation()
    const [output, setOutput] = useState<OutputObject[]>([])
    const [testResults, setTestResults] = useState<
      TestResultObject | undefined
    >()
    const [workerAvailable, setWorkerAvailable] = useState(true)
    const [files, setFiles, setFilesIfNewer] = useCachedFileEntries(
      cacheKey,
      initialFiles,
    )
    const [activeFile, setActiveFile] = useState(0)
    const [openNotification, setOpenNotification] = useState(false)
    const [executionTimeoutTimer, setExecutionTimeoutTimer] = useState<
      NodeJS.Timeout | undefined
    >()
    const [worker] = useWorker({ debug })
    const outputBoxRef = React.createRef<AnimatedOutputBoxRef>()
    const [editorState, setEditorState] = useState(EditorState.Initializing)
    const classes = useStyles()
    const handle = useFullScreenHandle()
    const [fullScreen, setFullScreen] = useState(false)
    const theme = useTheme()

    function handleRun(code?: string) {
      if (workerAvailable) {
        setOutput([])
        setTestResults(undefined)
        setWorkerAvailable(false)
        setEditorState(EditorState.WorkerInitializing)
        worker.postMessage({
          type: "run",
          msg: {
            code: code ?? files[activeFile].content,
            debug,
            files,
          },
        })
      } else {
        console.log("Worker is busy")
      }
    }

    function handleTests(code?: string) {
      if (workerAvailable) {
        const testCode = exercise.getTestProgram(
          code ?? files[activeFile].content,
        )
        setOutput([])
        setTestResults(undefined)
        setWorkerAvailable(false)
        setEditorState(EditorState.WorkerInitializing)
        worker.postMessage({
          type: "run_tests",
          msg: { code: testCode, debug },
        })
      } else {
        console.log("Worker is busy")
      }
    }

    const handleSubmit = () => {
      setEditorState(EditorState.Submitting)
      setTestResults(undefined)
    }

    const handleReset = () => {
      setFiles(
        exercise.projectFiles.map((x) => ({
          ...x,
          content: x.originalContent,
        })),
      )
      setActiveFile(0)
      setOutput([])
      setTestResults(undefined)
    }

    worker.setMessageListener((e: any) => {
      const { type, msg } = e.data
      switch (type) {
        case "print":
          if (editorState === EditorState.ExecutingCode) {
            setOutput(output.concat({ id: uuid(), type: "output", text: msg }))
          }
          break
        case "input_required":
          setEditorState(EditorState.WaitingInput)
          break
        case "error":
          console.error(msg)
          setOutput(
            output.concat({
              id: uuid(),
              type: "error",
              text: msg,
              traceback: e.data.traceback,
            }),
          )
          setWorkerAvailable(true)
          worker.recycle()
          break
        case "ready":
          setWorkerAvailable(true)
          break
        case "print_batch":
          if (editorState === EditorState.ExecutingCode) {
            const prints = msg.map((text: string) => ({
              id: uuid(),
              type: "output",
              text,
            }))
            setOutput((prevState) => prevState.concat(prints))
          }
          break
        case "print_done":
          console.log("done executing")
          setEditorState((previous) => {
            switch (previous) {
              case EditorState.Testing:
                if (testResults?.allTestsPassed && !submitDisabled) {
                  handleSubmit()
                }
                return EditorState.ShowTestResults
              default:
                return EditorState.Idle
            }
          })
          worker.recycle()
          break
        case "test_results": {
          const testCases = parseTestCases(msg)
          setOutput([])
          setTestResults({
            allTestsPassed: testCases.every((x) => x.passed),
            points: [],
            testCases,
          })
          break
        }
        case "start_run":
          setEditorState(EditorState.ExecutingCode)
          break
        case "start_test":
          setEditorState(EditorState.Testing)
          break
        case "update_files":
          setFiles(JSON.parse(msg))
      }
    })

    const sendInput = (input: string) => {
      if (editorState === EditorState.WaitingInput) {
        setEditorState(EditorState.ExecutingCode)
        setOutput(
          output.concat({ id: uuid(), type: "input", text: `${input}\n` }),
        )
        worker.postMessage({ type: "input", msg: input })
      }
    }

    useEffect(() => {
      // If exercise includes previous submission data, compare against cache.
      setFilesIfNewer({
        value: exercise.projectFiles,
        timestamp: exercise.submissionDetails?.createdAtMillis ?? -1,
      })
    }, [
      exercise.projectFiles,
      exercise.submissionDetails?.createdAtMillis,
      setFilesIfNewer,
    ])

    useEffect(() => {
      debug && console.log(EditorState[editorState])
      switch (editorState) {
        case EditorState.Submitting:
          submitProgrammingExercise(files).then((data) => {
            closeOutput()
            setTestResults(data)
            setOutput([])
            setEditorState(
              data.allTestsPassed
                ? EditorState.ShowPassedFeedbackForm
                : EditorState.ShowSubmissionResults,
            )
          })
          break
        case EditorState.ExecutingCode:
        case EditorState.Testing: {
          const msg = t("infiniteLoopMessage")
          const timeout = setTimeout(() => {
            setOutput([
              {
                id: uuid(),
                type: "output",
                text: msg,
              },
            ])
            stopWorker()
          }, 10000)
          setExecutionTimeoutTimer(timeout)
          break
        }
        case EditorState.Idle:
        case EditorState.RunAborted:
        case EditorState.ShowTestResults:
        case EditorState.WaitingInput:
          if (executionTimeoutTimer) {
            clearTimeout(executionTimeoutTimer)
          }
          break
      }
    }, [editorState])

    const stopWorker = () => {
      if (!workerAvailable) {
        worker.terminate()
      }
      worker.postMessage({ type: "stop" })
      setEditorState(EditorState.RunAborted)
      setWorkerAvailable(true)
    }

    const closeOutput = () => {
      stopWorker()
      outputBoxRef.current?.close()
      setEditorState(EditorState.Idle)
      setOutput([])
    }

    const handleCloseNotification = (
      event?: React.SyntheticEvent,
      reason?: string,
    ) => {
      if (reason === "clickaway") {
        return
      }
      setOpenNotification(false)
    }

    const handleAddFile = () => {
      const filename = window.prompt("Filename: ")
      if (!filename) {
        return
      }

      if (files.map((f) => f.shortName).includes(filename)) {
        window.alert(`${filename} already exists!`)
        return
      }

      const newIdx = files.length

      setFiles((files) => [
        ...files,
        {
          fullName: filename,
          shortName: filename,
          originalContent: "",
          content: "",
        },
      ])

      setActiveFile(newIdx)
    }

    const handleFileChange = (e: any, value: any) => {
      const idx =
        typeof value === "number"
          ? value
          : files.findIndex((x) => x.shortName === value)
      console.log(idx)
      setActiveFile(idx)
    }

    const handleCopy = () => {
      if (onCopy) {
        onCopy(files[activeFile])
      }
    }

    const mapStateToOutput = () => {
      switch (editorState) {
        case EditorState.ShowTestResults:
          return (
            <TestOutput
              getPasteLink={() => submitToPaste(files)}
              onClose={closeOutput}
              outputHeight={outputHeight}
              onSubmit={() => handleSubmit()}
              submitDisabled={submitDisabled}
              testResults={testResults ?? { points: [], testCases: [] }}
            />
          )
        case EditorState.ShowPassedFeedbackForm:
        case EditorState.ShowSubmissionResults:
          return (
            <SubmissionOutput
              onClose={closeOutput}
              onSubmit={() => handleSubmit()}
              testResults={testResults ?? { points: [], testCases: [] }}
              getPasteLink={() => submitToPaste(files)}
              pasteDisabled={submitDisabled}
              outputHeight={outputHeight}
            />
          )
        case EditorState.Submitting:
          return (
            <SubmittingOutput
              onClose={closeOutput}
              getPasteLink={() => submitToPaste(files)}
              pasteDisabled={true}
            />
          )
        case EditorState.ShowProblems:
          return (
            <Problems
              onClose={closeOutput}
              problems={exercise.templateIssues}
              outputHeight={outputHeight}
            />
          )
        default:
          return (
            <EditorOutput
              editorState={editorState}
              getPasteLink={() => submitToPaste(files)}
              onClose={closeOutput}
              outputContent={output}
              outputHeight={outputHeight}
              pasteDisabled={submitDisabled}
              sendInput={sendInput}
            />
          )
      }
    }

    const handleEditorValueChange = (newContent: string) => {
      if (!exercise.ready) return
      setFiles((prev) =>
        prev.map((x, i) =>
          i !== activeFile ? x : { ...x, content: newContent },
        ),
      )
    }

    const pyEditorButtonsDisabled =
      (editorState & (EditorState.WorkerActive | EditorState.Submitting)) === 0

    return (
      <StyledFullScreen
        handle={handle}
        onChange={setFullScreen}
        bgcolor={theme.palette.background.default}
      >
        <WithBrowserIncompatibilityOverlay>
          {editorState === EditorState.ShowPassedFeedbackForm && (
            <FeedbackForm
              awardedPoints={testResults?.points}
              onSubmitFeedback={(feedback) => {
                setEditorState(EditorState.ShowSubmissionResults)
                if (testResults) {
                  submitFeedback(testResults, feedback)
                  feedback.length > 0 && setOpenNotification(true)
                }
              }}
              onClose={() => setEditorState(EditorState.ShowSubmissionResults)}
              solutionUrl={testResults?.solutionUrl}
              feedbackQuestions={testResults?.feedbackQuestions}
            />
          )}
          <Tabs
            value={files[activeFile].shortName}
            onChange={handleFileChange}
            variant="scrollable"
            scrollButtons="on"
            aria-label="label"
            data-cy="select-file"
          >
            {files.map(({ shortName }) => (
              <Tab
                key={shortName}
                value={shortName}
                label={shortName}
                style={{ textTransform: "none" }}
              />
            ))}
            <AddButton onClick={handleAddFile}>
              <AddCircle />
            </AddButton>
          </Tabs>
          {!exercise.ready && (
            <OverlayCenterWrapper>
              <CircularProgress thickness={5} color="inherit" />
            </OverlayCenterWrapper>
          )}

          <PyEditor
            editorValue={files[activeFile].content}
            setEditorValue={handleEditorValueChange}
            editorHeight={editorHeight}
            setIsEditorReady={(isReady) =>
              setEditorState(
                isReady ? EditorState.Idle : EditorState.Initializing,
              )
            }
            ref={ref}
          />

          <div style={{ padding: "0.6em 0em" }}>
            {(editorState & EditorState.WorkerActive) === 0 ? (
              <StyledButton
                onClick={() => handleRun()}
                className={classes.runButton}
                disabled={
                  !(
                    workerAvailable &&
                    pyEditorButtonsDisabled &&
                    files[activeFile].fullName.endsWith(".py")
                  )
                }
                data-cy="run-btn"
              >
                <FontAwesomeIcon icon={faPlay} />
                <span className={classes.whiteText}>{t("runButtonText")}</span>
              </StyledButton>
            ) : (
              <StyledButton
                className={classes.stopButton}
                onClick={() => stopWorker()}
                data-cy="stop-btn"
              >
                <FontAwesomeIcon icon={faStop} />
                <span className={classes.whiteText}>{t("stopButtonText")}</span>
              </StyledButton>
            )}
            {onCopy && (
              <StyledButton
                onClick={handleCopy}
                disabled={!pyEditorButtonsDisabled}
                className={classes.testButton}
                data-cy="test-btn"
                title="Copy the code to your comment"
              >
                <FontAwesomeIcon icon={faCopy} />
                <span style={{ paddingLeft: "5px" }}>Copy</span>
              </StyledButton>
            )}
            <AlertDialog resetExercise={handleReset} />
            {solutionUrl && (
              <StyledButton
                className={classes.normalButton}
                onClick={() => window.open(solutionUrl, "_blank")}
              >
                {t("modelSolution")}
              </StyledButton>
            )}
            <IconButton
              style={{ float: "right" }}
              onClick={fullScreen ? handle.exit : handle.enter}
            >
              {fullScreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
            {exercise.templateIssues.length > 0 && (
              <StyledButton
                onClick={() => {
                  setEditorState(EditorState.ShowProblems)
                  outputBoxRef.current?.open()
                }}
                disabled={(editorState & EditorState.WorkerActive) > 0}
                className={classes.problemsButton}
                data-cy="problems-btn"
              >
                <FontAwesomeIcon icon={faExclamationCircle} />
                <span className={classes.whiteText}>{`${t("problemsTitle")} (${
                  exercise.templateIssues.length
                })`}</span>
              </StyledButton>
            )}
          </div>

          <AnimatedOutputBox
            isRunning={(editorState & EditorState.WorkerActive) > 0}
            outputHeight={outputHeight}
            ref={outputBoxRef}
          >
            {mapStateToOutput()}
          </AnimatedOutputBox>

          {debug && (
            <div>
              <div>EditorState: {EditorState[editorState]}</div>
              <div>Cache key: {cacheKey || "undefined"}</div>
              <div>Active file: {files[activeFile].fullName}</div>
            </div>
          )}

          <Snackbar
            open={openNotification}
            autoHideDuration={5000}
            onClose={handleCloseNotification}
            message={t("thankYouForFeedback")}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            key="bottom-center"
          />
        </WithBrowserIncompatibilityOverlay>
      </StyledFullScreen>
    )
  },
)

ProgrammingExercise.defaultProps = {
  submitProgrammingExercise: () =>
    Promise.resolve({ points: [], testCases: [] }),
  submitToPaste: () => Promise.resolve("default paste called"),
  exercise: {
    details: undefined,
    projectFiles: exampleFiles,
    ready: true,
    reset: () => console.log("Called for exercise reset."),
    templateIssues: [],
    updateDetails: async () =>
      console.log("Called for exercise details update."),
    getTestProgram: () => 'print("Default test called.")',
  },
  dark: false,
}

export { ProgrammingExercise, ProgrammingExerciseProps }
