import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { emptyFile } from "../constants"
import {
  createWebEditorModuleSource,
  extractExerciseArchive,
} from "../services/patch_exercise"
import {
  Configuration,
  getExerciseDetails,
  getExerciseZip,
  getOldSubmissions,
  getSubmissionZip,
} from "../services/programming_exercise"
import { ExerciseDetails, FileEntry, SubmissionDetails } from "../types"

export interface WebEditorExercise {
  details: ExerciseDetails | undefined
  getTestProgram(code: string): string
  projectFiles: ReadonlyArray<FileEntry>
  ready: boolean
  reset(): void
  submissionDetails?: SubmissionDetails
  templateIssues: ReadonlyArray<string>
  updateDetails(): Promise<void>
}

export default function useExercise(
  organization: string,
  course: string,
  exercise: string,
  userId: string,
  token: string,
): WebEditorExercise {
  const [ready, setReady] = useState(false)
  const [details, setDetails] = useState<ExerciseDetails>()
  const [projectFiles, setProjectFiles] = useState<ReadonlyArray<FileEntry>>([
    emptyFile,
  ])
  const [submissionDetails, setSubmissionDetails] =
    useState<SubmissionDetails>()
  const [templateIssues, setTemplateIssues] = useState<ReadonlyArray<string>>(
    [],
  )
  const [testCode, setTestCode] = useState<string>()
  const [t] = useTranslation()

  useEffect(() => {
    const effect = async () => {
      try {
        const apiConfig = { token, t }
        const details = await getExerciseDetails(
          organization,
          course,
          exercise,
          apiConfig,
        )
        setDetails(details)
        if (!details.downloadable) {
          setProjectFiles([
            { ...emptyFile, content: `# ${t("exerciseNotYetUnlocked")}` },
          ])
          setTemplateIssues([])
          setTestCode(undefined)
          return
        }

        const template = await getExercise(
          organization,
          course,
          exercise,
          apiConfig,
        )
        if (!userId || !token) {
          setProjectFiles(template.srcFiles)
          setTemplateIssues(template.problems ?? [])
          setTestCode(template.testSource)
          return
        }

        const latestSubmissionDetails = await getLatestSubmissionDetails(
          details.id,
          apiConfig,
        )
        if (latestSubmissionDetails) {
          const submission = await getSubmission(
            latestSubmissionDetails.id,
            apiConfig,
          )
          if (submission) {
            setProjectFiles(
              template.srcFiles.map<FileEntry>((templateFile) => {
                const submittedFile = submission.srcFiles.find(
                  (y) => y.fullName === templateFile.fullName,
                )
                return submittedFile
                  ? { ...templateFile, content: submittedFile.content }
                  : templateFile
              }),
            )
          } else {
            setProjectFiles(template.srcFiles)
          }
        } else {
          setProjectFiles(template.srcFiles)
        }
        setSubmissionDetails(latestSubmissionDetails)
        setTemplateIssues(template.problems ?? [])
        setTestCode(template.testSource)
      } catch (e) {
        setDetails(undefined)
        if (e instanceof Error) {
          setProjectFiles([{ ...emptyFile, content: `# ${e.message}` }])
        } else {
          setProjectFiles([{ ...emptyFile, content: `# Unknown error.` }])
        }
        setSubmissionDetails(undefined)
        setTemplateIssues([])
        setTestCode(undefined)
      }
    }

    if (organization && course && exercise) {
      setReady(false)
      effect().then(() => setReady(true))
    } else {
      setReady(true)
    }
  }, [organization, course, exercise, userId, token, t])

  const getTestProgram = useCallback(
    (code: string) => `
__webeditor_module_source = ${createWebEditorModuleSource(code)}
${testCode}
`,
    [testCode],
  )

  const reset = useCallback(() => {
    setProjectFiles((prev) =>
      prev.map((x) => ({ ...x, content: x.originalContent })),
    )
  }, [])

  const updateDetails = useCallback(async () => {
    try {
      const details = await getExerciseDetails(organization, course, exercise, {
        token,
        t,
      })
      setDetails(details)
    } catch (e) {
      // no op
    }
  }, [organization, course, exercise, token, t])

  return {
    details,
    getTestProgram,
    templateIssues,
    projectFiles,
    ready,
    reset,
    submissionDetails,
    updateDetails,
  }
}

const getExercise = async (
  organization: string,
  course: string,
  exercise: string,
  apiConfig: Configuration,
) => {
  const zip = await getExerciseZip(organization, course, exercise, apiConfig)
  const parsed = await extractExerciseArchive(zip, apiConfig)
  return parsed
}

const getLatestSubmissionDetails = async (
  exerciseId: number,
  apiConfig: Configuration,
) => {
  const submissions = await getOldSubmissions(exerciseId, apiConfig)
  if (submissions.length <= 0) {
    return undefined
  }
  const latest = submissions.reduce((latest, current) => {
    return current.createdAtMillis > latest.createdAtMillis ? current : latest
  }, submissions[0])
  return latest
}

const getSubmission = async (
  submissionId: number,
  apiConfig: Configuration,
) => {
  try {
    const zip = await getSubmissionZip(submissionId, apiConfig)
    const parsed = await extractExerciseArchive(zip, apiConfig)
    return parsed
  } catch (e) {
    // Stop caring, show template
    return undefined
  }
}
