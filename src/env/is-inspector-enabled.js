import binding from "../binding.js"
import hasDebugArg from "./has-debug-arg.js"
import noDeprecationWarning from "../warning/no-deprecation-warning.js"
import shared from "../shared.js"

function isInspectorEnabled() {
  if ("isInspectorEnabled" in shared.env) {
    return shared.env.isInspectorEnabled
  }

  const inspectorBinding = binding.inspector
  const isEnabled = noDeprecationWarning(() => inspectorBinding.isEnabled)

  return shared.env.isInspectorEnabled =
    hasDebugArg(process.execArgv) ||
    (typeof isEnabled === "function" &&
     isEnabled.call(inspectorBinding))
}

export default isInspectorEnabled
