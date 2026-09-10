"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TestCase = { input: string; expectedOutput: string; isHidden: boolean };
type Kind = "coding" | "short_answer" | "written" | "file";

export default function EditExercisePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<Kind>("coding");
  const [language, setLanguage] = useState("python");
  const [starterCode, setStarterCode] = useState("");
  const [expectedAnswers, setExpectedAnswers] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch(`/api/exercises/${id}`)
      .then((r) => r.json())
      .then((raw) => {
        const data = raw.exercise || raw;
        if (data.title) {
          setTitle(data.title);
          setDescription(data.description || "");
          setKind((data.kind as Kind) || "coding");
          setLanguage(data.language || "python");
          setStarterCode(data.starterCode || "");
          setExpectedAnswers((data.expectedAnswers || []).join("\n"));
          setTestCases(
            data.testCases?.length
              ? data.testCases
              : [{ input: "", expectedOutput: "", isHidden: false }]
          );
        }
      });
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/exercises/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        kind,
        language: kind === "coding" ? language : "text",
        starterCode: kind === "coding" ? starterCode : "",
        testCases: kind === "coding" ? testCases : [],
        expectedAnswers:
          kind === "short_answer"
            ? expectedAnswers
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    router.push("/studio/exercises");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-serif text-3xl text-blue-950">Edit exercise</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Kind</Label>
              <Select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
                <option value="coding">Coding</option>
                <option value="short_answer">Short answer</option>
                <option value="written">Written</option>
                <option value="file">File upload</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {kind === "coding" && (
              <>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Starter code</Label>
                  <Textarea
                    className="font-mono text-xs"
                    value={starterCode}
                    onChange={(e) => setStarterCode(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Test cases</Label>
                  {testCases.map((tc, i) => (
                    <div key={i} className="grid gap-2 rounded-lg border border-stone-200 p-3">
                      <Input
                        placeholder="Input"
                        value={tc.input}
                        onChange={(e) => {
                          const next = [...testCases];
                          next[i] = { ...tc, input: e.target.value };
                          setTestCases(next);
                        }}
                      />
                      <Input
                        placeholder="Expected output"
                        value={tc.expectedOutput}
                        onChange={(e) => {
                          const next = [...testCases];
                          next[i] = { ...tc, expectedOutput: e.target.value };
                          setTestCases(next);
                        }}
                        required
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setTestCases([
                        ...testCases,
                        { input: "", expectedOutput: "", isHidden: false },
                      ])
                    }
                  >
                    Add test case
                  </Button>
                </div>
              </>
            )}
            {kind === "short_answer" && (
              <div className="space-y-2">
                <Label>Accepted answers (one per line)</Label>
                <Textarea
                  rows={4}
                  value={expectedAnswers}
                  onChange={(e) => setExpectedAnswers(e.target.value)}
                />
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
