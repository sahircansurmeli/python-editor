import { FileEntry } from "../types"

export const emptyFile: FileEntry = {
  fullName: "main.py",
  shortName: "main.py",
  originalContent: "",
  content: "",
}

const defaultSrcContent = `# No ProgrammingExercise has been loaded.
# This is the default file main.py

from .utils import greeting, getLocality

def greetWorld():
  print(greeting(getLocality()))

def foo():
  print("foo!")
`

const defaultTestContent = `# No ProgrammingExercise has been loaded.
# This is the default file test.py

from .main import greetWorld

greetWorld()
`

const defaultUtilsContent = `# No ProgrammingExercise has been loaded.
# This is the default file utils.py

# Mutually recursive imports are disallowed.
# Try uncommenting the line below!
#from .main import foo

def greeting(recipient):
  return "Hello " + recipient + "!"

def getLocality():
  return "world"
`

export const exampleFiles: ReadonlyArray<FileEntry> = [
  {
    fullName: "main.py",
    shortName: "main.py",
    originalContent: `import micropip

# to install other libraries, simply copy the next line and replace numpy with the name of the library you want to install
await micropip.install("numpy")
    
# set up your imports here, below the libraries installation steps
import numpy as np

# these are included in the Python standard library, and do not need an installation step:
import json  
from sys import version
    
# at this point, you can run any standard Python code and the code from the libraries you have installed
print("Hello World")`,
    content: `import micropip

# to install other libraries, simply copy the next line and replace numpy with the name of the library you want to install
await micropip.install("numpy")
    
# set up your imports here, below the libraries installation steps
import numpy as np

# these are included in the Python standard library, and do not need an installation step:
import json  
from sys import version
    
# at this point, you can run any standard Python code and the code from the libraries you have installed
print("Hello World")`,
  },
]
