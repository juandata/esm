import { extname as _extname, dirname } from "path"
import _load from "../load.js"
import createOptions from "../../util/create-options.js"
import extname from "../../path/extname.js"
import moduleState from "../state.js"
import nodeModulePaths from "../node-module-paths.js"
import resolveFilename from "./resolve-filename.js"
import setGetter from "../../util/set-getter.js"

const queryHashRegExp = /[?#].*$/

function load(id, parent, options) {
  options = createOptions(options)
  const filePath = resolveFilename(id, parent, options)

  let child
  let oldChildA
  let oldChildB
  let state
  let cacheId = filePath
  let queryHash = queryHashRegExp.exec(id)

  if (options.esm === "mjs" &&
      _extname(filePath) === ".mjs") {
    state = moduleState
  }

  if (queryHash !== null) {
    // Each id with a query+hash is given a new cache entry.
    cacheId = filePath + queryHash[0]

    child = state
      ? state.cache[cacheId]
      : moduleState.cache[cacheId] || __non_webpack_require__.cache[cacheId]

    if (child) {
      return child
    }

    // Backup existing cache entries because Node uses the child module's file
    // path, without query+hash, as its cache id.
    if (state) {
      oldChildA = pluck(state.cache, filePath)
    } else {
      oldChildA = pluck(moduleState.cache, filePath)
      oldChildB = pluck(__non_webpack_require__.cache, filePath)
    }
  }

  let error
  let threw = true

  try {
    child = _load(filePath, parent, options.isMain, null, loader, () => filePath)
    threw = false
  } catch (e) {
    error = e
  }

  if (queryHash !== null) {
    if (state) {
      state.cache[cacheId] = child
    } else {
      moduleState.cache[cacheId] = __non_webpack_require__.cache[cacheId] = child
    }

    if (state) {
      restore(state.cache, filePath, oldChildA)
    } else {
      restore(__non_webpack_require__.cache, filePath, oldChildA)
      restore(__non_webpack_require__.cache, filePath, oldChildB)
    }
  }

  if (! threw) {
    return child
  }

  try {
    throw error
  } finally {
    // Unlike CJS, ESM errors are preserved for subsequent loads.
    setGetter(moduleState.cache, cacheId, () => {
      throw error
    })

    delete __non_webpack_require__.cache[cacheId]
  }
}

function loader(filePath) {
  let ext = extname(filePath)
  const { extensions } = moduleState

  if (! ext || typeof extensions[ext] !== "function") {
    ext = ".js"
  }

  const extCompiler = extensions[ext]
  const mod = this

  if (typeof extCompiler !== "function") {
    mod.load(filePath)
    return
  }

  mod.filename = filePath
  mod.paths = nodeModulePaths(dirname(filePath))

  extCompiler.call(extensions, mod, filePath)
  mod.loaded = true
}

function pluck(object, key) {
  let value

  if (key in object) {
    value = object[key]
    delete object[key]
  }

  return value
}

function restore(object, key, value) {
  if (value === void 0) {
    delete object[key]
  } else {
    object[key] = value
  }
}

export default load
