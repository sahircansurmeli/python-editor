import React from "react"
import PythonEditor from "../../src"

const projectFiles = [
  {
    fullName: "main.py",
    shortName: "main.py",
    originalContent: `import micropip

# to install other libraries, simply copy the next line and replace numpy with the name of the library you want to install
await micropip.install("numpy")

# set up your imports here, below the libraries installation steps
import numpy as np

# at this point, you can run any standard Python code and the code from the libraries you have installed
print("Hello World")`,
    content: `import micropip

# to install other libraries, simply copy the next line and replace numpy with the name of the library you want to install
await micropip.install("numpy")

# set up your imports here, below the libraries installation steps
import numpy as np

# at this point, you can run any standard Python code and the code from the libraries you have installed
print("Hello World")`,
  },
]

export default function App() {
  return (
    <PythonEditor
      editorHeight="55%"
      outputHeight="200px"
      dark
      onFullScreen={(fs) => console.log("Full screen: " + fs)}
      projectFiles={projectFiles}
      backgroundColor="red"
    />
  )
}
