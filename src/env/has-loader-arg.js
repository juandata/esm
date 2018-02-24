import CHAR_CODES from "../char-codes.js"
import GenericArray from "../generic/array.js"

import hasLoaderValue from "./has-loader-value.js"
import parseJSON from "../util/parse-json.js"

const {
  LBRACE
} = CHAR_CODES

function hasLoaderArg(args) {
  if (! Array.isArray(args)) {
    return false
  }

  return GenericArray.some(args, (arg) => {
    return arg.charCodeAt(0) === LBRACE
      ? hasLoaderValue(parseJSON(arg))
      : hasLoaderValue(arg)
  })
}

export default hasLoaderArg
