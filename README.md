# Moocfi Python Editor

[![NPM version](https://img.shields.io/npm/v/react-python-editor.svg?style=flat-square)](https://www.npmjs.com/package/react-python-editor)

React Python Editor is a React component that provides an in-browser editing and
running environment for Python
code. The editor is based on
[Pyodide python runtime environment](https://github.com/iodide-project/pyodide)
that is run using webworkers.

## Usage

Install with `npm i react-python-editor`.

The editor component can be used in a following way:

```jsx
import { PythonEditor } from "react-python-editor"

const App = () => {
  // ...

  return <ProgrammingExercise editorHeight="400px" outputHeight="200px" />
}
```

Optional properties:

- `debug` Show and log debug information if set to `true`.
- `editorHeight` Height of the editor. Defaults to `400px`.
- `outputHeight` Maximum height of the output content in pixels.

## Setting up the project

1. Clone the project on GitHub
2. Go to the project root directory and run `npm ci` & `npm run encode:worker`
3. Go to the `example` directory and run `npm ci`

## Running the project

To run the project in example environment, go to the `example` directory and
run `npm start`.

If you make any changes to the worker, you will always need to run the `encode:worker` command again.

## License

This project is forked from [https://github.com/rage/python-editor](url)

This project is licensed under either of

- Apache License, Version 2.0, ([LICENSE](LICENSE) or https://www.apache.org/licenses/LICENSE-2.0)
- MIT license, ([LICENSE-MIT](LICENSE-MIT) or https://opensource.org/licenses/MIT)

at your option.
