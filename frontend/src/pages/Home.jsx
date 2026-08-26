import { useState } from "react";
import { createCandidate } from "../services/api";

export default function Home({ onCandidateCreated }) {
  const [form, setForm] = useState({
    full_name: "",
    country: "",
    city: "",
    education: "",
    experience_years: 0,
    job_title: "",
    career_goal: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "experience_years"
          ? Number(value)
          : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const candidate = await createCandidate(form);

      onCandidateCreated(candidate);
    } catch (err) {
      setError(err.message);
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
            Complete your candidate information to begin.
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
              required
              className="rounded-lg border p-3"
            />

            <input
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              required
              className="rounded-lg border p-3"
            />

            <input
              name="education"
              placeholder="Education"
              value={form.education}
              onChange={handleChange}
              required
              className="rounded-lg border p-3"
            />

            <input
              type="number"
              name="experience_years"
              placeholder="Experience (years)"
              min="0"
              value={form.experience_years}
              onChange={handleChange}
              required
              className="rounded-lg border p-3"
            />

            <input
              name="job_title"
              placeholder="Current Job Title"
              value={form.job_title}
              onChange={handleChange}
              required
              className="rounded-lg border p-3"
            />

            <textarea
              name="career_goal"
              placeholder="Career Goal"
              value={form.career_goal}
              onChange={handleChange}
              required
              rows="4"
              className="rounded-lg border p-3"
            />

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Continue"}
            </button>

          </div>
        </form>
      </div>
    </main>
  );
}