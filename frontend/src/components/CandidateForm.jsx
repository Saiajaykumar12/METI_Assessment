import { useState } from "react";
import { createCandidate } from "../services/api";

export default function CandidateForm({ onCreated }) {
  const [form, setForm] = useState({
    full_name: "",
    country: "",
    city: "",
    education: "",
    experience_years: "",
    job_title: "",
    career_goal: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const candidate = await createCandidate({
        ...form,
        experience_years: form.experience_years
          ? Number(form.experience_years)
          : null,
      });

      onCreated(candidate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-600";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-8 shadow-sm"
    >
      <h2 className="mb-2 text-2xl font-bold text-slate-900">
        Candidate Information
      </h2>

      <p className="mb-6 text-sm text-slate-500">
        Enter your details to begin the assessment.
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Full Name *
          </label>

          <input
            required
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Country
          </label>

          <input
            name="country"
            value={form.country}
            onChange={handleChange}
            className={inputClass}
            placeholder="India"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            City
          </label>

          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            className={inputClass}
            placeholder="Bangalore"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Education
          </label>

          <input
            name="education"
            value={form.education}
            onChange={handleChange}
            className={inputClass}
            placeholder="Computer Science"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Experience (years)
          </label>

          <input
            type="number"
            min="0"
            name="experience_years"
            value={form.experience_years}
            onChange={handleChange}
            className={inputClass}
            placeholder="1"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Current Job Title
          </label>

          <input
            name="job_title"
            value={form.job_title}
            onChange={handleChange}
            className={inputClass}
            placeholder="AI Engineer"
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-medium">
          Career Goal
        </label>

        <textarea
          name="career_goal"
          value={form.career_goal}
          onChange={handleChange}
          rows="3"
          className={inputClass}
          placeholder="What are your career goals?"
        />
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Continue"}
      </button>
    </form>
  );
}