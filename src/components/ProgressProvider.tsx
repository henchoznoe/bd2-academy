import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  blankRecord,
  initialProgress,
  loadProgress,
  persistProgress,
} from "../lib/progress";
import type { Progress, ProgressRecord } from "../lib/progress";
type Context = {
  data: Progress;
  ready: boolean;
  error: string;
  saving: boolean;
  update: (fn: (data: Progress) => Progress) => void;
  record: (id: string) => ProgressRecord;
  patch: (id: string, patch: Partial<ProgressRecord>) => void;
  retry: () => void;
};
const ProgressContext = createContext<Context | null>(null);
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(initialProgress),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const current = useRef(data),
    counter = useRef(0),
    readable = useRef(false);
  useEffect(() => {
    let active = true;
    loadProgress()
      .then((saved) => {
        if (active) {
          current.current = saved;
          setData(saved);
          readable.current = true;
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Impossible de lire la sauvegarde locale. Vos données existantes sont conservées ; exportez votre travail avant de poursuivre.",
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  function save(next: Progress) {
    if (!readable.current) return;
    const revision = ++counter.current;
    setSaving(true);
    persistProgress(next)
      .then(() => {
        if (revision === counter.current) {
          setError("");
          setSaving(false);
        }
      })
      .catch(() => {
        setError(
          "Sauvegarde locale impossible. Votre travail reste dans cette page : exportez-le avant de la fermer.",
        );
        setSaving(false);
      });
  }
  function update(fn: (data: Progress) => Progress) {
    const next = fn(current.current);
    current.current = next;
    setData(next);
    save(next);
  }
  function patch(id: string, value: Partial<ProgressRecord>) {
    update((p) => ({
      ...p,
      records: {
        ...p.records,
        [id]: { ...(p.records[id] ?? blankRecord()), ...value },
      },
    }));
  }
  return (
    <ProgressContext.Provider
      value={{
        data,
        ready,
        error,
        saving,
        update,
        patch,
        record: (id) => data.records[id] ?? blankRecord(),
        retry: () => {
          readable.current = true;
          save(current.current);
        },
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}
export function useProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("ProgressProvider absent.");
  return value;
}
