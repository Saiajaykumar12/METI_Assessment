import { useState } from "react";

import {
  createCandidate,
  uploadResume,
} from "../services/api";

export default function Home({ onStart }) {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "experience_years"
          ? Number(value)
          : value,
    }));
  }

  function handleFileChange(e) {
    const selectedFile =
      e.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (
      selectedFile.type !==
        "application/pdf" &&
      !selectedFile.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      setError("Please upload a PDF resume.");
      setFile(null);
      return;
    }

    setError("");
    setFile(selectedFile);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file) {
      setError("Please upload your resume.");
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
      console.error(
        "Failed to create assessment:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">

      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-slate-900 shadow-lg">
              M
            </div>

            <div>
              <p className="font-bold tracking-wide text-white">
                METI
              </p>

              <p className="text-xs text-slate-400">
                Assessment Platform
              </p>
            </div>

          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            AI-Powered Assessment
          </div>
        </header>

        {/* Hero */}
        <section className="grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-16">

          <div>

            <div className="mb-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300">
              ✨ Personalized Career Assessment
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Discover your
              <span className="block text-slate-300">
                professional potential.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              Upload your resume and complete a personalized
              assessment designed to understand your strengths,
              competencies and areas for development.
            </p>

            {/* Benefits */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-xl">
                  📄
                </div>

                <p className="mt-2 text-sm font-semibold text-white">
                  Resume Based
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Assessment generated from your profile.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-xl">
                  🧠
                </div>

                <p className="mt-2 text-sm font-semibold text-white">
                  AI Powered
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Questions tailored to your background.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-xl">
                  📊
                </div>

                <p className="mt-2 text-sm font-semibold text-white">
                  Insights
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Understand your strengths and gaps.
                </p>
              </div>

            </div>

          </div>

          {/* Form */}
          <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">

            <div className="mb-7">

              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-lg text-white">
                →
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Start Your Assessment
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tell us a little about yourself and upload
                your latest resume.
              </p>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Full name */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name
                </label>

                <input
                  name="full_name"
                  placeholder="Enter your full name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>

              {/* Country + City */}
              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Country
                  </label>

                  <input
                    name="country"
                    placeholder="e.g. India"
                    value={form.country}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    City
                  </label>

                  <input
                    name="city"
                    placeholder="e.g. Chennai"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                </div>

              </div>

              {/* Education */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Education
                </label>

                <input
                  name="education"
                  placeholder="e.g. B.Tech Computer Science"
                  value={form.education}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>

              {/* Experience + Job */}
              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Experience
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      name="experience_years"
                      min="0"
                      value={form.experience_years}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-16 text-sm outline-none transition focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      years
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Job Title
                  </label>

                  <input
                    name="job_title"
                    placeholder="Current role"
                    value={form.job_title}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                </div>

              </div>

              {/* Career goal */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Career Goal
                </label>

                <textarea
                  name="career_goal"
                  placeholder="Tell us what you want to achieve in your career..."
                  value={form.career_goal}
                  onChange={handleChange}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>

              {/* Resume */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Resume
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-7 text-center transition hover:border-slate-400 hover:bg-white">

                  <div className="text-3xl">
                    📄
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {file
                      ? file.name
                      : "Upload your resume"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    PDF files only
                  </p>

                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    required={!file}
                    className="hidden"
                  />

                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                  <div className="flex gap-2">
                    <span>⚠</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Generating Assessment...
                  </>
                ) : (
                  <>
                    Continue to Assessment
                    <span>→</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                Your information is used to personalize your assessment.
              </p>

            </form>
          </div>

        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-6 text-center">
          <p className="text-xs text-slate-500">
            © METI Assessment Platform
          </p>
        </footer>

      </div>
    </main>
  );
}