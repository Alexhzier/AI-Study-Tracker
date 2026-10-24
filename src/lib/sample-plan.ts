/** Static illustration used when live AI generation isn't available. Not produced by a model. */
export const SAMPLE_PLAN = {
  summary: "Calculus II gets the most time ahead of its midterm, while the other subjects stay on track.",
  days: [
    { label: "Mon", capacity: 120, items: [{ subject: "Calculus II", color: "#3b6ea5", minutes: 60, why: "Priority 5, midterm in 12 days." }] },
    { label: "Tue", capacity: 120, items: [] as { subject: string; color: string; minutes: number; why: string }[] },
    { label: "Wed", capacity: 120, items: [{ subject: "Organic Chemistry", color: "#b5546b", minutes: 45, why: "Priority 4, quiz in 20 days." }] },
    { label: "Thu", capacity: 120, items: [{ subject: "Calculus II", color: "#3b6ea5", minutes: 60, why: "2h left of its 4h weekly target." }] },
    { label: "Fri", capacity: 120, items: [{ subject: "Spanish", color: "#6b8e3d", minutes: 30, why: "Not studied for 6 days." }] },
    { label: "Sat", capacity: 150, items: [] as { subject: string; color: string; minutes: number; why: string }[] },
    { label: "Sun", capacity: 0, items: [] as { subject: string; color: string; minutes: number; why: string }[] },
  ],
};
