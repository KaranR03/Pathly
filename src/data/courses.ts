export interface Course {
  id: string;
  skill: string;
  provider: string;
  title: string;
  cost: "Free" | "Paid";
  level: "Beginner" | "Intermediate" | "Advanced";
  hours: number;
  mode: "Online" | "In-person";
  rating: number;
  sponsored?: boolean;
  quality: number; // internal ranking quality, higher = better
  url: string;
}

const c = (
  skill: string,
  provider: string,
  title: string,
  cost: Course["cost"],
  level: Course["level"],
  hours: number,
  mode: Course["mode"],
  rating: number,
  quality: number,
  sponsored = false,
): Omit<Course, "id"> => ({
  skill,
  provider,
  title,
  cost,
  level,
  hours,
  mode,
  rating,
  quality,
  sponsored,
  url: "#",
});

export const COURSES: Course[] = [
  c("Power BI", "Microsoft Learn", "Power BI data analyst learning path", "Free", "Beginner", 15, "Online", 4.8, 95),
  c("Power BI", "Coursera", "Microsoft Power BI Data Analyst Specialisation", "Paid", "Intermediate", 30, "Online", 4.7, 90),
  c("Power BI", "TAFE Queensland", "Business Intelligence short course", "Paid", "Beginner", 24, "In-person", 4.4, 74),
  c("Power BI", "DataCamp", "Power BI Fundamentals track", "Paid", "Beginner", 12, "Online", 4.5, 80, true),
  c("Tableau", "Tableau Public", "Free training videos", "Free", "Beginner", 10, "Online", 4.6, 88),
  c("Tableau", "Coursera", "Data Visualisation with Tableau", "Paid", "Intermediate", 26, "Online", 4.6, 85),
  c("Tableau", "General Assembly", "Tableau intensive workshop", "Paid", "Intermediate", 16, "In-person", 4.3, 70, true),
  c("AWS", "AWS Skill Builder", "AWS Cloud Practitioner Essentials", "Free", "Beginner", 14, "Online", 4.7, 93),
  c("AWS", "A Cloud Guru", "AWS Certified Data Engineer Associate", "Paid", "Intermediate", 35, "Online", 4.6, 87),
  c("AWS", "University of Queensland", "Cloud Foundations micro-credential", "Paid", "Beginner", 40, "In-person", 4.5, 78),
  c("Python", "freeCodeCamp", "Python for everybody", "Free", "Beginner", 20, "Online", 4.8, 94),
  c("Python", "Coursera", "Python for Data Science (IBM)", "Paid", "Beginner", 22, "Online", 4.6, 86),
  c("SQL", "Mode Analytics", "SQL Tutorial (Basic to Advanced)", "Free", "Beginner", 8, "Online", 4.7, 91),
  c("SQL", "Coursera", "Advanced SQL for Data Analysis", "Paid", "Advanced", 18, "Online", 4.5, 84),
  c("Machine Learning", "fast.ai", "Practical Deep Learning for Coders", "Free", "Intermediate", 40, "Online", 4.9, 96),
  c("Machine Learning", "Coursera", "Machine Learning Specialisation", "Paid", "Intermediate", 60, "Online", 4.8, 92),
  c("React", "react.dev", "Official React learn track", "Free", "Beginner", 16, "Online", 4.8, 95),
  c("React", "Scrimba", "Learn React interactively", "Paid", "Beginner", 24, "Online", 4.6, 85, true),
  c("TypeScript", "TypeScript Handbook", "The TypeScript Handbook", "Free", "Intermediate", 10, "Online", 4.7, 90),
  c("Git", "Atlassian", "Git tutorials and workflows", "Free", "Beginner", 6, "Online", 4.6, 89),
  c("Data Visualisation", "Google", "Data Analytics Certificate (visualisation)", "Paid", "Beginner", 30, "Online", 4.6, 86),
  c("Data Visualisation", "Storytelling with Data", "Chart design workshop", "Paid", "Intermediate", 8, "In-person", 4.5, 79),
  c("Google Analytics", "Google Skillshop", "GA4 certification path", "Free", "Beginner", 9, "Online", 4.5, 88),
  c("Excel", "Microsoft Learn", "Excel data analysis fundamentals", "Free", "Beginner", 10, "Online", 4.5, 87),
  c("Airflow", "Astronomer", "Airflow fundamentals", "Free", "Intermediate", 12, "Online", 4.4, 82),
  c("Docker", "Docker Docs", "Docker getting started", "Free", "Beginner", 6, "Online", 4.5, 85),
  c("Figma", "Figma Learn", "Design foundations", "Free", "Beginner", 7, "Online", 4.6, 86),
  c("JavaScript", "MDN", "JavaScript guide", "Free", "Beginner", 20, "Online", 4.8, 93),
  c("Social Media", "Meta Blueprint", "Social media marketing basics", "Free", "Beginner", 8, "Online", 4.3, 80),
  c("Canva", "Canva Design School", "Design essentials", "Free", "Beginner", 4, "Online", 4.5, 84),
].map((course, i) => ({ ...course, id: `course-${i + 1}` }));

export const coursesForSkill = (skill: string) =>
  COURSES.filter((c) => c.skill.toLowerCase() === skill.toLowerCase()).sort(
    (a, b) => b.quality - a.quality,
  );
