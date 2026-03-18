import { describe, expect, it } from "vitest";
import { COURSES } from "@/lib/courseData";

describe("course normalization", () => {
  it("ensures every course has at least 15 lessons", () => {
    COURSES.forEach((course) => {
      expect(course.lessons.length).toBeGreaterThanOrEqual(15);
    });
  });

  it("ensures every lesson has at least 7 quiz questions", () => {
    COURSES.forEach((course) => {
      course.lessons.forEach((lesson) => {
        const quizCount = lesson.steps.filter((step) => step.type === "quiz").length;
        expect(quizCount).toBeGreaterThanOrEqual(7);
      });
    });
  });
});