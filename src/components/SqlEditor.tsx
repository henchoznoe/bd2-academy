import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
export default function SqlEditor({
  value,
  onChange,
  onRun,
  label = "Requête SQL",
}: {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  label?: string;
}) {
  const host = useRef<HTMLDivElement>(null),
    view = useRef<EditorView | null>(null),
    change = useRef(onChange),
    run = useRef(onRun);
  useEffect(() => {
    change.current = onChange;
    run.current = onRun;
  }, [onChange, onRun]);
  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          sql({ dialect: PostgreSQL }),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({
            "aria-label": label,
            spellcheck: "false",
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) change.current(update.state.doc.toString());
          }),
          keymap.of([
            {
              key: "Mod-Enter",
              run: () => {
                run.current?.();
                return true;
              },
            },
            {
              key: "Escape",
              run: (view) => {
                view.contentDOM.blur();
                return true;
              },
            },
          ]),
          EditorView.theme({
            "&": {
              fontSize: "14px",
              minHeight: "190px",
              backgroundColor: "#fff",
            },
            ".cm-content": {
              fontFamily: '"SFMono-Regular",Consolas,monospace',
              padding: "18px 0",
            },
            ".cm-gutters": {
              backgroundColor: "#f8fafc",
              color: "#94a3b8",
              border: "none",
            },
            ".cm-scroller": { overflow: "auto" },
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
    // The editor is owned by CodeMirror; subsequent document changes are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value)
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: value },
      });
  }, [value]);
  return <div ref={host} className="sql-editor" />;
}
