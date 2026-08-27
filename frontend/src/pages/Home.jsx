import { useState } from "react";

import {
  createCandidate,
  uploadResume,
} from "../services/api";


export default function Home({
  onStart,
}) {
  const [form, setForm] = useState({
    full_name: "",
    country: "",
    city: "",
    education: "",
    experience_years: 0,
    job_title: "",
    career_goal: "",
  });

  const [file, setFile] = useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  function handleChange(e) {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "experience_years"
          ? Number(value)
          : value,
    }));
  }


  async function handleSubmit(e) {
    e.preventDefault();

    if (!file) {
      setError(
        "Please upload your resume."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const candidate =
        await createCandidate(form);

      localStorage.setItem(
        "candidate_id",
        candidate.id
      );

      const result =
        await uploadResume(
          file,
          candidate.id
        );

      const assessment = {
        id:
          result.assessment
            .assessment_id,

        name:
          "AI Generated Assessment",

        description:
          "Assessment generated from your resume",

        ...result.assessment,
      };

      localStorage.setItem(
        "assessment_id",
        assessment.id
      );

      onStart(
        candidate,
        assessment
      );

    } catch (err) {
      setError(
        err.message ||
        "Something went wrong"
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">

      <div className="mx-auto max-w-2xl">

        <div className="mb-8 text-center">

          <h1 className="text-4xl font-bold text-slate-900">
            METI Assessment
          </h1>

          <p className="mt-3 text-slate-500">
            Enter your details and upload your resume.
          </p>

        </div>


        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-8 shadow-sm"
        >

          <div className="grid gap-5">

            <input
              name="full_name"
              placeholder="Full Name"
              value={form.full_name}
              onChange={handleChange}
              required
              className="rounded-lg border p-3"
            />


            <input
              name="country"
              placeholder="Country"
              value={form.country}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />


            <input
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />


            <input
              name="education"
              placeholder="Education"
              value={form.education}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />


            <input
              type="number"
              name="experience_years"
              placeholder="Experience (years)"
              min="0"
              value={form.experience_years}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />


            <input
              name="job_title"
              placeholder="Current Job Title"
              value={form.job_title}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />


            <textarea
              name="career_goal"
              placeholder="Career Goal"
              value={form.career_goal}
              onChange={handleChange}
              className="min-h-28 rounded-lg border p-3"
            />


            <div>

              <label className="mb-2 block font-medium">
                Upload Resume
              </label>

              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) =>
                  setFile(
                    e.target.files?.[0] ||
                    null
                  )
                }
                required
                className="w-full rounded-lg border p-3"
              />

            </div>


            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}


            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white disabled:opacity-50"
            >
              {loading
                ? "Generating Assessment..."
                : "Continue"}
            </button>

          </div>

        </form>

      </div>

    </main>
  );
}