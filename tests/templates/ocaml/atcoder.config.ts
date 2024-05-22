import { defineConfig } from "../../../src/main.ts"
import { dedent } from "../../../src/deps.ts"

export default defineConfig({
  contestsDir: "contests",
  source: {
    extension: "ml",
    compileCommand: (source) =>
      [
        "eval (opam env) ocamlfind ocamlopt -O2 -o a.out",
        `${source} -linkpkg -thread`,
        "-package str,num,threads,containers,core,iter,batteries",
      ].join(" "),
    executeCommand: "./a.out",
    template: dedent`
      open Batteries
    `,
  },
  templates: (problem, contest) => [
    {
      filename: "dune",
      content: dedent`
        (executable
          (name ${problem.id})
          (public_name ${contest.id}-${problem.id})
          (libraries batteries))
      `,
    },
  ],
})
