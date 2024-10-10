/**
 * Captures a StackTrace and (if passed) cuts off
 * the first lines including the calling function.
 */
export function captureStackTrace(callingFunction?: string | (() => {})) {
  let stack = "";
  try {
    throw new Error("");
  } catch (e: any) {
    ({ stack } = e);
  }

  const callerName =
    typeof callingFunction === "string"
      ? callingFunction
      : callingFunction
        ? callingFunction.name
        : undefined;

  if (callerName && stack.includes(callerName)) {
    const lines = stack.split("\n");

    stack = lines
      .slice(
        lines.findLastIndex((line: string) => line.includes(callerName)) + 1
      )
      .join("\n");
  }

  return stack;
}

export function applyStackTrace(error: Error, stackTrace: string) {
  error.stack = error.message + "\n" + stackTrace;
  return error;
}
